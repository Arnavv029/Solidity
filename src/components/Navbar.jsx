import React, { useState } from "react";
import { useEscrow } from "../context/EscrowContext";
import { FiCreditCard, FiChevronDown, FiCopy, FiCheck, FiLayers, FiMenu, FiX, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { session, connectWallet, disconnectWallet, selectRole, clearRole } = useEscrow();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "landing", label: "Home" },
    { id: "client", label: "Client Hub" },
    { id: "freelancer", label: "Freelancer Hub" },
    { id: "mediator", label: "Resolution Panel" },
    { id: "activity", label: "Ledger Ledger" }
  ];

  const getShortAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-dark-950/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo Section */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => { setCurrentTab("landing"); setMobileMenuOpen(false); }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FiLayers className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">
            Aegis<span className="text-purple-500">Escrow</span>
          </span>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                currentTab === tab.id
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {currentTab === tab.id && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-white/[0.04] border border-white/[0.08] shadow-sm rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls / Role Selector */}
        <div className="hidden md:flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition-colors relative">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-dark-950 animate-pulse" />
          </button>

          {session.connectionStatus === "connecting" ? (
            <button
              disabled
              className="px-5 py-2.5 rounded-xl bg-slate-700 text-sm font-bold text-slate-200 opacity-80 flex items-center gap-2 border border-white/[0.08]"
            >
              <FiCreditCard className="w-4 h-4" />
              Connecting...
            </button>
          ) : session.connected ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="glass-panel glass-panel-hover flex items-center gap-3 px-4 py-2 border border-white/[0.08] text-sm text-slate-100 font-semibold rounded-xl bg-white/[0.01]"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold uppercase">{getShortAddress(session.address)}</span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 glass-panel border border-white/[0.08] bg-dark-900/95 backdrop-blur-2xl p-4 shadow-2xl z-20 flex flex-col gap-3 rounded-2xl"
                    >
                      <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-3">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Wallet</span>
                        <div className="mt-1 text-slate-300 text-sm font-semibold">{getShortAddress(session.address)}</div>
                        <div className="text-xs text-slate-400">Network: {session.chainName || "unknown"}</div>
                        <div className="text-xs text-slate-400">Chain ID: {session.chainId ?? "N/A"}</div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                          <span className="text-xs text-slate-400">Wallet Balance:</span>
                          <span className="font-semibold text-cyan-300">{session.walletBalance === null ? "N/A" : `${session.walletBalance.toFixed(4)} ETH`}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                          <span>Simulated Role</span>
                          <span className="font-semibold text-cyan-300 uppercase">{session.role}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Switch Simulated Role</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['client', 'freelancer', 'mediator', 'visitor'].map((role) => (
                            <button
                              key={role}
                              onClick={() => {
                                selectRole(role);
                                setDropdownOpen(false);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                session.role === role
                                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-neon-purple/10 shadow-lg"
                                  : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-white hover:border-white/10"
                              }`}
                            >
                              {role.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          disconnectWallet();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-center text-xs py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-bold rounded-xl transition-all"
                      >
                        Disconnect Wallet
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 border border-purple-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <FiCreditCard className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>

        {/* Mobile Hamburger menu */}
        <div className="md:hidden flex items-center gap-3">
          <button className="text-slate-400 hover:text-white transition-colors relative">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white border border-white/10 rounded-lg bg-white/5"
          >
            {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 border-t border-white/5 pt-4 flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    currentTab === tab.id
                      ? "bg-purple-500/10 border-l-4 border-purple-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Wallet connect info in mobile drawer */}
            <div className="border-t border-white/5 pt-4 pb-2 px-4 flex flex-col gap-3">
              {session.connected ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Wallet</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 text-2xs font-extrabold uppercase border border-emerald-400/20">
                      Connected
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                    <div className="text-xs text-slate-400">{getShortAddress(session.address)}</div>
                    <div className="text-xs text-slate-400">Network: {session.chainName || "unknown"}</div>
                    <div className="text-xs font-semibold uppercase text-cyan-300">Role: {session.role}</div>
                    <div className="text-sm font-bold text-cyan-400">
                      {session.walletBalance === null ? "Balance N/A" : `${session.walletBalance.toFixed(4)} ETH`}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['client', 'freelancer', 'mediator'].map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          selectRole(role);
                        }}
                        className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                          session.role === role
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                            : "bg-white/[0.03] border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {role.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center text-xs py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-bold rounded-xl transition-all"
                  >
                    Disconnect Wallet
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    connectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-purple-500/20 border border-purple-400/20 hover:scale-[1.01] transition-all"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
