// lib/contract.js
// Shared contract config used by both server (verify page, upload API) and client code.

// NOTE: if you redeploy the contract (required for the allIssuers fix), update this address.
export const CONTRACT_ADDRESS = "0x994cb99ad1a079cf83b1783a1d623fa8373f457a";

export const CHAIN_ID = 11155111; // Sepolia
export const CHAIN_ID_HEX = "0xaa36a7";

export const ABI = [
  "function issueCertificate(address student, string courseName, string degree, uint256 expiryDate, string ipfsHash) external returns (uint256)",
  "function revokeCertificate(uint256 tokenId, string reason) external",
  "function verifyCertificate(uint256 tokenId) external view returns (bool isValid, string status, tuple(address student, address issuer, string courseName, string degree, string institutionName, uint256 issueDate, uint256 expiryDate, bool isRevoked, string revokeReason, string ipfsHash) cert)",
  "function getCertsByStudent(address student) external view returns (uint256[])",
  "function addIssuer(address issuer, string name) external",
  // FIX: removeIssuer was missing, so the admin "Remove" button threw "not a function"
  "function removeIssuer(address issuer) external",
  "function owner() external view returns (address)",
  "function authorizedIssuers(address) external view returns (bool)",
  "function issuerNames(address) external view returns (string)",
  "function getAllIssuers() external view returns (address[])",
  "event CertificateIssued(uint256 indexed tokenId, address indexed student, address indexed issuer, string courseName)",
  "event CertificateRevoked(uint256 indexed tokenId, string reason)",
  "event IssuerAuthorized(address indexed issuer, string name)",
  "event IssuerRevoked(address indexed issuer)",
];

// FIX: fall back to a public Sepolia RPC instead of undefined (which made
// JsonRpcProvider hit localhost and report every certificate as "not found").
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// FIX: fallback now matches the real deployment.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://cert-chain-nine.vercel.app"
).replace(/\/$/, "");
