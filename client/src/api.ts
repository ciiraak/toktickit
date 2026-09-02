const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface Requester {
  id: number;
  name: string;
  email: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) throw new Error("Health check failed");

  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

export async function fetchRequesters(): Promise<Requester[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) {
    throw new Error("Failed to fetch active development requesters");
  }
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

export async function fetchSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/systems`);
  if (!res.ok) {
    throw new Error("Failed to fetch related systems");
  }
  return res.json();
}

export interface CreatedTicket {
  id: number;
  ticketNumber: string;
  currentStatus: string;
  requestedPriority: string;
  summary: string;
  description: string;
  createdAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  attachments: { id: number; filename: string; fileSize: number; mimeType: string }[];
}

export async function createTicket(
  requesterId: number,
  data: {
    summary: string;
    description: string;
    categoryId: number;
    relatedSystemId: number;
    requestedPriority: string;
    attachments: File[];
  }
): Promise<CreatedTicket> {
  const formData = new FormData();
  formData.append("summary", data.summary);
  formData.append("description", data.description);
  formData.append("categoryId", String(data.categoryId));
  formData.append("relatedSystemId", String(data.relatedSystemId));
  formData.append("requestedPriority", data.requestedPriority);
  for (const file of data.attachments) {
    formData.append("attachments", file);
  }

  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: { "x-requester-id": String(requesterId) },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    const details = body.details ? ` ${(body.details as string[]).join(" ")}` : "";
    throw new Error(`${body.error}${details}`);
  }
  return res.json();
}

