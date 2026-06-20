// app/api/upload/route.js
//
// Server-side route — runs on the server, never in the browser.
// This is the piece that lets the Issue page upload a PDF directly,
// without exposing your Pinata secret key to the client and without
// a separate Node.js script.
//
// Flow: browser sends FormData (file + cert details) -> this route ->
// Pinata (file pin + JSON metadata pin) -> returns the IPFS CID.

import { NextResponse } from "next/server";

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export async function POST(request) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    return NextResponse.json(
      { error: "Server is missing PINATA_API_KEY / PINATA_SECRET_KEY env vars." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const studentName = formData.get("studentName") || "Unnamed";
    const course = formData.get("course") || "";
    const degree = formData.get("degree") || "";
    const institution = formData.get("institution") || "";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ── Step 1: Upload the certificate file to Pinata ──────────────
    const fileFormData = new FormData();
    fileFormData.append("file", file, file.name);
    fileFormData.append(
      "pinataMetadata",
      JSON.stringify({ name: `cert-${studentName}-${Date.now()}` })
    );

    const fileRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: fileFormData,
    });

    if (!fileRes.ok) {
      const errText = await fileRes.text();
      throw new Error(`Pinata file upload failed: ${errText}`);
    }
    const fileResult = await fileRes.json();
    const fileCid = fileResult.IpfsHash;

    // ── Step 2: Build & upload the metadata JSON ────────────────────
    const metadata = {
      name: `${studentName} — ${degree}`,
      description: `Certificate issued by ${institution}`,
      image: `ipfs://${fileCid}`,
      attributes: [
        { trait_type: "Course", value: course },
        { trait_type: "Degree", value: degree },
        { trait_type: "Institution", value: institution },
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
        pinataMetadata: { name: `cert-meta-${studentName}-${Date.now()}` },
        pinataContent: metadata,
      }),
    });

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      throw new Error(`Pinata metadata upload failed: ${errText}`);
    }
    const metaResult = await metaRes.json();

    return NextResponse.json({
      success: true,
      fileCid,
      metadataCid: metaResult.IpfsHash, // ← this is what goes into issueCertificate()
      fileUrl: `https://ipfs.io/ipfs/${fileCid}`,
      metadataUrl: `https://ipfs.io/ipfs/${metaResult.IpfsHash}`,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}

// Optional: limit upload size (Pinata free tier is generous, but keep requests reasonable)
export const config = {
  api: {
    bodyParser: false, // we're using formData(), not the legacy body parser
  },
};