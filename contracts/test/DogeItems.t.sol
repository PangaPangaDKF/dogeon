// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DogeItems} from "../src/DogeItems.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract DogeItemsTest is Test {
    DogeItems items;
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    uint256 constant FEE = 0.1 ether;

    function setUp() public {
        items = new DogeItems(FEE, treasury);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_MintExactFee() public {
        vm.prank(alice);
        uint256 id = items.mint{value: FEE}(alice, items.HAMMER(), 3);
        assertEq(id, 1, "ids start at 1");
        assertEq(items.ownerOf(1), alice);
        (uint8 t, uint8 l) = items.items(1);
        assertEq(t, 1);
        assertEq(l, 3);
        assertEq(items.accruedFees(), FEE);
        assertEq(items.nextId(), 2);
    }

    function test_RevertWrongFee() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(DogeItems.WrongFee.selector, FEE + 1, FEE));
        items.mint{value: FEE + 1}(alice, 1, 1);
        vm.expectRevert(abi.encodeWithSelector(DogeItems.WrongFee.selector, 0, FEE));
        items.mint(alice, 1, 1);
        vm.stopPrank();
    }

    function test_RevertBadItem() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(DogeItems.BadItem.selector, uint8(1), uint8(5)));
        items.mint{value: FEE}(alice, 1, 5); // hammer max 4
        vm.expectRevert(abi.encodeWithSelector(DogeItems.BadItem.selector, uint8(2), uint8(3)));
        items.mint{value: FEE}(alice, 2, 3); // armor max 2
        vm.expectRevert(abi.encodeWithSelector(DogeItems.BadItem.selector, uint8(3), uint8(0)));
        items.mint{value: FEE}(alice, 3, 0); // level 0
        vm.expectRevert(abi.encodeWithSelector(DogeItems.BadItem.selector, uint8(7), uint8(1)));
        items.mint{value: FEE}(alice, 7, 1); // unknown type
        vm.stopPrank();
    }

    function test_InventoryPacked() public {
        vm.startPrank(alice);
        items.mint{value: FEE}(alice, 1, 2);
        items.mint{value: FEE}(bob, 4, 1);
        items.mint{value: FEE}(alice, 3, 1);
        vm.stopPrank();
        uint256[] memory inv = items.inventoryOf(alice);
        assertEq(inv.length, 2);
        assertEq(inv[0], (1 << 16) | (1 << 8) | 2);
        assertEq(inv[1], (3 << 16) | (3 << 8) | 1);
        assertEq(items.inventoryOf(bob)[0], (2 << 16) | (4 << 8) | 1);
    }

    function test_BurnOnlyOwnerOrApproved() public {
        vm.prank(alice);
        items.mint{value: FEE}(alice, 4, 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721InsufficientApproval.selector, bob, 1));
        items.burn(1);
        vm.prank(alice);
        items.burn(1);
        assertEq(items.balanceOf(alice), 0);
        (uint8 t,) = items.items(1);
        assertEq(t, 0);
    }

    function test_WithdrawFeesToTreasuryOnly() public {
        vm.prank(alice);
        items.mint{value: FEE}(alice, 1, 1);
        vm.prank(bob); // anyone can trigger, funds still go to the treasury
        items.withdrawFees();
        assertEq(treasury.balance, FEE);
        assertEq(items.accruedFees(), 0);
        vm.expectRevert(DogeItems.NothingToWithdraw.selector);
        items.withdrawFees();
    }

    function test_OnlyOwnerAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        items.setMintFee(0);
        items.setMintFee(0.2 ether);
        assertEq(items.mintFee(), 0.2 ether);
        vm.expectRevert(DogeItems.ZeroAddress.selector);
        items.setTreasury(address(0));
    }

    function test_TokenURIOnChain() public {
        vm.prank(alice);
        items.mint{value: FEE}(alice, 1, 4);
        string memory uri = items.tokenURI(1);
        assertEq(bytes(uri).length > 100, true);
        assertEq(_startsWith(uri, "data:application/json;base64,"), true);
    }

    function testFuzz_MintValidRange(uint8 t, uint8 l) public {
        uint8 maxL = items.maxLevel(t);
        vm.prank(alice);
        if (l == 0 || l > maxL) {
            vm.expectRevert(abi.encodeWithSelector(DogeItems.BadItem.selector, t, l));
            items.mint{value: FEE}(alice, t, l);
        } else {
            uint256 id = items.mint{value: FEE}(alice, t, l);
            (uint8 tt, uint8 ll) = items.items(id);
            assertEq(tt, t);
            assertEq(ll, l);
        }
    }

    function _startsWith(string memory s, string memory p) internal pure returns (bool) {
        bytes memory a = bytes(s);
        bytes memory b = bytes(p);
        if (a.length < b.length) return false;
        for (uint256 i; i < b.length; i++) if (a[i] != b[i]) return false;
        return true;
    }

    /// Audit M-1: inventoryOf is O(balance) (ERC721Enumerable) and follows transfers.
    function test_Audit_InventoryEnumerable() public {
        vm.startPrank(alice);
        for (uint256 i; i < 50; i++) items.mint{value: FEE}(bob, 3, 1);
        uint256 mine = items.mint{value: FEE}(alice, 1, 4);
        vm.stopPrank();
        assertEq(items.inventoryOf(alice).length, 1);
        assertEq(items.inventoryOf(alice)[0], (mine << 16) | (1 << 8) | 4);
        vm.prank(alice);
        items.transferFrom(alice, bob, mine);
        assertEq(items.inventoryOf(alice).length, 0);
        assertEq(items.inventoryOf(bob).length, 51);
        assertEq(items.totalSupply(), 51);
    }
}
