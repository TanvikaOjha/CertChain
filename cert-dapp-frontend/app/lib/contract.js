// lib/contract.js
// Shared contract config used by both server (verify page) and client (issue page) code.

export const CONTRACT_ADDRESS = "0xYourDeployedAddressHere";

export const ABI = [
  "function issueCertificate(address student, string courseName, string degree, uint256 expiryDate, string ipfsHash) external returns (uint256)",
  "function revokeCertificate(uint256 tokenId, string reason) external",
  "function verifyCertificate(uint256 tokenId) external view returns (bool isValid, string status, tuple(address student, address issuer, string courseName, string degree, string institutionName, uint256 issueDate, uint256 expiryDate, bool isRevoked, string revokeReason, string ipfsHash) cert)",
  "function getCertsByStudent(address student) external view returns (uint256[])",
  "function addIssuer(address issuer, string name) external",
  "function authorizedIssuers(address) external view returns (bool)",
  "function issuerNames(address) external view returns (string)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed student, address indexed issuer, string courseName)",
  "event CertificateRevoked(uint256 indexed tokenId, string reason)"
];

export const RPC_URL = "https://rpc.ankr.com/eth_sepolia";

// export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://certchain.vercel.app";