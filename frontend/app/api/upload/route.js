import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI, RPC_URL, CHAIN_ID } from "../../../lib/contract";
import { uploadAuthMessage, UPLOAD_AUTH_WINDOW_MS } from "../../../lib/uploadAuth";

export const runtime = "nodejs";

// FIX: no NEXT_PUBLIC_ prefix — that prefix inlines the value into client bundles
// if any client file ever references it. These must stay server-only.
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// Vercel Functions cap request bodies at ~4.5 MB, so the UI's old "50 MB" was unreachable.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const MAX_TEXT = 200;

// Don't trust the client-supplied MIME type; check magic bytes.
function sniffType(buf) {
  const b = new Uint8Array(buf.slice(0, 12));
  const ascii = (s, o = 0) => [...s].every((c, i) => b[o + i] === c.charCodeAt(0));
  if (ascii("%PDF")) return "application/pdf";
  if (b[0] === 0x89 && ascii("PNG", 1)) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (ascii("RIFF") && ascii("WEBP", 8)) return "image/webp";
  return null;
}

function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    return bad("Server is missing PINATA_API_KEY / PINATA_SECRET_KEY env vars.", 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const studentAddress = String(formData.get("studentAddress") || "").trim();
    const course = String(formData.get("course") || "").trim();
    const degree = String(formData.get("degree") || "").trim();
    const signature = String(formData.get("signature") || "");
    const timestamp = Number(formData.get("timestamp"));

    // ── 1. Authenticate: signer must be an authorized issuer ───────────────
    if (!signature || !Number.isFinite(timestamp)) return bad("Missing authorization signature.", 401);
    const age = Date.now() - timestamp;
    if (age > UPLOAD_AUTH_WINDOW_MS || age < -60_000) return bad("Authorization expired. Please retry.", 401);

    let issuer;
    try {
      issuer = ethers.verifyMessage(uploadAuthMessage(timestamp), signature);
    } catch {
      return bad("Invalid signature.", 401);
    }

    let institution;
    try {
      const network = ethers.Network.from(CHAIN_ID);
      const provider = new ethers.JsonRpcProvider(RPC_URL, network, { staticNetwork: network });
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const authorized = await contract.authorizedIssuers(issuer);
      if (!authorized) return bad("This wallet is not an authorized issuer.", 403);
      // FIX: institution comes from the registry, not the form, so pinned metadata
      // can never disagree with what the contract stores in institutionName.
      institution = await contract.issuerNames(issuer);
    } catch (e) {
      console.error("Issuer check failed:", e);
      return bad("Could not verify issuer on-chain. Try again shortly.", 502);
    }

    // ── 2. Validate input ──────────────────────────────────────────────────
    if (!file || typeof file === "string") return bad("No file uploaded.");
    if (!ethers.isAddress(studentAddress)) return bad("Invalid student wallet address.");
    if (!course || !degree) return bad("Course and degree are required.");
    if (course.length > MAX_TEXT || degree.length > MAX_TEXT) return bad("Course/degree too long.");
    if (file.size > MAX_BYTES) return bad("File too large (max 4 MB).", 413);

    const buf = await file.arrayBuffer();
    const sniffed = sniffType(buf);
    if (!sniffed || !ALLOWED_TYPES.has(sniffed)) return bad("Only PDF, PNG, JPEG or WebP files are allowed.", 415);

    // ── 3. Pin the file ────────────────────────────────────────────────────
    const stamp = Date.now();
    const fileFormData = new FormData();
    fileFormData.append("file", new Blob([buf], { type: sniffed }), file.name || "certificate");
    fileFormData.append("pinataMetadata", JSON.stringify({ name: `cert-${studentAddress}-${stamp}` }));

    const fileRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { pinata_api_key: PINATA_API_KEY, pinata_secret_api_key: PINATA_SECRET_KEY },
      body: fileFormData,
    });
    if (!fileRes.ok) throw new Error(`Pinata file upload failed: ${await fileRes.text()}`);
    const fileCid = (await fileRes.json()).IpfsHash;

    // ── 4. Pin the metadata JSON ───────────────────────────────────────────
    const metadata = {
      name: `${degree} — ${studentAddress}`,
      description: `Certificate issued by ${institution}`,
      image: `ipfs://${fileCid}`,
      attributes: [
        { trait_type: "Course", value: course },
        { trait_type: "Degree", value: degree },
        { trait_type: "Institution", value: institution },
        { trait_type: "Issuer", value: issuer },
        { trait_type: "Issued", value: new Date().toISOString() },
      ],
    };

    const metaRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataMetadata: { name: `cert-meta-${studentAddress}-${stamp}` },
        pinataContent: metadata,
      }),
    });
    if (!metaRes.ok) throw new Error(`Pinata metadata upload failed: ${await metaRes.text()}`);
    const metaResult = await metaRes.json();

    return NextResponse.json({
      success: true,
      fileCid,
      metadataCid: metaResult.IpfsHash, // goes into issueCertificate()
      fileUrl: `https://ipfs.io/ipfs/${fileCid}`,
      metadataUrl: `https://ipfs.io/ipfs/${metaResult.IpfsHash}`,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return bad(e.message || "Upload failed", 500);
  }
}
