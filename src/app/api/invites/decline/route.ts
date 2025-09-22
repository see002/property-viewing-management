import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { DeclineInviteInput } from "@/schemas";
import { hashToken } from "@/server/security/token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DeclineInviteInput.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const tokenHash = hashToken(parsed.data.token);
    const invite = await prisma.invite.findFirst({
      where: { email: parsed.data.email, tokenHash },
    });
    if (!invite) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "declined", respondedAt: new Date() },
    });

    return NextResponse.json({ data: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
