// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DOGEON Staking — stake DOGE, earn the holders' 0.8% share of DogeDEX trading fees.
/// @notice Stake native DOGE here. DogeDEX pushes the stakers' slice of its 1% protocol fee into this vault
///         (via DogeDEX.flushStakerFees), and it is split pro-rata among stakers using the classic MasterChef
///         accumulator. Principal and rewards are withdrawn explicitly. No admin, no lockup. See docs/DECISIONS.md D-030.
/// @dev    Testnet MVP (DogeOS Chikyu). `receive()` credits any DOGE sent as reward; pull-style claim; nonReentrant payouts.
contract DogeStaking is ReentrancyGuard {
    uint256 private constant PREC = 1e12;

    uint256 public totalStaked;
    uint256 public accRewardPerShare; // scaled by PREC
    uint256 public residual; // rewards that arrived while nobody was staked (folded in on the next stake/reward)
    uint256 public totalRewards; // lifetime DOGE received as rewards (display)

    mapping(address => uint256) public staked;
    mapping(address => uint256) private rewardDebt;
    mapping(address => uint256) public claimable; // harvested, not yet withdrawn

    event Staked(address indexed who, uint256 amount);
    event Unstaked(address indexed who, uint256 amount);
    event Claimed(address indexed who, uint256 amount);
    event Reward(uint256 amount);

    error ZeroAmount();
    error NotEnoughStaked();
    error TransferFailed();

    /// @notice Any DOGE sent here becomes reward for current stakers (the DEX pushes the stakers' fee share in).
    receive() external payable {
        _addReward(msg.value);
    }

    function notifyReward() external payable {
        _addReward(msg.value);
    }

    function _addReward(uint256 amount) internal {
        if (amount == 0) return;
        totalRewards += amount;
        uint256 r = amount + residual;
        if (totalStaked == 0) {
            residual = r; // nobody to pay yet; hold it
        } else {
            accRewardPerShare += (r * PREC) / totalStaked;
            residual = 0;
        }
        emit Reward(amount);
    }

    function _harvest(address user) internal {
        uint256 s = staked[user];
        if (s > 0) {
            uint256 pending = (s * accRewardPerShare) / PREC - rewardDebt[user];
            if (pending > 0) claimable[user] += pending;
        }
    }

    function _setDebt(address user) internal {
        rewardDebt[user] = (staked[user] * accRewardPerShare) / PREC;
    }

    /// @notice Harvested + still-accruing DOGE rewards owed to `user`.
    function pendingRewards(address user) external view returns (uint256) {
        uint256 s = staked[user];
        uint256 pending = s > 0 ? (s * accRewardPerShare) / PREC - rewardDebt[user] : 0;
        return claimable[user] + pending;
    }

    /// @notice Stake DOGE (msg.value). Earns a pro-rata share of all future reward pushes.
    function stake() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        _harvest(msg.sender);
        staked[msg.sender] += msg.value;
        totalStaked += msg.value;
        _setDebt(msg.sender); // debt set BEFORE folding residual, so this staker is entitled to the orphaned rewards
        if (residual > 0) {
            // fold rewards that arrived while nobody was staked into the accumulator (they go to current stakers)
            accRewardPerShare += (residual * PREC) / totalStaked;
            residual = 0;
        }
        emit Staked(msg.sender, msg.value);
    }

    /// @notice Withdraw `amount` of staked DOGE. Pending rewards are banked to `claimable` first.
    function unstake(uint256 amount) external nonReentrant {
        uint256 s = staked[msg.sender];
        if (amount == 0) revert ZeroAmount();
        if (s < amount) revert NotEnoughStaked();
        _harvest(msg.sender);
        staked[msg.sender] = s - amount;
        totalStaked -= amount;
        _setDebt(msg.sender);
        emit Unstaked(msg.sender, amount);
        _pay(msg.sender, amount);
    }

    /// @notice Claim accrued DOGE rewards (principal stays staked).
    function claim() external nonReentrant {
        _harvest(msg.sender);
        _setDebt(msg.sender);
        uint256 amt = claimable[msg.sender];
        if (amt == 0) revert ZeroAmount();
        claimable[msg.sender] = 0;
        emit Claimed(msg.sender, amt);
        _pay(msg.sender, amt);
    }

    function _pay(address to, uint256 amt) internal {
        (bool ok,) = to.call{value: amt}("");
        if (!ok) revert TransferFailed();
    }
}
