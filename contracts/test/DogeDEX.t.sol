// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DogeItems} from "../src/DogeItems.sol";
import {DogeDEX} from "../src/DogeDEX.sol";

/// Tries to re-enter withdraw() from its receive hook.
contract Reenterer {
    DogeDEX dex;
    uint256 public hits;

    constructor(DogeDEX d) {
        dex = d;
    }

    function buyAndList(DogeItems items, uint256 tokenId, uint256 price) external payable {
        items.setApprovalForAll(address(dex), true);
        dex.list(tokenId, price);
    }

    function pull() external {
        dex.withdraw();
    }

    receive() external payable {
        hits++;
        if (hits < 3) {
            try dex.withdraw() {} catch {}
        }
    }
}

contract DogeDEXTest is Test {
    DogeItems items;
    DogeDEX dex;
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice"); // crafter / seller / LP
    address bob = makeAddr("bob"); // buyer / swapper
    uint256 constant FEE = 0.1 ether;
    uint256 constant FISH_KEY = (3 << 8) | 1;

    function setUp() public {
        items = new DogeItems(FEE, treasury);
        dex = new DogeDEX(items);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.prank(alice);
        items.setApprovalForAll(address(dex), true);
        vm.prank(bob);
        items.setApprovalForAll(address(dex), true);
    }

    function _mint(address to, uint8 t, uint8 l) internal returns (uint256 id) {
        vm.prank(to);
        id = items.mint{value: FEE}(to, t, l);
    }

    function _fish(address to, uint256 n) internal returns (uint256[] memory ids) {
        ids = new uint256[](n);
        for (uint256 i; i < n; i++) ids[i] = _mint(to, 3, 1);
    }

    // ---------------- listings ----------------
    function test_ListBuyWithdraw() public {
        uint256 id = _mint(alice, 1, 3);
        vm.prank(alice);
        dex.list(id, 2 ether);
        assertEq(items.ownerOf(id), address(dex), "escrowed");
        (uint256[] memory packed, uint256[] memory prices, address[] memory sellers) = dex.activeListings(0, 100);
        assertEq(packed.length, 1);
        assertEq(packed[0], (id << 16) | (1 << 8) | 3);
        assertEq(prices[0], 2 ether);
        assertEq(sellers[0], alice);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.WrongPayment.selector, 1 ether, 2 ether));
        dex.buy{value: 1 ether}(id);
        vm.prank(bob);
        dex.buy{value: 2 ether}(id);
        assertEq(items.ownerOf(id), bob);
        assertEq(dex.proceeds(alice), 2 ether);
        (packed,,) = dex.activeListings(0, 100);
        assertEq(packed.length, 0);

        uint256 before = alice.balance;
        vm.prank(alice);
        dex.withdraw();
        assertEq(alice.balance - before, 2 ether);
        vm.prank(alice);
        vm.expectRevert(DogeDEX.NothingToWithdraw.selector);
        dex.withdraw();
    }

    function test_DelistOnlySeller() public {
        uint256 id = _mint(alice, 2, 1);
        vm.prank(alice);
        dex.list(id, 1 ether);
        vm.prank(bob);
        vm.expectRevert(DogeDEX.NotSeller.selector);
        dex.delist(id);
        vm.prank(alice);
        dex.delist(id);
        assertEq(items.ownerOf(id), alice);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.NotListed.selector, id));
        dex.buy{value: 1 ether}(id);
    }

    function test_CannotListOthersItem() public {
        uint256 id = _mint(alice, 1, 1);
        vm.prank(bob);
        vm.expectRevert();
        dex.list(id, 1 ether);
    }

    function test_ListingIndexSwapRemove() public {
        uint256 a = _mint(alice, 1, 1);
        uint256 b = _mint(alice, 1, 2);
        uint256 c = _mint(alice, 1, 3);
        vm.startPrank(alice);
        dex.list(a, 1 ether);
        dex.list(b, 2 ether);
        dex.list(c, 3 ether);
        dex.delist(a); // removes from the middle-of-array path
        vm.stopPrank();
        (uint256[] memory packed, uint256[] memory prices,) = dex.activeListings(0, 100);
        assertEq(packed.length, 2);
        assertEq(prices[0] + prices[1], 5 ether);
        vm.prank(bob);
        dex.buy{value: 3 ether}(c);
        (packed,,) = dex.activeListings(0, 100);
        assertEq(packed.length, 1);
        assertEq(packed[0] >> 16, b);
    }

    // ---------------- pools ----------------
    function test_NoStoreUntilCreated() public {
        assertEq(dex.buyQuote(FISH_KEY), 0);
        assertEq(dex.sellQuote(FISH_KEY), 0);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.PoolMissing.selector, FISH_KEY));
        dex.buyFromPool{value: 1 ether}(FISH_KEY);
        (uint256[] memory keys,,) = dex.allPools();
        assertEq(keys.length, 0);
    }

    function test_CreatePoolBuySellRemove() public {
        uint256[] memory ids = _fish(alice, 4);
        vm.prank(alice);
        uint256 shares = dex.addLiquidity{value: 4 ether}(ids, 0); // 4 fish + 4 DOGE -> 1 DOGE/fish spot
        assertEq(shares, 4 ether);
        (uint256 x, uint256 y, uint256 s,,,) = dex.poolInfo(FISH_KEY, alice);
        assertEq(x, 4 ether);
        assertEq(y, 4);
        assertEq(s, 4 ether);

        uint256 price = dex.buyQuote(FISH_KEY); // ceil(4/3) + 2%
        vm.prank(bob);
        uint256 got = dex.buyFromPool{value: price + 1 ether}(FISH_KEY);
        assertEq(items.ownerOf(got), bob);
        assertEq(dex.proceeds(bob), 1 ether, "excess credited");
        (x, y,,,,) = dex.poolInfo(FISH_KEY, alice);
        assertEq(y, 3);
        assertGe(x * y, 4 ether * 4, "k never drops");

        uint256 quote = dex.sellQuote(FISH_KEY);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.Slippage.selector, quote, quote + 1));
        dex.sellToPool(got, quote + 1);
        vm.prank(bob);
        dex.sellToPool(got, quote);
        (x, y,,,,) = dex.poolInfo(FISH_KEY, alice);
        assertEq(y, 4);
        assertGt(x, 4 ether, "fees accrued to LPs");

        vm.prank(alice);
        dex.removeLiquidity(FISH_KEY, shares, 0, 0);
        assertEq(items.balanceOf(alice), 4);
        assertEq(dex.proceeds(alice), x);
        (x, y, s,,,) = dex.poolInfo(FISH_KEY, alice);
        assertEq(y + s + x, 0, "pool drained");
    }

    function test_SecondLPRatio() public {
        uint256[] memory a = _fish(alice, 2);
        vm.prank(alice);
        dex.addLiquidity{value: 2 ether}(a, 0);
        uint256[] memory b = _fish(bob, 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.NotEnoughDoge.selector, 0.5 ether, 1 ether));
        dex.addLiquidity{value: 0.5 ether}(b, 0);
        vm.prank(bob);
        uint256 minted = dex.addLiquidity{value: 1.5 ether}(b, 0);
        assertEq(minted, 1 ether);
        assertEq(dex.proceeds(bob), 0.5 ether);
    }

    function test_CannotBuyLastItem() public {
        uint256[] memory ids = _fish(alice, 1);
        vm.prank(alice);
        dex.addLiquidity{value: 1 ether}(ids, 0);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.PoolTooThin.selector, FISH_KEY));
        dex.buyFromPool{value: 10 ether}(FISH_KEY);
    }

    function test_MixedPoolRejected() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = _mint(alice, 3, 1);
        ids[1] = _mint(alice, 4, 1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.MixedPool.selector, ids[1], FISH_KEY));
        dex.addLiquidity{value: 1 ether}(ids, 0);
    }

    function test_WithdrawReentrancyBlocked() public {
        Reenterer r = new Reenterer(dex);
        uint256 id = _mint(alice, 1, 1);
        vm.prank(alice);
        items.transferFrom(alice, address(r), id);
        r.buyAndList(items, id, 1 ether);
        vm.prank(bob);
        dex.buy{value: 1 ether}(id);
        uint256 dexBal = address(dex).balance;
        r.pull();
        assertEq(address(r).balance, 1 ether, "paid once");
        assertEq(address(dex).balance, dexBal - 1 ether);
        assertEq(dex.proceeds(address(r)), 0);
    }

    /// Random buy/sell sequences never lower k = x*y and the DEX always holds enough DOGE for all claims.
    function testFuzz_PoolInvariant(uint8 nStart, uint64 seedDoge, uint256 ops) public {
        uint256 n = bound(nStart, 2, 12);
        uint256 d = bound(seedDoge, 0.01 ether, 20 ether);
        uint256[] memory ids = _fish(alice, n);
        vm.prank(alice);
        dex.addLiquidity{value: d}(ids, 0);
        uint256[] memory held = new uint256[](32);
        uint256 h;
        for (uint256 i; i < 24; i++) {
            (uint256 x, uint256 y,,,,) = dex.poolInfo(FISH_KEY, alice);
            uint256 k0 = x * y;
            bool buy = (ops >> i) & 1 == 1;
            if (buy && y >= 2) {
                uint256 p = dex.buyQuote(FISH_KEY);
                vm.deal(bob, bob.balance + p); // round trips lose DOGE by design; keep bob funded
                vm.prank(bob);
                held[h++] = dex.buyFromPool{value: p}(FISH_KEY);
            } else if (h > 0) {
                uint256 q = dex.sellQuote(FISH_KEY);
                vm.prank(bob);
                dex.sellToPool(held[--h], q);
            } else {
                continue;
            }
            (x, y,,,,) = dex.poolInfo(FISH_KEY, alice);
            assertGe(x * y, k0, "k dropped");
            assertGe(address(dex).balance, x + dex.proceeds(bob), "insolvent");
        }
    }

    // ---------------- audit regressions (D-022) ----------------
    /// Audit H-1: attacker seeds a dust pool, inflates y with free sells, victim deposit mints 0 shares -> must now be impossible.
    function test_Audit_ZeroShareTheftBlocked() public {
        address eve = makeAddr("eve");
        uint256 minFirst = dex.MIN_FIRST_DOGE(); // read before vm.prank (an external call would consume the prank)
        vm.deal(eve, 10 ether);
        vm.prank(eve);
        items.setApprovalForAll(address(dex), true);
        uint256[] memory e1 = _fish(eve, 1);
        vm.prank(eve);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.NotEnoughDoge.selector, 1, minFirst));
        dex.addLiquidity{value: 1}(e1, 0); // dust pool refused
        vm.prank(eve);
        dex.addLiquidity{value: minFirst}(e1, 0);
        // eve drains to 1 share: pool keeps 1 item, ~0 DOGE
        uint256 s = dex.lpShares(FISH_KEY, eve);
        vm.prank(eve);
        dex.removeLiquidity(FISH_KEY, s - 1, 0, 0);
        // free sells (payout 0) are refused, so y cannot be inflated
        uint256[] memory e2 = _fish(eve, 1);
        vm.prank(eve);
        vm.expectRevert(DogeDEX.ZeroPayout.selector);
        dex.sellToPool(e2[0], 0);
        // victim deposit gets a fair, non-zero share and can demand a minimum
        uint256[] memory v = _fish(alice, 5);
        (,, uint256 S0,,,) = dex.poolInfo(FISH_KEY, alice);
        vm.prank(alice);
        uint256 minted = dex.addLiquidity{value: 1 ether}(v, 5 * S0);
        assertGt(minted, 0);
        vm.prank(eve);
        dex.removeLiquidity(FISH_KEY, 1, 0, 0);
        assertEq(items.balanceOf(eve), 2, "eve: her unsold fish + her own 1/6 of the pool, not alice's");
        uint256 sa = dex.lpShares(FISH_KEY, alice);
        vm.prank(alice);
        dex.removeLiquidity(FISH_KEY, sa, 5, 0);
        assertEq(items.balanceOf(alice), 5, "alice gets all 5 of her fish back");
    }

    function test_Audit_MinSharesSlippage() public {
        uint256[] memory a = _fish(alice, 2);
        vm.prank(alice);
        dex.addLiquidity{value: 2 ether}(a, 0);
        uint256[] memory b = _fish(bob, 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.Slippage.selector, 1 ether, 2 ether));
        dex.addLiquidity{value: 1 ether}(b, 2 ether);
    }

    /// Audit L-1: a front-run swap that shifts y against the exiting LP is caught by minItemsOut.
    function test_Audit_RemoveLiquiditySlippageGuard() public {
        uint256[] memory a = _fish(alice, 1);
        vm.prank(alice);
        dex.addLiquidity{value: 1 ether}(a, 0);
        uint256[] memory b = _fish(bob, 1);
        vm.prank(bob);
        dex.addLiquidity{value: 1 ether}(b, 0); // 50/50, x=2, y=2
        uint256[] memory c = _fish(bob, 1);
        uint256 q = dex.sellQuote(FISH_KEY);
        vm.prank(bob);
        dex.sellToPool(c[0], q); // y=3: alice's half rounds down to 1 item
        uint256 s = dex.lpShares(FISH_KEY, alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.Slippage.selector, 1, 2));
        dex.removeLiquidity(FISH_KEY, s, 2, 0); // she asked for 2 items: refused instead of silently rounding
        (uint256 x,,,,,) = dex.poolInfo(FISH_KEY, alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(DogeDEX.Slippage.selector, x / 2, x));
        dex.removeLiquidity(FISH_KEY, s, 1, x); // DOGE minimum enforced too
        vm.prank(alice);
        dex.removeLiquidity(FISH_KEY, s, 1, x / 2);
        assertEq(dex.proceeds(alice), x / 2);
    }

    /// Audit M-2: listings are paginated.
    function test_Audit_ListingsPaginated() public {
        vm.startPrank(alice);
        for (uint256 i; i < 5; i++) dex.list(items.mint{value: FEE}(alice, 3, 1), 1 ether);
        vm.stopPrank();
        assertEq(dex.listedCount(), 5);
        (uint256[] memory p1,,) = dex.activeListings(0, 2);
        (uint256[] memory p2,,) = dex.activeListings(4, 10);
        (uint256[] memory p3,,) = dex.activeListings(9, 10);
        assertEq(p1.length, 2);
        assertEq(p2.length, 1);
        assertEq(p3.length, 0);
    }
}
