import React, { useState } from "react";
import { useEscrow } from "../context/EscrowContext";
import { FiPlusCircle, FiFileText, FiClock, FiCheck, FiX, FiShield, FiAlertOctagon, FiEye, FiActivity } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export const ClientView = ({ onViewDetails }) => {
  const { session, jobs, createJob, approveWork, rejectWork, raiseDispute, addToast } = useEscrow();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [freelancer, setFreelancer] = useState("");
  const [mediator, setMediator] = useState("");

  // Modal review state
  const [reviewJobId, setReviewJobId] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Dispute trigger states
  const [disputeJobId, setDisputeJobId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

  // Filter out job listings for the client role
  const clientJobs = session.role === "client" ? jobs : [];

  // Analytics calculator
  const activeJobs = clientJobs.filter(j => !["Paid", "Refunded"].includes(j.status)).length;
  const lockedFunds = clientJobs.filter(j => !["Paid", "Refunded"].includes(j.status)).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingReviews = clientJobs.filter(j => j.status === "Submitted").length;
  const completedPayments = clientJobs.filter(j => j.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Created":
        return "bg-slate-500/10 border-slate-500/25 text-slate-400";
      case "Active":
        return "bg-blue-500/10 border-blue-500/25 text-blue-400";
      case "Submitted":
        return "bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse";
      case "NotApproved":
        return "bg-orange-500/10 border-orange-500/25 text-orange-400";
      case "Disputed":
        return "bg-rose-500/10 border-rose-500/25 text-rose-400";
      case "Paid":
        return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
      case "Refunded":
        return "bg-purple-500/10 border-purple-500/25 text-purple-400";
      default:
        return "bg-slate-500/10 border-slate-500/25 text-slate-400";
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (session.role !== "client") {
      addToast("Please select Client role.", "error");
      return;
    }

    if (!freelancer || !mediator) {
      addToast("Please enter Freelancer and Mediator wallet addresses.", "error");
      return;
    }

    const success = await createJob(
      title,
      description,
      amount,
      deadline,
      requirements,
      freelancer,
      mediator
    );

    if (success) {
      setTitle("");
      setDescription("");
      setAmount("");
      setDeadline("");
      setRequirements("");
      setFreelancer("");
      setMediator("");
    }
  };

  const handleApprove = () => {
    if (!reviewJobId) return;
    approveWork(reviewJobId, feedback);
    setReviewJobId(null);
    setFeedback("");
  };

  const handleReject = () => {
    if (!reviewJobId) return;
    if (!feedback) {
      addToast("Feedback is required to request modifications.", "error");
      return;
    }
    rejectWork(reviewJobId, feedback);
    setReviewJobId(null);
    setFeedback("");
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

  const selectedReviewJob = clientJobs.find((j) => j.id === reviewJobId);

  return (
    <div className="flex flex-col gap-10 py-10 px-6 max-w-7xl mx-auto">

      {/* Page Header / Access warning */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Client Workspace</h1>
          <p className="text-slate-400 text-sm">Lock payments, manage active work orders, and review submissions.</p>
        </div>
        {session.role !== "client" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 text-amber-300 text-xs max-w-md">
            <FiAlertOctagon className="w-5 h-5 flex-shrink-0" />
            <p>You are viewing this hub as **{session.role.toUpperCase()}**. Select the Client role in the header dropdown to create jobs and release funds.</p>
          </div>
        )}
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: activeJobs, color: "text-blue-400" },
          { label: "Locked Funds", value: `${lockedFunds.toFixed(2)} ETH`, color: "text-cyan-400" },
          { label: "Pending Reviews", value: pendingReviews, color: "text-amber-400" },
          { label: "Completed Payments", value: `${completedPayments.toFixed(2)} ETH`, color: "text-emerald-400" }
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 border border-white/[0.05] bg-white/[0.01]">
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            <p className={`text-2xl font-black ${stat.color} mt-1.5`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Create New Escrow Form (1 Part) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FiPlusCircle className="text-purple-400" />
              Create Escrow Job
            </h3>

            <form onSubmit={handleCreate} className="flex flex-col gap-4 text-sm text-left">
              <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 text-slate-300 text-xs">
                <span className="font-bold uppercase text-slate-400 tracking-wider text-2xs">Freelancer / Mediator Assignment</span>
                <p className="leading-relaxed text-slate-400 text-sm">
                  Jobs are simulated with a generic Freelancer and Mediator role. This removes wallet address dependency while preserving the escrow workflow.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Freelancer Wallet Address
                </label>

                <input
                  type="text"
                  required
                  value={freelancer}
                  onChange={(e) => setFreelancer(e.target.value)}
                  className="glass-input"
                  placeholder="0xFreelancerWallet"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Mediator Wallet Address
                </label>

                <input
                  type="text"
                  required
                  value={mediator}
                  onChange={(e) => setMediator(e.target.value)}
                  className="glass-input"
                  placeholder="0xMediatorWallet"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Job Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input"
                  placeholder="e.g. Audit Smart Contract"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input resize-none"
                  placeholder="Project scope and details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Budget (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="glass-input font-bold"
                    placeholder="2.5"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="glass-input text-slate-300"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Deliverable Deliverables / Notes</label>
                <textarea
                  rows="2"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="glass-input resize-none text-xs"
                  placeholder="GitHub repo link, IPFS documents..."
                />
              </div>

              <button
                type="submit"
                disabled={session.role !== "client"}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 mt-2 ${session.role === "client"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  : "bg-slate-800 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-50"
                  }`}
              >
                <FiShield />
                Lock Funds & Create Escrow
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Escrow table (2 Parts) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col gap-5 h-full">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FiActivity className="text-purple-400" />
              Your Ongoing Escrow Agreements
            </h3>

            {clientJobs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/[0.06] rounded-2xl text-center">
                <FiFileText className="w-12 h-12 text-slate-600 mb-3" />
                <span className="text-sm font-bold text-slate-300">No jobs associated with this role</span>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Use the form on the left to create a new escrow job and fund it.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-xs font-bold text-slate-500 uppercase">
                      <th className="pb-3 font-semibold">Job ID / Title</th>
                      <th className="pb-3 font-semibold">Freelancer</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientJobs.map((job) => (
                      <tr key={job.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 pr-3 max-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-2xs font-extrabold text-purple-400">#{job.id}</span>
                            <span className="font-bold text-slate-200 truncate">{job.title}</span>
                          </div>
                        </td>
                        <td className="py-4 text-xs text-slate-400">
                          {job.freelancer}
                        </td>
                        <td className="py-4 font-extrabold text-cyan-400">{job.amount} ETH</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getStatusBadge(job.status)}`}>
                            {job.status === "NotApproved" ? "Not Approved" : job.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewDetails(job.id)}
                              title="View Details"
                              className="p-2 text-slate-400 hover:text-white border border-white/[0.05] hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <FiEye />
                            </button>

                            {job.status === "Submitted" && (
                              <button
                                onClick={() => {
                                  setReviewJobId(job.id);
                                  setFeedback("");
                                }}
                                disabled={session.role !== "client"}
                                className="px-3 py-1.5 text-xs font-extrabold rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                Review Work
                              </button>
                            )}

                            {["Active", "Submitted", "NotApproved"].includes(job.status) && (
                              <button
                                onClick={() => {
                                  setDisputeJobId(job.id);
                                  setDisputeReason("");
                                }}
                                disabled={session.role !== "client"}
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

      {/* Review Submissions Modal */}
      <AnimatePresence>
        {reviewJobId && selectedReviewJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setReviewJobId(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass-panel border border-white/[0.08] bg-dark-900/95 p-6 z-10 flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-lg font-black text-white">Review Submission</h3>
                <button
                  onClick={() => setReviewJobId(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Submission links preview */}
              <div className="flex flex-col gap-2.5 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Freelancer Deliverables:</span>
                <div className="flex flex-col gap-1.5 mt-1 font-mono">
                  {selectedReviewJob.deliverables?.githubUrl && (
                    <span>GitHub: <a href={selectedReviewJob.deliverables.githubUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{selectedReviewJob.deliverables.githubUrl}</a></span>
                  )}
                  {selectedReviewJob.deliverables?.ipfsHash && (
                    <span className="break-all">IPFS CID: <span className="text-purple-400">{selectedReviewJob.deliverables.ipfsHash}</span></span>
                  )}
                  {selectedReviewJob.deliverables?.driveUrl && (
                    <span>Drive Link: <a href={selectedReviewJob.deliverables.driveUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{selectedReviewJob.deliverables.driveUrl}</a></span>
                  )}
                </div>
                {selectedReviewJob.deliverables?.notes && (
                  <div className="border-t border-white/[0.04] pt-2.5 mt-1">
                    <span className="text-slate-500 font-bold uppercase block mb-1">Freelancer Notes:</span>
                    <p className="text-slate-300 italic leading-relaxed">"{selectedReviewJob.deliverables.notes}"</p>
                  </div>
                )}
              </div>

              {/* Feedback inputs */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Review Feedback</label>
                <textarea
                  rows="4"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="glass-input text-xs"
                  placeholder="Acceptance notes or modification requests..."
                />
              </div>

              {/* Submission buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  onClick={handleReject}
                  className="py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 font-extrabold rounded-xl transition-all"
                >
                  Reject & Request Updates
                </button>
                <button
                  onClick={handleApprove}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/20 font-extrabold rounded-xl shadow-lg shadow-emerald-500/10 transition-all"
                >
                  Approve & Release Funds
                </button>
              </div>
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
                  Raise Escrow Dispute
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
                  placeholder="Specify failure of deliverables or lack of communication..."
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
