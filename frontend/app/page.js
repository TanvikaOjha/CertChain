"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import {
  GraduationCap, Wallet, ShieldCheck, Ban, FileCode, Search, PlusCircle, Activity, ArrowRight,
} from "lucide-react";

function truncate(str, n = 6) {
  if (!str) return "";
  return `${str.slice(0, n)}…${str.slice(-4)}`;
}

export default function LandingPage() {
  const router = useRouter();
  const [tokenId, setTokenId] = useState("");
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");

  const handleConnectWallet = useCallback(async () => {
    if (!window.ethereum) return alert("MetaMask not found — please install it.");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) setAccount(accounts[0]);
    } catch (err) {
      console.error("Error connecting wallet:", err);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => { if (accounts.length > 0) setAccount(accounts[0]); })
      .catch((err) => console.error(err));

    const handleAccountsChanged = (accounts) => setAccount(accounts.length > 0 ? accounts[0] : "");
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
  }, []);

  // FIX: the form's onSubmit already handles Enter. The extra onKeyDown handler called
  // handleVerify() with no event, so e.preventDefault() threw. It is removed below.
  const handleVerify = (e) => {
    e.preventDefault();
    const id = tokenId.trim();
    if (!/^\d+$/.test(id)) return setError("Token ID must be a whole number, e.g. 1");
    setError("");
    router.push(`/verify/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CertChain
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#verify" className="hover:text-white transition-colors">Verify</a>
            <Link href="/issue" className="hover:text-white transition-colors">Issue</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Issuer Registry</Link>
          </div>

          <button
            onClick={handleConnectWallet}
            disabled={!!account}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-lg ${
              account
                ? "bg-slate-900 border border-slate-800 text-emerald-400 font-mono"
                : "bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <Wallet className="w-4 h-4" />
            {account ? truncate(account) : "Connect Wallet"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.08),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Live on Sepolia
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Immutable & <br />
              <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Soulbound Credentials
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0">
              Issue and check secure educational credentials built as non-transferable NFTs, verified directly against the blockchain.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <a href="#verify" className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 font-semibold transition-all flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" /> Verify a Certificate
              </a>
              {/* FIX: client-side navigation instead of a full page reload */}
              <Link href="/issue" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
                Issuer Space <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl"></div>
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> CertificateNFT Registry
                </div>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">Example</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-200">Decentralized Web Engineering</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Token ID: #1</p>
                </div>
                <div className="border-t border-b border-slate-900 py-3 text-left grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">RECIPIENT</span>
                    <span className="text-slate-300">0x71C...3923</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ISSUER</span>
                    <span className="text-slate-300">Sample University</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Cryptographic Foundations</h2>
            <p className="text-slate-400 text-sm">Security properties enforced by the deployed smart contract.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Ban className="w-5 h-5" /></div>
              <h3 className="text-lg font-semibold text-white">Soulbound Architecture</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Transfers and approvals always revert. A credential stays in the wallet it was issued to.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><PlusCircle className="w-5 h-5" /></div>
              <h3 className="text-lg font-semibold text-white">On-Chain Revocation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Issuers can revoke with a permanent reason string. The token stays, so the revocation is auditable.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400"><FileCode className="w-5 h-5" /></div>
              <h3 className="text-lg font-semibold text-white">IPFS Metadata Links</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Each token points to a content-addressed IPFS record, so altering the file changes its CID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verify */}
      <section id="verify" className="py-20 border-t border-slate-900 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-8 shadow-xl">
            <div className="text-center max-w-md mx-auto mb-8 space-y-2">
              <h2 className="text-2xl font-bold text-white">Public Verification Gateway</h2>
              <p className="text-xs text-slate-400">Enter a token ID to read its live status from the blockchain.</p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                value={tokenId}
                onChange={(e) => { setTokenId(e.target.value); setError(""); }}
                placeholder="Enter Token ID"
                inputMode="numeric"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-700 transition-colors"
              />
              <button
                type="submit"
                disabled={!tokenId.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Run Verification
              </button>
            </form>
            {error && <p className="text-xs text-rose-400 text-center mt-3">{error}</p>}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 text-center py-8 text-xs text-slate-600">
        <p>&copy; 2026 CertChain. Soulbound credentials on Ethereum.</p>
      </footer>
    </div>
  );
}
