import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { AcceptInviteInput } from "@/schemas";
import { hashToken } from "@/server/security/token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AcceptInviteInput.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const tokenHash = hashToken(parsed.data.token);

    const invite = await prisma.invite.findFirst({
      where: { email: parsed.data.email, tokenHash },
      include: { slot: true },
    });
    if (!invite) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

    // Capacity gate: ensure there is still room
    const acceptedCount = await prisma.invite.count({
      where: { slotId: invite.slotId, status: "accepted" },
    });
    if (acceptedCount >= invite.slot.capacity) {
      return NextResponse.json({ error: "slot_full" }, { status: 409 });
    }

    // Update name if provided
    const nameUpdate = parsed.data.name ? { name: parsed.data.name } : {};

    // Try to set status to accepted; DB trigger enforces time/capacity
    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data: { ...nameUpdate, status: "accepted", respondedAt: new Date() },
    });

    return NextResponse.json({ data: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
