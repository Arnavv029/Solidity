import React, { useState } from "react";
import { EscrowProvider, useEscrow } from "./context/EscrowContext";
import { Navbar } from "./components/Navbar";
import { LandingView } from "./components/LandingView";
import { ClientView } from "./components/ClientView";
import { FreelancerView } from "./components/FreelancerView";
import { MediatorView } from "./components/MediatorView";
import { ActivityView } from "./components/ActivityView";
import { JobDetailsModal } from "./components/JobDetailsModal";
import { ToastContainer } from "./components/Toast";

function MainLayout() {
  const [currentTab, setCurrentTab] = useState("landing");
  const [selectedDetailsJobId, setSelectedDetailsJobId] = useState(null);

  const renderContent = () => {
    switch (currentTab) {
      case "landing":
        return <LandingView setCurrentTab={setCurrentTab} />;
      case "client":
        return <ClientView onViewDetails={setSelectedDetailsJobId} />;
      case "freelancer":
        return <FreelancerView onViewDetails={setSelectedDetailsJobId} />;
      case "mediator":
        return <MediatorView onViewDetails={setSelectedDetailsJobId} />;
      case "activity":
        return <ActivityView />;
      default:
        return <LandingView setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      {/* Content wrapper */}
      <main className="flex-1 w-full relative z-10">
        {renderContent()}
      </main>

      {/* Details visual step modal */}
      {selectedDetailsJobId && (
        <JobDetailsModal
          jobId={selectedDetailsJobId}
          onClose={() => setSelectedDetailsJobId(null)}
        />
      )}

      {/* Notifications system */}
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <EscrowProvider>
      <MainLayout />
    </EscrowProvider>
  );
}

export default App;
