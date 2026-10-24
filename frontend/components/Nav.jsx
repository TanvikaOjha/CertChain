"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Wallet, ShieldCheck, PlusCircle, UserCheck } from "lucide-react";

function truncate(str, n = 6) {
  if (!str) return "";
  return `${str.slice(0, n)}…${str.slice(-4)}`;
}

export default function Nav() {
  const pathname = usePathname();
  const [account, setAccount] = useState("");

  const handleConnectWallet = useCallback(async () => {
    if (!window.ethereum) return alert("MetaMask not found — please install it.");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) setAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => { if (accounts.length > 0) setAccount(accounts[0]); })
      .catch((err) => console.error(err));

    // FIX: was setAccount(null), which broke the "" convention used elsewhere
    const handleAccountsChanged = (accounts) => setAccount(accounts.length > 0 ? accounts[0] : "");
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
  }, []);

  // FIX: dropped the hash-based highlighting — it made "Verify" light up on /issue
  // whenever the URL happened to contain a #fragment.
  const isVerify = pathname === "/" || pathname.startsWith("/verify");
  const isIssue = pathname.startsWith("/issue");
  const isAdmin = pathname.startsWith("/admin");

  const tab = (active) =>
    `flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
      active
        ? "bg-slate-950 text-indigo-400 shadow-sm border border-slate-800"
        : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <nav className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-white font-bold tracking-tight text-lg hover:opacity-90 transition-opacity">
          <span className="text-indigo-400 font-sans text-xl">✦</span>
          <span>CertChain</span>
        </Link>

        <div className="flex items-center bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl space-x-1">
          <Link href="/#verify" className={tab(isVerify)}>
            <ShieldCheck className="w-3.5 h-3.5" /><span>Verify</span>
          </Link>
          <Link href="/issue" className={tab(isIssue)}>
            <PlusCircle className="w-3.5 h-3.5" /><span>Issue</span>
          </Link>
          {/* FIX: the admin page was unreachable from the nav */}
          <Link href="/admin" className={tab(isAdmin)}>
            <UserCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">Issuers</span>
          </Link>
        </div>

        <button
          onClick={handleConnectWallet}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono font-medium transition-all ${
            account
              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/5"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${account ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          {account ? (
            <span>{truncate(account)}</span>
          ) : (
            <>
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Connect Wallet</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
