// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The Chainlink-compatible slice of a RedStone push price feed (AggregatorV3-style).
/// RedStone DOGE/USD on DogeOS Chikyu testnet: 0x434F8D17c0301cfEa143dba912972E24B827C968 (8 decimals), source:
/// redstone-oracles-monorepo relayer-manifests-multi-feed/dogeOsTestnetMultiFeed.json (verified on-chain 2026-11-07, D-024).
interface IPriceFeed {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}
