

import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, WifiOff } from "lucide-react";

function truncate(str, n = 8) {
  if (!str) return "—";
  return str.length > n * 2 + 3 ? `${str.slice(0, n)}…${str.slice(-n)}` : str;
}

function formatDate(unix) {
  if (!unix || Number(unix) === 0) return "Lifetime Validity";
  return new Date(Number(unix) * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// label defaulted to "VALID" and only revoked/expired were handled, so
// ISSUER_DEAUTHORIZED rendered as a green ring with a "VALID" label.
const STATUS_THEME = {
  VALID: {
    label: "VALID",
    ring: "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-400",
    summary:
      "This soulbound credential passes every on-chain check: it is issued by an authorized institution, not revoked, and not expired.",
  },
  REVOKED: {
    label: "REVOKED",
    ring: "border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)] text-rose-400",
    summary: "The issuing institution has permanently revoked this credential. It must not be relied upon.",
  },
  EXPIRED: {
    label: "EXPIRED",
    ring: "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-amber-400",
    summary: "This credential has passed its expiry date and is no longer valid.",
  },
  ISSUER_DEAUTHORIZED: {
    label: "ISSUER DEAUTHORIZED",
    ring: "border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)] text-orange-400",
    summary:
      "The institution that issued this credential is no longer authorized on the registry. The record exists but can no longer be trusted as valid.",
  },
};

export default function CertificateResult({ data }) {
  if (!data || !data.found) {
    const infra = data?.infraError;
    const Icon = infra ? WifiOff : XCircle;
    const tone = infra
      ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
      : "bg-rose-500/5 border-rose-500/20 text-rose-400";
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${tone}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span>{data?.error || "Token identifier not found in registry."}</span>
      </div>
    );
  }

  const {
    isValid, status, tokenId, student, issuer, courseName, degree,
    institutionName, issueDate, expiryDate, isRevoked, revokeReason, ipfsHash,
  } = data;

  const theme = STATUS_THEME[status] || {
    label: String(status || "UNKNOWN").replace(/_/g, " "),
    ring: "border-slate-500/30 text-slate-400",
    summary: "The registry returned an unrecognized status for this credential.",
  };
  const isExpired = status === "EXPIRED";

  return (
    <div className="space-y-8">
      {/* Seal + status */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-slate-950 border border-slate-800/60">
        <div className="shrink-0 relative flex items-center justify-center">
          <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center bg-slate-900 font-mono text-center relative z-10 px-2 ${theme.ring}`}>
            {isValid ? <CheckCircle2 className="w-6 h-6 mb-0.5" /> : <AlertTriangle className="w-6 h-6 mb-0.5" />}
            <span className="text-[9px] leading-tight font-extrabold tracking-wider">{theme.label}</span>
          </div>
          <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-pulse blur-md"></div>
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Ledger Attestation State</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{theme.summary}</p>
        </div>
      </div>

      {/* Certificate card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/2 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex justify-between items-start gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">
              {institutionName || "Authorized Institution Signature"}
            </div>
            <h4 className="text-xl font-extrabold text-white tracking-tight">{courseName}</h4>
          </div>
          <div className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg shrink-0">
            Token ID #{tokenId}
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
          This record states that wallet{" "}
          <span className="font-mono text-indigo-300 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 select-all">
            {truncate(student, 6)}
          </span>{" "}
          was awarded <strong className="text-white font-medium">{degree}</strong>.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900/60">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Issuance Date</span>
            <span className="text-slate-200 font-sans">{formatDate(issueDate)}</span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900/60">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Expiry</span>
            <span className={`font-sans ${isExpired ? "text-amber-400 font-medium" : "text-slate-200"}`}>
              {formatDate(expiryDate)}
            </span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900/60">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Student Wallet</span>
            <span className="text-slate-300 break-all text-[11px] select-all">{student}</span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900/60">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Issuer Wallet</span>
            <span className="text-slate-300 break-all text-[11px] select-all">{issuer}</span>
          </div>

          {isRevoked && (
            <div className="sm:col-span-2 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl text-rose-400 flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[10px] uppercase block tracking-wider mb-0.5">Revocation Record</span>
                <p className="font-sans text-xs">{revokeReason || "No reason was provided by the issuer."}</p>
              </div>
            </div>
          )}

          {status === "ISSUER_DEAUTHORIZED" && (
            <div className="sm:col-span-2 bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl text-orange-400 flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[10px] uppercase block tracking-wider mb-0.5">Issuer Status</span>
                <p className="font-sans text-xs">
                  The registry owner has removed this issuer. Contact the institution to confirm the credential independently.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-900 pt-4 flex flex-wrap gap-4 items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
            On-Chain Registry
          </div>

          {ipfsHash && (
            <a
              href={`https://ipfs.io/ipfs/${ipfsHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors group"
            >
              View IPFS metadata <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
