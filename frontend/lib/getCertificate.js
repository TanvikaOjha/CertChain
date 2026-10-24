
// Server-side fetch — runs on the server (or build time), not in the browser.
// Wrapped in React cache() so generateMetadata and the page share ONE set of RPC calls.

import { cache } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI, RPC_URL, CHAIN_ID } from "./contract";

export const getCertificate = cache(async (tokenId) => {
  // Reject garbage before it reaches the RPC.
  if (!/^\d{1,30}$/.test(String(tokenId))) {
    return { found: false, tokenId, error: "Invalid token ID." };
  }

  try {
    // staticNetwork: skip network auto-detection and don't retry forever on a bad RPC URL.
    const network = ethers.Network.from(CHAIN_ID);
    const provider = new ethers.JsonRpcProvider(RPC_URL, network, { staticNetwork: network });
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
    // Anything else (bad RPC URL, rate limit, timeout, wrong chain) is an
    // infrastructure failure and must NOT be shown as "not found".
    if (e?.code === "CALL_EXCEPTION") {
      return { found: false, tokenId, error: "Certificate not found in the registry." };
    }
    console.error("getCertificate infrastructure error:", e?.code, e?.shortMessage || e?.message);
    return {
      found: false,
      tokenId,
      infraError: true,
      error: "Could not reach the blockchain right now. This is not a verdict on the certificate — please try again shortly.",
    };
  }
});
