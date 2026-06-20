// components/Nav.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ethers } from "ethers";

function truncate(str, n = 6) {
  if (!str) return "";
  return `${str.slice(0, n)}…${str.slice(-4)}`;
}

export default function Nav() {
  const pathname = usePathname();
  const [account, setAccount] = useState("");

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found — please install it.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    setAccount(await signer.getAddress());
  }

  const isVerify = pathname === "/" || pathname.startsWith("/verify");
  const isIssue = pathname.startsWith("/issue");

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <span className="nav-seal">✦</span>
        CertChain
      </Link>
      <div className="nav-tabs">
        <Link href="/" className={`nav-tab ${isVerify ? "active" : ""}`}>Verify</Link>
        <Link href="/issue" className={`nav-tab ${isIssue ? "active" : ""}`}>Issue</Link>
      </div>
      <div
        className={`wallet-pill ${account ? "connected" : ""}`}
        onClick={connectWallet}
      >
        <div className="wallet-dot" />
        {account ? truncate(account) : "Connect Wallet"}
      </div>
    </nav>
  );
}