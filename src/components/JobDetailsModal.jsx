import React, { useState } from "react";
import { FiX, FiClock, FiDollarSign, FiUser, FiActivity, FiLayers, FiCheck, FiCopy, FiExternalLink, FiFileText } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useEscrow } from "../context/EscrowContext";

export const JobDetailsModal = ({ jobId, onClose }) => {
  const { jobs, addToast } = useEscrow();
  const [copiedId, setCopiedId] = useState("");
  const job = jobs.find((j) => j.id === jobId);

  if (!job) return null;

  const handleCopy = (value, type) => {
    navigator.clipboard.writeText(value);
    setCopiedId(type);
    addToast(`${type} copied to clipboard!`, "success");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Created":
        return "bg-slate-500/10 border-slate-500/30 text-slate-400";
      case "Active":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "Submitted":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "NotApproved":
        return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "Disputed":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/5 animate-pulse";
      case "Paid":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "Refunded":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  // Steps for progress tracker
  const steps = ["Created", "Active", "Submitted", "Approved", "Paid"];
  
  const getStepIndex = (status) => {
    if (status === "NotApproved") return 2; // Back to active/submitted boundaries
    if (status === "Disputed") return 2; // Stalled
    if (status === "Refunded") return 4; // Final state
    return steps.indexOf(status);
  };

  const currentStepIndex = getStepIndex(job.status);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop cover with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Main container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl glass-panel border border-white/[0.08] bg-dark-900/95 max-h-[90vh] overflow-y-auto p-6 md:p-8 z-10 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-400 font-mono tracking-wider">JOB #{job.id}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getStatusColor(job.status)}`}>
                  {job.status === "NotApproved" ? "Not Approved" : job.status}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{job.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white border border-white/[0.06] hover:bg-white/5 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white/[0.01] border border-white/[0.04] p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Workflow Progress</h3>
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 w-full">
              
              {/* Stepper horizontal line */}
              <div className="absolute top-5 left-[12%] right-[12%] h-[2px] bg-white/[0.05] hidden md:block z-0">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500" 
                  style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((stepName, idx) => {
                const isCompleted = idx < currentStepIndex || job.status === "Paid" || (job.status === "Refunded" && idx === 4);
                const isCurrent = idx === currentStepIndex && job.status !== "Paid" && job.status !== "Refunded";
                const isDisputedState = job.status === "Disputed" && idx === 2;
                const isNotApprovedState = job.status === "NotApproved" && idx === 2;

                let nodeColor = "bg-dark-900 border-white/[0.08] text-slate-600";
                if (isCompleted) {
                  nodeColor = "bg-purple-600 border-purple-500 text-white shadow-neon-purple/20 shadow-md";
                } else if (isCurrent) {
                  nodeColor = "bg-dark-950 border-cyan-400 text-cyan-400 ring-4 ring-cyan-400/10 shadow-neon-cyan/20 shadow-md";
                }

                if (isDisputedState) {
                  nodeColor = "bg-rose-950 border-rose-500 text-rose-400 animate-pulse ring-4 ring-rose-500/20";
                } else if (isNotApprovedState) {
                  nodeColor = "bg-orange-950 border-orange-500 text-orange-400 ring-4 ring-orange-500/15";
                }

                return (
                  <div key={stepName} className="flex md:flex-col items-center gap-4 md:gap-2.5 z-10 w-full md:w-auto">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-sm ${nodeColor}`}>
                      {isCompleted ? <FiCheck className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div className="flex flex-col md:items-center text-left md:text-center">
                      <span className="text-sm font-semibold text-slate-200">{stepName}</span>
                      <span className="text-2xs text-slate-500 mt-0.5">
                        {idx === 0 && "Funds Locked"}
                        {idx === 1 && "Work Commenced"}
                        {idx === 2 && (isDisputedState ? "Escalated Dispute" : isNotApprovedState ? "Modification Requested" : "Deliverables Uploaded")}
                        {idx === 3 && "Client Approved"}
                        {idx === 4 && (job.status === "Refunded" ? "Client Refunded" : "Freelancer Paid")}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Dual Column Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Hand: Escrow Parameters (2 Cols) */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* Description */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Description</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                  {job.description}
                </p>
              </div>

              {/* Requirements list */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deliverable Requirements</h4>
                <div className="flex items-start gap-2 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                  <FiFileText className="text-purple-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{job.requirements}</p>
                </div>
              </div>

              {/* Deliverables display panel */}
              {job.deliverables && (
                <div className="flex flex-col gap-3 border border-white/[0.06] bg-purple-950/5 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Submitted Deliverables</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-1">
                    {job.deliverables.githubUrl && (
                      <a
                        href={job.deliverables.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-panel glass-panel-hover flex items-center justify-between p-3 rounded-xl border border-white/[0.06]"
                      >
                        <span className="font-semibold text-slate-200">GitHub Repository</span>
                        <FiExternalLink className="text-slate-400" />
                      </a>
                    )}
                    {job.deliverables.ipfsHash && (
                      <div className="glass-panel p-3 rounded-xl border border-white/[0.06] flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-400">IPFS Hash</span>
                          <span className="font-mono text-slate-200 text-3xs">{job.deliverables.ipfsHash.slice(0, 16)}...</span>
                        </div>
                        <button
                          onClick={() => handleCopy(job.deliverables.ipfsHash, "IPFS")}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedId === "IPFS" ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                        </button>
                      </div>
                    )}
                    {job.deliverables.driveUrl && (
                      <a
                        href={job.deliverables.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-panel glass-panel-hover flex items-center justify-between p-3 rounded-xl border border-white/[0.06]"
                      >
                        <span className="font-semibold text-slate-200">Drive Assets Link</span>
                        <FiExternalLink className="text-slate-400" />
                      </a>
                    )}
                  </div>
                  {job.deliverables.notes && (
                    <div className="flex flex-col gap-1 mt-2 bg-dark-950/60 p-3 rounded-xl border border-white/[0.04]">
                      <span className="text-2xs font-bold text-slate-400 uppercase">Freelancer Notes:</span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{job.deliverables.notes}"</p>
                    </div>
                  )}

                  {/* Feedback display */}
                  {(job.clientFeedback || job.status === "Paid") && (
                    <div className="flex flex-col gap-1 mt-2 bg-emerald-950/10 p-3 rounded-xl border border-emerald-500/10">
                      <span className="text-2xs font-bold text-emerald-400 uppercase">Client Feedback / Audit Note:</span>
                      <p className="text-xs text-emerald-300 leading-relaxed italic">"{job.clientFeedback || "Approved automatically. Payout completed."}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dispute Split Resolution display */}
              {job.disputeSplit && (
                <div className="border border-purple-500/20 bg-purple-500/5 p-4 rounded-xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase">Mediator Arbitration Division</h4>
                  <div className="grid grid-cols-2 gap-4 mt-1 text-xs">
                    <div className="bg-dark-950/60 p-3 rounded-lg border border-white/[0.04]">
                      <span className="text-slate-400">Freelancer Payout ({job.disputeSplit.freelancerPct}%)</span>
                      <p className="text-sm font-extrabold text-white mt-0.5">{job.disputeSplit.freelancerShare} ETH</p>
                    </div>
                    <div className="bg-dark-950/60 p-3 rounded-lg border border-white/[0.04]">
                      <span className="text-slate-400">Client Refund ({job.disputeSplit.clientPct}%)</span>
                      <p className="text-sm font-extrabold text-white mt-0.5">{job.disputeSplit.clientShare} ETH</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Hand: Ledger Metrics & Role Summary */}
            <div className="flex flex-col gap-5 bg-white/[0.01] border border-white/[0.04] p-5 rounded-2xl">
              
              {/* Financial metrics */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xs text-slate-500 uppercase font-bold tracking-wider">Locked Funds</span>
                  <span className="text-lg font-black text-cyan-400">{job.amount} ETH</span>
                </div>
              </div>

              {/* Parties involved */}
              <div className="flex flex-col gap-3.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Participating Roles</h4>
                
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-2xs">Client Role</span>
                  <div className="bg-dark-950/60 p-2 rounded-xl border border-white/[0.04]">
                    <span className="text-slate-300">{job.client}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-2xs">Freelancer Role</span>
                  <div className="bg-dark-950/60 p-2 rounded-xl border border-white/[0.04]">
                    <span className="text-slate-300">{job.freelancer}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-2xs">Mediator Role</span>
                  <div className="bg-dark-950/60 p-2 rounded-xl border border-white/[0.04]">
                    <span className="text-slate-300">{job.mediator}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Audit History Logs */}
          <div className="border-t border-white/[0.06] pt-6 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FiActivity className="text-purple-400" />
              Smart Contract Audit History
            </h4>
            <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-2">
              {job.history.map((hist, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono">{hist.date}</span>
                    <span className="font-bold text-slate-200">{hist.title}</span>
                  </div>
                  <span className="text-slate-500 italic">Triggered by: {hist.actor}</span>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
