import { PrismaClient } from "@prisma/client";
import { Express } from "express";

// Allowed MIME types per BR-06
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

// Max file size per BR-07: 5 MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Generates the next unique ticket number in the format TKT-YYYY-XXXXXX (BR-01).
 * Uses the current year and counts all existing tickets to derive the next sequence.
 */
export async function generateTicketNumber(prisma: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count();
  const sequence = String(count + 1).padStart(6, "0");
  return `TKT-${year}-${sequence}`;
}

/**
 * Validates a single uploaded file against BR-06 (type) and BR-07 (size).
 * Returns an error string if invalid, or null if valid.
 */
export function validateAttachmentFile(file: Express.Multer.File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return `File "${file.originalname}" has an unsupported type (${file.mimetype}). Allowed: JPG, PNG, WEBP, PDF.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `File "${file.originalname}" is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`;
  }
  return null;
}

/**
 * Validates ticket body fields per BR-05.
 * Returns an array of error messages (empty if all valid).
 */
export function validateTicketFields(body: {
  summary?: unknown;
  description?: unknown;
  categoryId?: unknown;
  relatedSystemId?: unknown;
  requestedPriority?: unknown;
}): string[] {
  const errors: string[] = [];

  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  if (!summary) {
    errors.push("Summary is required.");
  } else if (summary.length < 10) {
    errors.push("Summary must be at least 10 characters long.");
  } else if (summary.length > 100) {
    errors.push("Summary must be at most 100 characters long.");
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    errors.push("Description is required.");
  } else if (description.length < 20) {
    errors.push("Description must be at least 20 characters long.");
  } else if (description.length > 1000) {
    errors.push("Description must be at most 1000 characters long.");
  }

  const categoryId = Number(body.categoryId);
  if (!categoryId || isNaN(categoryId)) {
    errors.push("Category is required.");
  }

  const relatedSystemId = Number(body.relatedSystemId);
  if (!relatedSystemId || isNaN(relatedSystemId)) {
    errors.push("Related System is required.");
  }

  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  const priority = typeof body.requestedPriority === "string" ? body.requestedPriority : "";
  if (!validPriorities.includes(priority)) {
    errors.push(`Requested Priority must be one of: ${validPriorities.join(", ")}.`);
  }

  return errors;
}
