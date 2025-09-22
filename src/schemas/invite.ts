import { z } from "zod";
import { InviteStatusEnum } from "./enums";

export const inviteId = z.string().cuid();

export const InviteSchema = z.object({
  id: inviteId,
  slotId: z.string().cuid(),
  email: z.string().email(),
  name: z.string().max(200).optional().nullable(),
  tokenHash: z.string().min(1),
  status: InviteStatusEnum,
  respondedAt: z.date().optional().nullable(),
  revokedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Invite = z.infer<typeof InviteSchema>;

export const AcceptInviteInput = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  name: z.string().max(200).optional(),
});

export const DeclineInviteInput = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

export const AddInviteesInput = z.object({
  slotId: z.string().cuid(),
  invitees: z
    .array(z.object({ email: z.string().email(), name: z.string().max(200).optional() }))
    .min(1),
});
