import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RequesterTicketDetail from "../../src/components/RequesterTicketDetail";
import { RequesterProvider } from "../../src/context/RequesterContext";

const mockTicket = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "Email connection issue on Outlook",
  description: "Unable to authenticate with exchange server after password update.",
  requestedPriority: "MEDIUM",
  currentStatus: "In Progress",
  createdAt: "2026-09-17T08:00:00.000Z",
  updatedAt: "2026-09-17T09:00:00.000Z",
  requester: { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
  category: { id: 1, name: "Email" },
  relatedSystem: { id: 1, name: "Exchange" },
  attachments: [],
  comments: [
    {
      id: 101,
      content: "Initial staff assessment in progress.",
      createdAt: "2026-09-17T08:30:00.000Z",
      author: { id: 2, name: "Sarah Staff", role: "IT_STAFF" },
    },
  ],
};

const mockRequesters = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
];

describe("RequesterTicketDetail - Public Comments & Problem Appears Resolved (BR-05 / FR-04)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem("toktickit_requester_id", "1");
  });

  function setupFetch(ticket = mockTicket) {
    global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/requesters")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRequesters),
        });
      }
      if (url.includes("/api/tickets/1/public-comments") && options?.method === "POST") {
        const body = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 999,
              content: body.content,
              createdAt: new Date().toISOString(),
              author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
            }),
        });
      }
      if (url.includes("/api/tickets/1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(ticket),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  }

  it("renders live public comments from ticket data", async () => {
    setupFetch();
    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Public Comments & Work Log")).toBeInTheDocument();
    });

    expect(screen.getByText("Initial staff assessment in progress.")).toBeInTheDocument();
    expect(screen.getByText(/Sarah Staff/)).toBeInTheDocument();
  });

  it("allows requester to post a public comment", async () => {
    setupFetch();
    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write a public comment/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Write a public comment/i);
    fireEvent.change(input, { target: { value: "I tried clearing credentials but still failing." } });

    fireEvent.click(screen.getByRole("button", { name: /Post Comment/i }));

    await waitFor(() => {
      expect(screen.getByText("I tried clearing credentials but still failing.")).toBeInTheDocument();
    });
  });

  it("allows requester to click 'Problem Appears Resolved' action (BR-05)", async () => {
    setupFetch();
    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Problem Appears Resolved/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Problem Appears Resolved/i }));

    await waitFor(() => {
      expect(screen.getByText(/IT Staff has been notified/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Requester indicated that the problem appears resolved.")).toBeInTheDocument();
  });
});
