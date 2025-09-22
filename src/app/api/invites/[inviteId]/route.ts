import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { z } from "zod";

const PatchSchema = z.object({ status: z.enum(["revoked", "pending"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { status } = parsed.data;
    const { inviteId } = await params;

    const data: {
      status: string;
      updatedAt: Date;
      revokedAt?: Date | null;
      respondedAt?: Date | null;
    } = {
      status,
      updatedAt: new Date(),
    };
    if (status === "revoked") {
      data.revokedAt = new Date();
    } else if (status === "pending") {
      data.revokedAt = null;
      data.respondedAt = null;
    }

    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        status,
        updatedAt: data.updatedAt,
        revokedAt: data.revokedAt,
        respondedAt: data.respondedAt,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
