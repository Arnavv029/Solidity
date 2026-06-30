import React from "react";
import { FiLayers, FiShield, FiTrendingUp, FiSmile, FiArrowRight, FiCheck } from "react-icons/fi";
import { motion } from "framer-motion";

export const LandingView = ({ setCurrentTab }) => {
  
  const stats = [
    { label: "Total Escrows Managed", value: "2,841", change: "+14.2% MoM" },
    { label: "Total Funds Locked", value: "14,842 ETH", change: "8,924,120 USD" },
    { label: "Escrow Release Success", value: "99.8%", change: "0.2% Dispute Rate" },
    { label: "Active Nodes/Users", value: "18,402", change: "+1,241 this week" }
  ];

  const features = [
    {
      icon: <FiShield className="w-6 h-6 text-purple-400" />,
      title: "Trustless Vaults",
      description: "Funds are held securely by automated smart contract logic, not a centralized company. No human can unilaterally block your payout."
    },
    {
      icon: <FiLayers className="w-6 h-6 text-cyan-400" />,
      title: "Immutable Auditing",
      description: "Every phase transition (Created, Work Submitted, Dispute Raised) is logged onto the ledger for absolute transparency."
    },
    {
      icon: <FiTrendingUp className="w-6 h-6 text-blue-400" />,
      title: "Fast Payout Settlement",
      description: "Once the client clicks Approve, funds are instantly released to the freelancer without traditional clearing delays."
    },
    {
      icon: <FiSmile className="w-6 h-6 text-pink-400" />,
      title: "Decentralized Mediation",
      description: "If disagreements surface, trusted mediators or DAO voting pools evaluate deliverables and split locked funds fairly."
    }
  ];

  const workflowSteps = [
    {
      num: "01",
      title: "Create & Deposit",
      desc: "Client initiates the job agreement and deposits the project budget into the smart contract's vault."
    },
    {
      num: "02",
      title: "Acceptance",
      desc: "The designated freelancer verifies the locked amount on the block explorer and accepts the project."
    },
    {
      num: "03",
      title: "Deliverables Upload",
      desc: "Freelancer completes the contract tasks and submits proof links (GitHub/IPFS CIDs) directly to the contract state."
    },
    {
      num: "04",
      title: "Automatic Payout",
      desc: "Client reviews and approves the submission, triggering the smart contract to instantly release locked funds."
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="flex flex-col gap-24 py-10 px-6 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <div className="relative text-center flex flex-col items-center gap-6 mt-8">
        
        {/* Glow effect background blur */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none" />
        <div className="absolute top-12 left-1/3 w-[250px] h-[250px] bg-cyan-600/10 blur-[100px] rounded-full z-0 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="z-10 flex flex-col items-center gap-6"
        >
          {/* Tag */}
          <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-black tracking-widest text-purple-300 uppercase shadow-neon-purple/5 shadow-md">
            🛡️ Next-Gen Web3 Escrow Protocol
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-4xl">
            Secure Freelance Payments with{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Blockchain Escrow
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Eliminate payment friction. Client funds remain securely locked inside immutable smart contracts until deliverables are reviewed and approved.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
            <button
              onClick={() => setCurrentTab("client")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 border border-purple-400/20 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
            >
              Create Escrow Job
              <FiArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentTab("activity")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel glass-panel-hover border border-white/[0.08] text-sm font-extrabold text-slate-100 hover:text-white flex items-center justify-center gap-2"
            >
              Explore Ledger Activity
            </button>
          </div>
        </motion.div>

        {/* Floating statistics cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-16 z-10"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="glass-panel p-6 border border-white/[0.05] bg-white/[0.01] hover:scale-[1.02] transition-transform duration-300 flex flex-col gap-1.5 text-left"
            >
              <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <span className="text-2xl font-black text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{stat.value}</span>
              <span className="text-xs font-bold text-cyan-400">{stat.change}</span>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* Benefits section */}
      <div className="flex flex-col gap-12">
        <div className="text-center flex flex-col items-center gap-3">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Why Choose Decentralized Escrows?</h2>
          <p className="text-slate-400 max-w-xl text-sm">
            We bypass high traditional freelance platform cuts (5% to 20%) by replacing middlemen with secure, automated blockchain code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="glass-panel p-6 border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors duration-300 flex items-start gap-5"
            >
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-shrink-0">
                {feature.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-slate-100">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow steps timeline */}
      <div className="flex flex-col gap-16 relative">
        
        {/* Background glow behind workflow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Interactive Walkthrough</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">The Agreement Lifecycle</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto w-full">
          {workflowSteps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col gap-4 bg-white/[0.01] border border-white/[0.03] p-5 rounded-2xl">
              <span className="text-3xl font-black bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent font-mono">
                {step.num}
              </span>
              <h3 className="text-base font-bold text-slate-100">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Banner callout */}
      <div className="glass-panel border-purple-500/20 bg-gradient-to-r from-purple-950/10 to-indigo-950/10 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-2 text-left max-w-xl">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FiShield className="text-purple-400" />
            Vulnerability-Free Audited Smart Contracts
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Our multi-signature vault architecture has been fully verified and audited. With reentrancy guards, complete role constraints, and secure fund routing, AegisEscrow is the safest way to transact.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          {["ReentrancyGuard", "OpenZeppelin Safe", "100% Audited"].map((tag) => (
            <span key={tag} className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-300 text-2xs font-extrabold uppercase">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.05] pt-8 pb-4 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs mt-12">
        <span>© 2026 AegisEscrow Protocol. Built on Web3 rails.</span>
        <div className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#github" className="hover:text-slate-300 transition-colors">Developer Docs</a>
        </div>
      </div>

    </div>
  );
};
