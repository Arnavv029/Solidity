import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { BrowserProvider, formatEther } from "ethers";

const EscrowContext = createContext();

const getShortAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Dynamic Helper to generate realistic TX Hashes
const generateTxHash = () => {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
};

// No pre-loaded demo data — app starts clean
const initialJobs = [];

// No pre-loaded transactions — ledger starts empty
const initialTransactions = [];

export const EscrowProvider = ({ children }) => {
  const [jobs, setJobs] = useState(initialJobs);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [toasts, setToasts] = useState([]);
  const [ethereumProvider, setEthereumProvider] = useState(null);
  const ethereumProviderRef = useRef(null);
  
  // Session state — starts disconnected and role-based only
  const [session, setSession] = useState({
    role: "visitor",
    connected: false,
    balance: 0,
    walletBalance: null,
    address: null,
    chainId: null,
    chainName: null,
    connectionStatus: "idle"
  });

  // Dynamic system time helper
  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Toast System Emitter
  const addToast = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically clear toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Role Simulation Actions
  const updateWalletState = async (browserProvider, address) => {
    const network = await browserProvider.getNetwork();
    const balanceBN = await browserProvider.getBalance(address);
    const walletBalance = parseFloat(formatEther(balanceBN));

    setSession((prev) => ({
      ...prev,
      connected: true,
      address,
      walletBalance,
      chainId: network.chainId,
      chainName: network.name || `chain-${network.chainId}`,
      connectionStatus: "connected"
    }));

    console.log("Connection successful", { address, chainId: network.chainId, chainName: network.name, walletBalance });
  };

  const connectWallet = async () => {
    console.log("Connect button clicked");

    if (!window.ethereum) {
      console.log("MetaMask not detected");
      addToast("MetaMask not detected. Please install MetaMask to connect.", "error");
      setSession((prev) => ({ ...prev, connectionStatus: "failed" }));
      return;
    }

    setSession((prev) => ({ ...prev, connectionStatus: "connecting" }));

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        console.log("MetaMask connection failed: no accounts returned.");
        addToast("MetaMask connection failed: no accounts returned.", "error");
        setSession((prev) => ({ ...prev, connectionStatus: "failed", connected: false }));
        return;
      }

      const address = accounts[0];
      const browserProvider = new BrowserProvider(window.ethereum);
      setEthereumProvider(browserProvider);
      await updateWalletState(browserProvider, address);
    } catch (error) {
      console.error("MetaMask connection failed", error);
      const rejected = error?.code === 4001;
      addToast(rejected ? "MetaMask connection rejected." : "MetaMask connection failed.", "error");
      setSession((prev) => ({
        ...prev,
        connected: false,
        address: null,
        walletBalance: null,
        chainId: null,
        chainName: null,
        connectionStatus: "failed"
      }));
    }
  };

  const disconnectWallet = () => {
    setEthereumProvider(null);
    setSession((prev) => ({
      ...prev,
      connected: false,
      walletBalance: null,
      address: null,
      chainId: null,
      chainName: null,
      connectionStatus: "idle"
    }));
    addToast("Wallet disconnected.", "warning");
  };

  useEffect(() => {
    ethereumProviderRef.current = ethereumProvider;
  }, [ethereumProvider]);

  useEffect(() => {
    if (!window.ethereum) {
      console.log("MetaMask not detected");
      return;
    }

    console.log("MetaMask detected");
    setSession((prev) => ({ ...prev, connectionStatus: "idle", connected: false }));

    const handleAccountsChanged = async (accounts) => {
      console.log("accountsChanged", accounts);
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
        return;
      }
      const provider = ethereumProviderRef.current || new BrowserProvider(window.ethereum);
      if (!ethereumProviderRef.current) {
        setEthereumProvider(provider);
      }
      await updateWalletState(provider, accounts[0]);
    };

    const handleChainChanged = async () => {
      console.log("chainChanged");
      const provider = ethereumProviderRef.current || new BrowserProvider(window.ethereum);
      if (!ethereumProviderRef.current) {
        setEthereumProvider(provider);
      }
      try {
        const account = session.address;
        if (account) {
          await updateWalletState(provider, account);
        } else {
          const network = await provider.getNetwork();
          setSession((prev) => ({
            ...prev,
            chainId: network.chainId,
            chainName: network.name || `chain-${network.chainId}`
          }));
        }
      } catch (error) {
        console.error(error);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const selectRole = (role) => {
    let mockBalance = 10.0;
    let resolvedRole = role;

    switch (role) {
      case "client":
        mockBalance = 14.25;
        break;
      case "freelancer":
        mockBalance = 4.82;
        break;
      case "mediator":
        mockBalance = 150.75;
        break;
      default:
        resolvedRole = "visitor";
        mockBalance = 1.5;
    }

    setSession((prev) => ({
      ...prev,
      role: resolvedRole,
      balance: mockBalance
    }));
    addToast(`Selected role ${resolvedRole.toUpperCase()} successfully.`, "success");
  };

  const clearRole = () => {
    setSession((prev) => ({
      ...prev,
      role: "visitor",
      balance: 0.0
    }));
    addToast("Role cleared.", "warning");
  };

  // Smart Contract Interaction Mock functions
  
  // 1. Client Creates Escrow Job
  const createJob = (title, description, amount, deadline, requirements) => {
    if (!title || !description || !amount || !deadline) {
      addToast("Job creation failed: Please fill out all required fields.", "error");
      return false;
    }

    const numericAmount = parseFloat(amount);
    if (numericAmount > session.balance) {
      addToast("Insufficient balance to lock in escrow!", "error");
      return false;
    }

    const newId = jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 101;
    const newJob = {
      id: newId,
      title,
      description,
      client: session.role === "client" ? "Client" : "UNKNOWN",
      freelancer: "Freelancer",
      mediator: "Mediator",
      amount: numericAmount,
      deadline,
      requirements: requirements || "No specific requirements provided.",
      status: "Created",
      deliverables: null,
      history: [
        { step: "Created", date: getCurrentDate(), title: "Job Created & Funds Locked", actor: `Client` }
      ],
      clientFeedback: "",
      disputeReason: "",
      disputeSplit: null,
      lastUpdated: new Date().toISOString()
    };

    // Deduct client balance
    setSession(prev => ({ ...prev, balance: prev.balance - numericAmount }));
    setJobs(prev => [newJob, ...prev]);

    // Record TX
    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId: newId,
      action: "Job Created",
      from: "Client",
      to: "Smart Contract Escrow",
      amount: numericAmount,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(115000 + Math.random() * 20000)
    };
    setTransactions(prev => [newTx, ...prev]);
    
    addToast(`Escrow transaction confirmed! Locked ${numericAmount} ETH in Job #${newId}.`, "success");
    return true;
  };

  // 2. Freelancer Accepts Job
  const acceptJob = (jobId) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId && job.status === "Created") {
        return {
          ...job,
          status: "Active",
          history: [
            ...job.history,
            { step: "Active", date: getCurrentDate(), title: "Job Accepted & Work Started", actor: "Freelancer" }
          ],
          lastUpdated: new Date().toISOString()
        };
      }
      return job;
    }));

    // Record TX
    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId,
      action: "Job Accepted",
      from: "Freelancer",
      to: "Smart Contract Escrow",
      amount: 0,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(40000 + Math.random() * 10000)
    };
    setTransactions(prev => [newTx, ...prev]);

    addToast(`You accepted Job #${jobId}. Project is now Active!`, "success");
  };

  // 3. Freelancer Submits Work
  const submitWork = (jobId, githubUrl, ipfsHash, driveUrl, notes) => {
    if (!githubUrl && !ipfsHash && !driveUrl) {
      addToast("Submission failed: Please provide at least one link / hash.", "error");
      return false;
    }

    setJobs(prev => prev.map(job => {
      if (job.id === jobId && (job.status === "Active" || job.status === "NotApproved")) {
        return {
          ...job,
          status: "Submitted",
          deliverables: { githubUrl, ipfsHash, driveUrl, notes },
          history: [
            ...job.history,
            { step: "Submitted", date: getCurrentDate(), title: "Work Submitted for Review", actor: "Freelancer" }
          ],
          lastUpdated: new Date().toISOString()
        };
      }
      return job;
    }));

    // Record TX
    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId,
      action: "Work Submitted",
      from: "Freelancer",
      to: "Smart Contract Escrow",
      amount: 0,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(80000 + Math.random() * 15000)
    };
    setTransactions(prev => [newTx, ...prev]);

    addToast(`Deliverables submitted successfully for Job #${jobId}! Client notified.`, "success");
    return true;
  };

  // 4. Client Approves Work (Releases Funds)
  const approveWork = (jobId, feedback) => {
    let releasedAmount = 0;

    setJobs(prev => prev.map(job => {
      if (job.id === jobId && job.status === "Submitted") {
        releasedAmount = job.amount;
        return {
          ...job,
          status: "Paid",
          clientFeedback: feedback || "Work approved! Outstanding results.",
          history: [
            ...job.history,
            { step: "Approved", date: getCurrentDate(), title: "Work Approved by Client", actor: "Client" },
            { step: "Paid", date: getCurrentDate(), title: "Escrow Released to Freelancer", actor: "Smart Contract Escrow" }
          ],
          lastUpdated: new Date().toISOString()
        };
      }
      return job;
    }));

    // If active session is the freelancer, simulate their balance update
    if (session.role === "freelancer") {
      setSession(prev => ({ ...prev, balance: prev.balance + releasedAmount }));
    }

    // Record TX
    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId,
      action: "Funds Released",
      from: "Smart Contract Escrow",
      to: "Freelancer",
      amount: releasedAmount,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(60000 + Math.random() * 12000)
    };
    setTransactions(prev => [newTx, ...prev]);

    addToast(`Escrow released! ${releasedAmount} ETH paid to Freelancer.`, "success");
  };

  // 5. Client Rejects Work (Request Updates)
  const rejectWork = (jobId, feedback) => {
    if (!feedback) {
      addToast("Rejection failed: Please specify feedback details.", "error");
      return false;
    }

    setJobs(prev => prev.map(job => {
      if (job.id === jobId && job.status === "Submitted") {
        return {
          ...job,
          status: "NotApproved",
          clientFeedback: feedback,
          history: [
            ...job.history,
            { step: "NotApproved", date: getCurrentDate(), title: "Work Rejected & Feedback Sent", actor: "Client" }
          ],
          lastUpdated: new Date().toISOString()
        };
      }
      return job;
    }));

    // Record TX
    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId,
      action: "Work Rejected",
      from: "Client",
      to: "Smart Contract Escrow",
      amount: 0,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(50000 + Math.random() * 10000)
    };
    setTransactions(prev => [newTx, ...prev]);

    addToast(`Work rejected. Requested freelancer updates for Job #${jobId}.`, "warning");
    return true;
  };

  // 6. Raise Dispute
  const raiseDispute = (jobId, reason) => {
    if (!reason) {
      addToast("Escalation failed: Please specify dispute reason.", "error");
      return false;
    }

    setJobs(prev => prev.map(job => {
      if (job.id === jobId && (job.status === "Active" || job.status === "Submitted" || job.status === "NotApproved")) {
        const actorRole = session.role === "client" ? "Client" : "Freelancer";
        return {
          ...job,
          status: "Disputed",
          disputeReason: reason,
          history: [
            ...job.history,
            { step: "Disputed", date: getCurrentDate(), title: "Dispute Escalated to Mediator", actor: actorRole }
          ],
          lastUpdated: new Date().toISOString()
        };
      }
      return job;
    }));

    // Record TX
    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId,
      action: "Dispute Raised",
      from: session.role === "client" ? "Client" : "Freelancer",
      to: "Smart Contract Escrow",
      amount: 0,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(65000 + Math.random() * 10000)
    };
    setTransactions(prev => [newTx, ...prev]);

    addToast(`Job #${jobId} is now locked in DISPUTE. Mediator notified.`, "error");
    return true;
  };

  // 7. Mediator Resolves Dispute
  const resolveDispute = (jobId, freelancerPct, clientPct) => {
    let freelancerShare = 0;
    let clientShare = 0;

    setJobs(prev => prev.map(job => {
      if (job.id === jobId && job.status === "Disputed") {
        freelancerShare = parseFloat(((job.amount * freelancerPct) / 100).toFixed(4));
        clientShare = parseFloat(((job.amount * clientPct) / 100).toFixed(4));

        const isFullyClient = clientPct === 100;
        const finalStatus = isFullyClient ? "Refunded" : "Paid";
        const resolveTitle = `Dispute Resolved: ${freelancerPct}% Freelancer / ${clientPct}% Client`;

        return {
          ...job,
          status: finalStatus,
          disputeSplit: { freelancerPct, clientPct, freelancerShare, clientShare },
          history: [
            ...job.history,
            { step: "Resolved", date: getCurrentDate(), title: resolveTitle, actor: "Mediator" },
            { step: finalStatus, date: getCurrentDate(), title: `Funds Distributed by Arbitrator`, actor: "Smart Contract Escrow" }
          ],
          lastUpdated: new Date().toISOString()
        };
      }
      return job;
    }));

    if (session.role === "freelancer") {
      setSession(prev => ({ ...prev, balance: prev.balance + freelancerShare }));
    } else if (session.role === "client") {
      setSession(prev => ({ ...prev, balance: prev.balance + clientShare }));
    }

    const txHash = generateTxHash();
    const newTx = {
      txHash,
      jobId,
      action: "Dispute Resolved",
      from: "Smart Contract Escrow",
      to: "Freelancer / Client",
      amount: freelancerShare,
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(19900000 + Math.random() * 50000),
      gasUsed: Math.floor(95000 + Math.random() * 15000)
    };
    setTransactions(prev => [newTx, ...prev]);

    addToast(`Dispute resolved! Disbursed ${freelancerShare} ETH to Freelancer & ${clientShare} ETH to Client.`, "success");
    return true;
  };

  return (
    <EscrowContext.Provider
      value={{
        session,
        jobs,
        transactions,
        toasts,
        connectWallet,
        disconnectWallet,
        selectRole,
        clearRole,
        createJob,
        acceptJob,
        submitWork,
        approveWork,
        rejectWork,
        raiseDispute,
        resolveDispute,
        addToast,
        removeToast
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
};

export const useEscrow = () => useContext(EscrowContext);
