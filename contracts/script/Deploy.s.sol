// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {DogeItems} from "../src/DogeItems.sol";
import {DogeDEX} from "../src/DogeDEX.sol";
import {DogeProfession} from "../src/DogeProfession.sol";
import {IPriceFeed} from "../src/IPriceFeed.sol";
import {MockPriceFeed} from "../src/mocks/MockPriceFeed.sol";

/// Deploys DogeItems (0.1 DOGE mint fee, fees to the deployer) and DogeDEX, then writes
/// deployments/<chainId>.json so the game config can be updated.
///
/// Local:   anvil  +  forge script script/Deploy.s.sol --rpc-url local --broadcast --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
/// Chikyu:  cast wallet import dogeon --interactive   (your key stays in the encrypted Foundry keystore, never in a file)
///          forge script script/Deploy.s.sol --rpc-url chikyu --broadcast --account dogeon --sender <your address>
contract Deploy is Script {
    function run() external returns (DogeItems items, DogeDEX dex, DogeProfession prof) {
        uint256 fee = vm.envOr("MINT_FEE_WEI", uint256(0.1 ether));
        uint256 profFee = vm.envOr("PROF_FEE_WEI", uint256(0.05 ether));
        vm.startBroadcast();
        address deployer = msg.sender;
        address treasury = vm.envOr("TREASURY", deployer);
        items = new DogeItems(fee, treasury);
        // RedStone DOGE/USD: env DOGE_USD_FEED wins; Chikyu defaults to RedStone's feed; local anvil gets a mock
        address feed = vm.envOr("DOGE_USD_FEED", address(0));
        if (feed == address(0) && block.chainid == 6281971) feed = 0x434F8D17c0301cfEa143dba912972E24B827C968;
        if (feed == address(0) && block.chainid == 31337) feed = address(new MockPriceFeed(7164240));
        dex = new DogeDEX(items, IPriceFeed(feed));
        prof = new DogeProfession(profFee, treasury); // one class per wallet, paid (D-027)
        vm.stopBroadcast();

        console.log("DogeItems ", address(items));
        console.log("DogeDEX   ", address(dex));
        console.log("DogeProf  ", address(prof));
        string memory j = "deploy";
        vm.serializeUint(j, "chainId", block.chainid);
        vm.serializeUint(j, "mintFee", fee);
        vm.serializeUint(j, "profFee", profFee);
        vm.serializeAddress(j, "items", address(items));
        vm.serializeAddress(j, "dogeUsdFeed", address(dex.dogeUsdFeed()));
        vm.serializeAddress(j, "prof", address(prof));
        string memory out = vm.serializeAddress(j, "dex", address(dex));
        vm.writeJson(out, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }
}
