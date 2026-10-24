import Link from "next/link";
import Nav from "../../../components/Nav";
import CertificateResult from "../../../components/CertificateResult";
import { getCertificate } from "../../../lib/getCertificate";
import { SITE_URL } from "../../../lib/contract";
import { Search, Share2, ArrowLeft, Award } from "lucide-react";

export async function generateMetadata({ params }) {
  const { tokenId } = await params;
  const data = await getCertificate(tokenId); // cached: shares RPC calls with the page below

  if (!data.found) {
    return {
      title: data.infraError
        ? `Certificate #${tokenId} — CertChain`
        : `Certificate #${tokenId} Not Found — CertChain`,
      description: data.infraError
        ? "The blockchain could not be reached right now. Please try again shortly."
        : "This certificate could not be located on the blockchain.",
    };
  }

  const statusText = data.isValid ? "VALID" : data.status.replace(/_/g, " ");
  const title = `${data.courseName} — ${data.isValid ? "Verified ✓" : statusText} | CertChain`;
  const description = `Certificate #${tokenId} issued by ${data.institutionName || "a registered institution"}. Status: ${statusText}. View the full on-chain credential.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      // FIX: was hard-coded "localhost:3000/..." with no scheme
      url: `${SITE_URL}/verify/${tokenId}`,
      siteName: "CertChain",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function VerifyTokenPage({ params }) {
  const { tokenId } = await params;
  const data = await getCertificate(tokenId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Nav />

      <header className="relative overflow-hidden py-20 border-b border-slate-900 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.12),transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Registry Verification Query
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {data.found ? (
              <>
                On-Chain Asset{" "}
                <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  #{tokenId} Status
                </span>
              </>
            ) : data.infraError ? (
              <>
                Registry{" "}
                <span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Unreachable
                </span>
              </>
            ) : (
              <>
                Record ID{" "}
                <span className="bg-linear-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                  #{tokenId} Not Found
                </span>
              </>
            )}
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            {data.found
              ? "Checked against live contract state on the Sepolia network."
              : data.infraError
              ? "We couldn't query the blockchain just now. No verdict has been reached on this certificate."
              : "No certificate with this token ID exists in the registry contract."}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-linear-to-br from-indigo-500/10 to-purple-500/10 opacity-70 blur-md"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Public Audit Gateway</h2>
                    <p className="text-xs text-slate-500 font-mono">Server-side read of verifyCertificate()</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/10">
                  ERC721 Storage
                </span>
              </div>

              <div className="min-h-50">
                <CertificateResult data={data} />
              </div>

              <div className="pt-4 border-t border-slate-800/60">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-950 hover:text-white border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Main Portal
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
              <Award className="w-6 h-6 text-amber-400/80" />
              <p className="text-sm italic text-slate-300 leading-relaxed font-serif">
                &ldquo;A certificate on-chain is not just a temporary file record — it is a permanent promise that cannot be broken.&rdquo;
              </p>
              <div className="text-[10px] font-mono font-semibold tracking-wider text-purple-400 bg-purple-500/5 px-2 py-1 rounded inline-block">
                SEPOLIA TESTNET
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" /> Share Verification Link
              </h3>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 font-mono uppercase">Direct link</label>
                <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 break-all select-all selection:bg-indigo-600/40 border-dashed">
                  {SITE_URL}/verify/{tokenId}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                This URL includes OpenGraph tags, so LinkedIn, X and messaging apps render a preview card with the live status.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
