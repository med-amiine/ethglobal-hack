// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/CourtRegistry.sol";
import "../contracts/CourtCaseFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Registry first
        CourtRegistry registry = new CourtRegistry();
        console.log("CourtRegistry deployed at:", address(registry));
        
        // Deploy Factory with Registry address
        CourtCaseFactory factory = new CourtCaseFactory(address(registry));
        console.log("CourtCaseFactory deployed at:", address(factory));
        
        // Set factory in registry
        registry.setCourtCaseFactory(address(factory));
        console.log("Factory set in Registry");
        
        vm.stopBroadcast();
        
        // Write addresses to file for frontend
        string memory json = string.concat(
            '{\n',
            '  "CourtRegistry": "', vm.toString(address(registry)), '",\n',
            '  "CourtCaseFactory": "', vm.toString(address(factory)), '",\n',
            '  "Network": "arbitrum-sepolia",\n',
            '  "Timestamp": ', vm.toString(block.timestamp), '\n',
            '}'
        );
        
        vm.writeFile("deployment.json", json);
        console.log("Deployment addresses saved to deployment.json");
    }
}
