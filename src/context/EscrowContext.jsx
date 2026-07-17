import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import EscrowABI from "../contracts/EscrowABI.json"

const EscrowContext = createContext();

// Network Configuration
const NETWORKS = {
  1: { name: "Ethereum Mainnet", symbol: "ETH", rpcUrl: "https://eth.publicnode.com" },
  11155111: { name: "Sepolia Testnet", symbol: "ETH", rpcUrl: "https://sepolia.infura.io/v3/" },
  31337: { name: "Localhost", symbol: "ETH", rpcUrl: "http://127.0.0.1:8545" },
  137: { name: "Polygon Mainnet", symbol: "MATIC", rpcUrl: "https://polygon-rpc.com" },
  80001: { name: "Polygon Mumbai", symbol: "MATIC", rpcUrl: "https://rpc-mumbai.maticvigil.com" }
};

// Set the correct contract address based on deployment
const CONTRACT_ADDRESSES = {
  11155111: "0x02fA79d6efdD391dF136486e79bb8fda356142dE", // Sepolia
  31337: "0x02fA79d6efdD391dF136486e79bb8fda356142dE",    // Localhost
  137: "0x02fA79d6efdD391dF136486e79bb8fda356142dE",      // Polygon
};

const SUPPORTED_CHAIN_IDS = [11155111, 31337, 137]; // Sepolia, Localhost, Polygon

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
  const [contract, setContract] = useState(null);
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
    networkSupported: false,
    connectionStatus: "idle"
  });

  console.log(session);

  // Helper function to switch network
  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        // Network not in MetaMask, try to add it
        const network = NETWORKS[chainId];
        if (network && chainId !== 1) { // Don't auto-add mainnet
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: { name: network.symbol, symbol: network.symbol, decimals: 18 },
                rpcUrls: [network.rpcUrl]
              }]
            });
            return true;
          } catch (addError) {
            console.error("Failed to add network:", addError);
            return false;
          }
        }
      }
      console.error("Failed to switch network:", error);
      return false;
    }
  };

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
    console.log("updateWalletState() called with address:", address);

    try {
      const network = await browserProvider.getNetwork();
      console.log("Network Info:", { chainId: network.chainId, name: network.name });
      
      const balanceBN = await browserProvider.getBalance(address);
      const walletBalance = parseFloat(formatEther(balanceBN));

      const isNetworkSupported = SUPPORTED_CHAIN_IDS.includes(network.chainId);
      const contractAddress = CONTRACT_ADDRESSES[network.chainId] || CONTRACT_ADDRESSES[11155111];

      console.log("Wallet Balance:", walletBalance, "ETH");
      console.log("Network Supported:", isNetworkSupported);

      setSession((prev) => ({
        ...prev,
        connected: true,
        address,
        walletBalance,
        chainId: network.chainId,
        chainName: network.name || `chain-${network.chainId}`,
        networkSupported: isNetworkSupported,
        connectionStatus: "connected"
      }));

      // Only create contract if network is supported
      if (isNetworkSupported) {
        const signer = await browserProvider.getSigner();
        const escrowContract = new Contract(
          contractAddress,
          EscrowABI.abi,
          signer
        );
        setContract(escrowContract);
        console.log("✅ Contract initialized on supported network");
      } else {
        addToast(`⚠️ Network not supported. Please switch to a supported network (Sepolia, Localhost, or Polygon)`, "warning");
        setContract(null);
      }

      console.log("✅ Connection successful", { address: getShortAddress(address), chainId: network.chainId, chainName: network.name, walletBalance });
    } catch (error) {
      console.error("❌ Error in updateWalletState:", error);
      addToast("Failed to update wallet state", "error");
    }
  };

  const connectWallet = async () => {
    console.log("🔗 Connect wallet button clicked");

    if (!window.ethereum) {
      console.log("❌ MetaMask not detected");
      addToast("MetaMask not detected. Please install MetaMask to connect.", "error");
      setSession((prev) => ({ ...prev, connectionStatus: "failed" }));
      return;
    }

    setSession((prev) => ({ ...prev, connectionStatus: "connecting" }));

    try {
      // Request accounts
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        console.log("❌ MetaMask connection failed: no accounts returned.");
        addToast("MetaMask connection failed: no accounts returned.", "error");
        setSession((prev) => ({ ...prev, connectionStatus: "failed", connected: false }));
        return;
      }

      const address = accounts[0];
      console.log("✅ Account accessed:", getShortAddress(address));

      const browserProvider = new BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      console.log("📡 Current Network - Chain ID:", network.chainId, "Name:", network.name);

      // Check if network is supported
      if (!SUPPORTED_CHAIN_IDS.includes(network.chainId)) {
        console.log("⚠️ Unsupported network. Attempting to switch to Sepolia...");
        addToast("Unsupported network. Switching to Sepolia Testnet...", "info");
        
        const switched = await switchNetwork(11155111);
        if (!switched) {
          addToast("Failed to switch network. Please manually switch to Sepolia Testnet in MetaMask.", "error");
          setSession((prev) => ({ ...prev, connectionStatus: "failed" }));
          return;
        }
        addToast("✅ Successfully switched to Sepolia Testnet", "success");
      }

      // Get signer and create contract
      const signer = await browserProvider.getSigner();
      const network2 = await browserProvider.getNetwork();
      const contractAddress = CONTRACT_ADDRESSES[network2.chainId] || CONTRACT_ADDRESSES[11155111];

      const contract = new Contract(
        contractAddress,
        EscrowABI.abi,
        signer
      );

      console.log("✅ Contract created at:", contractAddress);
      setContract(contract);
      setEthereumProvider(browserProvider);

      // Update wallet state
      await updateWalletState(browserProvider, address);
      addToast("✅ Wallet connected successfully!", "success");

    } catch (error) {
      console.error("❌ MetaMask connection failed", error);
      const rejected = error?.code === 4001;
      addToast(
        rejected ? "MetaMask connection rejected." : `Connection failed: ${error.message}`,
        "error"
      );
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
    setContract(null);
    setSession((prev) => ({
      ...prev,
      connected: false,
      walletBalance: null,
      address: null,
      chainId: null,
      chainName: null,
      networkSupported: false,
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

    console.log("🔍 MetaMask detected - setting up listeners");
    setSession((prev) => ({ ...prev, connectionStatus: "idle", connected: false }));

    const handleAccountsChanged = async (accounts) => {
      console.log("👤 Account changed:", accounts);
      if (!accounts || accounts.length === 0) {
        console.log("No accounts - disconnecting");
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
      console.log("🔄 Chain changed");
      const provider = ethereumProviderRef.current || new BrowserProvider(window.ethereum);
      if (!ethereumProviderRef.current) {
        setEthereumProvider(provider);
      }
      
      try {
        const network = await provider.getNetwork();
        console.log("New Chain ID:", network.chainId);
        
        if (session.address) {
          await updateWalletState(provider, session.address);
        } else {
          setSession((prev) => ({
            ...prev,
            chainId: network.chainId,
            chainName: network.name || `chain-${network.chainId}`,
            networkSupported: SUPPORTED_CHAIN_IDS.includes(network.chainId)
          }));
        }
      } catch (error) {
        console.error("Error handling chain change:", error);
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
  const createJob = async (
    title,
    description,
    amount,
    deadline,
    requirements,
    freelancer,
    mediator
  ) => {

    if (!contract) {
      addToast("Please connect wallet first", "error");
      return;
    }

    try {

      const tx = await contract.createJob(
        freelancer,
        mediator,
        title,
        description,
        {
          value: parseEther(amount)
        }
      );

      await tx.wait();

      const newJob = {
        id: Date.now(),
        title,
        description,
        amount: Number(amount),
        deadline,
        requirements,
        freelancer,
        mediator,
        status: "Created",
        history: [
          {
            step: "Created",
            date: getCurrentDate(),
            title: "Escrow Created",
            actor: "Client",
          },
        ],
        lastUpdated: new Date().toISOString(),
      };

      setJobs((prev) => [...prev, newJob]);

      return true;

      addToast(
        "Job Created Successfully",
        "success"
      );

    }
    catch (error) {

      console.log(error);

      addToast(
        "Transaction Failed",
        "error"
      );

    }

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
        contract,
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
        removeToast,
        switchNetwork,
        NETWORKS,
        SUPPORTED_CHAIN_IDS
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
};

export const useEscrow = () => useContext(EscrowContext);
