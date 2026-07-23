/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  const sessionRef = useRef(null);

  // Session state — starts disconnected and role-based only
  const [session, setSession] = useState({
    role: "visitor",
    connected: false,
    balance: 0,
    walletBalance: null,
    address: null,
    chainId: null,
    chainName: null,
    nativeCurrency: "ETH",
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

  // Toast System Emitter
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically clear toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Role Simulation Actions
  const updateWalletState = useCallback(async (browserProvider, address) => {
    console.log("updateWalletState() called with address:", address);

    try {
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);
      const chainName = NETWORKS[chainId]?.name || network.name || `chain-${chainId}`;
      const nativeCurrency = NETWORKS[chainId]?.symbol || "ETH";
      console.log("Network Info:", { chainId, name: chainName });
      
      const balanceBN = await browserProvider.getBalance(address);
      const walletBalance = parseFloat(formatEther(balanceBN));

      const isNetworkSupported = SUPPORTED_CHAIN_IDS.includes(chainId);
      const contractAddress = CONTRACT_ADDRESSES[chainId];

      console.log("Wallet Balance:", walletBalance, nativeCurrency);
      console.log("Network Supported:", isNetworkSupported);

      setSession((prev) => ({
        ...prev,
        connected: true,
        address,
        walletBalance,
        chainId,
        chainName,
        nativeCurrency,
        networkSupported: isNetworkSupported,
        connectionStatus: "connected"
      }));

      if (isNetworkSupported && contractAddress) {
        const signer = await browserProvider.getSigner();
        const escrowContract = new Contract(
          contractAddress,
          EscrowABI.abi,
          signer
        );
        setContract(escrowContract);
        console.log("✅ Contract initialized on supported network");
        return escrowContract;
      }

      if (!isNetworkSupported) {
        addToast(`⚠️ Network not supported. Please switch to a supported network (Sepolia, Localhost, or Polygon).`, "warning");
      }
      setContract(null);
      return null;
    } catch (error) {
      console.error("❌ Error in updateWalletState:", error);
      addToast("Failed to update wallet state", "error");
      return null;
    }
  }, [addToast]);

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
      const chainId = Number(network.chainId);
      const chainName = NETWORKS[chainId]?.name || network.name || `chain-${chainId}`;
      console.log("📡 Current Network - Chain ID:", chainId, "Name:", chainName);

      setEthereumProvider(browserProvider);

      // Update wallet state and always reflect current MetaMask network
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

  const disconnectWallet = useCallback(() => {
    setEthereumProvider(null);
    setContract(null);
    setSession((prev) => ({
      ...prev,
      connected: false,
      walletBalance: null,
      address: null,
      chainId: null,
      chainName: null,
      nativeCurrency: "ETH",
      networkSupported: false,
      connectionStatus: "idle"
    }));
    addToast("Wallet disconnected.", "warning");
  }, [addToast]);

  useEffect(() => {
    ethereumProviderRef.current = ethereumProvider;
  }, [ethereumProvider]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

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

  const parseJob = (jobStruct) => {
    const statusNames = [
      "Created",
      "Active",
      "Submitted",
      "NotApproved",
      "Disputed",
      "Paid",
      "Refunded"
    ];

    return {
      id: Number(jobStruct.id.toString()),
      client: jobStruct.client,
      freelancer: jobStruct.freelancer,
      mediator: jobStruct.mediator,
      amount: Number(formatEther(jobStruct.amount)),
      title: jobStruct.title,
      description: jobStruct.description,
      deliverableHash: jobStruct.deliverableHash,
      status: statusNames[Number(jobStruct.status.toString())] || "Unknown",
      createdAt: new Date(Number(jobStruct.createdAt.toString()) * 1000).toISOString(),
      history: [],
    };
  };

  const mergeJobMetadata = (onchainJob, prevJob) => {
    if (!onchainJob) {
      return prevJob;
    }

    return {
      ...onchainJob,
      deadline: prevJob?.deadline ?? onchainJob.deadline,
      requirements: prevJob?.requirements ?? onchainJob.requirements,
      deliverables: prevJob?.deliverables ?? onchainJob.deliverables,
      clientFeedback: prevJob?.clientFeedback ?? onchainJob.clientFeedback,
      disputeReason: prevJob?.disputeReason ?? onchainJob.disputeReason,
      disputeSplit: prevJob?.disputeSplit ?? onchainJob.disputeSplit,
      history: prevJob?.history ?? onchainJob.history ?? [],
      lastUpdated: prevJob?.lastUpdated ?? onchainJob.lastUpdated ?? new Date().toISOString()
    };
  };

  const addTransactionRecord = (tx, receipt, jobId, action, from, to, amount) => {
    setTransactions((prev) => [
      {
        txHash: tx.hash,
        jobId,
        action,
        from,
        to,
        amount,
        timestamp: new Date().toISOString(),
        blockNumber: receipt.blockNumber,
        gasUsed: Number(receipt.gasUsed?.toString() || 0)
      },
      ...prev
    ]);
  };

  const fetchJobFromContract = useCallback(async (jobId) => {
    if (!contract) {
      return null;
    }

    try {
      const jobStruct = await contract.getJob(jobId);
      return parseJob(jobStruct);
    } catch (error) {
      console.error("Failed to fetch job from contract:", error);
      addToast("Unable to fetch job from contract.", "error");
      return null;
    }
  }, [contract, addToast]);

  const refreshJobsFromContract = useCallback(async () => {
    if (!contract) {
      return;
    }

    try {
      const countBn = await contract.jobCount();
      const count = Number(countBn.toString());

      if (count <= 0) {
        setJobs([]);
        return;
      }

      const fetches = [];
      for (let i = 1; i <= count; i += 1) {
        fetches.push(fetchJobFromContract(i));
      }

      const loadedJobs = (await Promise.all(fetches)).filter(Boolean);
      setJobs(loadedJobs);
    } catch (error) {
      console.error("Failed to refresh jobs from contract:", error);
      addToast("Unable to refresh jobs from blockchain.", "error");
    }
  }, [contract, fetchJobFromContract, addToast]);

  useEffect(() => {
    if (!window.ethereum) {
      console.log("MetaMask not detected");
      return;
    }

    console.log("🔍 MetaMask detected - setting up listeners");

    const normalizeChainId = (chainId) => {
      if (typeof chainId === "string" && chainId.startsWith("0x")) {
        return Number.parseInt(chainId, 16);
      }
      return Number(chainId);
    };

    const handleAccountsChanged = async (accounts) => {
      if (!accounts || accounts.length === 0) {
        console.log("🔌 MetaMask account disconnected");
        disconnectWallet();
        return;
      }

      const address = accounts[0];
      console.log("🔄 MetaMask account changed to", address);

      const browserProvider = ethereumProviderRef.current || new BrowserProvider(window.ethereum);
      if (!ethereumProviderRef.current) {
        setEthereumProvider(browserProvider);
      }
      const updatedContract = await updateWalletState(browserProvider, address);
      if (updatedContract) {
        await refreshJobsFromContract();
      }
    };

    const handleChainChanged = async (chainId) => {
      try {
        const normalizedChainId = normalizeChainId(chainId);
        console.log("🌐 MetaMask chain changed to", normalizedChainId);

        disconnectWallet();
        addToast(
          `Network changed to ${NETWORKS[normalizedChainId]?.name || `chain ${normalizedChainId}`}. Please reconnect.`,
          "warning"
        );
      } catch (error) {
        console.error(error);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet, refreshJobsFromContract, updateWalletState, addToast]);

  const syncJob = useCallback(async (jobId) => {
    const loadedJob = await fetchJobFromContract(jobId);
    if (!loadedJob) {
      return;
    }

    setJobs((prev) => {
      const existing = prev.find((job) => job.id === loadedJob.id);
      const mergedJob = mergeJobMetadata(loadedJob, existing);
      if (existing) {
        return prev.map((job) => (job.id === loadedJob.id ? mergedJob : job));
      }
      return [mergedJob, ...prev];
    });
  }, [fetchJobFromContract]);

  useEffect(() => {
    if (!contract) {
      return;
    }

    const initializeJobs = async () => {
      await refreshJobsFromContract();
    };

    initializeJobs();

    const normalizeId = (jobId) => Number(jobId.toString());

    const handleJobCreated = async (jobId) => {
      await syncJob(normalizeId(jobId));
      addToast(`Job #${normalizeId(jobId)} created on-chain.`, "success");
    };

    const handleJobAccepted = async (jobId) => {
      await syncJob(normalizeId(jobId));
      addToast(`Job #${normalizeId(jobId)} was accepted by the freelancer.`, "success");
    };

    const handleWorkSubmitted = async (jobId) => {
      await syncJob(normalizeId(jobId));
      addToast(`Work submitted for Job #${normalizeId(jobId)}.`, "info");
    };

    const handleWorkRejected = async (jobId, reason) => {
      await syncJob(normalizeId(jobId));
      addToast(`Work rejected for Job #${normalizeId(jobId)}: ${reason}`, "warning");
    };

    const handleFundsReleased = async (jobId) => {
      await syncJob(normalizeId(jobId));
      addToast(`Funds released for Job #${normalizeId(jobId)}.`, "success");
    };

    const handleDisputeRaised = async (jobId) => {
      await syncJob(normalizeId(jobId));
      addToast(`Dispute raised for Job #${normalizeId(jobId)}.`, "error");
    };

    const handleDisputeResolved = async (jobId) => {
      await syncJob(normalizeId(jobId));
      addToast(`Dispute resolved for Job #${normalizeId(jobId)}.`, "success");
    };

    contract.on("JobCreated", handleJobCreated);
    contract.on("JobAccepted", handleJobAccepted);
    contract.on("WorkSubmitted", handleWorkSubmitted);
    contract.on("WorkRejected", handleWorkRejected);
    contract.on("FundsReleased", handleFundsReleased);
    contract.on("DisputeRaised", handleDisputeRaised);
    contract.on("DisputeResolved", handleDisputeResolved);

    return () => {
      contract.off("JobCreated", handleJobCreated);
      contract.off("JobAccepted", handleJobAccepted);
      contract.off("WorkSubmitted", handleWorkSubmitted);
      contract.off("WorkRejected", handleWorkRejected);
      contract.off("FundsReleased", handleFundsReleased);
      contract.off("DisputeRaised", handleDisputeRaised);
      contract.off("DisputeResolved", handleDisputeResolved);
    };
  }, [contract, refreshJobsFromContract, syncJob, addToast]);

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
      return false;
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

      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (e) => e.event === "JobCreated" || e.eventName === "JobCreated"
      );
      let newJobId = event?.args?.jobId?.toNumber();

      if (!newJobId) {
        const countBn = await contract.jobCount();
        newJobId = Number(countBn.toString());
      }

      const localJobMeta = {
        id: newJobId,
        title,
        description,
        amount: Number(amount),
        deadline,
        requirements,
        freelancer,
        mediator,
        status: "Created",
        deliverableHash: "",
        history: [
          {
            step: "Created",
            date: new Date().toISOString(),
            title: "Escrow Created",
            actor: "Client"
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      if (newJobId) {
        setJobs((prev) => [...prev, localJobMeta]);
        await syncJob(newJobId);
      }

      addTransactionRecord(
        tx,
        receipt,
        newJobId,
        "Job Created",
        session.address,
        "Escrow Contract",
        Number(amount)
      );

      addToast("Job created successfully.", "success");
      return true;
    } catch (error) {
      console.error(error);
      addToast("Transaction Failed", "error");
      return false;
    }
  };

  // 2. Freelancer Accepts Job
  const acceptJob = async (jobId) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return false;
    }

    const job = jobs.find((item) => item.id === jobId);
    if (job && session.address) {
      const connected = session.address.toLowerCase();
      const assigned = job.freelancer?.toLowerCase();
      if (assigned && connected !== assigned) {
        addToast(
          `Connected wallet does not match Job #${jobId} freelancer. Use ${getShortAddress(job.freelancer)} or change the job assignment.`,
          "error"
        );
        return false;
      }
    }

    try {
      const tx = await contract.acceptJob(jobId);
      const receipt = await tx.wait();

      await syncJob(jobId);
      addTransactionRecord(tx, receipt, jobId, "Job Accepted", session.address, "Escrow Contract", 0);

      addToast(`You accepted Job #${jobId}. Project is now Active!`, "success");
      return true;
    } catch (error) {
      console.error("acceptJob failed:", error);
      const reason = error?.reason || error?.data?.message || error?.message || "Failed to accept job on contract.";
      addToast(`Failed to accept job on contract: ${reason}`, "error");
      return false;
    }
  };

  // 3. Freelancer Submits Work
  const submitWork = async (jobId, githubUrl, ipfsHash, driveUrl, notes) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return false;
    }

    if (!githubUrl && !ipfsHash && !driveUrl) {
      addToast("Submission failed: Please provide at least one link / hash.", "error");
      return false;
    }

    const deliverableHash = ipfsHash || githubUrl || driveUrl;

    try {
      setJobs((prev) => prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            deliverables: { githubUrl, ipfsHash, driveUrl, notes },
            deliverableHash,
          };
        }
        return job;
      }));

      const tx = await contract.submitWork(jobId, deliverableHash);
      const receipt = await tx.wait();

      await syncJob(jobId);
      addTransactionRecord(tx, receipt, jobId, "Work Submitted", session.address, "Escrow Contract", 0);

      addToast(`Deliverables submitted successfully for Job #${jobId}! Client notified.`, "success");
      return true;
    } catch (error) {
      console.error(error);
      addToast("Failed to submit work on contract.", "error");
      return false;
    }
  };

  // 4. Client Approves Work (Releases Funds)
  const approveWork = async (jobId, feedback) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return false;
    }

    try {
      setJobs((prev) => prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            clientFeedback: feedback || job.clientFeedback,
          };
        }
        return job;
      }));

      const job = jobs.find((item) => item.id === jobId);
      const releasedAmount = job?.amount || 0;

      const tx = await contract.approveWork(jobId);
      const receipt = await tx.wait();

      await syncJob(jobId);
      addTransactionRecord(tx, receipt, jobId, "Funds Released", "Escrow Contract", job?.freelancer || "Freelancer", releasedAmount);

      if (session.role === "freelancer") {
        setSession((prev) => ({ ...prev, balance: prev.balance + releasedAmount }));
      }

      addToast(`Escrow released! ${releasedAmount} ETH paid to Freelancer.`, "success");
      return true;
    } catch (error) {
      console.error(error);
      addToast("Failed to approve work on contract.", "error");
      return false;
    }
  };

  // 5. Client Rejects Work (Request Updates)
  const rejectWork = async (jobId, feedback) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return false;
    }

    if (!feedback) {
      addToast("Rejection failed: Please specify feedback details.", "error");
      return false;
    }

    try {
      const tx = await contract.rejectWork(jobId, feedback);
      const receipt = await tx.wait();

      await syncJob(jobId);
      addTransactionRecord(tx, receipt, jobId, "Work Rejected", session.address, "Escrow Contract", 0);

      addToast(`Work rejected. Requested freelancer updates for Job #${jobId}.`, "warning");
      return true;
    } catch (error) {
      console.error(error);
      addToast("Failed to reject work on contract.", "error");
      return false;
    }
  };

  // 6. Raise Dispute
  const raiseDispute = async (jobId, reason) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return false;
    }

    if (!reason) {
      addToast("Escalation failed: Please specify dispute reason.", "error");
      return false;
    }

    try {
      const tx = await contract.raiseDispute(jobId);
      const receipt = await tx.wait();

      await syncJob(jobId);
      addTransactionRecord(tx, receipt, jobId, "Dispute Raised", session.address, "Escrow Contract", 0);

      addToast(`Job #${jobId} is now locked in DISPUTE. Mediator notified.`, "error");
      return true;
    } catch (error) {
      console.error(error);
      addToast("Failed to raise dispute on contract.", "error");
      return false;
    }
  };

  // 7. Mediator Resolves Dispute
  const resolveDispute = async (jobId, freelancerPct, clientPct) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return false;
    }

    try {
      const job = jobs.find((item) => item.id === jobId);
      const amount = job?.amount || 0;
      const freelancerShare = parseFloat(((amount * freelancerPct) / 100).toFixed(4));
      const clientShare = parseFloat(((amount * clientPct) / 100).toFixed(4));

      const tx = await contract.resolveDispute(jobId, freelancerPct, clientPct);
      const receipt = await tx.wait();

      await syncJob(jobId);
      addTransactionRecord(tx, receipt, jobId, "Dispute Resolved", "Escrow Contract", "Freelancer / Client", freelancerShare + clientShare);

      if (session.role === "freelancer") {
        setSession((prev) => ({ ...prev, balance: prev.balance + freelancerShare }));
      } else if (session.role === "client") {
        setSession((prev) => ({ ...prev, balance: prev.balance + clientShare }));
      }

      addToast(`Dispute resolved! Disbursed ${freelancerShare} ETH to Freelancer & ${clientShare} ETH to Client.`, "success");
      return true;
    } catch (error) {
      console.error(error);
      addToast("Failed to resolve dispute on contract.", "error");
      return false;
    }
  };

  const getJob = async (jobId) => {
    if (!contract) {
      addToast("Please connect wallet first", "error");
      return null;
    }

    return await fetchJobFromContract(jobId);
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
        getJob,
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
