// components/CertificateResult.jsx
// Pure presentational — works as a Server Component (no hooks, no "use client").
// This is what enables the verify page to be fully SSR'd.

function truncate(str, n = 8) {
  if (!str) return "—";
  return str.length > n * 2 + 3 ? `${str.slice(0, n)}…${str.slice(-n)}` : str;
}
function formatDate(unix) {
  if (!unix) return "No Expiry";
  return new Date(unix * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function CertificateResult({ data }) {
  if (!data.found) {
    return (
      <div className="status-banner error">
        <span>✕</span> {data.error || "Certificate not found. Check the Token ID."}
      </div>
    );
  }

  const { isValid, status, tokenId, student, issuer, courseName, degree, institutionName, issueDate, expiryDate, isRevoked, revokeReason, ipfsHash } = data;

  return (
    <div className="seal-container">
      <div className="seal-wrap">
        <div className={`seal ${isValid ? "valid" : "revoked"}`}>
          <div className="seal-rays" />
          <div className="seal-ring" />
          <div className="seal-icon">{isValid ? "✓" : "✕"}</div>
          <div className="seal-word">{isValid ? "VALID" : status}</div>
        </div>
      </div>

      <div className="cert-card">
        <div className="cert-header">
          <div>
            <div className="cert-inst">{institutionName || "Certified Institution"}</div>
            <div className="cert-name">{courseName}</div>
          </div>
          <div className="cert-token">#{tokenId}</div>
        </div>
        <div className="cert-divider" />
        <div className="cert-body">
          This certifies that <strong>{truncate(student, 6)}</strong> has successfully completed the
          requirements for the degree of <strong>{degree}</strong>.
        </div>
        <div className="cert-meta">
          <div>
            <div className="cert-meta-label">Issued On</div>
            <div className="cert-meta-val">{formatDate(issueDate)}</div>
          </div>
          <div>
            <div className="cert-meta-label">Expires</div>
            <div className="cert-meta-val">{formatDate(expiryDate)}</div>
          </div>
          <div>
            <div className="cert-meta-label">Student</div>
            <div className="cert-meta-val">{truncate(student)}</div>
          </div>
          <div>
            <div className="cert-meta-label">Issuer</div>
            <div className="cert-meta-val">{truncate(issuer)}</div>
          </div>
          {isRevoked && (
            <div style={{ gridColumn: "1/-1" }}>
              <div className="cert-meta-label">Revoke Reason</div>
              <div className="cert-meta-val" style={{ color: "var(--revoked)" }}>{revokeReason}</div>
            </div>
          )}
        </div>
        <div className="cert-footer">
          <div className="cert-chain-badge">
            <div className="chain-dot" />
            On-Chain · Sepolia
          </div>
          {ipfsHash && (
            <a className="cert-ipfs-link" href={`https://ipfs.io/ipfs/${ipfsHash}`} target="_blank" rel="noreferrer">
              View on IPFS ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}