// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CertificateNFT.sol";

contract CertificateNFTTest is Test {

    CertificateNFT public cert;

    // Test addresses — Foundry gives us these for free
    address owner   = address(this);
    address college = makeAddr("college");
    address student = makeAddr("student");
    address other   = makeAddr("other");

    string constant IPFS = "QmFakeHash123abc";

    // setUp() runs before every test — like beforeEach
    function setUp() public {
        cert = new CertificateNFT();
        cert.addIssuer(college, "Test University");
    }

    // ── Helper: issue one certificate ───────────────────────────
    function _issue() internal returns (uint256) {
        vm.prank(college); // next call is from college
        return cert.issueCertificate(student, "Blockchain Dev", "B.Tech", 0, IPFS);
    }

    // ── Test 1: Mint ─────────────────────────────────────────────
    function test_MintToStudent() public {
        uint256 tokenId = _issue();
        assertEq(cert.ownerOf(tokenId), student);
    }

    // ── Test 2: Certificate data stored correctly ────────────────
    function test_CertificateDataCorrect() public {
        uint256 tokenId = _issue();
        (bool valid, string memory status,) = cert.verifyCertificate(tokenId);
        assertTrue(valid);
        assertEq(status, "VALID");
    }

    // ── Test 3: Revoke ───────────────────────────────────────────
    function test_RevokeCertificate() public {
        uint256 tokenId = _issue();
        vm.prank(college);
        cert.revokeCertificate(tokenId, "Academic fraud");
        (bool valid, string memory status,) = cert.verifyCertificate(tokenId);
        assertFalse(valid);
        assertEq(status, "REVOKED");
    }

    // ── Test 4: Block unauthorized issuer ────────────────────────
    function test_RevertUnauthorizedIssuer() public {
        vm.prank(other);
        vm.expectRevert("Not an authorized issuer");
        cert.issueCertificate(student, "Course", "Degree", 0, IPFS);
    }

    // ── Test 5: Block transfer (soulbound) ───────────────────────
    function test_RevertTransfer() public {
        uint256 tokenId = _issue();
        vm.prank(student);
        vm.expectRevert("Non-transferable");
        cert.transferFrom(student, other, tokenId);
    }

    // ── Test 6: Block non-issuer from revoking ───────────────────
    function test_RevertNonIssuerRevoke() public {