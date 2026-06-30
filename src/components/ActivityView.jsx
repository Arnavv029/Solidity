import React, { useState } from "react";
import { useEscrow } from "../context/EscrowContext";
import { FiActivity, FiLayers, FiCopy, FiCheck, FiSearch, FiSliders, FiClock, FiFileText } from "react-icons/fi";

export const ActivityView = () => {
  const { transactions, addToast } = useEscrow();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [copiedHash, setCopiedHash] = useState("");

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    addToast("Transaction hash copied!", "success");
    setTimeout(() => setCopiedHash(""), 2000);
  };

  const getActionColor = (action) => {
    switch (action) {
      case "Job Created":
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
      case "Job Accepted":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "Work Submitted":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "Work Rejected":
        return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      case "Dispute Raised":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "Funds Released":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "Dispute Resolved":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  // Filter transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch = 
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.jobId.toString().includes(searchTerm) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filterAction === "all" || tx.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-10 py-10 px-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Ledger Registry</h1>
          <p className="text-slate-400 text-sm">Real-time immutable log of smart contract triggers, state emissions, and gas metrics.</p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-4 border border-white/[0.05] bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-950/60 border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
            placeholder="Search by Tx Hash, Job ID, or Role..."
          />
        </div>

        {/* Action dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <FiSliders className="text-slate-500 w-4 h-4 flex-shrink-0" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full md:w-48 bg-dark-950/60 border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
          >
            <option value="all">All Events</option>
            <option value="Job Created">Job Created</option>
            <option value="Job Accepted">Job Accepted</option>
            <option value="Work Submitted">Work Submitted</option>
            <option value="Work Rejected">Work Rejected</option>
            <option value="Dispute Raised">Dispute Raised</option>
            <option value="Funds Released">Funds Released</option>
            <option value="Dispute Resolved">Dispute Resolved</option>
          </select>
        </div>

      </div>

      {/* Ledger Log cards */}
      <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <FiActivity className="text-purple-400" />
          Transaction Block Ledger ({filteredTxs.length})
        </h3>

        {filteredTxs.length === 0 ? (
          <div className="py-16 border border-dashed border-white/[0.06] rounded-2xl text-center">
            <FiClock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <span className="text-sm font-bold text-slate-300">No matching events logged</span>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try adjusting your filters or search terms to query other mock ledger events.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredTxs.map((tx) => (
              <div 
                key={tx.txHash} 
                className="glass-panel border border-white/[0.05] bg-white/[0.01] p-5 rounded-2xl hover:bg-white/[0.02] hover:border-white/[0.1] transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-left"
              >
                {/* Visual state name */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-400 flex-shrink-0">
                    <FiLayers className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase border ${getActionColor(tx.action)}`}>
                        {tx.action}
                      </span>
                      <span className="text-xs font-bold text-slate-500 font-mono">Job #{tx.jobId}</span>
                    </div>
                    {/* Hash */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-slate-400 break-all">{tx.txHash.slice(0, 16)}...{tx.txHash.slice(-16)}</span>
                      <button 
                        onClick={() => handleCopy(tx.txHash)} 
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {copiedHash === tx.txHash ? (
                          <FiCheck className="text-emerald-400 w-3.5 h-3.5" />
                        ) : (
                          <FiCopy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sender/Receiver details */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono w-full lg:w-auto">
                  <div className="flex flex-col">
                    <span className="text-3xs text-slate-500 uppercase font-bold tracking-wider font-sans">Sender</span>
                    <span className="text-slate-300 mt-0.5 truncate max-w-[120px]">{tx.from}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xs text-slate-500 uppercase font-bold tracking-wider font-sans">Recipient</span>
                    <span className="text-slate-300 mt-0.5 truncate max-w-[120px]">{tx.to}</span>
                  </div>
                </div>

                {/* Core metrics details (Gas / ETH) */}
                <div className="flex items-center justify-between lg:justify-end gap-10 w-full lg:w-auto border-t lg:border-t-0 border-white/[0.04] pt-4 lg:pt-0">
                  <div className="flex flex-col text-left lg:text-right font-mono text-xs">
                    <span className="text-3xs text-slate-500 uppercase font-bold tracking-wider font-sans">Gas Used</span>
                    <span className="text-slate-400 mt-0.5">{tx.gasUsed.toLocaleString()} units</span>
                  </div>
                  
                  <div className="flex flex-col text-right font-mono">
                    <span className="text-3xs text-slate-500 uppercase font-bold tracking-wider font-sans">Transfer Amount</span>
                    <span className="text-sm font-extrabold text-cyan-400 mt-0.5">
                      {tx.amount > 0 ? `${tx.amount} ETH` : "0.0 ETH"}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
