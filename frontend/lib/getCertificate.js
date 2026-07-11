// lib/getCertificate.js
// Server-side fetch — runs on the server (or build time), not in the browser.
// This is what makes the verify page SSR-able and link-preview-friendly.

import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI, RPC_URL } from "./contract";

export async function getCertificate(tokenId) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const [isValid, status, cert] = await contract.verifyCertificate(tokenId);

    return {
      found: true,
      tokenId,
      isValid,
      status,
      student: cert.student,
      issuer: cert.issuer,
      courseName: cert.courseName,
      degree: cert.degree,
      institutionName: cert.institutionName,
      issueDate: Number(cert.issueDate),
      expiryDate: Number(cert.expiryDate),
      isRevoked: cert.isRevoked,
      revokeReason: cert.revokeReason,
      ipfsHash: cert.ipfsHash,
    };
  } catch (e) {
    return { found: false, tokenId, error: e.reason || "Certificate not found" };
  }
}