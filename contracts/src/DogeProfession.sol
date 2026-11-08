// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DOGEON Professions — one class per wallet, bound by a paid transaction.
/// @notice Classes: 1 WARRIOR (Demolition Dogs), 2 ARCHER (Kernel Crew), 3 HEALER (Barkitects).
///         Each class gives a different mechanic + skill in the game. The game reads
///         `professionOf(addr)` to drive your build. One choice per wallet, forever: you lock
///         it in by signing `choose()` with an exact DOGE fee (+ gas). See docs/DECISIONS.md D-027.
/// @dev    Testnet MVP (DogeOS Chikyu). On-chain code cannot see gameplay, so "one per wallet" is
///         the only rule the chain enforces; the game UI handles the rest. Pull-payment treasury.
contract DogeProfession is ReentrancyGuard {
    uint8 public constant WARRIOR = 1; // Demolition Dogs: tanky hammer bruiser
    uint8 public constant ARCHER = 2; // Kernel Crew: fast ranged kiter
    uint8 public constant HEALER = 3; // Barkitects: fast support, MP->HP mend

    uint256 public immutable fee; // exact DOGE fee to claim a profession
    address public immutable treasury; // where the fee goes (pull payment)

    mapping(address => uint8) public professionOf; // 0 = none
    mapping(uint8 => uint256) public countOf; // wallets per class (for the camp roster)
    uint256 public totalChosen;
    uint256 public proceeds; // treasury's withdrawable balance

    event ProfessionChosen(address indexed who, uint8 indexed profession);

    error BadProfession();
    error AlreadyChosen();
    error WrongFee(uint256 sent, uint256 needed);
    error NotTreasury();
    error TransferFailed();

    constructor(uint256 fee_, address treasury_) {
        fee = fee_;
        treasury = treasury_ == address(0) ? msg.sender : treasury_;
    }

    /// @notice Claim your profession. One per wallet, forever. Pay exactly `fee` DOGE (+ gas).
    function choose(uint8 profession) external payable nonReentrant {
        if (profession < WARRIOR || profession > HEALER) revert BadProfession();
        if (professionOf[msg.sender] != 0) revert AlreadyChosen();
        if (msg.value != fee) revert WrongFee(msg.value, fee);
        professionOf[msg.sender] = profession;
        unchecked {
            countOf[profession]++;
            totalChosen++;
            proceeds += msg.value;
        }
        emit ProfessionChosen(msg.sender, profession);
    }

    /// @notice True once a wallet has locked in a class.
    function hasProfession(address who) external view returns (bool) {
        return professionOf[who] != 0;
    }

    /// @notice Camp roster: how many wallets chose each class (warrior, archer, healer).
    function roster() external view returns (uint256 warriors, uint256 archers, uint256 healers) {
        return (countOf[WARRIOR], countOf[ARCHER], countOf[HEALER]);
    }

    /// @notice Treasury pulls accumulated profession fees (pull-payment pattern, like DogeDEX).
    function withdraw() external nonReentrant {
        if (msg.sender != treasury) revert NotTreasury();
        uint256 amt = proceeds;
        proceeds = 0;
        (bool ok,) = treasury.call{value: amt}("");
        if (!ok) revert TransferFailed();
    }
}
