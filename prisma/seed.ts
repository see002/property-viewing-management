import { PrismaClient, InviteStatus, SlotStatus } from "@/generated/prisma";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

function makeIstTimes(daysFromNow: number, hour: number, minute: number, durationMinutes: number) {
  const startIst = DateTime.now()
    .setZone("Asia/Kolkata")
    .plus({ days: daysFromNow })
    .set({ hour, minute, second: 0, millisecond: 0 });
  const endIst = startIst.plus({ minutes: durationMinutes });
  return { startUtc: startIst.toUTC().toJSDate(), endUtc: endIst.toUTC().toJSDate() };
}

async function main() {
  const refs = {
    s1: [] as string[],
    s2: [] as string[],
    f: [] as string[],
    a: [] as string[],
    c: [] as string[],
    x: [] as string[],
  };

  await prisma.$transaction(async (tx) => {
    // Clean slate
    await tx.invite.deleteMany();
    await tx.slot.deleteMany();
    await tx.property.deleteMany();

    // 10 India-based properties
    const cities = [
      { name: "Mumbai 2BHK near Marine Drive", addr: "Marine Drive, Mumbai" },
      { name: "Delhi DDA Flat in Saket", addr: "Saket, New Delhi" },
      { name: "Bengaluru Indiranagar Apt", addr: "Indiranagar, Bengaluru" },
      { name: "Chennai Besant Nagar Home", addr: "Besant Nagar, Chennai" },
      { name: "Hyderabad Hitec City Studio", addr: "Hitec City, Hyderabad" },
      { name: "Pune Kalyani Nagar Condo", addr: "Kalyani Nagar, Pune" },
      { name: "Kolkata Salt Lake House", addr: "Salt Lake, Kolkata" },
      { name: "Ahmedabad SG Highway Flat", addr: "SG Highway, Ahmedabad" },
      { name: "Jaipur Vaishali Nagar Villa", addr: "Vaishali Nagar, Jaipur" },
      { name: "Kochi Marine Drive View", addr: "Marine Drive, Kochi" },
    ];

    const properties: { id: string; name: string }[] = [];
    for (const c of cities) {
      const p = await tx.property.create({
        data: {
          name: c.name,
          description: `Listing in ${c.addr}`,
          address: c.addr,
          timezone: "Asia/Kolkata",
        },
      });
      properties.push({ id: p.id, name: p.name });
    }

    // 20 invites total, each slot >= 3, status mix
    let emailCounter = 1;
    const mkEmail = () => `user${emailCounter++}@example.com`;
    const mkToken = (code: string, idx: number) => `seed_${code}_${idx}`;

    // Scheduled #1
    {
      const { startUtc, endUtc } = makeIstTimes(3, 10, 0, 45);
      const s = await tx.slot.create({
        data: {
          propertyId: properties[0].id,
          startUtc,
          endUtc,
          capacity: 3,
          status: SlotStatus.scheduled,
        },
      });
      const ids: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const inv = await tx.invite.create({
          data: {
            slotId: s.id,
            email: mkEmail(),
            name: `S1 ${i}`,
            tokenHash: mkToken("S1", i),
            status: InviteStatus.pending,
          },
          select: { id: true },
        });
        ids.push(inv.id);
      }
      refs.s1 = ids;
    }

    // Scheduled #2
    {
      const { startUtc, endUtc } = makeIstTimes(5, 11, 30, 60);
      const s = await tx.slot.create({
        data: {
          propertyId: properties[1].id,
          startUtc,
          endUtc,
          capacity: 3,
          status: SlotStatus.scheduled,
        },
      });
      const ids: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const inv = await tx.invite.create({
          data: {
            slotId: s.id,
            email: mkEmail(),
            name: `S2 ${i}`,
            tokenHash: mkToken("S2", i),
            status: InviteStatus.pending,
          },
          select: { id: true },
        });
        ids.push(inv.id);
      }
      refs.s2 = ids;
    }

    // Full
    {
      const { startUtc, endUtc } = makeIstTimes(4, 12, 0, 45);
      const s = await tx.slot.create({
        data: {
          propertyId: properties[2].id,
          startUtc,
          endUtc,
          capacity: 2,
          status: SlotStatus.full,
        },
      });
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const inv = await tx.invite.create({
          data: {
            slotId: s.id,
            email: mkEmail(),
            name: `F ${i}`,
            tokenHash: mkToken("F", i),
            status: InviteStatus.pending,
          },
          select: { id: true },
        });
        ids.push(inv.id);
      }
      refs.f = ids;
    }

    // Active
    {
      const nowIst = DateTime.now().setZone("Asia/Kolkata");
      const startIst = nowIst.minus({ minutes: 15 }).set({ second: 0, millisecond: 0 });
      const endIst = nowIst.plus({ minutes: 30 }).set({ second: 0, millisecond: 0 });
      const s = await tx.slot.create({
        data: {
          propertyId: properties[3].id,
          startUtc: startIst.toUTC().toJSDate(),
          endUtc: endIst.toUTC().toJSDate(),
          capacity: 4,
          status: SlotStatus.active,
        },
      });
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const inv = await tx.invite.create({
          data: {
            slotId: s.id,
            email: mkEmail(),
            name: `A ${i}`,
            tokenHash: mkToken("A", i),
            status: InviteStatus.pending,
          },
          select: { id: true },
        });
        ids.push(inv.id);
      }
      refs.a = ids;
    }

    // Completed
    {
      const yesterdayIst = DateTime.now().setZone("Asia/Kolkata").minus({ days: 1 });
      const startIst = yesterdayIst.set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
      const endIst = startIst.plus({ minutes: 45 });
      const s = await tx.slot.create({
        data: {
          propertyId: properties[4].id,
          startUtc: startIst.toUTC().toJSDate(),
          endUtc: endIst.toUTC().toJSDate(),
          capacity: 3,
          status: SlotStatus.completed,
        },
      });
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const inv = await tx.invite.create({
          data: {
            slotId: s.id,
            email: mkEmail(),
            name: `C ${i}`,
            tokenHash: mkToken("C", i),
            status: InviteStatus.pending,
          },
          select: { id: true },
        });
        ids.push(inv.id);
      }
      refs.c = ids;
    }

    // Cancelled
    {
      const { startUtc, endUtc } = makeIstTimes(6, 14, 0, 45);
      const s = await tx.slot.create({
        data: {
          propertyId: properties[5].id,
          startUtc,
          endUtc,
          capacity: 3,
          status: SlotStatus.cancelled,
        },
      });
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const inv = await tx.invite.create({
          data: {
            slotId: s.id,
            email: mkEmail(),
            name: `X ${i}`,
            tokenHash: mkToken("X", i),
            status: InviteStatus.pending,
          },
          select: { id: true },
        });
        ids.push(inv.id);
      }
      refs.x = ids;
    }
  });

  // Phase 2: status updates after the transaction
  const now = new Date();
  if (refs.s1.length >= 3) {
    await prisma.invite.update({
      where: { id: refs.s1[0]! },
      data: { status: InviteStatus.accepted, respondedAt: now },
    });
    await prisma.invite.update({
      where: { id: refs.s1[1]! },
      data: { status: InviteStatus.accepted, respondedAt: now },
    });
    await prisma.invite.update({
      where: { id: refs.s1[2]! },
      data: { status: InviteStatus.declined, respondedAt: now },
    });
  }
  if (refs.s2.length >= 4) {
    await prisma.invite.update({
      where: { id: refs.s2[0]! },
      data: { status: InviteStatus.accepted, respondedAt: now },
    });
    await prisma.invite.update({
      where: { id: refs.s2[3]! },
      data: { status: InviteStatus.declined, respondedAt: now },
    });
  }
  if (refs.f.length >= 2) {
    await prisma.invite.update({
      where: { id: refs.f[0]! },
      data: { status: InviteStatus.accepted, respondedAt: now },
    });
    await prisma.invite.update({
      where: { id: refs.f[1]! },
      data: { status: InviteStatus.accepted, respondedAt: now },
    });
  }
  if (refs.a.length >= 3) {
    await prisma.invite.update({
      where: { id: refs.a[2]! },
      data: { status: InviteStatus.declined, respondedAt: now },
    });
  }
  if (refs.c.length >= 3) {
    await prisma.invite.update({
      where: { id: refs.c[2]! },
      data: { status: InviteStatus.declined, respondedAt: now },
    });
  }
  if (refs.x.length >= 3) {
    await prisma.invite.update({
      where: { id: refs.x[2]! },
      data: { status: InviteStatus.revoked, revokedAt: now },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
