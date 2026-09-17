import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StaffTicketQueue from "../../src/components/StaffTicketQueue";

const mockTickets = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    summary: "Laptop battery drains quickly",
    requestedPriority: "HIGH",
    itPriority: null,
    currentStatus: "New",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { name: "Hardware" },
    relatedSystem: { name: "Corporate Laptop" },
    requester: { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
    owner: null,
  },
  {
    id: 2,
    ticketNumber: "TKT-2026-000002",
    summary: "Cannot connect to VPN",
    requestedPriority: "MEDIUM",
    itPriority: null,
    currentStatus: "Open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { name: "Network" },
    relatedSystem: { name: "VPN" },
    requester: { id: 2, name: "Michael Brown", email: "michael.brown@kmutt.ac.th" },
    owner: { id: 6, name: "IT Staff One" },
  },
];

const mockPagination = {
  totalItems: 2,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
};

function mockFetch(tickets = mockTickets, pagination = mockPagination) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ tickets, pagination }),
  } as any);
}

describe("StaffTicketQueue", () => {
  const onSelectTicket = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI-02: renders ticket queue data in table on desktop", async () => {
    mockFetch();
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    await waitFor(() => screen.getAllByText("TKT-2026-000001"));
    expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Laptop battery drains quickly").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TKT-2026-000002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cannot connect to VPN").length).toBeGreaterThan(0);
  });

  it("displays priority badges correctly", async () => {
    mockFetch();
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    await waitFor(() => screen.getAllByText("HIGH"));
    expect(screen.getAllByText("HIGH").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MEDIUM").length).toBeGreaterThan(0);
  });

  it("displays status badges correctly", async () => {
    mockFetch();
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    await waitFor(() => screen.getAllByText("New"));
    const newBadges = screen.getAllByText("New");
    expect(newBadges.length).toBeGreaterThan(0);
    const openBadges = screen.getAllByText("Open");
    expect(openBadges.length).toBeGreaterThan(0);
  });

  it("shows 'Unassigned' for tickets with no owner", async () => {
    mockFetch();
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    await waitFor(() => screen.getAllByText("Unassigned"));
    const unassigned = screen.getAllByText("Unassigned");
    expect(unassigned.length).toBeGreaterThan(0);
  });

  it("shows empty state when no tickets", async () => {
    mockFetch([], { ...mockPagination, totalItems: 0, totalPages: 0 });
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    await waitFor(() => screen.getByText(/no tickets in the queue/i));
  });

  it("shows no-results state when filters return nothing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tickets: [], pagination: { ...mockPagination, totalItems: 0 } }),
    } as any);
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    const searchInput = screen.getByPlaceholderText(/ticket # or summary/i);
    fireEvent.change(searchInput, { target: { value: "xyz" } });
    await waitFor(() => screen.getByText(/no tickets match your filters/i));
  });

  it("calls onSelectTicket when a ticket row is clicked", async () => {
    mockFetch();
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    // Wait for table to render then click the first ticket row
    const ticketNum = await waitFor(() => screen.getAllByText("TKT-2026-000001")[0]);
    fireEvent.click(ticketNum);
    expect(onSelectTicket).toHaveBeenCalledWith(1);
  });

  it("shows error state and retry button when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to load ticket queue" }),
    } as any);
    render(<StaffTicketQueue onSelectTicket={onSelectTicket} />);
    await waitFor(() => screen.getByText(/failed to load ticket queue/i));
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
