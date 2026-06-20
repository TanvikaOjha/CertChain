// app/page.js
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Nav from "../components/Nav";

export default function HomePage() {
  const router = useRouter();
  const [tokenId, setTokenId] = useState("");

  function handleVerify() {
    if (!tokenId.trim()) return;
    // Navigate to the dynamic SSR route — this is where the magic happens
    router.push(`/verify/${tokenId.trim()}`);
  }

  return (
    <>
      <Nav />

      <div className="hero">
        <div className="hero-eyebrow">On-Chain Credential Registry</div>
        <h1 className="hero-title"><em>Verify</em> a Certificate</h1>
        <p className="hero-sub">
          Paste any Token ID to instantly verify authenticity against the Ethereum blockchain. No trust required.
        </p>
      </div>

      <div className="main">
        <div className="stats-strip">
          <div className="stat-block"><div className="stat-val">∞</div><div className="stat-label">Certificates Issued</div></div>
          <div className="stat-block"><div className="stat-val">Sepolia</div><div className="stat-label">Network</div></div>
          <div className="stat-block"><div className="stat-val">3s</div><div className="stat-label">Avg. Verify Time</div></div>
        </div>

        <div className="verify-wrap">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-icon">🔍</div>
              <div>
                <div className="panel-title">Certificate Lookup</div>
                <div className="panel-sub">No wallet required</div>
              </div>
            </div>
            <div className="panel-body">
              <div className="field">
                <label className="field-label">Token ID</label>
                <input
                  className="field-input"
                  placeholder="e.g. 1"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <button className="btn-primary" onClick={handleVerify} disabled={!tokenId.trim()}>
                Verify Certificate
              </button>

              <div className="empty-state">
                <div className="empty-icon">📜</div>
                <div className="empty-label">Enter a Token ID to begin verification</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-icon">⛓️</div>
              <div>
                <div className="panel-title">How It Works</div>
                <div className="panel-sub">Trustless by design</div>
              </div>
            </div>
            <div className="panel-body">
              <div className="hiw-item">
                <div className="hiw-icon">🪙</div>
                <div>
                  <div className="hiw-title">Minted as an NFT</div>
                  <div className="hiw-text">Every certificate is an ERC-721 token on Ethereum — permanently recorded on the blockchain.</div>
                </div>
              </div>
              <div className="hiw-item">
                <div className="hiw-icon">🔒</div>
                <div>
                  <div className="hiw-title">Soulbound & Immutable</div>
                  <div className="hiw-text">Certificates cannot be transferred or sold. The record cannot be altered after issuance.</div>
                </div>
              </div>
              <div className="hiw-item">
                <div className="hiw-icon">⚡</div>
                <div>
                  <div className="hiw-title">Instant Verification</div>
                  <div className="hiw-text">No emails, no waiting. Any employer reads the smart contract directly — verification in seconds.</div>
                </div>
              </div>
              <div className="hiw-item">
                <div className="hiw-icon">🔗</div>
                <div>
                  <div className="hiw-title">Shareable Links</div>
                  <div className="hiw-text">Every certificate has a permanent URL — <code>certchain.app/verify/42</code> — that shows a rich preview when shared.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}