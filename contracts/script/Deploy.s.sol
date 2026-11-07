// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {DogeItems} from "../src/DogeItems.sol";
import {DogeDEX} from "../src/DogeDEX.sol";

/// Deploys DogeItems (0.1 DOGE mint fee, fees to the deployer) and DogeDEX, then writes
/// deployments/<chainId>.json so the game config can be updated.
///
/// Local:   anvil  +  forge script script/Deploy.s.sol --rpc-url local --broadcast --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
/// Chikyu:  cast wallet import dogeon --interactive   (your key stays in the encrypted Foundry keystore, never in a file)
///          forge script script/Deploy.s.sol --rpc-url chikyu --broadcast --account dogeon --sender <your address>
contract Deploy is Script {
    function run() external returns (DogeItems items, DogeDEX dex) {
        uint256 fee = vm.envOr("MINT_FEE_WEI", uint256(0.1 ether));
        vm.startBroadcast();
        address deployer = msg.sender;
        items = new DogeItems(fee, vm.envOr("TREASURY", deployer));
        dex = new DogeDEX(items);
        vm.stopBroadcast();

        console.log("DogeItems", address(items));
        console.log("DogeDEX  ", address(dex));
        string memory j = "deploy";
        vm.serializeUint(j, "chainId", block.chainid);
        vm.serializeUint(j, "mintFee", fee);
        vm.serializeAddress(j, "items", address(items));
        string memory out = vm.serializeAddress(j, "dex", address(dex));
        vm.writeJson(out, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }
}
