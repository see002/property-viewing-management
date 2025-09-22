import { z } from "zod";
import { DateTime } from "luxon";
import { SlotStatusEnum } from "./enums";

export const slotId = z.string().cuid();

export const SlotSchema = z.object({
  id: slotId,
  propertyId: z.string().cuid(),
  startUtc: z.date(),
  endUtc: z.date(),
  capacity: z.number().int().min(1),
  status: SlotStatusEnum,
  rescheduleVersion: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Slot = z.infer<typeof SlotSchema>;

export const CreateSlotInput = z
  .object({
    propertyId: z.string().cuid(),
    // Accept ISO strings from JSON and coerce to Date
    startUtc: z.coerce.date(),
    endUtc: z.coerce.date(),
    capacity: z.number().int().min(1).default(1),
    invitees: z.array(z.string().email()).default([]),
  })
  .superRefine((data, ctx) => {
    const start = DateTime.fromJSDate(data.startUtc);
    const end = DateTime.fromJSDate(data.endUtc);

    if (!(start < end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startUtc must be before endUtc",
        path: ["startUtc"],
      });
    }

    const minutes = end.diff(start, "minutes").minutes;
    if (minutes < 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duration must be at least 30 minutes",
        path: ["endUtc"],
      });
    }

    const startIst = start.setZone("Asia/Kolkata");
    const endIst = end.setZone("Asia/Kolkata");
    if (!startIst.hasSame(endIst, "day")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "start/end must be on the same day in Asia/Kolkata",
        path: ["endUtc"],
      });
    }
  });

export const UpdateSlotInput = z
  .object({
    startUtc: z.coerce.date().optional(),
    endUtc: z.coerce.date().optional(),
    capacity: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate temporal rules when both provided
    if (data.startUtc && data.endUtc) {
      const start = DateTime.fromJSDate(data.startUtc);
      const end = DateTime.fromJSDate(data.endUtc);

      if (!(start < end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startUtc must be before endUtc",
          path: ["startUtc"],
        });
      }

      const minutes = end.diff(start, "minutes").minutes;
      if (minutes < 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duration must be at least 30 minutes",
          path: ["endUtc"],
        });
      }

      const startIst = start.setZone("Asia/Kolkata");
      const endIst = end.setZone("Asia/Kolkata");
      if (!startIst.hasSame(endIst, "day")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "start/end must be on the same day in Asia/Kolkata",
          path: ["endUtc"],
        });
      }
    }
  });
