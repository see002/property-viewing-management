# Property Viewing Slot Management System

Airbnb-inspired property viewing slot manager with admin and invitee flows. Built with Next.js App Router, TypeScript, TailwindCSS, Prisma (SQLite), and a modern UI stack.

## Overview

This app lets admins create and manage property viewing slots, invite attendees via secure token links, and track attendance. Invitees can accept or decline directly from their invite link.

## Product Flows (PRD)

- Admin
  - Slots dashboard: `/slots`
    - Card grid with status badges; sorted Active → Scheduled → Full → Cancelled → Completed
    - Filters: Status, Property, Time (Today/This week/This month/Past)
    - Skeletons during load
  - Create slot: `/slots/create`
    - Single date + start/end time inputs; Zod validations (same-day IST, ≥30 mins, start < end, start ≥ now+15m if today)
    - Capacity control
    - Invitee TagInput (emails), tokens generated and stored as hashes
    - Success toast and form reset
  - Slot detail: `/slots/[slotId]`
    - Status, Accepted/Capacity card, Vacancy/Pending card (status-colored progress)
    - Edit Capacity with client/server validation: cannot go below accepted
    - Add Invitees via TagInput
    - Invitee cards with status badges; Revoke/Revert (pending) actions when slot is not Cancelled/Completed
    - Timestamps include timezone
- Invitee
  - Invite link landing: `/invite?email=...&token=...`
    - Property and slot details with timezone
    - Invite status badge; flags for full/expired/revoked
    - Respond (Accept/Decline) with disabled states while pending

## Tech Stack

- Framework: Next.js 15 (App Router), TypeScript (strict)
- Styling: TailwindCSS, custom design tokens, Radix UI icons (lucide-react)
- Data: Prisma ORM + SQLite
- Validation: Zod, React Hook Form
- Data fetching: TanStack Query (React Query)
- State: Zustand (UI filters/modals)
- Dates: Luxon (server-side validations), native date formatting client-side
- Tooling: ESLint, Prettier, Husky, pnpm

## Database & Integrity Rules

- Models: Property, Slot, Invite
- Enums: SlotStatus (scheduled, full, active, completed, cancelled), InviteStatus (pending, accepted, declined, revoked, needs_reconfirm)
- Constraints & Triggers (SQLite):
  - Slot: startUtc < endUtc; duration ≥ 30 min; same local day (IST); capacity ≥ 1; no-overlap per property (exclude cancelled)
  - Invite accept gates: capacity and time verified using `julianday()` comparisons
  - Reschedules flag invites as needs_reconfirm
- Tokens: secure random tokens generated per invite, only tokenHash stored

## Getting Started (Local Setup)

Prerequisites:

- Node.js 20+
- pnpm 10+

Clone & install:

```bash
git clone https://github.com/see002/property-viewing-management.git
cd property-viewing-management
pnpm install
```

Environment:

```bash
cp .env.example .env  # if available; otherwise create .env
```

Add:

```
DATABASE_URL="file:./prisma/dev.db"
```

Prisma & DB:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

Run dev server:

```bash
pnpm dev
# open http://localhost:3000
```

Invite link (dev): After creating a slot with invitees, the email and token can be read from the server terminal output. You can open the invite page directly using the query params:

- Open: `http://localhost:3000/invite?email=<EMAIL>&token=<TOKEN>`
- Example: `http://localhost:3000/invite?email=aa%40aa.aa&token=JpiiTU7D5Pxti-sxNkE0dgquAW52RWlt8U6A6rdOfIg`

Useful scripts:

- `pnpm prisma:generate` → Generate Prisma client
- `pnpm prisma:migrate` → Apply migrations
- `pnpm prisma:seed` → Seed development data (properties, slots, invites)
- `pnpm prisma:studio` → Open Prisma Studio (GUI DB browser) at `http://localhost:5555` (uses `DATABASE_URL`)
- `pnpm lint` → ESLint
- `pnpm dev` → Start Next.js dev server

## Core Features Walkthrough

### Slots Dashboard (`/slots`)

- Card layout with: property name, date/time, attendees Accepted/Capacity, status badge, and progress bar tinted per status
- Filters: Status, Property, Time (Today/This week/This month/Past)
- Sorting: Active → Scheduled → Full → Cancelled → Completed
- Skeleton UI mirrors final layout

### Create Slot (`/slots/create`)

- Form with Property, Date, Start/End time, Capacity, and Invitees (TagInput)
- Client validations (Zod):
  - Required fields with friendly messages
  - End ≥ Start + 30m; Start ≥ now + 15m if date is today; same local date (IST)
- On success: toast appears, form resets, focus returns to Property

### Slot Detail (`/slots/[slotId]`)

- Cards: Status; Accepted/Capacity; Vacancy/Pending
- Vacancy/Pending progress bar uses status color mapping
- Edit Capacity: client check (≥ accepted) and server enforcement
- Add Invitees: TagInput; tokens generated; dev console logs invite link params
- Invitee cards: status badges, respondedAt with timezone, Revoke/Revert (pending) actions; disabled visuals during requests
- For Cancelled/Completed: edit/add actions hidden; invitee CTAs removed

### Invite Landing (`/invite`)

- Two-column layout (75/25 on desktop): Slot Details | Respond
- Status badge (accepted/pending/declined/revoked/needs_reconfirm)
- Accept/Decline buttons with pending disabled states and success reload
- Friendly error and skeleton states

## API Endpoints

- Slots
  - GET `/api/slots` → list with property, counts, acceptedCount
  - POST `/api/slots` → create slot (validates overlap, generates invites)
  - GET `/api/slots/[slotId]` → slot detail (property, invites, counts)
  - PATCH `/api/slots/[slotId]` → update slot (capacity validation ≥ accepted)
  - DELETE `/api/slots/[slotId]` → delete slot
  - POST `/api/slots/[slotId]/invitees` → add invitees (tokenized)
- Invites
  - GET `/api/invites/status?email&token` → invite status + flags/actions
  - POST `/api/invites/accept` → accept with capacity gate
  - POST `/api/invites/decline` → decline
  - PATCH `/api/invites/[inviteId]` → revert to pending or revoke

## Developer Notes

- Linting: `pnpm lint` (strict, no warnings)
- Formatting: Prettier configured
- Husky: pre-commit hooks (if enabled)
- Design tokens in `src/app/globals.css` (colors, shadows, radius)
- UI primitives in `src/components/ui` (Button, Card, Select, Progress, Skeleton, etc.)
- State in `src/stores/ui.ts`
- Prisma schema and migrations in `prisma/`

## Troubleshooting

- DATABASE_URL errors during seed/migrate → ensure `.env` exists, run from project root
- Foreign key/trigger errors on seed → SQLite triggers enforce overlap/time/capacity; data must satisfy constraints
- Dynamic route params warning → ensure `params` is awaited in API route handlers

## License

MIT
