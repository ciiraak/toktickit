import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RequesterDashboard from "../../src/components/RequesterDashboard.tsx";

const mockMetrics = {
  totalOpen: 3,
  waitingForRequester: 1,
  recentlyResolved: 2,
  totalClosed: 5,
};

const mockRecentTickets = [
  {
    id: 14,
    ticketNumber: "TKT-2026-000014",
    summary: "Laptop battery drains quickly",
    requestedPriority: "MEDIUM",
    currentStatus: "In Progress",
    createdAt: "2026-10-12T09:14:00.000Z",
    updatedAt: "2026-10-12T11:00:00.000Z",
  },
  {
    id: 15,
    ticketNumber: "TKT-2026-000015",
    summary: "Email sync not working",
    requestedPriority: "HIGH",
    currentStatus: "New",
    createdAt: "2026-10-12T07:00:00.000Z",
    updatedAt: "2026-10-12T07:05:00.000Z",
  },
];

const mockDashboardData = {
  metrics: mockMetrics,
  recentTickets: mockRecentTickets,
};

describe("RequesterDashboard Component (UI-02 / FR-09 / AC-09)", () => {
  const onCreateTicketClick = vi.fn();
  const onViewMyTickets = vi.fn();
  const onSelectTicket = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardData),
    });
  });

  it("UI-02a: renders the welcome greeting banner", async () => {
    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-greeting")).toBeInTheDocument();
    });
    // greeting always renders (name may be 'there' when no auth provider in unit test)
    expect(screen.getByTestId("dashboard-greeting").textContent).toMatch(/Welcome,/);
  });

  it("UI-02b: renders all 4 metric cards", async () => {
    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("requester-metric-cards")).toBeInTheDocument();
    });

    expect(screen.getByTestId("metric-value-metric-total-open")).toHaveTextContent("3");
    expect(screen.getByTestId("metric-value-metric-waiting")).toHaveTextContent("1");
    expect(screen.getByTestId("metric-value-metric-resolved")).toHaveTextContent("2");
    expect(screen.getByTestId("metric-value-metric-closed")).toHaveTextContent("5");
  });

  it("UI-02c: renders metric card labels", async () => {
    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("My Open Tickets")).toBeInTheDocument();
    });
    expect(screen.getByText("Waiting for My Response")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("UI-02d: renders recent tickets list", async () => {
    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
        onSelectTicket={onSelectTicket}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("recent-tickets-list")).toBeInTheDocument();
    });
    expect(screen.getByText("TKT-2026-000014")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000015")).toBeInTheDocument();
  });

  it("UI-02e: renders empty state when no recent tickets", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          metrics: { totalOpen: 0, waitingForRequester: 0, recentlyResolved: 0, totalClosed: 0 },
          recentTickets: [],
        }),
    });

    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-recent-tickets")).toBeInTheDocument();
    });
    expect(screen.getByTestId("empty-recent-tickets")).toHaveTextContent(
      "You haven't submitted any tickets yet."
    );
  });

  it("UI-02f: renders quick action buttons (Create Ticket + View My Tickets)", async () => {
    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    });
    expect(screen.getByText("Create Ticket")).toBeInTheDocument();
    expect(screen.getByText("📂 View My Tickets")).toBeInTheDocument();
  });

  it("UI-02g: shows refresh button", async () => {
    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-refresh")).toBeInTheDocument();
    });
    expect(screen.getByTestId("dashboard-refresh")).toHaveTextContent("Refresh");
  });

  it("UI-02h: shows error state on fetch failure", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    render(
      <RequesterDashboard
        onCreateTicketClick={onCreateTicketClick}
        onViewMyTickets={onViewMyTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized");
  });
});
