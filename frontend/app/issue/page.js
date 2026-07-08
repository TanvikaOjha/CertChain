"use client";

import { useState, useRef } from "react";
import { ethers } from "ethers";
import Nav from "../components/Nav";
import { CONTRACT_ADDRESS, ABI } from "../lib/contract";
import { 
  PlusCircle, 
  User, 
  GraduationCap, 
  Award, 
  UploadCloud, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet,
  ArrowRight,
  Loader2,
  ExternalLink,
  BookOpen,
  Anchor,
  Sparkles,
  Building2
} from "lucide-react";

function truncate(str, n = 6) {
  if (!str) return "";
  return `${str.slice(0, n)}…${str.slice(-4)}`;
}

export default function IssuePage() {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [form, setForm] = useState({ student: "", course: "", degree: "", institution: "Your College Name" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
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
      setUploadResult(null);
    }
  }

  async function handleUpload() {
    if (!file || !form.student || !form.course || !form.degree || !form.institution) {
      return setStatus({ type: "error", msg: "Fill in all fields and select a file first." });
    }
    setUploading(true);
    setStatus({ type: "info", msg: "Uploading certificate to IPFS storage cluster…" });
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("studentName", form.student);
      body.append("course", form.course);
      body.append("degree", form.degree);
      body.append("institution", form.institution); 

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadResult(data);
      setStatus({ type: "success", msg: "✓ Asset safely pinned to IPFS. Ready to sign ledger transaction." });
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    }
    setUploading(false);
  }

  async function handleIssue() {
    if (!signer || !uploadResult) return;
    setIssuing(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setStatus({ type: "info", msg: "Awaiting wallet validation signature..." });
      
      const tx = await contract.issueCertificate(
        form.student, 
        form.course, 
        form.degree, 
        BigInt(0), 
        uploadResult.metadataCid
      );
      setStatus({ type: "info", msg: "Mining transaction onto Ethereum block structure…" });
      const receipt = await tx.wait();

      const iface = new ethers.Interface(ABI);
      let tokenId = "?";
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "CertificateIssued") { 
            tokenId = parsed.args.tokenId.toString(); 
            break; 
          }
        } catch {}
      }
      setStatus({ type: "success", msg: `✓ Certificate successfully minted on-chain — Token ID: ${tokenId}`, tokenId });
      setForm({ student: "", course: "", degree: "", institution: "Your College Name" });
      setFile(null);
      setUploadResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message || "EVM transaction failed execution." });
    }
    setIssuing(false);
  }

  const formReady = form.student && form.course && form.degree && form.institution && file;

  // Render Section A: Wallet connect wrapper if not authenticated
  const renderWalletConnection = (
    <div className="text-center py-12 px-4 space-y-5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
        <Wallet className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Signatory Signature Required</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Connect an authorized wallet address containing appropriate gas provisions to execute ledger state manipulation commands.
        </p>
      </div>
      <button 
        onClick={connectWallet}
        className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/10"
      >
        Connect Provider Wallet
      </button>
    </div>
  );

  // Render Section B: Form interface when wallet is connected
  const renderIssueForm = (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Student Destination Wallet
          </label>
          <input 
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 font-mono transition-colors"
            placeholder="0x71C23145A5542136531355415256561556943923" 
            value={form.student}
            onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))} 
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Course Specification
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 transition-colors"
              placeholder="Decentralized Architectures" 
              value={form.course}
              onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-indigo-400" /> Qualification Degree
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 transition-colors"
              placeholder="B.Tech Computer Science" 
              value={form.degree}
              onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Institution Name
          </label>
          <input 
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 transition-colors"
            placeholder="Your College Name" 
            value={form.institution}
            onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" /> Certificate Document Resource
          </label>
          <label
            htmlFor="cert-file"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 cursor-pointer bg-slate-950/50 transition-colors group text-center"
          >
            <UploadCloud className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            <span className="text-xs font-medium text-slate-400 block max-w-xs truncate">
              {file ? file.name : "Select raw PDF copy or static image sheet..."}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">Max size threshold 50MB</span>
          </label>
          <input
            ref={fileInputRef}
            id="cert-file"
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/60 space-y-4">
        {!uploadResult && (
          <button
            className="w-full bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 hover:border-slate-700 font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:pointer-events-none"
            disabled={uploading || !formReady}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> 
                <span>Executing Interplanetary Upload Pinning...</span>
              </>
            ) : (
              <>
                <span>1. Anchor Record Assets to IPFS</span> 
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </>
            )}
          </button>
        )}

        {uploadResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> 
                <span>IPFS Mutation Target Pinned Successfully</span>
              </span>
              <a 
                href={uploadResult.fileUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1 underline hover:text-emerald-300 transition-colors"
              >
                <span>inspect</span> 
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <button
              className="w-full bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/10 disabled:opacity-50"
              disabled={issuing}
              onClick={handleIssue}
            >
              {issuing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 
                  <span>Mining Block Ledger Sequences...</span>
                </>
              ) : (
                <>
                  <span>2. Sign and Authorize Ledger Minting</span> 
                  <Cpu className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {status && status.msg && (
          <div className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-3 ${
            status.type === "success" 
              ? "bg-emerald-500/5 border-emerald-500/20 text-slate-300" 
              : status.type === "error"
              ? "bg-rose-500/5 border-rose-500/20 text-rose-400"
              : "bg-slate-950 border border-slate-800 text-slate-400"
          }`}>
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : status.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            )}
            <span>{status.msg}</span>
            
            {status.tokenId && (
              <a 
                href={`/verify/${status.tokenId}`} 
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-sans font-semibold ml-auto shrink-0 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10"
              >
                Inspect Public Gateway →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Nav />

      {/* Hero Header Block */}
      <header className="relative overflow-hidden py-16 border-b border-slate-900 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.12),transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> 
            Authorized Administrator Console
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Issue On-Chain <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Credentials</span>
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Upload verified student materials to decentralized systems and write permanent allocations directly inside the registry contract.
          </p>
        </div>
      </header>

      {/* Main Container Setup */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Action Form Frame Column */}
          <div className="lg:col-span-2 relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-linear-to-br from-indigo-500/10 to-purple-500/10 opacity-70 blur-md"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Mint Asset Payload</h2>
                    <p className="text-xs text-slate-500 font-mono">write matrix: issueCertificate</p>
                  </div>
                </div>
                {account && (
                  <span className="text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1 rounded-lg">
                    Connected: {truncate(account)}
                  </span>
                )}
              </div>

              {/* Dynamic Content Display cleanly mounted via variables */}
              {!account ? renderWalletConnection : renderIssueForm}

            </div>
          </div>

          {/* Right Explanatory Information Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Mechanics Process Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gateway Processing Engine</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Isolated Execution Sequence</p>
              </div>

              <div className="space-y-5">
                <div className="flex gap-3 items-start text-xs">
                  <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0 font-mono text-[10px]">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white">1. Server Isolation</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Files are securely passed through an API endpoint handler to prevent client-side exposure of API secrets.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs">
                  <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0 font-mono text-[10px]">
                    <Anchor className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white">2. CID Binding</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      The generated content descriptor hash maps directly into storage structures during contract execution.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs">
                  <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0 font-mono text-[10px]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white">3. Complete Execution</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      The browser extension captures logs emitted by the ledger immediately upon block finalization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Immutability Quote Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
              <p className="text-sm italic text-slate-300 leading-relaxed font-serif">
                &ldquo;A certificate on-chain is not just a digital record — it is a cryptographic promise that cannot be broken.&rdquo;
              </p>
              <div className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-500/5 py-1 px-2.5 rounded inline-block uppercase font-semibold">
                CertChain · Sepolia Network
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}