/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LabeledSelect } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Calendar, Users, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUIStore } from "@/stores/ui";

type SlotItem = {
  id: string;
  property: { id: string; name: string };
  startUtc: string;
  endUtc: string;
  status: string;
  capacity: number;
  _count: { invites: number };
  acceptedCount?: number;
};

type ApiResponse = { data: SlotItem[] };
type PropsItem = { id: string; name: string };
type PropsResp = { data: PropsItem[] };

type StatusKey = null | "active" | "scheduled" | "full" | "cancelled" | "completed";
type TimeKey = null | "today" | "this_week" | "this_month" | "past";

export default function SlotsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["slots:list"],
    queryFn: () => apiFetch<ApiResponse>("/api/slots"),
  });
  const { data: propsData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => apiFetch<PropsResp>("/api/properties"),
  });

  const status = useUIStore((s) => s.status);
  const propertyId = useUIStore((s) => s.propertyId);
  const timeRange = useUIStore((s) => s.timeRange);
  const setStatus = useUIStore((s) => s.setStatus);
  const setPropertyId = useUIStore((s) => s.setPropertyId);
  const setTimeRange = useUIStore((s) => s.setTimeRange);
  const resetFilters = useUIStore((s) => s.resetFilters);

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl space-y-9 px-6 py-9">
        <PageHeader title="Viewing Slots" description="Manage and track property viewing slots" />

        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shadow-card rounded-lg bg-white p-5">
              {/* Header: property title (2 lines reserve) + status pill */}
              <div className="mb-4 flex max-h-[3.5rem] min-h-[3.5rem] items-start justify-between">
                <div className="flex w-56 items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="w-48">
                    <Skeleton className="mb-1 h-4 w-11/12" />
                    <Skeleton className="h-4 w-9/12" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              {/* Date / Time row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
              </div>
              {/* Attendees + inline progress */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-6 rounded" />
                  <div className="w-24">
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  if (error) return <div className="p-6">Failed to load.</div>;

  const slots = data?.data ?? [];

  const rank: Record<string, number> = {
    active: 0,
    scheduled: 1,
    full: 2,
    cancelled: 3,
    completed: 4,
  };
  const sorted = [...slots].sort((a, b) => {
    const ra = rank[a.status] ?? 99;
    const rb = rank[b.status] ?? 99;
    if (ra !== rb) return ra - rb;
    // secondary: earliest start first
    return new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime();
  });

  const filtered = sorted.filter((s) => {
    if (status && s.status !== status) return false;
    if (propertyId && s.property?.id !== propertyId) return false;
    if (timeRange && timeRange !== null) {
      const d = new Date(s.startUtc);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayMs = 24 * 60 * 60 * 1000;
      if (timeRange === "today") {
        const endOfDay = new Date(startOfDay.getTime() + dayMs);
        if (!(d >= startOfDay && d < endOfDay)) return false;
      } else if (timeRange === "this_week") {
        const day = startOfDay.getDay();
        const diffToMonday = (day + 6) % 7; // 0->6, 1->0 ...
        const startOfWeek = new Date(startOfDay.getTime() - diffToMonday * dayMs);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * dayMs);
        if (!(d >= startOfWeek && d < endOfWeek)) return false;
      } else if (timeRange === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        if (!(d >= startOfMonth && d < endOfMonth)) return false;
      } else if (timeRange === "past") {
        if (!(d < startOfDay)) return false;
      }
    }
    return true;
  });

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      scheduled: "bg-[var(--primary-50)] text-[var(--primary-700)]",
      active: "bg-[var(--success-500)]/10 text-[var(--success-500)]",
      full: "bg-[var(--warning-500)]/10 text-[var(--warning-500)]",
      completed: "bg-[var(--neutral-100)] text-[var(--neutral-700)]",
      cancelled: "bg-[var(--danger-500)]/10 text-[var(--danger-500)]",
    };
    const cls = map[status] ?? "bg-[var(--neutral-100)] text-[var(--neutral-700)]";
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${cls}`}>
        {status}
      </span>
    );
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatTimeRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const startTime = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${startTime} - ${endTime}`;
  }

  function progressForStatus(status: string, value: number) {
    const barClass =
      status === "scheduled"
        ? "bg-[var(--color-primary-300)]"
        : status === "active"
          ? "bg-[var(--color-success-500)]"
          : status === "full"
            ? "bg-[var(--color-warning-500)]"
            : status === "completed"
              ? "bg-[var(--color-neutral-400)]"
              : status === "cancelled"
                ? "bg-[var(--color-danger-500)]"
                : "bg-[var(--color-neutral-400)]";
    return <Progress value={value} barClassName={barClass} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-6 py-9">
      <PageHeader title="Viewing Slots" description="Manage and track property viewing slots" />

      {/* Filters */}
      <div className="border-token rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center gap-8">
          <LabeledSelect
            label="Status"
            value={status ?? ""}
            onChange={(v: any) => setStatus((v || null) as StatusKey)}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "scheduled", label: "Scheduled" },
              { value: "full", label: "Full" },
              { value: "cancelled", label: "Cancelled" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <LabeledSelect
            label="Property"
            value={propertyId ?? ""}
            onChange={(v) => setPropertyId(v || null)}
            options={[
              { value: "", label: "All properties" },
              ...(propsData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <LabeledSelect
            label="Time"
            value={timeRange ?? ""}
            onChange={(v: any) => setTimeRange((v === "" ? null : v) as TimeKey)}
            options={[
              { value: "", label: "Any time" },
              { value: "today", label: "Today" },
              { value: "this_week", label: "This week" },
              { value: "this_month", label: "This month" },
              { value: "past", label: "Past" },
            ]}
          />
          <div className="ml-auto" />
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => resetFilters()}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link key={s.id} href={`/slots/${s.id}`} className="block focus-visible:outline-none">
            <Card className="border-token shadow-card hover:shadow-card-lg border transition-shadow motion-safe:transition-transform motion-safe:hover:-translate-y-0.5">
              <CardHeader className="max-h-[3.5rem] min-h-[3.5rem]">
                <CardTitle className="flex-1">
                  <span className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                    <span className="line-clamp-2">{s.property?.name ?? "—"}</span>
                  </span>
                </CardTitle>
                {statusBadge(s.status)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-neutral-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 min-h-4 w-4 min-w-4" />
                    <span className="font-medium">{formatDate(s.startUtc)}</span>
                  </div>
                  <div className="text-right text-sm font-medium">
                    {formatTimeRange(s.startUtc, s.endUtc)}{" "}
                    <span className="ml-1 text-xs text-neutral-500">IST</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 min-h-4 w-4 min-w-4 text-neutral-600" />
                    <span className="text-neutral-600">Attendees:</span> {s.acceptedCount ?? 0} /{" "}
                    {s.capacity}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      {Math.round(((s.acceptedCount ?? 0) / Math.max(1, s.capacity)) * 100)}%
                    </span>
                    <div className="w-24">
                      {progressForStatus(
                        s.status,
                        ((s.acceptedCount ?? 0) / Math.max(1, s.capacity)) * 100,
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
