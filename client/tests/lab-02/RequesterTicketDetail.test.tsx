import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequesterTicketDetail from "../../src/components/RequesterTicketDetail";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

const mockRequesters: api.Requester[] = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
];

const mockTicketDetail: api.TicketDetail = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "Laptop battery drains quickly",
  description: "The battery drains from 100% to 0% within 2 hours of light usage.",
  requestedPriority: "MEDIUM",
  currentStatus: "New",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  requester: { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
  category: { id: 2, name: "Hardware" },
  relatedSystem: { id: 7, name: "Corporate Laptop" },
  attachments: [
    {
      id: 10,
      filename: "battery_report.pdf",
      fileSize: 524288,
      mimeType: "application/pdf",
      createdAt: new Date().toISOString(),
      deletedAt: null,
      deletionReason: null,
    },
    {
      id: 11,
      filename: "old_screenshot.png",
      fileSize: 102400,
      mimeType: "image/png",
      createdAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(),
      deletionReason: "Uploaded wrong screenshot",
    },
  ],
};

function renderDetail(ticketId: number = 1, onBack = vi.fn()) {
  return render(
    <RequesterProvider>
      <RequesterTicketDetail ticketId={ticketId} onBack={onBack} />
    </RequesterProvider>
  );
}

describe("Lab 2 - Requester Ticket Detail Component", () => {
  beforeEach(() => {
    cleanup();
    localStorage.setItem("toktickit_requester_id", "1");
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketDetail);
  });

  it("renders ticket details metadata in read-only mode", async () => {
    renderDetail();

    expect(await screen.findByText("TKT-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText(/The battery drains from 100% to 0%/i)).toBeInTheDocument();
    expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
  });

  it("displays active attachments with download and remove options", async () => {
    renderDetail();

    expect(await screen.findByText("battery_report.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
  });

  it("displays soft-removed attachments with Removed badge and reason", async () => {
    renderDetail();

    expect(await screen.findByText("old_screenshot.png")).toBeInTheDocument();
    expect(screen.getByText("Removed")).toBeInTheDocument();
    expect(screen.getByText(/Reason: "Uploaded wrong screenshot"/i)).toBeInTheDocument();
  });

  it("opens soft removal modal and submits removal reason", async () => {
    vi.spyOn(api, "softRemoveAttachment").mockResolvedValue({
      message: "Attachment successfully removed",
      id: 10,
      deletedAt: new Date().toISOString(),
      deletionReason: "No longer relevant report",
    });

    renderDetail();

    const removeBtn = await screen.findByRole("button", { name: /Remove/i });
    await userEvent.click(removeBtn);

    expect(await screen.findByText(/Remove Attachment/i)).toBeInTheDocument();
    const reasonInput = screen.getByPlaceholderText(/Enter reason for removing/i);
    await userEvent.type(reasonInput, "No longer relevant report");

    await userEvent.click(screen.getByRole("button", { name: /Confirm Soft Removal/i }));

    expect(api.softRemoveAttachment).toHaveBeenCalledWith(1, 10, "No longer relevant report");
  });
});
