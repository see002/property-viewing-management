/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    const raw = (data as any)?.error ?? data;
    let msg: string = "request_failed";
    if (typeof raw === "string") msg = raw;
    else if (raw && typeof raw === "object") msg = (raw as any).message ?? JSON.stringify(raw);
    throw new ApiError(msg, res.status, data);
  }
  if (schema) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid response shape");
    }
    return parsed.data;
  }
  return data as T;
}
