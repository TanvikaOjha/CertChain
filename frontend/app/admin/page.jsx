"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Nav from "../../components/Nav";
import { CONTRACT_ADDRESS, ABI } from "../../lib/contract";
import { 
  GraduationCap, 
  Wallet, 
  ShieldCheck, 
  PlusCircle, 
  Ban, 
  CheckCircle, 
  ExternalLink,
  Info,
  AlertTriangle,
  UserCheck,
  Plus,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

// ── Extended ABI — includes issuer management functions ────────
const ISSUER_ABI = [
  ...ABI,
  "function owner() external view returns (address)",
];

// ── Small helpers ──────────────────────────────────────────────
function truncate(str, n = 8) {
  if (!str) return "—";
  return str.length > n * 2 + 3 ? `${str.slice(0, n)}…${str.slice(-6)}` : str;
}

function AddrPill({ address }) {
  const [copied, setCopied] = useState(false);
  
  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  
  return (
    <button
      onClick={copy}
      title={address}
      className={`font-mono text-xs mt-0.5 flex items-center gap-1 transition-colors bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-md hover:text-white ${
        copied ? "text-amber-400 border-amber-500/20" : "text-slate-500"
      }`}
    >
      {truncate(address)}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-2.5 h-2.5 opacity-40" />}
    </button>
  );
}

// ── Issuer row component ───────────────────────────────────────
function IssuerRow({ issuer, isOwner, inactive = false, removing = false, onRemove }) {
  return (
    <div className={`flex items-center gap-4 padding px-6 py-4 border-b border-slate-900/60 last:border-0 transition-all ${
      inactive ? "opacity-45 bg-slate-950/20" : "hover:bg-slate-900/20"
    }`}>
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        inactive 
          ? "bg-slate-700" 
          : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
      }`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold flex items-center gap-2 ${
          inactive ? "text-slate-500" : "text-slate-200"
        }`}>
          {issuer.name}
          {inactive && (
            <span className="font-mono text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
              REMOVED
            </span>
          )}
        </div>
        <AddrPill address={issuer.address} />
      </div>

      {/* Etherscan link */}
      <a
        href={`https://sepolia.etherscan.io/address/${issuer.address}`}
        target="_blank"
        rel="noreferrer"
        className="text-slate-500 hover:text-indigo-400 transition-colors p-1.5 hover:bg-slate-900 rounded-lg"
        title="View on Etherscan"
      >
        <ExternalLink className="w-4 h-4" />
      </a>

      {/* Remove button — only for owner, only for active issuers */}
      {isOwner && !inactive && (
        <button
          onClick={onRemove}
          disabled={removing}
          className="shrink-0 border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 text-xs font-mono font-medium rounded-lg px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      )}
    </div>
  );
}

export default function IssuersPage() {
  const [account,    setAccount]    = useState("");
  const [signer,     setSigner]     = useState(null);
  const [isOwner,    setIsOwner]    = useState(false);
  const [issuers,    setIssuers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newAddr,    setNewAddr]    = useState("");
  const [newName,    setNewName]    = useState("");
  const [addStatus,  setAddStatus]  = useState(null);
  const [adding,     setAdding]     = useState(false);
  const [removing,   setRemoving]   = useState("");

  const readContract = useCallback(() => {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/eth_sepolia"
    );
    return new ethers.Contract(CONTRACT_ADDRESS, ISSUER_ABI, provider);
  }, []);

  const loadIssuers = useCallback(async () => {
    setLoading(true);
    try {
      const c = readContract();
      const list = await fetchIssuers(c);
      setIssuers(list);
    } catch (e) {
      console.error("Failed to load issuers:", e);
    }
    setLoading(false);
  }, [readContract]);

  useEffect(() => { 
    loadIssuers(); 
  }, [loadIssuers]);

  const checkOwnerStatus = useCallback(async (walletAddress, currentSigner) => {
    if (!walletAddress) return;
    try {
      const c = new ethers.Contract(CONTRACT_ADDRESS, ISSUER_ABI, currentSigner || readContract());
      const owner = await c.owner();
      setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase());
    } catch (err) {
      console.error("Failed to verify contract owner context:", err);
    }
  }, [readContract]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const s = await provider.getSigner();
          setSigner(s);
          setAccount(accounts[0]);
          await checkOwnerStatus(accounts[0], s);
        } else {
          setSigner(null);
          setAccount("");
          setIsOwner(false);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [checkOwnerStatus]);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found.");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      const addr = accounts[0];
      setSigner(s);
      setAccount(addr);
      await checkOwnerStatus(addr, s);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  }

  async function handleAdd() {
    if (!signer || !newAddr.trim() || !newName.trim()) return;
    if (!ethers.isAddress(newAddr.trim())) {
      return setAddStatus({ type: "error", msg: "Invalid wallet address." });
    }
    setAdding(true);
    setAddStatus({ type: "info", msg: "Waiting for MetaMask…" });
    try {
      const c = new ethers.Contract(CONTRACT_ADDRESS, ISSUER_ABI, signer);
      const tx = await c.addIssuer(newAddr.trim(), newName.trim());
      setAddStatus({ type: "info", msg: "Mining transaction…" });
      await tx.wait();
      setAddStatus({ type: "success", msg: `✓ ${newName.trim()} authorized as an issuer.` });
      setNewAddr("");
      setNewName("");
      await loadIssuers();
    } catch (e) {
      setAddStatus({ type: "error", msg: e.reason || e.message });
    }
    setAdding(false);
  }

  async function handleRemove(address, name) {
    if (!signer) return;
    const confirmed = window.confirm(
      `Remove "${name}" (${truncate(address)}) as an authorized issuer?\n\nCertificates they already issued will show "ISSUER_DEAUTHORIZED" when verified.`
    );
    if (!confirmed) return;

    setRemoving(address);
    try {
      const c = new ethers.Contract(CONTRACT_ADDRESS, ISSUER_ABI, signer);
      const tx = await c.removeIssuer(address);
      await tx.wait();
      await loadIssuers();
    } catch (e) {
      alert(e.reason || e.message);
    }
    setRemoving("");
  }

  const activeIssuers   = issuers.filter((i) => i.isActive);
  const inactiveIssuers = issuers.filter((i) => !i.isActive);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Nav />

      {/* Hero Header Section */}
      <header className="relative overflow-hidden py-16 lg:py-20 border-b border-slate-900/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(79,70,229,0.06),transparent_60%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserCheck className="w-3.5 h-3.5" /> Access Control Matrix
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Issuer <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Registry</span>
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Only authorized institutions can mint certificates. This terminal gives the core contract root-owner authority to manage permitted cryptographical signers.
          </p>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Wallet Context System Banners */}
        {!account && (
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-4 bg-amber-500/5 text-amber-400 border border-amber-500/10 rounded-2xl p-4 text-sm w-full">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0" />
              <span>Connect the <strong className="text-white">contract owner</strong> wallet to mutate registry states. Anyone can read.</span>
            </div>
            <button
              onClick={connectWallet}
              className="sm:ml-auto w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded-xl transition-all font-mono"
            >
              <Wallet className="w-3.5 h-3.5" /> Connect Owner
            </button>
          </div>
        )}

        {account && !isOwner && (
          <div className="mb-8 flex items-start gap-3 bg-rose-500/5 text-rose-400 border border-rose-500/10 rounded-2xl p-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Connected as <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 text-white">{truncate(account)}</span> — this workspace is running in <strong className="text-white text-xs uppercase tracking-wider bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 ml-1">Read-Only Mode</strong>.
            </div>
          </div>
        )}

        {account && isOwner && (
          <div className="mb-8 flex items-start gap-3 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-2xl p-4 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Authenticated: Root Admin Control Panel open via <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 text-white">{truncate(account)}</span>.
            </div>
          </div>
        )}

        {/* Dynamic Multi-Column Segment Architecture */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT 2 COLUMNS: Registry Feeds */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Registry */}
            <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">Authorized Institutions</h2>
                    <p className="text-xs text-slate-500">Live consensus nodes permitted to mint credentials</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400">
                  {loading ? "querying RPC…" : `${activeIssuers.length} Verified`}
                </span>
              </div>

              <div>
                {loading ? (
                  <div className="py-20 text-center text-xs text-slate-500 font-mono flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    Parsing remote storage mappings...
                  </div>
                ) : activeIssuers.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">🏛️</div>
                    <p className="text-sm font-medium">No active issuers bound to contract.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-900/40">
                    {activeIssuers.map((issuer) => (
                      <IssuerRow
                        key={issuer.address}
                        issuer={issuer}
                        isOwner={isOwner}
                        removing={removing === issuer.address}
                        onRemove={() => handleRemove(issuer.address, issuer.name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inactive Revoked Registry */}
            {inactiveIssuers.length > 0 && (
              <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-900/25">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-slate-500 border border-slate-900">
                      <Ban className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-400 text-base">Deauthorized Registry</h2>
                      <p className="text-xs text-slate-600">Archived state identities removed from security access</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-900/40">
                  {inactiveIssuers.map((issuer) => (
                    <IssuerRow
                      key={issuer.address}
                      issuer={issuer}
                      isOwner={isOwner}
                      inactive
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Action Panel + Rules Explainer */}
          <div className="space-y-8">
            
            {/* Mutation Form Box */}
            <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Add New Issuer</h2>
                  <p className="text-xs text-slate-500">Append identity addresses to mapping</p>
                </div>
              </div>

              {!isOwner ? (
                <div className="text-center py-6 bg-slate-950/50 border border-slate-900 rounded-2xl p-4 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Identity validation required. Only the cryptographic system deployer can write updates.
                  </p>
                  {!account && (
                    <button 
                      onClick={connectWallet}
                      className="text-xs text-indigo-400 underline hover:text-indigo-300 font-medium"
                    >
                      Connect Wallet to check context
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">Institution Hex Public Address</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-700 transition-colors font-mono"
                      placeholder="0x..."
                      value={newAddr}
                      onChange={(e) => setNewAddr(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">Institution String Alias Label</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-700 transition-colors"
                      placeholder="e.g. IIT Bombay"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>

                  <button
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    disabled={adding || !newAddr.trim() || !newName.trim()}
                    onClick={handleAdd}
                  >
                    {adding ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Authorize Space"
                    )}
                  </button>

                  {addStatus && (
                    <div className={`text-xs p-3 rounded-xl border flex items-start gap-2 ${
                      addStatus.type === "error" 
                        ? "bg-rose-500/5 text-rose-400 border-rose-500/10" 
                        : "bg-indigo-500/5 text-indigo-400 border-indigo-500/10"
                    }`}>
                      {addStatus.msg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Protocol Specs Info Cards */}
            <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-white text-base">Registry Principles</h2>
              </div>

              <div className="space-y-5">
                <div className="flex gap-3">
                  <span className="text-base bg-slate-950 p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-slate-900">👑</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">System Decentralized Registry</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                      State writes are strictly validated by the deployed storage layout. Modifying values requires passing execution validation logic.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-base bg-slate-950 p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-slate-900">🏛️</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Mint Allocation Vectors</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                      Assigned nodes sign credentials permanently storing tracking keys, tying origin vectors to target wallet endpoints natively.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-base bg-slate-950 p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-slate-900">⚠️</span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-400">Cascade Revocation Fallouts</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Pruning an identity causes existing credentials parsed from that specific signature pointer to dynamically evaluation as <span className="text-rose-400 font-mono text-[10px]">ISSUER_DEAUTHORIZED</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Synchronized System Footer */}
      <footer className="border-t border-slate-900 text-center py-8 text-xs text-slate-600">
        <p>&copy; 2026 CertiChain Infrastructure Stack. Secure Immutable Sovereignty Identity Ecosystem.</p>
      </footer>
    </div>
  );
}

// ── Event Filtering Parser Logic Function ────────────────────
async function fetchIssuers(contract) {
  const authFilter = contract.filters.IssuerAuthorized();
  const revoFilter = contract.filters.IssuerRevoked();

  const [authLogs, revLogs] = await Promise.all([
    contract.queryFilter(authFilter, 0, "latest"),
    contract.queryFilter(revoFilter, 0, "latest"),
  ]);

  const nameMap = {};
  for (const log of authLogs) {
    const { issuer, name } = log.args;
    nameMap[issuer.toLowerCase()] = { address: issuer, name };
  }

  for (const log of revLogs) {
    const { issuer } = log.args;
    const key = issuer.toLowerCase();
    if (nameMap[key]) {
      const latestAuth = authLogs
        .filter((l) => l.args.issuer.toLowerCase() === key)
        .at(-1);
      if (!latestAuth || latestAuth.blockNumber <= log.blockNumber) {
        delete nameMap[key];
      }
    }
  }

  const entries = await Promise.all(
    Object.values(nameMap).map(async ({ address, name }) => {
      const isActive = await contract.authorizedIssuers(address);
      return { address, name, isActive };
    })
  );

  return entries;
}