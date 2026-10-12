import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRequester } from "../context/RequesterContext";
import {
  fetchRequesterDashboard,
  RequesterDashboardData,
  DashboardTicketItem,
} from "../api";

interface Props {
  onCreateTicketClick?: () => void;
  onViewMyTickets?: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    New: { bg: "#E8F5EE", color: "#0B7A46" },
    Open: { bg: "#EFF6FF", color: "#1D4ED8" },
    "In Progress": { bg: "#FEF3C7", color: "#D97706" },
    "Waiting for Requester": { bg: "#FEF9C3", color: "#B45309" },
    Resolved: { bg: "#D1FAE5", color: "#065F46" },
    Closed: { bg: "#F3F4F6", color: "#6B7280" },
    Reopened: { bg: "#FEE2E2", color: "#DC2626" },
    Cancelled: { bg: "#F3F4F6", color: "#9CA3AF" },
  };
  const style = map[status] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "0.75rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    HIGH: { bg: "#FEE2E2", color: "#DC2626" },
    MEDIUM: { bg: "#FEF3C7", color: "#D97706" },
    LOW: { bg: "#F3F4F6", color: "#6B7280" },
  };
  const style = map[priority] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "0.72rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {priority}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequesterDashboard({ onCreateTicketClick, onViewMyTickets, onSelectTicket }: Props) {
  const { user } = useAuth();
  const { requester } = useRequester();
  const activeUser = user || requester;
  const firstName = activeUser?.name.split(" ")[0] ?? "there";

  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchRequesterDashboard();
      setData(result);
    } catch (e: any) {
      setError(e.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <div
            className="spinner-border"
            role="status"
            style={{ color: "var(--color-primary-green)", width: 36, height: 36 }}
          />
          <p style={{ color: "var(--color-text-muted)", marginTop: 12, fontSize: "0.9rem" }}>
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const recentTickets = data?.recentTickets ?? [];

  const cards = [
    {
      id: "metric-total-open",
      label: "My Open Tickets",
      value: metrics?.totalOpen ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      color: "#0B7A46",
      bg: "#E8F5EE",
    },
    {
      id: "metric-waiting",
      label: "Waiting for My Response",
      value: metrics?.waitingForRequester ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "#D97706",
      bg: "#FEF3C7",
    },
    {
      id: "metric-resolved",
      label: "Resolved",
      value: metrics?.recentlyResolved ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      color: "#059669",
      bg: "#D1FAE5",
    },
    {
      id: "metric-closed",
      label: "Closed",
      value: metrics?.totalClosed ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      ),
      color: "#6B7280",
      bg: "#F3F4F6",
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B7A46 0%, #085C35 100%)",
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 28,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.01em" }}
            data-testid="dashboard-greeting"
          >
            Welcome, {firstName}!
          </h1>
          <p style={{ margin: "6px 0 0", opacity: 0.85, fontSize: "0.95rem" }}>
            Here's the latest on your requests.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          data-testid="dashboard-refresh"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 18px",
            cursor: refreshing ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background 0.2s",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            color: "#DC2626",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: "0.875rem",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
        data-testid="requester-metric-cards"
      >
        {cards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            style={{
              background: "#fff",
              border: "1px solid var(--color-border-subtle, #E5E7EB)",
              borderRadius: 12,
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.2s, transform 0.15s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: card.bg,
                color: card.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div
                style={{ fontSize: "1.75rem", fontWeight: 800, color: card.color, lineHeight: 1 }}
                data-testid={`metric-value-${card.id}`}
              >
                {card.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #6B7280)", marginTop: 4 }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 2-column section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Recent Tickets */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-border-subtle, #E5E7EB)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary, #111827)" }}>
              My Recent Tickets
            </h2>
            {onViewMyTickets && (
              <button
                onClick={onViewMyTickets}
                data-testid="view-all-tickets"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-primary-green, #0B7A46)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                View all →
              </button>
            )}
          </div>

          {recentTickets.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--color-text-muted, #6B7280)",
                fontSize: "0.875rem",
              }}
              data-testid="empty-recent-tickets"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="1.5"
                style={{ marginBottom: 12 }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p style={{ margin: 0 }}>
                You haven't submitted any tickets yet.
                <br />
                Need help?{" "}
                <button
                  onClick={onCreateTicketClick}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary-green, #0B7A46)",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: 0,
                    fontSize: "inherit",
                  }}
                >
                  Create a ticket
                </button>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.8rem" }}>Ticket</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.8rem" }}>Summary</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.8rem" }}>Status</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.8rem" }}>Priority</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.8rem" }}>Updated</th>
                  </tr>
                </thead>
                <tbody data-testid="recent-tickets-list">
                  {recentTickets.map((ticket: DashboardTicketItem, idx: number) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket?.(ticket.id)}
                      data-testid={`recent-ticket-row-${ticket.id}`}
                      style={{
                        borderTop: idx > 0 ? "1px solid #F3F4F6" : "none",
                        cursor: onSelectTicket ? "pointer" : "default",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 16px", color: "#0B7A46", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {ticket.ticketNumber}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#111827", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ticket.summary}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={ticket.currentStatus} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <PriorityBadge priority={ticket.requestedPriority} />
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6B7280", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                        {formatDate(ticket.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-border-subtle, #E5E7EB)",
            borderRadius: 12,
            padding: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
          data-testid="quick-actions"
        >
          <h2 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              id="quick-action-create-ticket"
              onClick={onCreateTicketClick}
              style={{
                background: "var(--color-primary-green, #0B7A46)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#085C35"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0B7A46"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Ticket
            </button>
            <button
              id="quick-action-view-tickets"
              onClick={onViewMyTickets}
              style={{
                background: "#F9FAFB",
                color: "var(--color-text-primary, #111827)",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "12px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#E8F5EE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              📂 View My Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
