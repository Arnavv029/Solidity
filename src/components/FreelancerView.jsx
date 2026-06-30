import React, { useState } from "react";
import { useEscrow } from "../context/EscrowContext";
import { FiDollarSign, FiClock, FiCheck, FiPlay, FiBriefcase, FiSend, FiX, FiEye, FiAlertOctagon } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export const FreelancerView = ({ onViewDetails }) => {
  const { session, jobs, acceptJob, submitWork, raiseDispute, addToast } = useEscrow();

  // Submission form states
  const [submitJobId, setSubmitJobId] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Dispute escalation states
  const [disputeJobId, setDisputeJobId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

  // Show jobs in the freelancer role simulation
  const freelancerJobs = session.role === "freelancer" ? jobs : [];

  // Analytics calculator
  const totalEarnings = freelancerJobs.filter(j => j.status === "Paid").reduce((acc, curr) => {
    // If disputed and resolved, take split share, else full amount
    return acc + (curr.disputeSplit ? curr.disputeSplit.freelancerShare : curr.amount);
  }, 0);
  const lockedPayments = freelancerJobs.filter(j => ["Active", "Submitted", "NotApproved", "Disputed"].includes(j.status)).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingPayments = freelancerJobs.filter(j => j.status === "Submitted").reduce((acc, curr) => acc + curr.amount, 0);
  const releasedPayments = totalEarnings;

  // Filter jobs by current roles
  const pendingJobs = freelancerJobs.filter((job) => job.status === "Created");
  const activeProjects = freelancerJobs.filter((job) => ["Active", "Submitted", "NotApproved", "Disputed"].includes(job.status));

  const getStatusBadge = (status) => {
    switch (status) {
      case "Created":
        return "bg-slate-500/10 border-slate-500/25 text-slate-400";
      case "Active":
        return "bg-blue-500/10 border-blue-500/25 text-blue-400";
      case "Submitted":
        return "bg-amber-500/10 border-amber-500/25 text-amber-400";
      case "NotApproved":
        return "bg-orange-500/10 border-orange-500/25 text-orange-400";
      case "Disputed":
        return "bg-rose-500/10 border-rose-500/25 text-rose-400 animate-pulse";
      case "Paid":
        return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
      case "Refunded":
        return "bg-purple-500/10 border-purple-500/25 text-purple-400";
      default:
        return "bg-slate-500/10 border-slate-500/25 text-slate-400";
    }
  };

  const handleSubmitDeliverables = (e) => {
    e.preventDefault();
    if (session.role !== "freelancer") {
      addToast("Access denied: Switch simulated role in Navbar to Freelancer to submit work.", "error");
      return;
    }

    const success = submitWork(submitJobId, githubUrl, ipfsHash, driveUrl, notes);
    if (success) {
      setSubmitJobId(null);
      setGithubUrl("");
      setIpfsHash("");
      setDriveUrl("");
      setNotes("");
    }
  };

  const handleEscalateDispute = () => {
    if (!disputeJobId) return;
    if (!disputeReason) {
      addToast("Please provide a reason for the mediation request.", "error");
      return;
    }
    raiseDispute(disputeJobId, disputeReason);
    setDisputeJobId(null);
    setDisputeReason("");
  };

  const selectedSubmitJob = activeProjects.find((j) => j.id === submitJobId);

  return (
    <div className="flex flex-col gap-10 py-10 px-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Freelancer Portal</h1>
          <p className="text-slate-400 text-sm">Accept pending assignments, upload files, and check historical payout ledgers.</p>
        </div>
        {session.role !== "freelancer" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 text-amber-300 text-xs max-w-md">
            <FiAlertOctagon className="w-5 h-5 flex-shrink-0" />
            <p>You are viewing this hub as **{session.role.toUpperCase()}**. Select the Freelancer role in the header dropdown to start work and submit deliverables.</p>
          </div>
        )}
      </div>

      {/* Earnings Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earnings", value: `${totalEarnings.toFixed(2)} ETH`, color: "text-emerald-400" },
          { label: "Locked Payments", value: `${lockedPayments.toFixed(2)} ETH`, color: "text-cyan-400" },
          { label: "Pending Releases", value: `${pendingPayments.toFixed(2)} ETH`, color: "text-amber-400" },
          { label: "Released Claims", value: `${releasedPayments.toFixed(2)} ETH`, color: "text-purple-400" }
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 border border-white/[0.05] bg-white/[0.01]">
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            <p className={`text-2xl font-black ${stat.color} mt-1.5`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main workspaces grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Pending Invitations Deck (1 Part) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FiBriefcase className="text-purple-400" />
              Contract Offers ({pendingJobs.length})
            </h3>

            {pendingJobs.length === 0 ? (
              <div className="py-12 border border-dashed border-white/[0.06] rounded-2xl text-center">
                <FiClock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-400">No pending offers found</span>
                <p className="text-2xs text-slate-500 mt-1 max-w-[200px] mx-auto">Receive job proposals assigned to the freelancer role and accept them to begin work.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
                {pendingJobs.map((job) => (
                  <div key={job.id} className="glass-panel border-purple-500/10 hover:border-purple-500/20 bg-purple-950/2 px-4 py-4 rounded-xl flex flex-col gap-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-purple-400 font-mono">#{job.id}</span>
                      <span className="text-xs font-black text-cyan-400">{job.amount} ETH</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-extrabold text-slate-100 truncate">{job.title}</h4>
                      <p className="text-2xs text-slate-400 line-clamp-2 leading-relaxed">{job.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
                      <div className="flex flex-col">
                        <span className="text-3xs text-slate-500 uppercase font-bold">Client Role</span>
                        <span className="text-2xs text-slate-400 mt-0.5">{job.client}</span>
                      </div>
                      <button
                        onClick={() => acceptJob(job.id)}
                        disabled={session.role !== "freelancer"}
                        className="px-3.5 py-1.5 text-2xs font-extrabold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/20 text-white flex items-center gap-1.5 shadow-md shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiPlay />
                        Accept Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Project Progress Lists (2 Parts) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5 h-full">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FiBriefcase className="text-purple-400" />
              Your Active Escrow Projects
            </h3>

            {activeProjects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/[0.06] rounded-2xl text-center">
                <FiBriefcase className="w-12 h-12 text-slate-600 mb-3" />
                <span className="text-sm font-bold text-slate-300">No active projects found</span>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Accept a job proposal from the contract offers deck on the left to start working.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-xs font-bold text-slate-500 uppercase">
                      <th className="pb-3 font-semibold">Job ID / Project</th>
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Budget</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjects.map((job) => (
                      <tr key={job.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 pr-3 max-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-2xs font-extrabold text-purple-400">#{job.id}</span>
                            <span className="font-bold text-slate-200 truncate">{job.title}</span>
                          </div>
                        </td>
                        <td className="py-4 text-xs text-slate-400">
                          {job.client}
                        </td>
                        <td className="py-4 font-extrabold text-cyan-400">{job.amount} ETH</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getStatusBadge(job.status)}`}>
                            {job.status === "NotApproved" ? "Rejected Needs Update" : job.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewDetails(job.id)}
                              title="Inspection Details"
                              className="p-2 text-slate-400 hover:text-white border border-white/[0.05] hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <FiEye />
                            </button>

                            {["Active", "NotApproved"].includes(job.status) && (
                              <button
                                onClick={() => {
                                  setSubmitJobId(job.id);
                                  setGithubUrl("");
                                  setIpfsHash("");
                                  setDriveUrl("");
                                  setNotes("");
                                }}
                                disabled={session.role !== "freelancer"}
                                className="px-3 py-1.5 text-xs font-extrabold rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                Submit Work
                              </button>
                            )}

                            {["Active", "Submitted", "NotApproved"].includes(job.status) && (
                              <button
                                onClick={() => {
                                  setDisputeJobId(job.id);
                                  setDisputeReason("");
                                }}
                                disabled={session.role !== "freelancer"}
                                className="px-3 py-1.5 text-xs font-extrabold rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                Dispute
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Submit Work Modal */}
      <AnimatePresence>
        {submitJobId && selectedSubmitJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setSubmitJobId(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass-panel border border-white/[0.08] bg-dark-900/95 p-6 z-10 flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-3xs font-extrabold text-purple-400 font-mono">SUBMIT JOB #{selectedSubmitJob.id}</span>
                  <h3 className="text-lg font-black text-white">Upload Project Deliverables</h3>
                </div>
                <button
                  onClick={() => setSubmitJobId(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {selectedSubmitJob.status === "NotApproved" && (
                <div className="border border-orange-500/20 bg-orange-500/5 p-3 rounded-xl flex flex-col gap-1 text-xs text-orange-300">
                  <span className="font-bold uppercase text-2xs">Client Rejection Feedback:</span>
                  <p className="italic">"{selectedSubmitJob.clientFeedback}"</p>
                </div>
              )}

              <form onSubmit={handleSubmitDeliverables} className="flex flex-col gap-4 text-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="glass-input text-xs"
                    placeholder="https://github.com/your-username/repo-name"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">IPFS Deliverable CID Hash</label>
                  <input
                    type="text"
                    value={ipfsHash}
                    onChange={(e) => setIpfsHash(e.target.value)}
                    className="glass-input font-mono text-xs"
                    placeholder="Qm..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Google Drive Shared Folder Link</label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="glass-input text-xs"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Submission Notes / Summary</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="glass-input resize-none text-xs"
                    placeholder="Explain execution deliverables and proof criteria..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={session.role !== "freelancer"}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/20 font-extrabold rounded-xl shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-2"
                >
                  <FiSend />
                  Submit Deliverables to Escrow
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raise Dispute Modal */}
      <AnimatePresence>
        {disputeJobId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setDisputeJobId(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass-panel border border-white/[0.08] bg-dark-900/95 p-6 z-10 flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FiAlertOctagon className="text-rose-500" />
                  Escalate Escrow Dispute
                </h3>
                <button
                  onClick={() => setDisputeJobId(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-rose-950/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-xs">
                <p>
                  Escalating this job will lock the locked funds in the smart contract completely. Authority will transfer to the Mediator to resolve the division of currency. Neither client nor freelancer can pull funds until arbitration is complete.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Reason for Escalate Dispute</label>
                <textarea
                  rows="4"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="Specify failure of client response, payments delay or unfair specs requests..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setDisputeJobId(null)}
                  className="px-4 py-2 text-xs font-extrabold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEscalateDispute}
                  className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/20 shadow-lg shadow-rose-500/10 transition-all"
                >
                  Confirm Escalate Dispute
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
