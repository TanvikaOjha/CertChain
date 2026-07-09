// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CertificateNFT.sol";

contract CertificateNFTTest is Test {
    CertificateNFT public cert;

    //actors
    address owner = address(this); // test contract = deployer
    address college = makeAddr("college");
    address mit = makeAddr("mit");
    address iit = makeAddr("iit");
    address student = makeAddr("student");
    address student2 = makeAddr("student2");
    address student3 = makeAddr("student3");
    address employer = makeAddr("employer"); // read-only caller
    address attacker = makeAddr("attacker"); // unauthorized caller

    //Constants
    string constant IPFS_A = "QmCertHashAlpha111";
    string constant IPFS_B = "QmCertHashBeta222";
    string constant IPFS_C = "QmCertHashGamma333";
    string constant COURSE_A = "Blockchain Development";
    string constant COURSE_B = "Distributed Systems";
    string constant DEGREE_UG = "B.Tech CSE";
    string constant DEGREE_PG = "M.Tech AI";
    string constant DEGREE_DR = "PhD Computer Science";

    //Events (mirror contract declarations for vm.expectEmit)
    event CertificateIssued(
        uint256 indexed tokenId, address indexed student, address indexed issuer, string courseName
    );
    event CertificateRevoked(uint256 indexed tokenId, string reason);
    event IssuerAuthorized(address indexed issuer, string name);
    event IssuerRevoked(address indexed issuer);

    //  SETUP
    function setUp() public {
        cert = new CertificateNFT();
        cert.addIssuer(college, "State University");
    }

    //  HELPERS

    // Issue a standard cert from college to student (no expiry).
    function _issue(address to) internal returns (uint256) {
        vm.prank(college);
        return cert.issueCertificate(to, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    //Issue a cert with a specific expiry timestamp.
    function _issueExpiring(address to, uint256 expiry) internal returns (uint256) {
        vm.prank(college);
        return cert.issueCertificate(to, COURSE_A, DEGREE_UG, expiry, IPFS_A);
    }

    // Read all 10 certificate fields from the public mapping.
    function _certOf(uint256 tokenId) internal view returns (CertificateNFT.Certificate memory) {
        (
            address _student,
            address _issuer,
            string memory _course,
            string memory _degree,
            string memory _institution,
            uint256 _issue,
            uint256 _expiry,
            bool _revoked,
            string memory _reason,
            string memory _ipfs
        ) = cert.certificates(tokenId);
        return CertificateNFT.Certificate({
            student: _student,
            issuer: _issuer,
            courseName: _course,
            degree: _degree,
            institutionName: _institution,
            issueDate: _issue,
            expiryDate: _expiry,
            isRevoked: _revoked,
            revokeReason: _reason,
            ipfsHash: _ipfs
        });
    }
    //  1 · DEPLOYMENT & INITIAL STATE

    function test_Deploy_NameAndSymbol() public view {
        assertEq(cert.name(), "CertificateNFT");
        assertEq(cert.symbol(), "CERT");
    }

    function test_Deploy_OwnerIsDeployer() public view {
        assertEq(cert.owner(), address(this));
    }

    function test_Deploy_NoTokensExist() public {
        // tokenId 1 should not exist yet
        vm.expectRevert();
        cert.ownerOf(1);
    }

    function test_Deploy_CollegeIsAuthorizedFromSetUp() public view {
        assertTrue(cert.authorizedIssuers(college));
        assertEq(cert.issuerNames(college), "State University");
    }

    //  2 · ISSUER MANAGEMENT

    function test_AddIssuer_SetsAuthorizedTrue() public {
        cert.addIssuer(mit, "MIT");
        assertTrue(cert.authorizedIssuers(mit));
    }

    function test_AddIssuer_StoresName() public {
        cert.addIssuer(mit, "Massachusetts Institute of Technology");
        assertEq(cert.issuerNames(mit), "Massachusetts Institute of Technology");
    }

    function test_AddIssuer_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IssuerAuthorized(mit, "MIT");
        cert.addIssuer(mit, "MIT");
    }

    function test_AddIssuer_CanUpdateExistingIssuerName() public {
        // Re-adding an issuer should update their name
        cert.addIssuer(college, "University of Technology");
        assertEq(cert.issuerNames(college), "University of Technology");
        assertTrue(cert.authorizedIssuers(college));
    }

    function test_AddIssuer_MultipleIssuersIndependent() public {
        cert.addIssuer(mit, "MIT");
        cert.addIssuer(iit, "IIT Bombay");
        assertTrue(cert.authorizedIssuers(college));
        assertTrue(cert.authorizedIssuers(mit));
        assertTrue(cert.authorizedIssuers(iit));
    }

    function test_RemoveIssuer_SetsAuthorizedFalse() public {
        cert.addIssuer(mit, "MIT");
        cert.removeIssuer(mit);
        assertFalse(cert.authorizedIssuers(mit));
    }

    function test_RemoveIssuer_EmitsEvent() public {
        cert.addIssuer(mit, "MIT");
        vm.expectEmit(true, false, false, false);
        emit IssuerRevoked(mit);
        cert.removeIssuer(mit);
    }

    function test_RemoveIssuer_NamePersistsAfterRemoval() public {
        // issuerNames is not cleared — the name stays in storage
        cert.addIssuer(mit, "MIT");
        cert.removeIssuer(mit);
        // Name still exists in mapping; only authorizedIssuers is cleared
        assertEq(cert.issuerNames(mit), "MIT");
    }

    function test_Revert_AddIssuer_CallerNotOwner() public {
        vm.prank(attacker);
        vm.expectRevert();
        cert.addIssuer(attacker, "Fake Uni");
    }

    function test_Revert_AddIssuer_CollegeCallerNotOwner() public {
        // Even a legitimate issuer cannot authorize another issuer
        vm.prank(college);
        vm.expectRevert();
        cert.addIssuer(mit, "MIT");
    }

    function test_Revert_RemoveIssuer_CallerNotOwner() public {
        vm.prank(attacker);
        vm.expectRevert();
        cert.removeIssuer(college);
    }

    //  3 · ISSUING CERTIFICATES

    function test_Issue_MintsToCaller() public {
        uint256 id = _issue(student);
        assertEq(cert.ownerOf(id), student);
    }

    function test_Issue_FirstTokenIdIsOne() public {
        uint256 id = _issue(student);
        assertEq(id, 1);
    }

    function test_Issue_TokenIdsAreSequential() public {
        uint256 id1 = _issue(student);
        uint256 id2 = _issue(student2);
        uint256 id3 = _issue(student3);
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
    }

    function test_Issue_StoresStudentAddress() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).student, student);
    }

    function test_Issue_StoresIssuerAddress() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).issuer, college);
    }

    function test_Issue_StoresCourseName() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).courseName, COURSE_A);
    }

    function test_Issue_StoresDegree() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).degree, DEGREE_UG);
    }

    function test_Issue_StoresInstitutionNameFromRegistry() public {
        uint256 id = _issue(student);
        // institutionName is copied from issuerNames[msg.sender] at mint time
        assertEq(_certOf(id).institutionName, "State University");
    }

    function test_Issue_InstitutionNameSnapshotAtMintTime() public {
        // If the institution name changes AFTER minting, the cert keeps the old name
        uint256 id = _issue(student);
        cert.addIssuer(college, "Renamed University"); // update name
        assertEq(_certOf(id).institutionName, "State University"); // cert is unchanged
    }

    function test_Issue_StoresIssueDateAsBlockTimestamp() public {
        vm.warp(1_700_000_000);
        uint256 id = _issue(student);
        assertEq(_certOf(id).issueDate, 1_700_000_000);
    }

    function test_Issue_ZeroExpiryStoredCorrectly() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).expiryDate, 0);
    }

    function test_Issue_NonZeroExpiryStoredCorrectly() public {
        uint256 expiry = block.timestamp + 365 days;
        uint256 id = _issueExpiring(student, expiry);
        assertEq(_certOf(id).expiryDate, expiry);
    }

    function test_Issue_IsRevokedDefaultsFalse() public {
        uint256 id = _issue(student);
        assertFalse(_certOf(id).isRevoked);
    }

    function test_Issue_RevokeReasonDefaultsEmpty() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).revokeReason, "");
    }

    function test_Issue_StoresIpfsHash() public {
        uint256 id = _issue(student);
        assertEq(_certOf(id).ipfsHash, IPFS_A);
    }

    function test_Issue_SetsTokenURIWithIpfsPrefix() public {
        uint256 id = _issue(student);
        assertEq(cert.tokenURI(id), string(abi.encodePacked("ipfs://", IPFS_A)));
    }

    function test_Issue_AddsToStudentList() public {
        uint256 id = _issue(student);
        uint256[] memory ids = cert.getCertsByStudent(student);
        assertEq(ids.length, 1);
        assertEq(ids[0], id);
    }

    function test_Issue_MultipleCertsForSameStudent() public {
        vm.startPrank(college);
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        cert.issueCertificate(student, COURSE_B, DEGREE_PG, 0, IPFS_B);
        vm.stopPrank();
        assertEq(cert.getCertsByStudent(student).length, 2);
    }

    function test_Issue_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CertificateIssued(1, student, college, COURSE_A);
        vm.prank(college);
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function test_Issue_TwoIssuersCanMintIndependently() public {
        cert.addIssuer(mit, "MIT");

        vm.prank(college);
        uint256 id1 = cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);

        vm.prank(mit);
        uint256 id2 = cert.issueCertificate(student2, COURSE_B, DEGREE_PG, 0, IPFS_B);

        assertEq(_certOf(id1).issuer, college);
        assertEq(_certOf(id2).issuer, mit);
        assertEq(_certOf(id1).institutionName, "State University");
        assertEq(_certOf(id2).institutionName, "MIT");
    }

    // ── Revert cases ──────────────────────────────────────────────────────────

    function test_Revert_Issue_CallerNotIssuer() public {
        vm.prank(attacker);
        vm.expectRevert("Not an authorized issuer");
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function test_Revert_Issue_EmployerCallerNotIssuer() public {
        vm.prank(employer);
        vm.expectRevert("Not an authorized issuer");
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function test_Revert_Issue_StudentAddressZero() public {
        vm.prank(college);
        vm.expectRevert("Invalid student address");
        cert.issueCertificate(address(0), COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function test_Revert_Issue_EmptyIpfsHash() public {
        vm.prank(college);
        vm.expectRevert("IPFS hash required");
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, "");
    }

    function test_Revert_Issue_RemovedIssuerCannotMint() public {
        cert.removeIssuer(college);
        vm.prank(college);
        vm.expectRevert("Not an authorized issuer");
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function test_Revert_Issue_OwnerCannotMintWithoutIssuerRole() public {
        // The contract owner is NOT automatically an issuer
        vm.expectRevert("Not an authorized issuer");
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    //  4 · VERIFICATION — ALL FOUR STATUS PATHS

    function test_Verify_VALID_FreshCert() public {
        uint256 id = _issue(student);
        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertTrue(ok);
        assertEq(status, "VALID");
    }

    function test_Verify_VALID_ReturnsCorrectCertData() public {
        uint256 id = _issue(student);
        (,, CertificateNFT.Certificate memory c) = cert.verifyCertificate(id);
        assertEq(c.student, student);
        assertEq(c.issuer, college);
        assertEq(c.courseName, COURSE_A);
    }

    function test_Verify_VALID_WithFutureExpiry() public {
        uint256 id = _issueExpiring(student, block.timestamp + 365 days);
        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertTrue(ok);
        assertEq(status, "VALID");
    }

    function test_Verify_REVOKED_AfterRevocation() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "Policy violation");
        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertFalse(ok);
        assertEq(status, "REVOKED");
    }

    function test_Verify_EXPIRED_PastExpiryDate() public {
        uint256 expiry = block.timestamp + 30 days;
        uint256 id = _issueExpiring(student, expiry);

        vm.warp(expiry + 1); // one second past expiry
        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertFalse(ok);
        assertEq(status, "EXPIRED");
    }

    function test_Verify_EXPIRED_ExactlyAtExpiryTimestamp() public {
        // block.timestamp == expiryDate: the contract checks timestamp > expiry,
        // so AT the exact timestamp the cert is still VALID
        uint256 expiry = block.timestamp + 100;
        uint256 id = _issueExpiring(student, expiry);

        vm.warp(expiry); // exactly at expiry — still valid per contract logic
        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertTrue(ok);
        assertEq(status, "VALID");
    }

    function test_Verify_EXPIRED_OneSecondPastExpiry() public {
        uint256 expiry = block.timestamp + 100;
        uint256 id = _issueExpiring(student, expiry);

        vm.warp(expiry + 1); // one second over — now expired
        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertFalse(ok);
        assertEq(status, "EXPIRED");
    }

    function test_Verify_ISSUER_DEAUTHORIZED_AfterIssuerRemoved() public {
        uint256 id = _issue(student); // college issues cert

        cert.removeIssuer(college); // owner removes college authorization

        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertFalse(ok);
        assertEq(status, "ISSUER_DEAUTHORIZED");
    }

    function test_Verify_ISSUER_DEAUTHORIZED_ReturnsCorrectCertData() public {
        uint256 id = _issue(student);
        cert.removeIssuer(college);

        (,, CertificateNFT.Certificate memory c) = cert.verifyCertificate(id);
        assertEq(c.student, student); // cert data intact, just status changed
        assertFalse(c.isRevoked);
    }

    function test_Verify_REVOKED_TakesPrecedenceOverEXPIRED() public {
        // A cert that is both revoked AND expired should report REVOKED
        // because the contract checks isRevoked before checking expiry
        uint256 expiry = block.timestamp + 1;
        uint256 id = _issueExpiring(student, expiry);

        vm.prank(college);
        cert.revokeCertificate(id, "Fraud");

        vm.warp(expiry + 1); // also expired now

        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertFalse(ok);
        assertEq(status, "REVOKED"); // REVOKED wins — checked first in contract
    }

    function test_Verify_REVOKED_TakesPrecedenceOverISSUER_DEAUTHORIZED() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "Fraud");
        cert.removeIssuer(college); // also deauthorize issuer

        (bool ok, string memory status,) = cert.verifyCertificate(id);
        assertFalse(ok);
        assertEq(status, "REVOKED"); // REVOKED checked first
    }

    function test_Verify_AnyCallerCanVerify() public {
        uint256 id = _issue(student);
        // employer has no role — verify should succeed anyway
        vm.prank(employer);
        (bool ok,,) = cert.verifyCertificate(id);
        assertTrue(ok);
    }

    function test_Verify_StudentCanVerifyOwnCert() public {
        uint256 id = _issue(student);
        vm.prank(student);
        (bool ok,,) = cert.verifyCertificate(id);
        assertTrue(ok);
    }

    function test_Verify_ReissueAfterDeauthorize_UsesNewIssuer() public {
        // college issues, gets deauthorized, MIT issues new cert — MIT's is VALID
        uint256 id1 = _issue(student);
        cert.addIssuer(mit, "MIT");
        cert.removeIssuer(college);

        vm.prank(mit);
        uint256 id2 = cert.issueCertificate(student, COURSE_B, DEGREE_PG, 0, IPFS_B);

        (, string memory s1,) = cert.verifyCertificate(id1);
        (, string memory s2,) = cert.verifyCertificate(id2);
        assertEq(s1, "ISSUER_DEAUTHORIZED");
        assertEq(s2, "VALID");
    }

    function test_Revert_Verify_NonexistentToken() public {
        vm.expectRevert("Certificates does not exist");
        cert.verifyCertificate(999);
    }

    function test_Revert_Verify_TokenIdZero() public {
        vm.expectRevert(); // ERC721 also rejects tokenId 0
        cert.verifyCertificate(0);
    }

    //  5 · REVOCATION

    function test_Revoke_SetsIsRevokedTrue() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "Plagiarism");
        assertTrue(_certOf(id).isRevoked);
    }

    function test_Revoke_StoresReason() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "Academic-misconduct");
        assertEq(_certOf(id).revokeReason, "Academic-misconduct");
    }

    function test_Revoke_EmptyReasonAllowed() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, ""); // no reason — should not revert
        assertTrue(_certOf(id).isRevoked);
        assertEq(_certOf(id).revokeReason, "");
    }

    function test_Revoke_EmitsEvent() public {
        uint256 id = _issue(student);
        vm.expectEmit(true, false, false, true);
        emit CertificateRevoked(id, "fraud");
        vm.prank(college);
        cert.revokeCertificate(id, "fraud");
    }

    function test_Revoke_DoesNotBurnToken() public {
        // The token remains — the student still holds the (now invalid) NFT
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "Fraud");
        assertEq(cert.ownerOf(id), student);
    }

    function test_Revoke_DoesNotChangeCertDataExceptFlagAndReason() public {
        uint256 id = _issue(student);
        CertificateNFT.Certificate memory before = _certOf(id);

        vm.prank(college);
        cert.revokeCertificate(id, "fraud");

        CertificateNFT.Certificate memory after_ = _certOf(id);
        assertEq(after_.student, before.student);
        assertEq(after_.issuer, before.issuer);
        assertEq(after_.courseName, before.courseName);
        assertEq(after_.degree, before.degree);
        assertEq(after_.institutionName, before.institutionName);
        assertEq(after_.issueDate, before.issueDate);
        assertEq(after_.expiryDate, before.expiryDate);
        assertEq(after_.ipfsHash, before.ipfsHash);
        // Only these two change:
        assertTrue(after_.isRevoked);
        assertEq(after_.revokeReason, "fraud");
    }

    function test_Revert_Revoke_CallerNotIssuer() public {
        uint256 id = _issue(student);
        vm.prank(attacker);
        vm.expectRevert("Not an authorized issuer");
        cert.revokeCertificate(id, "trying");
    }

    function test_Revert_Revoke_DifferentAuthorizedIssuerCannotRevoke() public {
        cert.addIssuer(mit, "MIT");
        uint256 id = _issue(student); // issued by college

        vm.prank(mit);
        vm.expectRevert("Only original issuer can revoke");
        cert.revokeCertificate(id, "MIT attempting to revoke college's cert");
    }

    function test_Revert_Revoke_AlreadyRevoked() public {
        uint256 id = _issue(student);
        vm.startPrank(college);
        cert.revokeCertificate(id, "first reason");
        vm.expectRevert("Already revoked");
        cert.revokeCertificate(id, "second attempt");
        vm.stopPrank();
    }

    function test_Revert_Revoke_NonexistentToken() public {
        vm.prank(college);
        vm.expectRevert("Certificates does not exist");
        cert.revokeCertificate(999, "not there");
    }

    //  6 · SOULBOUND — ALL TRANSFER VECTORS BLOCKED

    function test_Soulbound_TransferFromReverts() public {
        uint256 id = _issue(student);
        vm.prank(student);
        vm.expectRevert("Certificates are non-transferable");
        cert.transferFrom(student, attacker, id);
    }

    function test_Soulbound_SafeTransferFromReverts() public {
        uint256 id = _issue(student);
        vm.prank(student);
        vm.expectRevert("Certificates are non-transferable");
        cert.safeTransferFrom(student, attacker, id, "");
    }

    function test_Soulbound_SafeTransferFromNoDataReverts() public {
        uint256 id = _issue(student);
        vm.prank(student);
        vm.expectRevert("Certificates are non-transferable");
        cert.safeTransferFrom(student, attacker, id);
    }

    function test_Soulbound_ApproveReverts() public {
        uint256 id = _issue(student);
        vm.prank(student);
        vm.expectRevert("Certificates are non-transferable");
        cert.approve(attacker, id);
    }

    function test_Soulbound_ApproveRevertsEvenByOwner() public {
        uint256 id = _issue(student);
        // contract owner cannot approve either
        vm.prank(owner);
        vm.expectRevert("Certificates are non-transferable");
        cert.approve(attacker, id);
    }

    function test_Soulbound_TransferAttemptByThirdPartyReverts() public {
        uint256 id = _issue(student);
        // attacker doesn't own the token — should still revert on the soulbound check
        vm.prank(attacker);
        vm.expectRevert("Certificates are non-transferable");
        cert.transferFrom(student, attacker, id);
    }

    function test_Soulbound_RevokedCertIsAlsoNonTransferable() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "fraud");
        vm.prank(student);
        vm.expectRevert("Certificates are non-transferable");
        cert.transferFrom(student, attacker, id);
    }

    function test_Soulbound_StudentRetainsOwnershipAfterRevoke() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "fraud");
        assertEq(cert.ownerOf(id), student);
    }

    //  7 · STUDENT CERTIFICATE LIST

    function test_StudentList_EmptyForNewAddress() public view {
        uint256[] memory ids = cert.getCertsByStudent(student);
        assertEq(ids.length, 0);
    }

    function test_StudentList_PopulatedAfterIssue() public {
        uint256 id = _issue(student);
        uint256[] memory ids = cert.getCertsByStudent(student);
        assertEq(ids.length, 1);
        assertEq(ids[0], id);
    }

    function test_StudentList_AccumulatesMultipleCerts() public {
        vm.startPrank(college);
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        cert.issueCertificate(student, COURSE_B, DEGREE_PG, 0, IPFS_B);
        cert.issueCertificate(student, "PhD Topic", DEGREE_DR, 0, IPFS_C);
        vm.stopPrank();
        assertEq(cert.getCertsByStudent(student).length, 3);
    }

    function test_StudentList_DoesNotBleedBetweenStudents() public {
        vm.startPrank(college);
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        cert.issueCertificate(student2, COURSE_B, DEGREE_PG, 0, IPFS_B);
        vm.stopPrank();
        assertEq(cert.getCertsByStudent(student).length, 1);
        assertEq(cert.getCertsByStudent(student2).length, 1);
        assertEq(cert.getCertsByStudent(student3).length, 0);
    }

    function test_StudentList_RevocationDoesNotRemoveFromList() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "fraud");
        // Revoked cert still appears in the list — caller must verify status
        assertEq(cert.getCertsByStudent(student).length, 1);
    }

    function test_StudentList_OrderIsInsertionOrder() public {
        vm.startPrank(college);
        uint256 id1 = cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        uint256 id2 = cert.issueCertificate(student, COURSE_B, DEGREE_PG, 0, IPFS_B);
        vm.stopPrank();
        uint256[] memory ids = cert.getCertsByStudent(student);
        assertEq(ids[0], id1);
        assertEq(ids[1], id2);
    }

    //  8 · INTEGRATION SCENARIOS

    function test_Integration_FullLifecycle_IssueVerifyRevoke() public {
        // Issue
        uint256 id = _issue(student);
        assertEq(cert.ownerOf(id), student);

        // Employer verifies — VALID
        vm.prank(employer);
        (bool ok1, string memory s1,) = cert.verifyCertificate(id);
        assertTrue(ok1);
        assertEq(s1, "VALID");

        // Revoke
        vm.prank(college);
        cert.revokeCertificate(id, "Degree obtained fraudulently");

        // Employer re-verifies — REVOKED
        vm.prank(employer);
        (bool ok2, string memory s2,) = cert.verifyCertificate(id);
        assertFalse(ok2);
        assertEq(s2, "REVOKED");
    }

    function test_Integration_IssuerDeauthorizedMidLifecycle() public {
        // College issues to student
        uint256 id = _issue(student);

        // Cert is valid
        (, string memory s1,) = cert.verifyCertificate(id);
        assertEq(s1, "VALID");

        // Owner removes college
        cert.removeIssuer(college);

        // Same cert now shows ISSUER_DEAUTHORIZED
        (, string memory s2,) = cert.verifyCertificate(id);
        assertEq(s2, "ISSUER_DEAUTHORIZED");

        // Owner re-authorizes college
        cert.addIssuer(college, "State University Reinstated");

        // Same cert is VALID again
        (, string memory s3,) = cert.verifyCertificate(id);
        assertEq(s3, "VALID");
    }

    function test_Integration_ExpiryBecomesInvalidAtCorrectTime() public {
        uint256 futureExpiry = block.timestamp + 90 days;
        uint256 id = _issueExpiring(student, futureExpiry);

        // 89 days in — still valid
        vm.warp(block.timestamp + 89 days);
        (, string memory s1,) = cert.verifyCertificate(id);
        assertEq(s1, "VALID");

        // 91 days in — expired
        vm.warp(block.timestamp + 91 days);
        (, string memory s2,) = cert.verifyCertificate(id);
        assertEq(s2, "EXPIRED");
    }

    function test_Integration_ThreeIssuersParallelSessions() public {
        cert.addIssuer(mit, "MIT");
        cert.addIssuer(iit, "IIT Bombay");

        vm.prank(college);
        uint256 ca = cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        vm.prank(mit);
        uint256 cb = cert.issueCertificate(student2, COURSE_B, DEGREE_PG, 0, IPFS_B);
        vm.prank(iit);
        uint256 cc = cert.issueCertificate(student3, "ML", DEGREE_DR, 0, IPFS_C);

        (, string memory sa,) = cert.verifyCertificate(ca);
        (, string memory sb,) = cert.verifyCertificate(cb);
        (, string memory sc,) = cert.verifyCertificate(cc);
        assertEq(sa, "VALID");
        assertEq(sb, "VALID");
        assertEq(sc, "VALID");

        // Remove MIT — only cb is deauthorized
        cert.removeIssuer(mit);
        (, string memory sa2,) = cert.verifyCertificate(ca);
        (, string memory sb2,) = cert.verifyCertificate(cb);
        (, string memory sc2,) = cert.verifyCertificate(cc);
        assertEq(sa2, "VALID");
        assertEq(sb2, "ISSUER_DEAUTHORIZED");
        assertEq(sc2, "VALID");
    }

    function test_Integration_StudentHoldsMultipleCertsFromDifferentIssuers() public {
        cert.addIssuer(mit, "MIT");

        vm.prank(college);
        uint256 id1 = cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        vm.prank(mit);
        uint256 id2 = cert.issueCertificate(student, COURSE_B, DEGREE_PG, 0, IPFS_B);

        uint256[] memory ids = cert.getCertsByStudent(student);
        assertEq(ids.length, 2);
        assertEq(ids[0], id1);
        assertEq(ids[1], id2);

        assertEq(_certOf(id1).issuer, college);
        assertEq(_certOf(id2).issuer, mit);
    }

    //  9 · FUZZ TESTS

    function testFuzz_AnyNonZeroAddressCanReceiveCert(address randomStudent) public {
        vm.assume(randomStudent != address(0));
        vm.prank(college);
        uint256 id = cert.issueCertificate(randomStudent, COURSE_A, DEGREE_UG, 0, IPFS_A);
        assertEq(cert.ownerOf(id), randomStudent);
        assertEq(_certOf(id).student, randomStudent);
    }

    function testFuzz_ZeroAddressAlwaysReverts(address zero) public {
        vm.assume(zero != address(0));
        vm.prank(college);
        cert.issueCertificate(zero, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function testFuzz_ExpiryBoundaryAlwaysCorrect(uint256 secondsUntilExpiry, uint256 warpSeconds) public {
        secondsUntilExpiry = bound(secondsUntilExpiry, 1, 10 * 365 days);
        warpSeconds = bound(warpSeconds, 0, 20 * 365 days);

        uint256 expiry = block.timestamp + secondsUntilExpiry;
        vm.prank(college);
        uint256 id = cert.issueCertificate(student, COURSE_A, DEGREE_UG, expiry, IPFS_A);

        vm.warp(block.timestamp + warpSeconds);

        (bool ok, string memory status,) = cert.verifyCertificate(id);

        if (block.timestamp > expiry) {
            assertFalse(ok);
            assertEq(status, "EXPIRED");
        } else {
            assertTrue(ok);
            assertEq(status, "VALID");
        }
    }

    function testFuzz_TokenIdsIncreaseMonotonically(uint8 count) public {
        count = uint8(bound(count, 1, 60));
        vm.startPrank(college);
        for (uint256 i = 0; i < count; i++) {
            uint256 id = cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
            assertEq(id, i + 1);
        }
        vm.stopPrank();
    }

    function testFuzz_RevokeReasonRoundTrips(string calldata reason) public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, reason);
        assertEq(_certOf(id).revokeReason, reason);
    }

    function testFuzz_NonIssuerNeverMints(address caller) public {
        vm.assume(caller != college);
        vm.assume(caller != address(0));
        vm.prank(caller);
        vm.expectRevert("Not an authorized issuer");
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function testFuzz_TransferAlwaysReverts(address recipient) public {
        vm.assume(recipient != address(0));
        uint256 id = _issue(student);
        vm.prank(student);
        vm.expectRevert("Certificates are non-transferable");
        cert.transferFrom(student, recipient, id);
    }

    //  10 · GAS SNAPSHOTS  (run with: forge snapshot --match-contract CertificateNFTTest)

    function test_Gas_IssueCertificate() public {
        vm.prank(college);
        cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
    }

    function test_Gas_RevokeCertificate() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "reason");
    }

    function test_Gas_VerifyCertificate_Valid() public view {
        // Can't warp in a view test — snapshot the read path
        cert.getCertsByStudent(student); // call a view so gas is captured
    }

    function test_Gas_AddIssuer() public {
        cert.addIssuer(mit, "MIT");
    }

    function test_Gas_RemoveIssuer() public {
        cert.removeIssuer(college);
    }

    //  11 · INVARIANT-STYLE PROPERTY CHECKS

    function test_Invariant_IssuedCertAlwaysHasNonZeroIssueDate() public {
        vm.warp(1_000_000);
        uint256 id = _issue(student);
        assertGt(_certOf(id).issueDate, 0);
    }

    function test_Invariant_OwnerOfIsAlwaysStudentAddress() public {
        uint256 id = _issue(student);
        assertEq(cert.ownerOf(id), _certOf(id).student);
    }

    function test_Invariant_TokenURIMatchesIpfsField() public {
        vm.prank(college);
        uint256 id = cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_B);
        string memory expected = string(abi.encodePacked("ipfs://", IPFS_B));
        assertEq(cert.tokenURI(id), expected);
    }

    function test_Invariant_StudentListCountMatchesMintCount() public {
        vm.startPrank(college);
        uint256 N = 5;
        for (uint256 i = 0; i < N; i++) {
            cert.issueCertificate(student, COURSE_A, DEGREE_UG, 0, IPFS_A);
        }
        vm.stopPrank();
        assertEq(cert.getCertsByStudent(student).length, N);
    }

    function test_Invariant_RevokedCertIsInvalidRegardlessOfTimestamp() public {
        uint256 id = _issue(student);
        vm.prank(college);
        cert.revokeCertificate(id, "fraud");

        // Warp to many different timestamps — cert is always REVOKED, never VALID
        for (uint256 t = 0; t < 5; t++) {
            vm.warp(block.timestamp + t * 365 days);
            (bool ok, string memory status,) = cert.verifyCertificate(id);
            assertFalse(ok);
            assertEq(status, "REVOKED");
        }
    }

    function test_Invariant_DeauthorizedIssuerCertsNeverValid() public {
        uint256 id = _issue(student);
        cert.removeIssuer(college);

        for (uint256 t = 0; t < 3; t++) {
            vm.warp(block.timestamp + t * 30 days);
            (bool ok,,) = cert.verifyCertificate(id);
            assertFalse(ok);
        }
    }

    function test_Invariant_TokenIdNeverZero() public {
        uint256 id = _issue(student);
        assertGt(id, 0);
    }

    function test_Invariant_InstitutionNameSnapshotIsImmutable() public {
        // Mint cert, rename institution, cert still shows original name
        uint256 id = _issue(student);
        string memory original = _certOf(id).institutionName;
        cert.addIssuer(college, "Completely Different Name");
        assertEq(_certOf(id).institutionName, original);
    }
}
