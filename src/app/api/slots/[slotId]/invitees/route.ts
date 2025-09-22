import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { AddInviteesInput } from "@/schemas";
import { generateToken, hashToken } from "@/server/security/token";

type Params = { params: Promise<{ slotId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { slotId } = await params;
    const json = await req.json();
    const parsed = AddInviteesInput.safeParse({ ...json, slotId });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) return NextResponse.json({ error: "slot_not_found" }, { status: 404 });

    let created = 0;

    for (const inv of parsed.data.invitees) {
      const token = generateToken();
      const tokenHash = hashToken(token);
      if (process.env.NODE_ENV !== "production") {
        const qs = `email=${encodeURIComponent(inv.email)}&token=${token}`;
        console.log(`[DEV] Invite link params → ${qs}`);
      }
      // Upsert on composite unique (slotId, email)
      await prisma.invite
        .upsert({
          where: { slotId_email: { slotId, email: inv.email } },
          update: {
            name: inv.name ?? undefined,
            status: "pending",
            tokenHash,
            respondedAt: null,
            revokedAt: null,
          },
          create: {
            slotId,
            email: inv.email,
            name: inv.name,
            status: "pending",
            tokenHash,
          },
        })
        .then(() => {
          // naive: count created vs updated by presence of createdAt==updatedAt equality is unreliable; just try to detect by catching unique conflict
          // Prisma upsert doesn't signal created/updated; ignore fine-grained metrics
          created += 1; // treat as processed
        });
    }

    return NextResponse.json({ ok: true, processed: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
