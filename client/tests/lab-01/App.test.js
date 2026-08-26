import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SystemChecker from "../../src/SystemChecker.js";
import * as api from "../../src/api.js";
describe("App", () => {
    // WORKED EXAMPLE — provided for you.
    it("renders the TokTickIT heading", () => {
        render(_jsx(SystemChecker, {}));
        expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    });
    it("shows Online and the seeded categories on success", async () => {
        vi.spyOn(api, "checkSystem").mockResolvedValue({
            online: true,
            categories: [
                { id: 1, name: "Account and Access" },
                { id: 2, name: "Hardware" },
            ],
        });
        render(_jsx(SystemChecker, {}));
        await userEvent.click(screen.getByRole("button", { name: /check system/i }));
        expect(await screen.findByText("Online")).toBeInTheDocument();
        expect(screen.getByText("Account and Access")).toBeInTheDocument();
        expect(screen.getByText("Hardware")).toBeInTheDocument();
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Network error"));
        render(_jsx(SystemChecker, {}));
        await userEvent.click(screen.getByRole("button", { name: /check system/i }));
        expect(await screen.findByText("Offline")).toBeInTheDocument();
        expect(screen.getByText("Network error")).toBeInTheDocument();
    });
});
