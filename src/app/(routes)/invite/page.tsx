"use client";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Calendar, MapPin, BadgeCheck, AlertTriangle, Ban, Check } from "lucide-react";

type StatusResp = {
  data?: {
    invite: { id: string; email: string; name?: string | null; status: string };
    slot: {
      id: string;
      startUtc: string;
      endUtc: string;
      capacity: number;
      status: string;
      acceptedCount: number;
    };
    property: { id: string; name: string; address?: string | null };
    flags: { expired: boolean; full: boolean; revoked: boolean };
    actions: { acceptAllowed: boolean; declineAllowed: boolean };
  };
  error?: string;
};

export default function InvitePage() {
  const sp = useSearchParams();
  const email = sp.get("email") ?? "";
  const token = sp.get("token") ?? "";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["invite:status", email, token],
    queryFn: () =>
      apiFetch<StatusResp>(
        `/api/invites/status?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
      ),
    enabled: Boolean(email && token),
  });

  const accept = useMutation({
    mutationFn: () =>
      apiFetch(`/api/invites/accept`, { method: "POST", body: JSON.stringify({ email, token }) }),
    onSuccess: () => refetch(),
  });
  const decline = useMutation({
    mutationFn: () =>
      apiFetch(`/api/invites/decline`, { method: "POST", body: JSON.stringify({ email, token }) }),
    onSuccess: () => refetch(),
  });
  function inviteStatusBadge(status: string) {
    const map: Record<string, string> = {
      accepted: "bg-[var(--success-500)]/10 text-[var(--success-500)]",
      pending: "bg-[var(--primary-50)] text-[var(--primary-700)]",
      declined: "bg-[var(--danger-500)]/10 text-[var(--danger-500)]",
      revoked: "bg-[var(--neutral-100)] text-[var(--neutral-700)]",
      needs_reconfirm: "bg-[var(--warning-500)]/10 text-[var(--warning-500)]",
    };
    const cls = map[status] ?? "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]";
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${cls}`}>
        {status}
      </span>
    );
  }

  if (!email || !token)
    return (
      <div className="mx-auto max-w-6xl space-y-9 px-6 py-9" id="invite-page">
        <PageHeader title="Invitation" description="Missing invite parameters" />
      </div>
    );
  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl space-y-9 px-6 py-9" id="invite-page-loading">
        <PageHeader title="Invitation" description="Loading details" />
        <div className="border-token rounded-lg border bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="mb-2 h-4 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
    );
  if (error || !data?.data)
    return (
      <div className="mx-auto max-w-6xl space-y-9 px-6 py-9" id="invite-page-error">
        <PageHeader title="Invitation" description="Invalid or expired link" />
        <div className="border-token rounded-md border bg-white p-4 text-sm text-[var(--danger-500)]">
          We couldn&apos;t validate your invitation. Please check the link or request a new one.
        </div>
      </div>
    );

  const d = data.data;

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-6 py-9" id="invite-page">
      <PageHeader title="You're invited" description="Confirm your attendance for this viewing" />

      <div className="grid gap-6 md:grid-cols-5">
        <div className="border-token rounded-lg border bg-white p-4 md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <MapPin className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
              <span className="line-clamp-1">{d.property.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-neutral-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                <span className="line-clamp-1">
                  <span className="font-medium">
                    {new Date(d.slot.startUtc).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                  </span>
                  <span className="text-neutral-500">—</span>
                  <span className="font-medium">
                    {new Date(d.slot.endUtc).toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <BadgeCheck className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-neutral-600">Invite status:</span>
                {inviteStatusBadge(d.invite.status)}
              </div>
              {d.flags.full && (
                <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-[var(--warning-500)]/10 px-2 py-1 text-xs text-[var(--warning-500)]">
                  <AlertTriangle className="h-3.5 w-3.5" /> Slot is currently full.
                </div>
              )}
              {d.flags.expired && (
                <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-[var(--danger-500)]/10 px-2 py-1 text-xs text-[var(--danger-500)]">
                  <Ban className="h-3.5 w-3.5" /> This slot has started or expired.
                </div>
              )}
              {d.flags.revoked && (
                <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-[var(--danger-500)]/10 px-2 py-1 text-xs text-[var(--danger-500)]">
                  <Ban className="h-3.5 w-3.5" /> This invite has been revoked.
                </div>
              )}
            </div>
          </CardContent>
        </div>

        <div className="border-token rounded-lg border bg-white p-4 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              Respond
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                id="invite-accept-btn"
                disabled={!d.actions.acceptAllowed || accept.isPending}
                onClick={() => accept.mutate()}
                className="cursor-pointer"
              >
                {accept.isPending ? (
                  "Accepting…"
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4" /> Accept
                  </span>
                )}
              </Button>
              <Button
                id="invite-decline-btn"
                variant="outline"
                disabled={!d.actions.declineAllowed || decline.isPending}
                onClick={() => decline.mutate()}
                className="cursor-pointer"
              >
                {decline.isPending ? (
                  "Declining…"
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Ban className="h-4 w-4" /> Decline
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
