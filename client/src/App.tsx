import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequesterSelector from "./components/RequesterSelector";
import Login from "./components/Login";
import ChangePasswordScreen from "./components/ChangePasswordScreen";
import MyTickets from "./components/MyTickets";
import RequesterTicketDetail from "./components/RequesterTicketDetail";
import CreateTicket from "./components/CreateTicket";
import StaffTicketQueue from "./components/StaffTicketQueue";
import StaffTicketDetail from "./components/StaffTicketDetail";
import AdminUserManagement from "./components/AdminUserManagement";
import { CreatedTicket } from "./api";

type Tab = "my-tickets" | "create-ticket" | "staff-queue" | "admin-users";

function AppShell() {
  const { user, loading: authLoading, logout } = useAuth();
  const { requester, clearRequester } = useRequester();

  const [activeTab, setActiveTab] = useState<Tab>("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedStaffTicketId, setSelectedStaffTicketId] = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "requester">(() => {
    if (typeof window !== "undefined" && window.location.search.includes("mode=login")) {
      return "login";
    }
    return "requester";
  });

  function handleTicketCreated(ticket: CreatedTicket) {
    setSuccessBanner(`Ticket ${ticket.ticketNumber} created successfully!`);
    setSelectedTicketId(null);
    setActiveTab("my-tickets");
    setTimeout(() => setSuccessBanner(null), 6000);
  }

  // 1. Loading state
  if (authLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status"></div>
          <p className="text-muted small">Loading TokTickIT...</p>
        </div>
      </div>
    );
  }

  // 2. If authenticated user requires first-login password change -> mandatory interstitial (BR-02)
  if (user && user.requiresPasswordChange) {
    return <ChangePasswordScreen />;
  }

  // 3. If neither real user nor dev requester is selected -> Auth Screen
  if (!user && !requester) {
    return (
      <div className="min-vh-100 bg-light d-flex flex-column">
        <div className="container py-3 d-flex justify-content-end">
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className={`btn ${authMode === "login" ? "btn-success" : "btn-outline-secondary"}`}
              onClick={() => setAuthMode("login")}
            >
              Sign In (Lab 3)
            </button>
            <button
              type="button"
              className={`btn ${authMode === "requester" ? "btn-success" : "btn-outline-secondary"}`}
              onClick={() => setAuthMode("requester")}
            >
              Dev Requester (Lab 2)
            </button>
          </div>
        </div>

        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          {authMode === "login" ? (
            <Login />
          ) : (
            <RequesterSelector />
          )}
        </div>
      </div>
    );
  }

  // Active identity details
  const displayName = user ? user.name : requester!.name;
  const currentUserId = user ? user.id : requester!.id;
  const userRole = user ? user.role : "REQUESTER";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isStaffOrAdmin = userRole === "IT_STAFF" || userRole === "ADMINISTRATOR";
  const isAdmin = userRole === "ADMINISTRATOR";

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Zen Green Top Header */}
      <header className="app-header">
        <div className="d-flex align-items-center gap-4">
          <div
            className="brand-title"
            onClick={() => {
              setSelectedTicketId(null);
              setSelectedStaffTicketId(null);
              setActiveTab("my-tickets");
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
                  onClick={() => {
                    setSelectedTicketId(null);
                    setSelectedStaffTicketId(null);
                    setActiveTab("my-tickets");
                  }}
                  data-testid="nav-my-tickets"
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
                  onClick={() => {
                    setSelectedTicketId(null);
                    setSelectedStaffTicketId(null);
                    setActiveTab("create-ticket");
                  }}
                  data-testid="nav-create-ticket"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Ticket
                </button>
              </li>

              {isStaffOrAdmin && (
                <li>
                  <button
                    type="button"
                    className={`nav-tab-item border-0 bg-transparent ${activeTab === "staff-queue" ? "active" : ""}`}
                    onClick={() => {
                      setSelectedTicketId(null);
                      setSelectedStaffTicketId(null);
                      setActiveTab("staff-queue");
                    }}
                    data-testid="nav-staff-queue"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    IT Staff Queue
                  </button>
                </li>
              )}

              {isAdmin && (
                <li>
                  <button
                    type="button"
                    className={`nav-tab-item border-0 bg-transparent ${activeTab === "admin-users" ? "active" : ""}`}
                    onClick={() => {
                      setSelectedTicketId(null);
                      setSelectedStaffTicketId(null);
                      setActiveTab("admin-users");
                    }}
                    data-testid="nav-admin-users"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    User Management
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* User Identity Widget */}
        <div className="user-profile-widget d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="user-avatar-badge">{initials}</div>
            <div className="d-none d-sm-block">
              <div className="fw-semibold small lh-1">{displayName}</div>
              {user && (
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {user.role === "ADMINISTRATOR" ? "Administrator" : user.role === "IT_STAFF" ? "IT Staff" : "Requester"}
                </span>
              )}
            </div>
          </div>

          {user ? (
            <button
              type="button"
              className="btn-change-requester"
              onClick={logout}
              title="Sign Out"
              data-testid="logout-button"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              className="btn-change-requester"
              onClick={clearRequester}
              title="Switch Development Requester"
            >
              Change Requester
            </button>
          )}
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{successBanner}</span>
                </div>
              )}
              <MyTickets
                onCreateTicketClick={() => {
                  setSelectedTicketId(null);
                  setActiveTab("create-ticket");
                }}
                onSelectTicket={(id) => setSelectedTicketId(id)}
              />
            </div>
          )
        )}

        {activeTab === "create-ticket" && (
          <CreateTicket onSuccess={handleTicketCreated} />
        )}

        {activeTab === "staff-queue" && (
          selectedStaffTicketId ? (
            <StaffTicketDetail
              ticketId={selectedStaffTicketId}
              onBack={() => setSelectedStaffTicketId(null)}
              currentUserId={currentUserId}
            />
          ) : (
            <StaffTicketQueue
              onSelectTicket={(id) => setSelectedStaffTicketId(id)}
            />
          )
        )}

        {activeTab === "admin-users" && (
          <AdminUserManagement currentUserId={currentUserId} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <AppShell />
      </RequesterProvider>
    </AuthProvider>
  );
}
