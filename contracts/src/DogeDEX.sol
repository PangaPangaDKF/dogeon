// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {DogeItems} from "./DogeItems.sol";

/// @title The Sphinx DEX — player-made markets for DOGEON item NFTs, priced in native DOGE.
/// @notice Nothing is for sale until a player creates it:
///   1. Listings: fixed-price sale of one NFT (escrowed here until bought or delisted).
///   2. Pools ("LP with DOGE"): one pool per (itemType, level). LPs deposit NFTs + DOGE and get shares.
///      Anyone can swap DOGE -> item or item -> DOGE against the pool on a constant-product curve
///      (reserve DOGE x, item count y, x*y = k). A 2% fee stays in the pool for the LPs.
/// @dev Pull payments only: sellers, swappers and LPs collect DOGE with `withdraw()`. NFTs move with plain
///      `transferFrom` (no receiver callbacks). Every state change happens before any external call (CEI) and all
///      entry points are nonReentrant. No admin: the deployer has no power over listings, pools or balances.
contract DogeDEX is ReentrancyGuard {
    DogeItems public immutable items;
    uint256 public constant FEE_BPS = 200; // 2% swap fee, kept by the pool (LPs)
    uint256 public constant BPS = 10_000;
    uint256 public constant SHARES_PER_ITEM = 1e18; // first LP: shares scale with items, so S >> y (audit D-022)
    uint256 public constant MIN_FIRST_DOGE = 0.001 ether; // no dust-priced pools

    // ---------- listings ----------
    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings; // tokenId => listing
    uint256[] internal _listed; // active listed tokenIds
    mapping(uint256 => uint256) internal _listedIdx; // tokenId => index+1 in _listed

    // ---------- pools ----------
    struct Pool {
        uint256 doge; // DOGE reserve in wei
        uint256 shares; // total LP shares
        uint256[] ids; // NFTs held by the pool
    }

    mapping(uint256 => Pool) internal _pools; // key = itemType << 8 | level
    mapping(uint256 => mapping(address => uint256)) public lpShares;
    uint256[] public poolKeys;
    mapping(uint256 => bool) public poolExists;

    // ---------- balances ----------
    mapping(address => uint256) public proceeds; // DOGE owed to each address, collected with withdraw()

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Delisted(uint256 indexed tokenId, address indexed seller);
    event Bought(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event LiquidityAdded(uint256 indexed key, address indexed provider, uint256 nItems, uint256 doge, uint256 shares);
    event LiquidityRemoved(uint256 indexed key, address indexed provider, uint256 nItems, uint256 doge, uint256 shares);
    event SwapBuy(uint256 indexed key, address indexed buyer, uint256 tokenId, uint256 paid);
    event SwapSell(uint256 indexed key, address indexed seller, uint256 tokenId, uint256 received);
    event Withdrawn(address indexed to, uint256 amount);

    error ZeroPrice();
    error NotListed(uint256 tokenId);
    error NotSeller();
    error WrongPayment(uint256 sent, uint256 expected);
    error EmptyDeposit();
    error MixedPool(uint256 tokenId, uint256 key);
    error PoolMissing(uint256 key);
    error PoolTooThin(uint256 key);
    error NotEnoughDoge(uint256 sent, uint256 required);
    error NotEnoughShares();
    error Slippage(uint256 got, uint256 limit);
    error ZeroShares();
    error ZeroPayout();
    error NothingToWithdraw();
    error TransferFailed();

    constructor(DogeItems items_) {
        items = items_;
    }

    function keyOf(uint256 tokenId) public view returns (uint256) {
        (uint8 t, uint8 l) = items.items(tokenId);
        return (uint256(t) << 8) | l;
    }

    // ===================== listings =====================

    /// @notice Escrow `tokenId` here and offer it for `price` wei. Needs approve / setApprovalForAll first.
    function list(uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert ZeroPrice();
        listings[tokenId] = Listing(msg.sender, price);
        _listed.push(tokenId);
        _listedIdx[tokenId] = _listed.length;
        emit Listed(tokenId, msg.sender, price);
        items.transferFrom(msg.sender, address(this), tokenId); // reverts if caller isn't owner/approved
    }

    function delist(uint256 tokenId) external nonReentrant {
        Listing memory l = listings[tokenId];
        if (l.seller == address(0)) revert NotListed(tokenId);
        if (l.seller != msg.sender) revert NotSeller();
        _unlist(tokenId);
        emit Delisted(tokenId, msg.sender);
        items.transferFrom(address(this), msg.sender, tokenId);
    }

    /// @notice Buy a listed NFT. msg.value must equal the price exactly. The seller collects with withdraw().
    function buy(uint256 tokenId) external payable nonReentrant {
        Listing memory l = listings[tokenId];
        if (l.seller == address(0)) revert NotListed(tokenId);
        if (msg.value != l.price) revert WrongPayment(msg.value, l.price);
        _unlist(tokenId);
        proceeds[l.seller] += msg.value;
        emit Bought(tokenId, msg.sender, l.seller, msg.value);
        items.transferFrom(address(this), msg.sender, tokenId);
    }

    function _unlist(uint256 tokenId) internal {
        delete listings[tokenId];
        uint256 i = _listedIdx[tokenId] - 1;
        uint256 last = _listed[_listed.length - 1];
        _listed[i] = last;
        _listedIdx[last] = i + 1;
        _listed.pop();
        delete _listedIdx[tokenId];
    }

    function listedCount() external view returns (uint256) {
        return _listed.length;
    }

    /// @notice Active listings [offset, offset+limit) packed as (tokenId << 16 | itemType << 8 | level), with prices and
    ///         sellers. Paginated so junk listings can't push the view over RPC gas caps (audit D-022).
    function activeListings(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory packed, uint256[] memory prices, address[] memory sellers)
    {
        uint256 len = _listed.length;
        uint256 end = offset >= len ? offset : (len - offset > limit ? offset + limit : len);
        uint256 n = end - offset;
        packed = new uint256[](n);
        prices = new uint256[](n);
        sellers = new address[](n);
        for (uint256 i; i < n; i++) {
            uint256 id = _listed[offset + i];
            packed[i] = (id << 16) | keyOf(id);
            prices[i] = listings[id].price;
            sellers[i] = listings[id].seller;
        }
    }

    // ===================== pools (LP) =====================

    function poolInfo(uint256 key, address who)
        external
        view
        returns (uint256 doge, uint256 nItems, uint256 shares, uint256 myShares, uint256 buyPrice, uint256 sellPrice)
    {
        Pool storage p = _pools[key];
        return (p.doge, p.ids.length, p.shares, lpShares[key][who], buyQuote(key), sellQuote(key));
    }

    function allPools() external view returns (uint256[] memory keys, uint256[] memory doge, uint256[] memory nItems) {
        uint256 n = poolKeys.length;
        keys = poolKeys;
        doge = new uint256[](n);
        nItems = new uint256[](n);
        for (uint256 i; i < n; i++) {
            doge[i] = _pools[keys[i]].doge;
            nItems[i] = _pools[keys[i]].ids.length;
        }
    }

    /// @notice DOGE needed to buy one item now (0 if not possible). cost = ceil(x / (y-1)), plus the fee.
    function buyQuote(uint256 key) public view returns (uint256) {
        Pool storage p = _pools[key];
        uint256 y = p.ids.length;
        if (y < 2) return 0; // the last item can never be bought (keeps k > 0)
        uint256 cost = (p.doge + (y - 2)) / (y - 1); // ceil(x/(y-1))
        return cost + (cost * FEE_BPS) / BPS;
    }

    /// @notice DOGE paid for selling one item now (0 if no pool). out = floor(x / (y+1)), minus the fee.
    function sellQuote(uint256 key) public view returns (uint256) {
        Pool storage p = _pools[key];
        if (p.shares == 0) return 0;
        uint256 out = p.doge / (p.ids.length + 1);
        return out - (out * FEE_BPS) / BPS;
    }

    /// @notice Deposit NFTs of ONE (type, level) plus DOGE. The first deposit sets the price (>= MIN_FIRST_DOGE) and gets
    ///         n * SHARES_PER_ITEM shares. Later deposits add DOGE in the current ratio: required = ceil(n * x / y), get
    ///         floor(S * n / y) shares, which must be > 0 and >= minShares (slippage / rounding guard, audit D-022).
    ///         Overpayment is credited to proceeds.
    function addLiquidity(uint256[] calldata tokenIds, uint256 minShares) external payable nonReentrant returns (uint256 minted) {
        uint256 n = tokenIds.length;
        if (n == 0) revert EmptyDeposit();
        uint256 key = keyOf(tokenIds[0]);
        for (uint256 i = 1; i < n; i++) if (keyOf(tokenIds[i]) != key) revert MixedPool(tokenIds[i], key);
        Pool storage p = _pools[key];
        uint256 y = p.ids.length;
        uint256 required;
        if (p.shares == 0) {
            if (msg.value < MIN_FIRST_DOGE) revert NotEnoughDoge(msg.value, MIN_FIRST_DOGE);
            required = msg.value;
            minted = n * SHARES_PER_ITEM;
            p.doge += msg.value; // also absorbs dust left by a fully drained pool
        } else {
            required = (n * p.doge + y - 1) / y;
            if (msg.value < required) revert NotEnoughDoge(msg.value, required);
            minted = (p.shares * n) / y;
            if (minted == 0) revert ZeroShares();
            p.doge += required;
            if (msg.value > required) proceeds[msg.sender] += msg.value - required;
        }
        if (minted < minShares) revert Slippage(minted, minShares);
        p.shares += minted;
        lpShares[key][msg.sender] += minted;
        if (!poolExists[key]) {
            poolExists[key] = true;
            poolKeys.push(key);
        }
        for (uint256 i; i < n; i++) p.ids.push(tokenIds[i]);
        emit LiquidityAdded(key, msg.sender, n, required, minted);
        for (uint256 i; i < n; i++) items.transferFrom(msg.sender, address(this), tokenIds[i]);
    }

    /// @notice Burn `amount` shares for a pro-rata cut: floor(y*s/S) items and x*s/S DOGE (DOGE goes to proceeds).
    ///         minItemsOut / minDogeOut stop a front-run swap from shifting the rounding against you (audit D-022).
    ///         The dropped fraction (< 1 item) stays with the other LPs: paying it in DOGE at spot would let an LP sell
    ///         items to the other LPs at spot with no fee and no curve (rejected alternative, see D-022).
    function removeLiquidity(uint256 key, uint256 amount, uint256 minItemsOut, uint256 minDogeOut) external nonReentrant {
        Pool storage p = _pools[key];
        if (amount == 0 || lpShares[key][msg.sender] < amount) revert NotEnoughShares();
        uint256 y = p.ids.length;
        uint256 nOut = (y * amount) / p.shares;
        uint256 dogeOut = (p.doge * amount) / p.shares;
        if (nOut < minItemsOut) revert Slippage(nOut, minItemsOut);
        if (dogeOut < minDogeOut) revert Slippage(dogeOut, minDogeOut);
        lpShares[key][msg.sender] -= amount;
        p.shares -= amount;
        p.doge -= dogeOut;
        proceeds[msg.sender] += dogeOut;
        uint256[] memory out = new uint256[](nOut);
        for (uint256 i; i < nOut; i++) {
            out[i] = p.ids[p.ids.length - 1];
            p.ids.pop();
        }
        emit LiquidityRemoved(key, msg.sender, nOut, dogeOut, amount);
        for (uint256 i; i < nOut; i++) items.transferFrom(address(this), msg.sender, out[i]);
    }

    /// @notice Swap DOGE -> one item from the pool. Send at least buyQuote(key); the excess is credited to proceeds.
    function buyFromPool(uint256 key) external payable nonReentrant returns (uint256 tokenId) {
        Pool storage p = _pools[key];
        if (p.shares == 0) revert PoolMissing(key);
        uint256 price = buyQuote(key);
        if (price == 0) revert PoolTooThin(key);
        if (msg.value < price) revert NotEnoughDoge(msg.value, price);
        p.doge += price;
        if (msg.value > price) proceeds[msg.sender] += msg.value - price;
        tokenId = p.ids[p.ids.length - 1];
        p.ids.pop();
        emit SwapBuy(key, msg.sender, tokenId, price);
        items.transferFrom(address(this), msg.sender, tokenId);
    }

    /// @notice Swap one item -> DOGE. Reverts if the payout is below `minOut` (slippage guard).
    function sellToPool(uint256 tokenId, uint256 minOut) external nonReentrant returns (uint256 payout) {
        uint256 key = keyOf(tokenId);
        Pool storage p = _pools[key];
        if (p.shares == 0) revert PoolMissing(key);
        payout = sellQuote(key);
        if (payout == 0) revert ZeroPayout(); // selling for 0 would inflate y for free (audit D-022)
        if (payout < minOut) revert Slippage(payout, minOut);
        p.doge -= payout;
        p.ids.push(tokenId);
        proceeds[msg.sender] += payout;
        emit SwapSell(key, msg.sender, tokenId, payout);
        items.transferFrom(msg.sender, address(this), tokenId);
    }

    // ===================== payouts =====================

    function withdraw() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        proceeds[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }
}
