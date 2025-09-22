import { randomBytes, createHash } from "crypto";

export function generateToken(byteLength: number = 32): string {
  // URL-safe base64 without padding
  return randomBytes(byteLength)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
