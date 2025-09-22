BEGIN TRANSACTION;

PRAGMA foreign_keys = ON;

-- Create Property table
CREATE TABLE "Property" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "address" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Create Slot table with constraints
CREATE TABLE "Slot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "startUtc" DATETIME NOT NULL,
  "endUtc" DATETIME NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "rescheduleVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,

  CONSTRAINT "Slot_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "chk_slot_time_order"
    CHECK ("startUtc" < "endUtc"),
  CONSTRAINT "chk_slot_min_duration"
    CHECK ((julianday("endUtc") - julianday("startUtc")) >= (30.0 / 1440.0)),
  CONSTRAINT "chk_slot_capacity"
    CHECK ("capacity" >= 1),
  CONSTRAINT "chk_slot_status_values"
    CHECK ("status" IN ('scheduled','full','active','completed','cancelled')),
  CONSTRAINT "chk_slot_same_local_date_ist"
    CHECK (date("startUtc", '+5 hours', '+30 minutes') = date("endUtc", '+5 hours', '+30 minutes'))
);

-- Create Invite table with allowed status set
CREATE TABLE "Invite" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slotId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "respondedAt" DATETIME,
  "revokedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,

  CONSTRAINT "Invite_slotId_fkey"
    FOREIGN KEY ("slotId") REFERENCES "Slot" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "chk_invite_status_values"
    CHECK ("status" IN ('pending','accepted','declined','revoked','needs_reconfirm'))
);

-- Indexes
CREATE INDEX "Slot_propertyId_startUtc_idx" ON "Slot" ("propertyId","startUtc");
CREATE INDEX "Slot_propertyId_endUtc_idx" ON "Slot" ("propertyId","endUtc");
CREATE INDEX "Slot_status_idx" ON "Slot" ("status");

CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite" ("tokenHash");
CREATE INDEX "Invite_email_idx" ON "Invite" ("email");
CREATE INDEX "Invite_status_idx" ON "Invite" ("status");
CREATE UNIQUE INDEX "Invite_slotId_email_key" ON "Invite" ("slotId","email");

-- Half-open no-overlap: [start, end), ignore cancelled
DROP TRIGGER IF EXISTS "slot_no_overlap_insert";
CREATE TRIGGER "slot_no_overlap_insert"
BEFORE INSERT ON "Slot"
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM "Slot" s
      WHERE s."propertyId" = NEW."propertyId"
        AND s."status" != 'cancelled'
        AND NEW."startUtc" < s."endUtc"
        AND NEW."endUtc" > s."startUtc"
    )
    THEN RAISE(ABORT, 'overlapping slot')
  END;
END;

DROP TRIGGER IF EXISTS "slot_no_overlap_update";
CREATE TRIGGER "slot_no_overlap_update"
BEFORE UPDATE OF "startUtc","endUtc","propertyId","status" ON "Slot"
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM "Slot" s
      WHERE s."id" != NEW."id"
        AND s."propertyId" = NEW."propertyId"
        AND s."status" != 'cancelled'
        AND NEW."startUtc" < s."endUtc"
        AND NEW."endUtc" > s."startUtc"
    )
    THEN RAISE(ABORT, 'overlapping slot')
  END;
END;

-- Auto-flag accepted invites to reconfirm when timings change
DROP TRIGGER IF EXISTS "slot_au_times_flag_invites";
CREATE TRIGGER "slot_au_times_flag_invites"
AFTER UPDATE OF "startUtc","endUtc" ON "Slot"
BEGIN
  UPDATE "Invite"
  SET "status" = 'needs_reconfirm',
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "slotId" = NEW."id"
    AND "status" = 'accepted';
END;

-- Accept-time gates: cannot accept after start; enforce capacity
DROP TRIGGER IF EXISTS "invite_bi_accept_gate";
CREATE TRIGGER "invite_bi_accept_gate"
BEFORE INSERT ON "Invite"
WHEN NEW."status" = 'accepted'
BEGIN
  -- Disallow accepting after slot start
  SELECT CASE
    WHEN (
      SELECT julianday("startUtc") <= julianday('now')
      FROM "Slot" WHERE "id" = NEW."slotId"
    )
    THEN RAISE(ABORT, 'cannot accept after slot start')
  END;

  -- Capacity check (only count accepted)
  SELECT CASE
    WHEN (
      SELECT COUNT(*) FROM "Invite" i
      WHERE i."slotId" = NEW."slotId" AND i."status" = 'accepted'
    ) >= (SELECT "capacity" FROM "Slot" WHERE "id" = NEW."slotId")
    THEN RAISE(ABORT, 'slot full')
  END;
END;

DROP TRIGGER IF EXISTS "invite_bu_accept_gate";
CREATE TRIGGER "invite_bu_accept_gate"
BEFORE UPDATE OF "status" ON "Invite"
WHEN NEW."status" = 'accepted'
BEGIN
  -- Disallow accepting after slot start
  SELECT CASE
    WHEN (
      SELECT julianday("startUtc") <= julianday('now')
      FROM "Slot" WHERE "id" = NEW."slotId"
    )
    THEN RAISE(ABORT, 'cannot accept after slot start')
  END;

  -- Capacity check (exclude current row if previously accepted)
  SELECT CASE
    WHEN (
      SELECT COUNT(*) FROM "Invite" i
      WHERE i."slotId" = NEW."slotId"
        AND i."status" = 'accepted'
        AND i."id" != NEW."id"
    ) >= (SELECT "capacity" FROM "Slot" WHERE "id" = NEW."slotId")
    THEN RAISE(ABORT, 'slot full')
  END;
END;

COMMIT;
