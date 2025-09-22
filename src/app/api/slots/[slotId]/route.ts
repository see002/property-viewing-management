import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { UpdateSlotInput } from "@/schemas";

type Params = { params: Promise<{ slotId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slotId } = await params;
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      property: true,
      invites: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          respondedAt: true,
          revokedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { invites: true } },
    },
  });
  if (!slot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ data: slot });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { slotId } = await params;
    const json = await req.json();
    const parsed = UpdateSlotInput.safeParse(json);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // If capacity change, ensure not less than accepted invites
    if (parsed.data.capacity !== undefined) {
      const acceptedCount = await prisma.invite.count({ where: { slotId, status: "accepted" } });
      if (parsed.data.capacity < acceptedCount) {
        return NextResponse.json({ error: "capacity_below_accepted" }, { status: 400 });
      }
    }

    const updated = await prisma.slot.update({
      where: { id: slotId },
      data: parsed.data,
    });

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { slotId } = await params;
    const exists = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await prisma.slot.delete({ where: { id: slotId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
