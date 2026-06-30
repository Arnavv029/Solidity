import React, { useState } from "react";
import { useEscrow } from "../context/EscrowContext";
import { FiShield, FiSliders, FiFileText, FiUser, FiActivity, FiArrowRight, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { motion } from "framer-motion";

export const MediatorView = ({ onViewDetails }) => {
  const { session, jobs, resolveDispute, addToast } = useEscrow();

  // Active dispute resolution sliders
  const [activeJobId, setActiveJobId] = useState(null);
  const [freelancerPct, setFreelancerPct] = useState(50); // default 50% split

  // Show disputed jobs to mediator role simulation
  const disputedJobs = session.role === "mediator" ? jobs.filter((job) => job.status === "Disputed") : [];

  const selectedJob = disputedJobs.find((j) => j.id === activeJobId);
  const clientPct = 100 - freelancerPct;

  const handleResolve = () => {
    if (!activeJobId || !selectedJob) return;
    if (session.role !== "mediator") {
      addToast("Access denied: Switch simulated role in Navbar to Mediator to resolve disputes.", "error");
      return;
    }

    const success = resolveDispute(activeJobId, freelancerPct, clientPct);
    if (success) {
      setActiveJobId(null);
      setFreelancerPct(50);
    }
  };

  return (
    <div className="flex flex-col gap-10 py-10 px-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Resolution Panel</h1>
          <p className="text-slate-400 text-sm">Review escrow agreements in deadlock, evaluate deliverables, and execute split payouts.</p>
        </div>
        {session.role !== "mediator" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 text-amber-300 text-xs max-w-md">
            <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>You are viewing this hub as **{session.role.toUpperCase()}**. Select the Mediator role in the header dropdown to slide splits and settle escrows.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Dispute Folder List (2 Parts) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5 h-full">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FiSliders className="text-purple-400" />
              Disputed Escrow Cases ({disputedJobs.length})
            </h3>

            {disputedJobs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/[0.06] rounded-2xl text-center">
                <FiCheckCircle className="w-12 h-12 text-slate-600 mb-3" />
                <span className="text-sm font-bold text-slate-300">All cases fully resolved</span>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">No smart contracts are currently escalated in dispute. Role balances are secure.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {disputedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className={`glass-panel border p-5 rounded-2xl flex flex-col gap-4 text-left transition-all ${
                      activeJobId === job.id 
                        ? "border-purple-500/40 bg-purple-950/2 shadow-lg shadow-purple-500/5" 
                        : "border-white/[0.05] bg-white/[0.01] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-purple-400 font-mono">#{job.id}</span>
                        <h4 className="text-sm font-extrabold text-slate-100 truncate max-w-[200px] sm:max-w-md">{job.title}</h4>
                      </div>
                      <span className="text-sm font-black text-cyan-400">{job.amount} ETH</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-3xs">Dispute Reason (Freelancer):</span>
                        <p className="text-slate-300 italic leading-relaxed">"{job.disputeReason}"</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-3xs">Critique Feedback (Client):</span>
                        <p className="text-slate-300 italic leading-relaxed">"{job.clientFeedback || "No feedback specified."}"</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/[0.04] pt-3 mt-1">
                      <div className="flex flex-wrap gap-3 text-3xs text-slate-400">
                        <span>Client: {job.client}</span>
                        <span>Freelancer: {job.freelancer}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => onViewDetails(job.id)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-white/[0.06] hover:bg-white/5 text-slate-300 transition-colors"
                        >
                          Inspect Details
                        </button>
                        <button
                          onClick={() => {
                            setActiveJobId(job.id);
                            setFreelancerPct(50);
                          }}
                          disabled={session.role !== "mediator"}
                          className="px-4 py-1.5 text-xs font-extrabold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Resolve Case
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Split Slider Resolution Console (1 Part) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5 h-full">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FiShield className="text-purple-400" />
              Arbitration Console
            </h3>

            {!activeJobId || !selectedJob ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-white/[0.06] rounded-2xl text-center">
                <FiSliders className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-400">No active cases selected</span>
                <p className="text-2xs text-slate-500 mt-1 max-w-[200px] mx-auto">Click "Resolve Case" on any disputed escrow item on the left to activate resolution controls.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 text-left">
                <div className="flex flex-col gap-1 border-b border-white/[0.05] pb-3">
                  <span className="text-2xs font-extrabold text-purple-400 font-mono">SELECTED CASE #{selectedJob.id}</span>
                  <h4 className="text-sm font-extrabold text-white line-clamp-1">{selectedJob.title}</h4>
                  <span className="text-xs text-slate-400 mt-1">Escrowed Balance: <span className="font-extrabold text-cyan-400">{selectedJob.amount} ETH</span></span>
                </div>

                {/* Range Slider */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Freelancer Payout</span>
                    <span className="text-purple-400 text-sm font-black">{freelancerPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={freelancerPct}
                    onChange={(e) => setFreelancerPct(parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-950 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-white/[0.06]"
                  />
                  <div className="flex items-center justify-between text-2xs text-slate-500">
                    <span>0% (Refund Client)</span>
                    <span>100% (Pay Freelancer)</span>
                  </div>
                </div>

                {/* Division Breakdown preview */}
                <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl flex flex-col gap-3 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-2xs">Estimated Division:</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-slate-400">Freelancer Payout ({freelancerPct}%)</span>
                      <span className="font-extrabold text-white font-mono">{((selectedJob.amount * freelancerPct) / 100).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400">Client Refund ({clientPct}%)</span>
                      <span className="font-extrabold text-white font-mono">{((selectedJob.amount * clientPct) / 100).toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-950/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2.5 text-2xs text-rose-300">
                  <FiAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Executing this transaction is final. Smart contract funds will be disbursed automatically according to this split.</p>
                </div>

                <button
                  onClick={handleResolve}
                  disabled={session.role !== "mediator"}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/20 font-extrabold rounded-xl shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-2"
                >
                  <FiSliders />
                  Disburse Split Settle
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
