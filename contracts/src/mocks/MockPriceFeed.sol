// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPriceFeed} from "../IPriceFeed.sol";

/// @notice Local stand-in for a RedStone push feed (anvil + tests only). Never deployed to a public chain by our scripts.
contract MockPriceFeed is IPriceFeed {
    int256 public answer;
    uint256 public updatedAt;
    bool public broken; // simulate RedStone's revert on stale data

    constructor(int256 answer_) {
        answer = answer_;
        updatedAt = block.timestamp;
    }

    function set(int256 answer_, uint256 updatedAt_, bool broken_) external {
        answer = answer_;
        updatedAt = updatedAt_;
        broken = broken_;
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        require(!broken, "stale");
        return (1, answer, updatedAt, updatedAt, 1);
    }
}
