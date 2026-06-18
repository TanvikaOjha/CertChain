//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract CertificateNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;


    //Certificate Data

    stuct Certificate {
        address student;
        address issuer;
        string courseName;
        string degree;
        string institutionName;
        uint256 issueData;
        uint256 expiryDate;   //0 => no expiry
        bool isRevoked;
        string revokeReason;
        string ipfsHash; //IPFS CID of metadata JSON
    }

    //Storage
    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;
    mapping(address=> string) public issuerNames;
    mapping(address => uint256[]) private studentTokens;

    //Events
    event CertificateIssued(
    uint256 indexed tokenId,
    address indexed student,
    address indexed issuer,
    string courseName);
    event CertificateRevoked(
        uint256 indexed tokenId,
        string reason
    )
    event IssuerAuthorized(address indexed issuer, string name);
    event IssuerRevoked(address indexed issuer);

    //Modifiers
    modifier onlyIssuer() {
        require(authorizedIssuer[msg.sender], "Not an authorized issuer");
        _;
    }
    modifier certExists(uint256 tokenId) {
        require(_exists(tokenId), "Certificates does not exit");
        _;
    }

    //Constructor
    constructor() ERC721("CetificateNFT", "CERT") Ownable(msg.sender) {
       //Contract Owner = the platform / university admin
    }
    //Admin: Manage Issuers
    function addIssuer(address _issuer, string memory _name) external onlyOwner{
        authorizedIssuer[_issuer] = true;
        issuerNames[_issuer] = _name;
        emit IssuerAuthorized(_issuer, _name);
    }

    function removeIssuer(address _issuer) external onlyOwner{
        authorizedIssuers[_issuer]= false;
        emit IssuerRevoked(_issuer);
    }

    //Issuer: Mint Certificate

    function issueCertificate(
        address _student,
        string memory _courseName,
        string memory _degree,
        uint256 _expiryDate,
        string memory _ipfsHash)
        external onlyIssuer returns (uint256) {
            require(_student != address(0), "Invalid student address");
            require(bytes(_ipfsHash).length > 0, "IPFS hash required");

            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();

            //Mint the NFT to the student's wallet

            _safeMint(_student, tokenId);
            _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", _ipfsHash)));
        }
   // Store certificate data on-chain
        certificates[tokenId] = Certificate({
            student:         _student,
            issuer:          msg.sender,
            courseName:      _courseName,
            degree:          _degree,
            institutionName: issuerNames[msg.sender],
            issueDate:       block.timestamp,
            expiryDate:      _expiryDate,
            isRevoked:       false,
            revokeReason:    "",
            ipfsHash:        _ipfsHash
        });

        studentTokens[_student].push(tokenId);
        emit CertificateIssued(tokenId, _student, msg.sender, _courseName);

        return tokenId;
    }      

  // ── Issuer: Revoke Certificate ──────────────────────────────
    function revokeCertificate(uint256 tokenId, string memory reason)
        external onlyIssuer certExists(tokenId)
    {
        require(
            certificates[tokenId].issuer == msg.sender,
            "Only original issuer can revoke"
        );
        require(!certificates[tokenId].isRevoked, "Already revoked");

        certificates[tokenId].isRevoked     = true;
        certificates[tokenId].revokeReason  = reason;

        emit CertificateRevoked(tokenId, reason);
    }       
 // ── Public: Verify Certificate ──────────────────────────────
    function verifyCertificate(uint256 tokenId)
        external view certExists(tokenId)
        returns (
            bool   isValid,
            string memory status,
            Certificate memory cert
        )
    {
        Certificate memory c = certificates[tokenId];
        cert = c;

        if (c.isRevoked) {
            return (false, "REVOKED", cert);
        }
        if (c.expiryDate > 0 && block.timestamp > c.expiryDate) {
            return (false, "EXPIRED", cert);
        }
        if (!authorizedIssuers[c.issuer]) {
            return (false, "ISSUER_DEAUTHORIZED", cert);
        }

        return (true, "VALID", cert);
    }
       
    // ── Public: Get Student's Certificates ─────────────────────
    function getCertsByStudent(address _student)
        external view
        returns (uint256[] memory)
    {
        return studentTokens[_student];
    }    


         // ── Soulbound: Block All Transfers ──────────────────────────
    function transferFrom(
        address, address, uint256
    ) public pure override {
        revert("Certificates are non-transferable");
    }

    function safeTransferFrom(
        address, address, uint256, bytes memory
    ) public pure override {
        revert("Certificates are non-transferable");
    }

    function approve(address, uint256) public pure override {
        revert("Certificates are non-transferable");
    }


}