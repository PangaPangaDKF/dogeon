// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title DOGEON Items — every crafted gear piece or food is an ERC-721 minted by the Mechanic (the crafter).
/// @notice The game burns materials off-chain, then calls `mint` with an exact DOGE fee. Metadata is fully on-chain.
/// @dev Testnet MVP (DogeOS Chikyu). Anyone who pays the fee can mint: on-chain code cannot see gameplay, so the
///      "only playing gets you stuff" rule is enforced by the game UI (mint only after a craft). See docs/DECISIONS.md D-018.
contract DogeItems is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // item types (keep in sync with ITEM_TYPES in index.html)
    uint8 public constant HAMMER = 1;
    uint8 public constant ARMOR = 2;
    uint8 public constant RAW_FISH = 3;
    uint8 public constant COOKED_FISH = 4;
    uint8 public constant BONE_CHARM = 5;
    uint8 public constant MOON_BISCUIT = 6;
    // D-058 DOGE gear items (9; one stat theme each, any class may wield any). Stat bonuses live in the game (GEAR_STATS).
    uint8 public constant DOGE_SWORD = 7;
    uint8 public constant DOGE_LEATHER = 8;
    uint8 public constant DOGE_SHIELD = 9;
    uint8 public constant DOGE_STAFF = 10;
    uint8 public constant DOGE_ROBE = 11;
    uint8 public constant DOGE_WHIP = 12;
    uint8 public constant DOGE_BOW = 13;
    uint8 public constant DOGE_HEMP = 14;
    uint8 public constant DOGE_QUIVER = 15;

    struct Item {
        uint8 itemType;
        uint8 level;
    }

    uint256 public mintFee;
    address public treasury;
    address public stakingPool;
    uint256 public nextId = 1; // token ids start at 1 (0 means "none" in the game)
    uint256 public accruedFees; // pull-based: anyone may push them to the treasury
    mapping(uint256 => Item) public items;

    event ItemMinted(address indexed to, uint256 indexed tokenId, uint8 itemType, uint8 level, uint256 fee);
    event ItemBurned(uint256 indexed tokenId, address indexed by);
    event MintFeeChanged(uint256 oldFee, uint256 newFee);
    event TreasuryChanged(address oldTreasury, address newTreasury);
    event StakingPoolChanged(address oldPool, address newPool);
    event FeesWithdrawn(address indexed to, uint256 amount);

    error BadItem(uint8 itemType, uint8 level);
    error WrongFee(uint256 sent, uint256 fee);
    error ZeroAddress();
    error NothingToWithdraw();
    error TransferFailed();

    constructor(uint256 fee, address treasury_) ERC721("DOGEON Items", "DOGEI") Ownable(msg.sender) {
        if (treasury_ == address(0)) revert ZeroAddress();
        mintFee = fee;
        treasury = treasury_;
    }

    /// @notice Highest valid level per type (hammer 1-4, armor 1-2, everything else 1). 0 = unknown type.
    function maxLevel(uint8 itemType) public pure returns (uint8) {
        if (itemType == HAMMER) return 4;
        if (itemType == ARMOR) return 2;
        if (itemType >= RAW_FISH && itemType <= MOON_BISCUIT) return 1;
        if (itemType >= DOGE_SWORD && itemType <= DOGE_QUIVER) return 1; // D-058: the 9 DOGE gear items, single level each
        return 0;
    }

    /// @notice Mint one item to `to`. msg.value must equal `mintFee` exactly (no silent overpayment).
    function mint(address to, uint8 itemType, uint8 level) external payable nonReentrant returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();
        if (level == 0 || level > maxLevel(itemType)) revert BadItem(itemType, level);
        if (msg.value != mintFee) revert WrongFee(msg.value, mintFee);
        tokenId = nextId++;
        items[tokenId] = Item(itemType, level);
        accruedFees += msg.value;
        emit ItemMinted(to, tokenId, itemType, level, msg.value);
        _safeMint(to, tokenId); // last: may call onERC721Received on a contract recipient
    }

    /// @notice Burn (use up) an item, e.g. eating a food NFT. Owner or approved only.
    function burn(uint256 tokenId) external {
        delete items[tokenId];
        _update(address(0), tokenId, _msgSender()); // reverts unless caller is owner/approved
        emit ItemBurned(tokenId, _msgSender());
    }

    /// @notice Send all accrued mint fees split between stakers (80%) and game treasury (20%).
    function withdrawFees() external nonReentrant {
        uint256 amount = accruedFees;
        if (amount == 0) revert NothingToWithdraw();
        accruedFees = 0;
        if (stakingPool != address(0)) {
            uint256 stakeShare = (amount * 80) / 100;
            uint256 treasuryShare = amount - stakeShare;
            (bool ok1,) = stakingPool.call{value: stakeShare}("");
            if (!ok1) revert TransferFailed();
            (bool ok2,) = treasury.call{value: treasuryShare}("");
            if (!ok2) revert TransferFailed();
            emit FeesWithdrawn(stakingPool, stakeShare);
            emit FeesWithdrawn(treasury, treasuryShare);
        } else {
            (bool ok,) = treasury.call{value: amount}("");
            if (!ok) revert TransferFailed();
            emit FeesWithdrawn(treasury, amount);
        }
    }

    function setStakingPool(address s) external onlyOwner {
        emit StakingPoolChanged(stakingPool, s);
        stakingPool = s;
    }

    function setMintFee(uint256 fee) external onlyOwner {
        emit MintFeeChanged(mintFee, fee);
        mintFee = fee;
    }

    function setTreasury(address t) external onlyOwner {
        if (t == address(0)) revert ZeroAddress();
        emit TreasuryChanged(treasury, t);
        treasury = t;
    }

    /// @notice Every item `owner` holds, packed as (tokenId << 16) | (itemType << 8) | level, so a game can read
    ///         its whole inventory in one eth_call and decode it without a library.
    ///         O(balance of owner) via ERC721Enumerable — independent of total supply (audit D-022).
    function inventoryOf(address owner) external view returns (uint256[] memory packed) {
        uint256 n = balanceOf(owner);
        packed = new uint256[](n);
        for (uint256 i; i < n; i++) {
            uint256 id = tokenOfOwnerByIndex(owner, i);
            Item memory it = items[id];
            packed[i] = (id << 16) | (uint256(it.itemType) << 8) | it.level;
        }
    }

    function typeName(uint8 t) public pure returns (string memory) {
        if (t == HAMMER) return "HAMMER";
        if (t == ARMOR) return "ARMOR";
        if (t == RAW_FISH) return "RAW FISH";
        if (t == COOKED_FISH) return "COOKED FISH";
        if (t == BONE_CHARM) return "BONE CHARM";
        if (t == MOON_BISCUIT) return "MOON BISCUIT";
        if (t == DOGE_SWORD) return "DOGE SWORD";
        if (t == DOGE_LEATHER) return "DOGE LEATHER ARMOR";
        if (t == DOGE_SHIELD) return "DOGE SHIELD";
        if (t == DOGE_STAFF) return "DOGE STAFF";
        if (t == DOGE_ROBE) return "DOGE ROBE";
        if (t == DOGE_WHIP) return "DOGE WHIP";
        if (t == DOGE_BOW) return "DOGE BOW";
        if (t == DOGE_HEMP) return "DOGE HEMP SHIRT";
        if (t == DOGE_QUIVER) return "DOGE QUIVER";
        return "UNKNOWN";
    }

    function _color(uint8 t) internal pure returns (string memory) {
        if (t == HAMMER) return "#c09060";
        if (t == ARMOR) return "#a0a8b0";
        if (t == RAW_FISH) return "#80c0e0";
        if (t == COOKED_FISH) return "#f0a040";
        if (t == BONE_CHARM) return "#e8e8f8";
        if (t == DOGE_SWORD) return "#d0d0d8";
        if (t == DOGE_LEATHER) return "#9a6b3a";
        if (t == DOGE_SHIELD) return "#b0b8c0";
        if (t == DOGE_STAFF) return "#80e0c0";
        if (t == DOGE_ROBE) return "#8070d0";
        if (t == DOGE_WHIP) return "#c04040";
        if (t == DOGE_BOW) return "#a07840";
        if (t == DOGE_HEMP) return "#90b060";
        if (t == DOGE_QUIVER) return "#b09050";
        return "#f0c030";
    }

    /// @notice Fully on-chain metadata: base64 JSON with a small base64 SVG card (Genesis-blue frame, item colour, name).
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Item memory it = items[tokenId];
        string memory label = string.concat(typeName(it.itemType), " LV", uint256(it.level).toString());
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">',
            '<rect width="64" height="64" fill="#0a1460"/><rect x="2" y="2" width="60" height="60" fill="none" stroke="#e8e8f8" stroke-width="2"/>',
            '<rect x="20" y="14" width="24" height="24" fill="', _color(it.itemType), '" stroke="#000" stroke-width="2"/>',
            '<text x="32" y="52" font-family="monospace" font-size="6" fill="#ffe040" text-anchor="middle">', label, "</text></svg>"
        );
        string memory json = string.concat(
            '{"name":"', label, " #", tokenId.toString(),
            '","description":"DOGEON item crafted by Wrenchpaw the Mechanic. Such craft. Much wow.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"Type","value":"', typeName(it.itemType),
            '"},{"trait_type":"Level","display_type":"number","value":', uint256(it.level).toString(), "}]}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
