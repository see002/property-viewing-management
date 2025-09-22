"use client";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { Users, Mail, Undo2, Ban, BadgeCheck, UserPlus, SlidersHorizontal } from "lucide-react";

type Invite = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  respondedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

type SlotDetail = {
  id: string;
  property: { id: string; name: string; address?: string | null };
  startUtc: string;
  endUtc: string;
  capacity: number;
  status: string;
  invites: Invite[];
  _count: { invites: number };
};

type ApiResp = { data: SlotDetail };

export default function SlotDetailPage() {
  const params = useParams<{ slotId: string }>();
  const qc = useQueryClient();
  const slotId = params.slotId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["slot", slotId],
    queryFn: () => apiFetch<ApiResp>(`/api/slots/${slotId}`),
  });

  const [capacity, setCapacity] = useState<number | "">("");
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [inviteesError, setInviteesError] = useState<string | null>(null);
  const [inviteActionPending, setInviteActionPending] = useState<Record<string, boolean>>({});

  const patchCapacity = useMutation({
    mutationFn: async () => {
      if (capacity === "") return;
      return apiFetch(`/api/slots/${slotId}`, {
        method: "PATCH",
        body: JSON.stringify({ capacity: Number(capacity) }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slot", slotId] });
    },
  });

  const addInvitees = useMutation({
    mutationFn: async () => {
      const emails = invitees.filter(Boolean);
      if (emails.length === 0) return;
      return apiFetch(`/api/slots/${slotId}/invitees`, {
        method: "POST",
        body: JSON.stringify({ invitees: emails.map((e) => ({ email: e })) }),
      });
    },
    onSuccess: () => {
      setInvitees([]);
      setInviteesError(null);
      qc.invalidateQueries({ queryKey: ["slot", slotId] });
    },
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl space-y-9 px-6 py-9">
        <PageHeader title="Slot Details" description="Loading details" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-token rounded-lg border bg-white p-5">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-token space-y-3 rounded-lg border bg-white p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="ml-auto h-8 w-24" />
          </div>
          <div className="border-token space-y-3 rounded-lg border bg-white p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="ml-auto h-8 w-24" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-token rounded-lg border bg-white p-5">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  if (error || !data?.data) return <div className="p-6">Not found.</div>;

  const slot = data.data;
  const acceptedCount = slot.invites.filter((i) => i.status === "accepted").length;
  const pendingCount = slot.invites.filter((i) => i.status === "pending").length;
  const availableCapacity = Math.max(0, slot.capacity - acceptedCount);
  const isReadOnly = slot.status === "cancelled" || slot.status === "completed";

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function formatTimeRange(startIso: string, endIso: string) {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const st = s.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const et = e.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${st} - ${et}`;
  }
  function statusBadge(status: string) {
    const map: Record<string, string> = {
      scheduled: "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
      active: "bg-[var(--color-success-500)]/10 text-[var(--color-success-500)]",
      full: "bg-[var(--color-warning-500)]/10 text-[var(--color-warning-500)]",
      completed: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
      cancelled: "bg-[var(--color-danger-500)]/10 text-[var(--color-danger-500)]",
    };
    const cls = map[status] ?? "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]";
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${cls}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-6 py-9">
      <PageHeader
        title={slot.property.name}
        description={`${formatDate(slot.startUtc)} • ${formatTimeRange(slot.startUtc, slot.endUtc)} IST`}
      />

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border-token rounded-lg border bg-white p-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <BadgeCheck className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" /> Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-semibold">{statusBadge(slot.status)}</CardContent>
          </div>
          <div className="border-token rounded-lg border bg-white p-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Users className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" /> Accepted / Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-lg text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">
                    <span className="font-medium">{acceptedCount}</span> / {slot.capacity}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
          <div className="border-token rounded-lg border bg-white p-4">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Mail className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" /> Vacancy / Pending
                Invitees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-lg text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">
                    {availableCapacity} / {pendingCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>

        {!isReadOnly && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border-token rounded-lg border bg-white p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" /> Edit
                  Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    min={1}
                    className="w-40"
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder={`${slot.capacity}`}
                  />
                </div>
                {capacityError && <p className="mt-2 text-sm text-red-600">{capacityError}</p>}
                {patchCapacity.error && <p className="mt-2 text-sm text-red-600">Update failed.</p>}
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => {
                      if (
                        capacity === "" ||
                        Number(capacity) < 1 ||
                        Number.isNaN(Number(capacity))
                      ) {
                        setCapacityError("Please enter a valid capacity (>= 1)");
                        return;
                      }
                      if (Number(capacity) < acceptedCount) {
                        setCapacityError(
                          `Capacity cannot be less than accepted attendees (${acceptedCount})`,
                        );
                        return;
                      }
                      setCapacityError(null);
                      patchCapacity.mutate();
                    }}
                    disabled={patchCapacity.isPending}
                    className="cursor-pointer"
                  >
                    {patchCapacity.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </div>

            <div className="border-token rounded-lg border bg-white p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" /> Add Invitees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagInput
                  value={invitees}
                  onChange={setInvitees}
                  placeholder="Type email and press Enter or , to add"
                />
                {inviteesError && <p className="mt-2 text-sm text-red-600">{inviteesError}</p>}
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => {
                      if (invitees.length === 0) {
                        setInviteesError("Please add at least one email");
                        return;
                      }
                      setInviteesError(null);
                      addInvitees.mutate();
                    }}
                    disabled={addInvitees.isPending}
                    className="cursor-pointer"
                  >
                    {addInvitees.isPending ? "Adding…" : "Add"}
                  </Button>
                </div>
                {addInvitees.error && <p className="mt-2 text-sm text-red-600">Add failed.</p>}
              </CardContent>
            </div>
          </div>
        )}

        <div>
          <CardHeader>
            <CardTitle>Invitees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {slot.invites.map((i) => {
                const statusCls =
                  i.status === "accepted"
                    ? "bg-[var(--success-500)]/10 text-[var(--success-500)]"
                    : i.status === "declined"
                      ? "bg-[var(--danger-500)]/10 text-[var(--danger-500)]"
                      : i.status === "revoked"
                        ? "bg-[var(--warning-500)]/10 text-[var(--warning-500)]"
                        : "bg-[var(--primary-50)] text-[var(--primary-700)]";
                return (
                  <div key={i.id} className="border-token rounded-lg border bg-white p-4">
                    <div className="line-clamp-1 flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                        <div className="line-clamp-1 font-medium">{i.email}</div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${statusCls}`}
                      >
                        {i.status}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-1 text-sm text-neutral-600">
                      <span className="text-neutral-500">Name:</span> {i.name ?? "—"}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-neutral-500">
                      <span className="text-neutral-500">Responded at:</span>{" "}
                      {i.respondedAt
                        ? new Date(i.respondedAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZoneName: "short",
                          })
                        : "—"}
                    </div>
                    {!isReadOnly && (
                      <div className="mt-3">
                        {i.status === "revoked" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`cursor-pointer border-[var(--color-warning-500)] text-[var(--color-warning-500)] hover:bg-[var(--color-warning-500)]/10 ${inviteActionPending[i.id] ? "pointer-events-none opacity-60" : ""}`}
                            disabled={!!inviteActionPending[i.id]}
                            onClick={async () => {
                              setInviteActionPending((m) => ({ ...m, [i.id]: true }));
                              try {
                                await apiFetch(`/api/invites/${i.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ status: "pending" }),
                                });
                                qc.invalidateQueries({ queryKey: ["slot", slotId] });
                              } finally {
                                setInviteActionPending((m) => ({ ...m, [i.id]: false }));
                              }
                            }}
                          >
                            <Undo2 className="mr-1 h-4 w-4" /> Revert
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`cursor-pointer border-[var(--color-warning-500)] text-[var(--color-warning-500)] hover:bg-[var(--color-warning-500)]/10 ${inviteActionPending[i.id] ? "pointer-events-none opacity-60" : ""}`}
                            disabled={!!inviteActionPending[i.id]}
                            onClick={async () => {
                              setInviteActionPending((m) => ({ ...m, [i.id]: true }));
                              try {
                                await apiFetch(`/api/invites/${i.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ status: "revoked" }),
                                });
                                qc.invalidateQueries({ queryKey: ["slot", slotId] });
                              } finally {
                                setInviteActionPending((m) => ({ ...m, [i.id]: false }));
                              }
                            }}
                          >
                            <Ban className="mr-1 h-4 w-4" /> Revoke
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
