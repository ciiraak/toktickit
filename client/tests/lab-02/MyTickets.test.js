import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import * as api from "../../src/api";
const mockRequesters = [
    { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
];
const mockCategories = [
    { id: 1, name: "Account and Access" },
    { id: 2, name: "Hardware" },
];
const mockTickets = [
    {
        id: 1,
        ticketNumber: "TKT-2026-000001",
        summary: "Laptop battery drains quickly",
        requestedPriority: "MEDIUM",
        currentStatus: "New",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { name: "Hardware" },
        relatedSystem: { name: "Corporate Laptop" },
    },
    {
        id: 2,
        ticketNumber: "TKT-2026-000002",
        summary: "Cannot connect to VPN from home",
        requestedPriority: "HIGH",
        currentStatus: "Open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { name: "Network" },
        relatedSystem: { name: "VPN" },
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
describe("Lab 2 - My Tickets Dashboard", () => {
    beforeEach(() => {
        cleanup();
        localStorage.clear();
        localStorage.setItem("toktickit_requester_id", "1");
        vi.restoreAllMocks();
        vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    });
    it("renders empty state card when user has no tickets", async () => {
        vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
            tickets: [],
            pagination: {
                totalItems: 0,
                totalPages: 1,
                currentPage: 1,
                limit: 10,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(App, {}));
        expect(await screen.findByText(/No support tickets yet/i)).toBeInTheDocument();
        expect(screen.getByText(/You haven't submitted any IT support tickets/i)).toBeInTheDocument();
    });
    it("renders ticket list table with tickets and badges when populated", async () => {
        vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
            tickets: mockTickets,
            pagination: mockPagination,
        });
        render(_jsx(App, {}));
        expect((await screen.findAllByText("TKT-2026-000001")).length).toBeGreaterThan(0);
        expect(screen.getAllByText("Laptop battery drains quickly").length).toBeGreaterThan(0);
        expect(screen.getAllByText("TKT-2026-000002").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Cannot connect to VPN from home").length).toBeGreaterThan(0);
        // Check table column headers
        expect(screen.getByText("Summary")).toBeInTheDocument();
    });
    it("renders search input and category/priority/status filter dropdowns", async () => {
        vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
            tickets: mockTickets,
            pagination: mockPagination,
        });
        render(_jsx(App, {}));
        expect(await screen.findByPlaceholderText(/Search by ticket number or summary/i)).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: /Filter by Category/i })).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: /Filter by Priority/i })).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: /Filter by Status/i })).toBeInTheDocument();
    });
    it("shows no matching tickets state when filter returns zero results", async () => {
        vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
            tickets: [],
            pagination: {
                totalItems: 0,
                totalPages: 1,
                currentPage: 1,
                limit: 10,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(App, {}));
        const searchInput = await screen.findByPlaceholderText(/Search by ticket number or summary/i);
        await userEvent.type(searchInput, "nonexistent query");
        expect(await screen.findByText(/No matching tickets found/i)).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /Clear Filters/i }).length).toBeGreaterThan(0);
    });
});
