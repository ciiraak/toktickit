import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchStaffDashboard,
  StaffDashboardData,
  StaffTicketItem,
} from "../api";

interface Props {
  onCreateTicketClick?: () => void;
  onViewQueue?: () => void;
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
        fontSize: "0.73rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
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
        padding: "2px 8px",
        fontSize: "0.7rem",
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketTable({
  tickets,
  onSelectTicket,
  emptyMessage,
  testId,
}: {
  tickets: StaffTicketItem[];
  onSelectTicket?: (id: number) => void;
  emptyMessage: string;
  testId: string;
}) {
  if (tickets.length === 0) {
    return (
      <div
        style={{ padding: "32px 20px", textAlign: "center", color: "#9CA3AF", fontSize: "0.875rem" }}
        data-testid={`${testId}-empty`}
      >
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.78rem" }}>Ticket</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.78rem" }}>Summary</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.78rem" }}>Status</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.78rem" }}>Priority</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.78rem" }}>Requester</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: "0.78rem" }}>Updated</th>
          </tr>
        </thead>
        <tbody data-testid={testId}>
          {tickets.map((ticket, idx) => (
            <tr
              key={ticket.id}
              onClick={() => onSelectTicket?.(ticket.id)}
              data-testid={`${testId}-row-${ticket.id}`}
              style={{
                borderTop: idx > 0 ? "1px solid #F3F4F6" : "none",
                cursor: onSelectTicket ? "pointer" : "default",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
            >
              <td style={{ padding: "11px 14px", color: "#0B7A46", fontWeight: 700, whiteSpace: "nowrap" }}>
                {ticket.ticketNumber}
              </td>
              <td
                style={{
                  padding: "11px 14px",
                  color: "#111827",
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ticket.summary}
              </td>
              <td style={{ padding: "11px 14px" }}>
                <StatusBadge status={ticket.currentStatus} />
              </td>
              <td style={{ padding: "11px 14px" }}>
                <PriorityBadge priority={ticket.itPriority ?? ticket.requestedPriority} />
              </td>
              <td style={{ padding: "11px 14px", color: "#374151", whiteSpace: "nowrap" }}>
                {ticket.requesterName}
              </td>
              <td style={{ padding: "11px 14px", color: "#6B7280", whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                {formatDate(ticket.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StaffDashboard({ onCreateTicketClick, onViewQueue, onSelectTicket }: Props) {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchStaffDashboard();
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
            style={{ color: "var(--color-primary-green, #0B7A46)", width: 36, height: 36 }}
          />
          <p style={{ color: "#6B7280", marginTop: 12, fontSize: "0.9rem" }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const urgentTickets = data?.urgentTickets ?? [];
  const recentTickets = data?.recentTickets ?? [];

  const metricCards = [
    {
      id: "metric-new",
      label: "New",
      value: metrics?.new ?? 0,
      color: "#0B7A46",
      bg: "#E8F5EE",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      id: "metric-open",
      label: "Open",
      value: metrics?.open ?? 0,
      color: "#1D4ED8",
      bg: "#EFF6FF",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      id: "metric-in-progress",
      label: "In Progress",
      value: metrics?.inProgress ?? 0,
      color: "#D97706",
      bg: "#FEF3C7",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: "metric-waiting",
      label: "Waiting for Requester",
      value: metrics?.waitingForRequester ?? 0,
      color: "#B45309",
      bg: "#FEF9C3",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="17" y1="11" x2="23" y2="11" />
        </svg>
      ),
    },
    {
      id: "metric-my-assigned",
      label: "My Assigned",
      value: metrics?.myAssigned ?? 0,
      color: "#7C3AED",
      bg: "#EDE9FE",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B7A46 0%, #064E2A 100%)",
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
            Welcome back, {firstName}!
          </h1>
          <p style={{ margin: "6px 0 0", opacity: 0.85, fontSize: "0.95rem" }}>
            Here's what's happening with your queue today.
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

      {/* Metric Cards (5-column grid) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
        data-testid="staff-metric-cards"
      >
        {metricCards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              cursor: "pointer",
              transition: "box-shadow 0.2s, transform 0.15s",
            }}
            onClick={onViewQueue}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
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
                style={{ fontSize: "1.7rem", fontWeight: 800, color: card.color, lineHeight: 1 }}
                data-testid={`metric-value-${card.id}`}
              >
                {card.value}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: 4, lineHeight: 1.3 }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column Bottom Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left: Recent Tickets + Urgent Tickets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Urgent Tickets */}
          {urgentTickets.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #FECACA",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid #FEE2E2",
                  background: "#FFF5F5",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#DC2626" }}>
                  Urgent Tickets ({urgentTickets.length})
                </h2>
              </div>
              <TicketTable
                tickets={urgentTickets}
                onSelectTicket={onSelectTicket}
                emptyMessage="No urgent tickets."
                testId="urgent-tickets"
              />
            </div>
          )}

          {/* Recent Tickets */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                Recent Tickets
              </h2>
              {onViewQueue && (
                <button
                  onClick={onViewQueue}
                  data-testid="view-all-queue"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#0B7A46",
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
            <TicketTable
              tickets={recentTickets}
              onSelectTicket={onSelectTicket}
              emptyMessage="No recent tickets to display."
              testId="recent-tickets"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
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
                background: "#0B7A46",
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
              id="quick-action-search-tickets"
              onClick={onViewQueue}
              style={{
                background: "#F9FAFB",
                color: "#111827",
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              🔍 Search Tickets
            </button>

            <button
              id="quick-action-my-queue"
              onClick={onViewQueue}
              style={{
                background: "#F9FAFB",
                color: "#111827",
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
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              📋 My Queue
            </button>
          </div>

          {/* Unassigned Alert */}
          {(metrics?.unassigned ?? 0) > 0 && (
            <div
              style={{
                marginTop: 20,
                background: "#FFFBEB",
                border: "1px solid #FCD34D",
                borderRadius: 8,
                padding: "12px 14px",
              }}
              data-testid="unassigned-alert"
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#B45309" }}>
                ⚠ {metrics?.unassigned} Unassigned Ticket{(metrics?.unassigned ?? 0) !== 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#92400E", marginTop: 4 }}>
                Tickets awaiting assignment.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
