"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../lib/contract";
import { 
  ShieldCheck, 
  UserPlus, 
  UserMinus, 
  Building2, 
  FileText, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Fingerprint
} from "lucide-react";

export default function IssuerManagementSection({ signer, account }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);
  
  // Form states
  const [issuerAddress, setIssuerAddress] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  
  // Action tracking states
  const [actionStatus, setActionStatus] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Verify if the active wallet is the Contract Owner
  useEffect(() => {
    async function checkOwnerStatus() {
      if (!signer || !account) return;
      try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        const ownerAddress = await contract.owner();
        setIsAdmin(ownerAddress.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error("Failed to fetch contract structural owner:", err);
      } finally {
        setLoadingAdminCheck(false);
      }
    }
    checkOwnerStatus();
  }, [signer, account]);

  async function handleAddIssuer(e) {
    e.preventDefault();
    if (!issuerAddress || !institutionName) return;
    
    setProcessing(true);
    setActionStatus({ type: "info", msg: "Broadcasting authorization signature to network..." });
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.addIssuer(issuerAddress, institutionName);
      
      setActionStatus({ type: "info", msg: "Mining block confirmation mapping records..." });
      await tx.wait();
      
      setActionStatus({ 
        type: "success", 
        msg: `✓ Successfully authorized "${institutionName}" (${issuerAddress.slice(0,6)}...${issuerAddress.slice(-4)})` 
      });
      setIssuerAddress("");
      setInstitutionName("");
    } catch (err) {
      setActionStatus({ type: "error", msg: err.reason || err.message || "Transaction reverted by EVM." });
    } finally {
      setProcessing(false);
    }
  }

  async function handleRemoveIssuer(e) {
    e.preventDefault();
    if (!issuerAddress) return;

    setProcessing(true);
    setActionStatus({ type: "info", msg: "Broadcasting revocation script onto ledger..." });

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.removeIssuer(issuerAddress);
      
      setActionStatus({ type: "info", msg: "Confirming state change parameters..." });
      await tx.wait();
      
      setActionStatus({ 
        type: "success", 
        msg: `✓ Access rights permanently stripped from node signature allocation.` 
      });
      setIssuerAddress("");
    } catch (err) {
      setActionStatus({ type: "error", msg: err.reason || err.message || "Transaction reverted by EVM." });
    } finally {
      setProcessing(false);
    }
  }

  if (loadingAdminCheck) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-xs text-slate-500 font-mono ml-3">Verifying platform access matrix...</span>
      </div>
    );
  }

  // Deny layout view to unauthorized wallets
  if (!isAdmin) {
    return (
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Admin Credentials Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your connected wallet account does not hold owner structural tokens for this registrar contract deployment layout. Switch profiles inside your provider wallet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      
      {/* Box A: Provision Access Rights */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Authorize Registry Node</h3>
            <p className="text-[11px] text-slate-500 font-mono">write method: addIssuer</p>
          </div>
        </div>

        <form onSubmit={handleAddIssuer} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-400" /> Target Signatory Address
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-slate-700 font-mono transition-colors"
              placeholder="0x94B733000... (Issuer Wallet)" 
              value={issuerAddress}
              onChange={(e) => setIssuerAddress(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Academic Institution Label
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-slate-700 transition-colors"
              placeholder="e.g., IIT Dhanbad" 
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={processing || !issuerAddress || !institutionName}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs text-white flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mount Node Authorization"}
          </button>
        </form>
      </div>

      {/* Box B: Strip Access Rights */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <UserMinus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Revoke Node Permissions</h3>
            <p className="text-[11px] text-slate-500 font-mono">write method: removeIssuer</p>
          </div>
        </div>

        <form onSubmit={handleRemoveIssuer} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5 text-rose-400" /> Active Registry Target
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-slate-700 font-mono transition-colors"
              placeholder="0x94B733000... (Revocation Address)" 
              value={issuerAddress}
              onChange={(e) => setIssuerAddress(e.target.value)}
            />
          </div>

          <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            ⚠️ <strong>Critical Security Action:</strong> Revoking an issuer instantly fails any signature check constraints generated by this wallet node context via the public gateway verification engine.
          </div>

          <button 
            type="submit"
            disabled={processing || !issuerAddress}
            className="w-full bg-slate-950 border border-rose-900/30 text-rose-400 hover:bg-rose-950/20 disabled:opacity-40 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Strip Node Verification Rights"}
          </button>
        </form>
      </div>

      {/* Global Status Callback Banner */}
      {actionStatus && (
        <div className={`col-span-full p-4 rounded-xl border text-xs font-mono flex items-center gap-3 ${
          actionStatus.type === "success" 
            ? "bg-emerald-500/5 border-emerald-500/20 text-slate-300" 
            : actionStatus.type === "error"
            ? "bg-rose-500/5 border-rose-500/20 text-rose-400"
            : "bg-slate-900 border border-slate-800 text-slate-400"
        }`}>
          {actionStatus.type === "success" ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          ) : actionStatus.type === "error" ? (
            <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          ) : (
            <Loader2 className="w-4.5 h-4.5 text-indigo-400 animate-spin shrink-0" />
          )}
          <span>{actionStatus.msg}</span>
        </div>
      )}

    </div>
  );
}