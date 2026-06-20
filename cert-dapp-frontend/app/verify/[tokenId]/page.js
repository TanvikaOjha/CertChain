// app/verify/[tokenId]/page.js
//
// This is the page that justifies Next.js for this project.
// It's a Server Component — the certificate is fetched and rendered
// on the server BEFORE the page reaches the browser. That means:
//   1. The page is instantly visible (no blank-screen-then-render)
//   2. generateMetadata() below lets WhatsApp/LinkedIn/Twitter show a
//      rich preview card with the certificate details when this link
//      is shared — something a pure client-side React app cannot do.

import Link from "next/link";
import Nav from "../../../components/Nav";
import CertificateResult from "../../../components/CertificateResult";
import { getCertificate } from "../../../lib/getCertificate";
import { SITE_URL } from "../../../lib/contract";

// ─── Runs on the server at request time, builds <head> meta tags ───
export async function generateMetadata({ params }) {
  const { tokenId } = params;
  const data = await getCertificate(tokenId);

  if (!data.found) {
    return {
      title: `Certificate #${tokenId} Not Found — CertChain`,
      description: "This certificate could not be located on the blockchain.",
    };
  }

  const title = `${data.courseName} — ${data.isValid ? "Verified ✓" : data.status} | CertChain`;
  const description = `Certificate #${tokenId} issued by ${data.institutionName || "a verified institution"}. Status: ${data.isValid ? "VALID" : data.status}. View the full on-chain credential.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/verify/${tokenId}`,
      siteName: "CertChain",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

// ─── The actual page — Server Component, runs on the server ───
export default async function VerifyTokenPage({ params }) {
  const { tokenId } = params;
  const data = await getCertificate(tokenId);

  return (
    <>
      <Nav />

      <div className="hero">
        <div className="hero-eyebrow">Certificate #{tokenId}</div>
        <h1 className="hero-title">
          {data.found ? <><em>{data.isValid ? "Verified" : "Checked"}</em> Result</> : <>Not <em>Found</em></>}
        </h1>
        <p className="hero-sub">
          {data.found
            ? "This result was verified directly against the smart contract on Ethereum."
            : "No certificate exists with this Token ID on the current contract."}
        </p>
      </div>

      <div className="main">
        <div className="verify-wrap">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-icon">🔍</div>
              <div>
                <div className="panel-title">Verification Result</div>
                <div className="panel-sub">Server-rendered · Sepolia</div>
              </div>
            </div>
            <div className="panel-body">
              <CertificateResult data={data} />
              <Link href="/" className="btn-primary" style={{ marginTop: "20px" }}>
                ← Verify Another Certificate
              </Link>
            </div>
          </div>

          <div className="panel quote-card">
            <div className="panel-body">
              <div className="quote-text">
                &ldquo;A certificate on-chain is not just a record — it is a promise that cannot be broken.&rdquo;
              </div>
              <div className="quote-attr">CERTCHAIN · SEPOLIA TESTNET</div>
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                <div className="field-label" style={{ marginBottom: "8px" }}>Share this result</div>
                <div className="field-input" style={{ fontSize: "11px", wordBreak: "break-all", cursor: "text" }}>
                  {SITE_URL}/verify/{tokenId}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px", lineHeight: 1.6 }}>
                  This link shows a rich preview with the certificate status when shared on LinkedIn, WhatsApp, or Twitter.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}