import { z } from "zod";

export const propertyId = z.string().cuid();

export const PropertySchema = z.object({
  id: propertyId,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  timezone: z.string().min(1).default("Asia/Kolkata"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Property = z.infer<typeof PropertySchema>;

// Payloads
export const CreatePropertyInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  timezone: z.string().min(1).default("Asia/Kolkata"),
});

export const UpdatePropertyInput = CreatePropertyInput.partial();
