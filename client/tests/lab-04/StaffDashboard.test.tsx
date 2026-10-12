import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import StaffDashboard from "../../src/components/StaffDashboard.tsx";

const mockMetrics = {
  new: 14,
  open: 23,
  inProgress: 18,
  waitingForRequester: 7,
  myAssigned: 5,
  unassigned: 3,
};

const mockUrgentTickets = [
  {
    id: 34,
    ticketNumber: "TKT-2026-000034",
    summary: "Core switch fan failure",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "Open",
    requesterName: "Alice Walker",
    ownerName: "Michael Chang",
    createdAt: "2026-10-12T08:00:00.000Z",
    updatedAt: "2026-10-12T08:15:00.000Z",
  },
];

const mockRecentTickets = [
  {
    id: 35,
    ticketNumber: "TKT-2026-000035",
    summary: "VPN disconnects randomly",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    currentStatus: "In Progress",
    requesterName: "Bob Miller",
    ownerName: null,
    createdAt: "2026-10-12T08:30:00.000Z",
    updatedAt: "2026-10-12T11:45:00.000Z",
  },
];

const mockDashboardData = {
  metrics: mockMetrics,
  urgentTickets: mockUrgentTickets,
  recentTickets: mockRecentTickets,
};

describe("StaffDashboard Component (UI-01 / FR-10 / AC-10)", () => {
  const onCreateTicketClick = vi.fn();
  const onViewQueue = vi.fn();
  const onSelectTicket = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardData),
    });
  });

  it("UI-01a: renders the welcome banner", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-greeting")).toBeInTheDocument();
    });
    // greeting always renders (name may be 'there' when no auth context in tests)
    expect(screen.getByTestId("dashboard-greeting").textContent).toMatch(/Welcome back,/);
  });

  it("UI-01b: renders all 5 metric cards", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("staff-metric-cards")).toBeInTheDocument();
    });

    // Verify metric values render
    expect(screen.getByTestId("metric-value-metric-new")).toHaveTextContent("14");
    expect(screen.getByTestId("metric-value-metric-open")).toHaveTextContent("23");
    expect(screen.getByTestId("metric-value-metric-in-progress")).toHaveTextContent("18");
    expect(screen.getByTestId("metric-value-metric-waiting")).toHaveTextContent("7");
    expect(screen.getByTestId("metric-value-metric-my-assigned")).toHaveTextContent("5");
  });

  it("UI-01c: renders metric card labels", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("staff-metric-cards")).toBeInTheDocument();
    });
    const cards = screen.getByTestId("staff-metric-cards");
    expect(within(cards).getByText("New")).toBeInTheDocument();
    expect(within(cards).getByText("Open")).toBeInTheDocument();
    expect(within(cards).getByText("In Progress")).toBeInTheDocument();
    expect(within(cards).getByText("Waiting for Requester")).toBeInTheDocument();
    expect(within(cards).getByText("My Assigned")).toBeInTheDocument();
  });

  it("UI-01d: renders recent tickets table with ticket data", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("recent-tickets")).toBeInTheDocument();
    });
    expect(screen.getByText("TKT-2026-000035")).toBeInTheDocument();
    expect(screen.getByText("VPN disconnects randomly")).toBeInTheDocument();
  });

  it("UI-01e: renders urgent tickets table", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("urgent-tickets")).toBeInTheDocument();
    });
    expect(screen.getByText("TKT-2026-000034")).toBeInTheDocument();
    expect(screen.getByText("Core switch fan failure")).toBeInTheDocument();
  });

  it("UI-01f: renders quick action buttons", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    });
    expect(screen.getByText("Create Ticket")).toBeInTheDocument();
    expect(screen.getByText("🔍 Search Tickets")).toBeInTheDocument();
    expect(screen.getByText("📋 My Queue")).toBeInTheDocument();
  });

  it("UI-01g: renders unassigned alert when unassigned > 0", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("unassigned-alert")).toBeInTheDocument();
    });
    expect(screen.getByTestId("unassigned-alert")).toHaveTextContent("3 Unassigned Tickets");
  });

  it("UI-01h: shows empty state when no recent tickets", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...mockDashboardData,
          recentTickets: [],
          urgentTickets: [],
        }),
    });

    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("recent-tickets-empty")).toBeInTheDocument();
    });
    expect(screen.getByTestId("recent-tickets-empty")).toHaveTextContent("No recent tickets to display.");
  });

  it("UI-01i: shows refresh button", async () => {
    render(
      <StaffDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewQueue={onViewQueue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-refresh")).toBeInTheDocument();
    });
    expect(screen.getByTestId("dashboard-refresh")).toHaveTextContent("Refresh");
  });
});
