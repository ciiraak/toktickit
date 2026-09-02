import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import RequesterSelector from "./components/RequesterSelector";
import MyTickets from "./components/MyTickets";
import RequesterTicketDetail from "./components/RequesterTicketDetail";
import CreateTicket from "./components/CreateTicket";
import { CreatedTicket } from "./api";

type Tab = "my-tickets" | "create-ticket";

function MainAppShell() {
  const { requester, clearRequester } = useRequester();
  const [activeTab, setActiveTab] = useState<Tab>("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  function handleTicketCreated(ticket: CreatedTicket) {
    setSuccessBanner(`Ticket ${ticket.ticketNumber} created successfully!`);
    setSelectedTicketId(null);
    setActiveTab("my-tickets");
    setTimeout(() => setSuccessBanner(null), 6000);
  }

  if (!requester) {
    return <RequesterSelector />;
  }

  // Get initials for user avatar
  const initials = requester.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Zen Green Top Header */}
      <header className="app-header">
        <div className="d-flex align-items-center gap-4">
          <div className="brand-title" onClick={() => { setSelectedTicketId(null); setActiveTab("my-tickets"); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>TokTickIT</span>
          </div>

          <nav>
            <ul className="nav-tabs-custom">
              <li>
                <button
                  type="button"
                  className={`nav-tab-item border-0 bg-transparent ${activeTab === "my-tickets" ? "active" : ""}`}
                  onClick={() => { setSelectedTicketId(null); setActiveTab("my-tickets"); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  My Tickets
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-tab-item border-0 bg-transparent ${activeTab === "create-ticket" ? "active" : ""}`}
                  onClick={() => { setSelectedTicketId(null); setActiveTab("create-ticket"); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Ticket
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* User Identity Widget */}
        <div className="user-profile-widget">
          <div className="d-flex align-items-center gap-2">
            <div className="user-avatar-badge">{initials}</div>
            <span className="fw-semibold small d-none d-sm-inline">{requester.name}</span>
          </div>
          <button
            type="button"
            className="btn-change-requester"
            onClick={clearRequester}
            title="Switch Development Requester"
          >
            Change Requester
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container-fluid py-4 px-3 px-md-5 flex-grow-1">
        {activeTab === "my-tickets" && (
          selectedTicketId ? (
            <RequesterTicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
          ) : (
            <div>
              {successBanner && (
                <div className="zen-banner-info mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>{successBanner}</span>
                </div>
              )}
              <MyTickets
                onCreateTicketClick={() => { setSelectedTicketId(null); setActiveTab("create-ticket"); }}
                onSelectTicket={(id) => setSelectedTicketId(id)}
              />
            </div>
          )
        )}

        {activeTab === "create-ticket" && (
          <CreateTicket onSuccess={handleTicketCreated} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainAppShell />
    </RequesterProvider>
  );
}
