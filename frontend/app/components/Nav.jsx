"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, ShieldCheck, PlusCircle } from "lucide-react";

function truncate(str, n = 6) {
  if (!str) return "";
  return `${str.slice(0, n)}…${str.slice(-4)}`;
}

export default function Nav() {
  const pathname = usePathname();
  const [account, setAccount] = useState("");
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
  
  handleHashChange(); // Set initial hash on mount
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found — please install it.");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
    } catch (err) {
      console.error("Wallet connection cancelled or failed:", err);
    }
  }

  const isVerify = pathname === "/" || pathname.startsWith("/verify") || currentHash;
  const isIssue = pathname.startsWith("/issue");

  return (
    <nav className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-bold tracking-tight text-lg hover:opacity-90 transition-opacity">
          <span className="text-indigo-400 font-sans text-xl">✦</span>
          <span>CertChain</span>
        </Link>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl space-x-1">
          <Link 
            href="/#verify" 
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isVerify 
                ? "bg-slate-950 text-indigo-400 shadow-sm border border-slate-800" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify</span>
          </Link>
          <Link 
            href="/issue" 
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isIssue 
                ? "bg-slate-950 text-indigo-400 shadow-sm border border-slate-800" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Issue</span>
          </Link>
        </div>

        {/* Action Button: Wallet Connector */}
        <button
          onClick={connectWallet}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono font-medium transition-all ${
            account
              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/5"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700 hover:text-white"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${account ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          {account ? (
            <span>{truncate(account)}</span>
          ) : (
            <>
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>

      </div>
    </nav>
  );
}