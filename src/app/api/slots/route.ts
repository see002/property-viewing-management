import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { CreateSlotInput } from "@/schemas";
import { generateToken, hashToken } from "@/server/security/token";

export async function GET() {
  const slots = await prisma.slot.findMany({
    orderBy: [{ startUtc: "asc" }],
    include: {
      property: true,
      _count: { select: { invites: true } },
      invites: { select: { status: true } },
    },
  });
  const shaped = slots.map((s) => ({
    ...s,
    acceptedCount: s.invites.filter((i) => i.status === "accepted").length,
  }));
  return NextResponse.json({ data: shaped });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CreateSlotInput.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { propertyId, startUtc, endUtc, capacity, invitees } = parsed.data;

    // Overlap check: half-open [start, end), ignoring cancelled
    const overlapping = await prisma.slot.findFirst({
      where: {
        propertyId,
        status: { not: "cancelled" },
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
      },
      select: { id: true },
    });
    if (overlapping) {
      return NextResponse.json({ error: "overlapping slot" }, { status: 409 });
    }

    const created = await prisma.slot.create({
      data: { propertyId, startUtc, endUtc, capacity },
    });

    // Optionally create invites as pending
    if (invitees && invitees.length > 0) {
      for (const email of invitees) {
        const token = generateToken();
        const tokenHash = hashToken(token);
        await prisma.invite.create({
          data: { slotId: created.id, email, status: "pending", tokenHash },
        });
        if (process.env.NODE_ENV !== "production") {
          const qs = `email=${encodeURIComponent(email)}&token=${token}`;
          console.log(`[DEV] Invite link params → ${qs}`);
        }
      }
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
