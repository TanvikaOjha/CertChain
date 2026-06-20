// app/issue/page.js
"use client";

import { useState, useRef } from "react";
import { ethers } from "ethers";
import Nav from "../../components/Nav";
// import { CONTRACT_ADDRESS, ABI } from "../../lib/contract";

function truncate(str, n = 6) {
  if (!str) return "";
  return `${str.slice(0, n)}…${str.slice(-4)}`;
}

export default function IssuePage() {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [form, setForm] = useState({ student: "", course: "", degree: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { metadataCid, fileUrl, ... }
  const [issuing, setIssuing] = useState(false);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found — please install it.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const s = await provider.getSigner();
    setSigner(s);
    setAccount(await s.getAddress());
  }

  function handleFileSelect(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setUploadResult(null); // reset — needs re-upload if file changes
    }
  }

  // Step 1: Upload PDF + metadata to IPFS via our own API route
  // (keeps the Pinata secret key on the server, never in the browser)
  async function handleUpload() {
    if (!file || !form.student || !form.course || !form.degree) {
      return setStatus({ type: "error", msg: "Fill in all fields and select a file first." });
    }
    setUploading(true);
    setStatus({ type: "info", msg: "Uploading certificate to IPFS…" });
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("studentName", form.student);
      body.append("course", form.course);
      body.append("degree", form.degree);
      body.append("institution", "Your College Name"); // customize per-deployment

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadResult(data);
      setStatus({ type: "success", msg: "✓ Uploaded to IPFS. Ready to mint." });
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    }
    setUploading(false);
  }

  // Step 2: Mint the certificate NFT using the CID from step 1
  async function handleIssue() {
    if (!signer || !uploadResult) return;
    setIssuing(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setStatus({ type: "info", msg: "Waiting for MetaMask confirmation…" });
      const tx = await contract.issueCertificate(
        form.student, form.course, form.degree, 0, uploadResult.metadataCid
      );
      setStatus({ type: "info", msg: "Mining transaction…" });
      const receipt = await tx.wait();

      const iface = new ethers.Interface(ABI);
      let tokenId = "?";
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "CertificateIssued") { tokenId = parsed.args.tokenId.toString(); break; }
        } catch {}
      }
      setStatus({ type: "success", msg: `✓ Certificate minted — Token ID: ${tokenId}`, tokenId });
      setForm({ student: "", course: "", degree: "" });
      setFile(null);
      setUploadResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "Transaction failed." });
    }
    setIssuing(false);
  }

  const formReady = form.student && form.course && form.degree && file;

  return (
    <>
      <Nav />

      <div className="hero">
        <div className="hero-eyebrow">On-Chain Credential Registry</div>
        <h1 className="hero-title">Issue a <em>Credential</em></h1>
        <p className="hero-sub">
          Upload the certificate and mint it directly — no separate scripts, no manual CID pasting.
        </p>
      </div>

      <div className="main">
        <div className="verify-wrap">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-icon">🎓</div>
              <div>
                <div className="panel-title">Issue Certificate</div>
                <div className="panel-sub">Authorized issuers only</div>
              </div>
            </div>
            <div className="panel-body">
              {!account ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: "32px", marginBottom: "14px" }}>🔑</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: "16px", marginBottom: "8px", color: "var(--parchment)" }}>
                    Wallet Required
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "20px" }}>
                    Connect your authorized institution wallet to mint certificates.
                  </div>
                  <button className="btn-primary" style={{ maxWidth: "220px", margin: "0 auto" }} onClick={connectWallet}>
                    Connect MetaMask
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-grid">
                    <div className="field field-full">
                      <label className="field-label">Student Wallet Address</label>
                      <input className="field-input" placeholder="0x..." value={form.student}
                        onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Course Name</label>
                      <input className="field-input" placeholder="Blockchain Development" value={form.course}
                        onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Degree</label>
                      <input className="field-input" placeholder="B.Tech CSE" value={form.degree}
                        onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} />
                    </div>

                    {/* Native file picker — replaces the old manual CID text field */}
                    <div className="field field-full">
                      <label className="field-label">Certificate File (PDF or Image)</label>
                      <label
                        htmlFor="cert-file"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                          border: "1px dashed var(--border2)", borderRadius: "9px", padding: "20px",
                          cursor: "pointer", background: "var(--surface2)", transition: "border-color 0.2s",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>📎</span>
                        <span style={{ fontSize: "12px", color: file ? "var(--parchment)" : "var(--faint)" }}>
                          {file ? file.name : "Click to choose a file…"}
                        </span>
                      </label>
                      <input
                        ref={fileInputRef}
                        id="cert-file"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>

                  {/* Step 1: Upload button — only enabled once form + file are ready */}
                  {!uploadResult && (
                    <button
                      className={`btn-primary ${uploading ? "loading" : ""}`}
                      disabled={uploading || !formReady}
                      onClick={handleUpload}
                    >
                      {uploading ? "" : "1. Upload to IPFS"}
                    </button>
                  )}

                  {/* Step 2: Mint button — only appears after successful upload */}
                  {uploadResult && (
                    <>
                      <div className="status-banner success" style={{ marginBottom: "8px" }}>
                        ✓ Pinned to IPFS —{" "}
                        <a href={uploadResult.fileUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                          view file
                        </a>
                      </div>
                      <button
                        className={`btn-primary ${issuing ? "loading" : ""}`}
                        disabled={issuing}
                        onClick={handleIssue}
                      >
                        {issuing ? "" : "2. Mint Certificate NFT"}
                      </button>
                    </>
                  )}

                  {status && (
                    <div className={`status-banner ${status.type}`}>
                      {status.msg}
                      {status.tokenId && (
                        <a href={`/verify/${status.tokenId}`} style={{ color: "inherit", textDecoration: "underline", marginLeft: "auto" }}>
                          View →
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon">📋</div>
                <div>
                  <div className="panel-title">How Issuing Works Now</div>
                  <div className="panel-sub">Two steps, both in-app</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="hiw-item">
                  <div className="hiw-icon">📤</div>
                  <div>
                    <div className="hiw-title">1. Upload to IPFS</div>
                    <div className="hiw-text">Your file goes to our server, which pins it to IPFS via Pinata. Your Pinata key never touches the browser.</div>
                  </div>
                </div>
                <div className="hiw-item">
                  <div className="hiw-icon">⛓️</div>
                  <div>
                    <div className="hiw-title">2. Mint On-Chain</div>
                    <div className="hiw-text">The returned IPFS CID is passed straight into the smart contract call — no copy-pasting required.</div>
                  </div>
                </div>
                <div className="hiw-item">
                  <div className="hiw-icon">✓</div>
                  <div>
                    <div className="hiw-title">Done</div>
                    <div className="hiw-text">You get a Token ID and a shareable verify link immediately.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel quote-card">
              <div className="panel-body">
                <div className="quote-text">
                  &ldquo;A certificate on-chain is not just a record — it is a promise that cannot be broken.&rdquo;
                </div>
                <div className="quote-attr">CERTCHAIN · SEPOLIA TESTNET</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}