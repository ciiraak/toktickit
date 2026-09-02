import { describe, it, expect, vi } from "vitest";
import { validateAttachmentFile, validateTicketFields, generateTicketNumber } from "../../src/ticketHelpers.js";

describe("Lab 2 - Ticket Helper Unit Tests", () => {
  describe("UNIT-01: generateTicketNumber", () => {
    it("returns ticket number formatted as TKT-YYYY-XXXXXX", async () => {
      const mockPrisma = {
        ticket: {
          count: vi.fn().mockResolvedValue(0),
        },
      } as any;

      const number = await generateTicketNumber(mockPrisma);
      const year = new Date().getFullYear();
      expect(number).toBe(`TKT-${year}-000001`);
    });

    it("pads sequence correctly for 5th ticket", async () => {
      const mockPrisma = {
        ticket: {
          count: vi.fn().mockResolvedValue(4),
        },
      } as any;

      const number = await generateTicketNumber(mockPrisma);
      const year = new Date().getFullYear();
      expect(number).toBe(`TKT-${year}-000005`);
    });
  });

  describe("UNIT-02: validateAttachmentFile", () => {
    it("accepts valid file types under 5MB", () => {
      const validFile = {
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 2 * 1024 * 1024,
      } as Express.Multer.File;

      expect(validateAttachmentFile(validFile)).toBeNull();
    });

    it("rejects unsupported MIME types", () => {
      const invalidFile = {
        originalname: "script.exe",
        mimetype: "application/x-msdownload",
        size: 1024,
      } as Express.Multer.File;

      const err = validateAttachmentFile(invalidFile);
      expect(err).toContain("unsupported type");
    });

    it("rejects files exceeding 5 MB", () => {
      const largeFile = {
        originalname: "big.png",
        mimetype: "image/png",
        size: 6 * 1024 * 1024,
      } as Express.Multer.File;

      const err = validateAttachmentFile(largeFile);
      expect(err).toContain("too large");
    });
  });

  describe("validateTicketFields", () => {
    it("returns empty array for valid fields", () => {
      const validBody = {
        summary: "My laptop battery drains too fast",
        description: "The battery drains from 100% to 0% within 2 hours of light usage.",
        categoryId: "2",
        relatedSystemId: "7",
        requestedPriority: "MEDIUM",
      };

      expect(validateTicketFields(validBody)).toEqual([]);
    });

    it("returns error list for invalid fields", () => {
      const invalidBody = {
        summary: "Short",
        description: "Too short",
        categoryId: "",
        relatedSystemId: "",
        requestedPriority: "INVALID",
      };

      const errors = validateTicketFields(invalidBody);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes("Summary"))).toBe(true);
      expect(errors.some((e) => e.includes("Description"))).toBe(true);
      expect(errors.some((e) => e.includes("Category"))).toBe(true);
      expect(errors.some((e) => e.includes("Related System"))).toBe(true);
      expect(errors.some((e) => e.includes("Requested Priority"))).toBe(true);
    });
  });
});
