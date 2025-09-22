import { z } from "zod";

export const SlotStatusEnum = z.enum(["scheduled", "full", "active", "completed", "cancelled"]);

export type SlotStatus = z.infer<typeof SlotStatusEnum>;

export const InviteStatusEnum = z.enum([
  "pending",
  "accepted",
  "declined",
  "revoked",
  "needs_reconfirm",
]);

export type InviteStatus = z.infer<typeof InviteStatusEnum>;
