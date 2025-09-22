import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { hashToken } from "@/server/security/token";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email") ?? "";
    const token = req.nextUrl.searchParams.get("token") ?? "";
    if (!email || !token) return NextResponse.json({ error: "missing_params" }, { status: 400 });

    const tokenHash = hashToken(token);
    const invite = await prisma.invite.findFirst({
      where: { email, tokenHash },
      include: {
        slot: {
          include: {
            property: true,
            _count: { select: { invites: { where: { status: "accepted" } } } },
          },
        },
      },
    });
    if (!invite) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

    const now = new Date();
    const slot = invite.slot;
    const acceptedCount = await prisma.invite.count({
      where: { slotId: slot.id, status: "accepted" },
    });
    const isExpired = slot.startUtc <= now;
    const isFull = acceptedCount >= slot.capacity && invite.status !== "accepted";
    const isRevoked = invite.status === "revoked";

    const acceptAllowed = !isExpired && !isFull && !isRevoked && invite.status !== "accepted";
    const declineAllowed = !isExpired && !isRevoked && invite.status !== "declined";

    return NextResponse.json({
      data: {
        invite: {
          id: invite.id,
          email: invite.email,
          name: invite.name,
          status: invite.status,
          respondedAt: invite.respondedAt,
          revokedAt: invite.revokedAt,
        },
        slot: {
          id: slot.id,
          startUtc: slot.startUtc,
          endUtc: slot.endUtc,
          capacity: slot.capacity,
          status: slot.status,
          acceptedCount,
        },
        property: {
          id: slot.property.id,
          name: slot.property.name,
          description: slot.property.description,
          address: slot.property.address,
          timezone: slot.property.timezone,
        },
        flags: {
          expired: isExpired,
          full: isFull,
          revoked: isRevoked,
        },
        actions: {
          acceptAllowed,
          declineAllowed,
        },
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
