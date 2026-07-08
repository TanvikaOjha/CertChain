// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CertificateNFT.sol";

contract Deploy is Script {

    function run() external {
        // Load private key from .env and start broadcasting txs
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer   = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Deploy contract
        CertificateNFT cert = new CertificateNFT();
        console.log("CertificateNFT deployed at:", address(cert));

        // 2. Authorize deployer as issuer (for testing)
        cert.addIssuer(deployer, "IIT Dhanbad");
        console.log("Deployer added as issuer");

        // 3. Issue a test certificate
        //    Paste your CID from the IPFS upload step here:
        string memory ipfsCID = "Qmbgk2WAbuznThVTfbB9dNptriyhuLELitUp8AeNkkKWDJ";

        cert.issueCertificate(
            deployer,                     // student = yourself for testing
            "Blockchain Development",
            "B.Tech CSE",
            0,                            // 0 = no expiry
            ipfsCID
        );
        console.log("Test certificate issued. Token ID: 1");

        vm.stopBroadcast();
    }
}