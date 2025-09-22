import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json({ data: properties });
}
