/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useForm, useController } from "react-hook-form";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { LabeledSelect } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { TagInput } from "@/components/ui/TagInput";
import { Input } from "@/components/ui/Input";
import { DateInput, TimeInput } from "@/components/ui/DateTime";
import { Calendar, Users, Hash, Clock, MapPin, X } from "lucide-react";

type PropsItem = { id: string; name: string };
type PropsResp = { data: PropsItem[] };

const FormSchema = z
  .object({
    propertyId: z.preprocess(
      (v) => (typeof v === "string" ? v : ""),
      z.string().min(1, "Property is required"),
    ),
    dateISO: z
      .string()
      .min(1, "Date is required")
      .refine((v) => {
        if (!v) return false;
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);
        const d = new Date(v + "T00:00:00");
        return d >= start && d <= end;
      }, "Date must be within the next 60 days"), // YYYY-MM-DD
    startTime: z.string().min(1, "Start time is required"), // HH:MM
    endTime: z.string().min(1, "End time is required"),
    capacity: z.preprocess(
      (v) => {
        if (v === "" || v === null || typeof v === "undefined") return 0;
        if (typeof v === "number" && Number.isNaN(v)) return 0;
        if (typeof v === "string") {
          const n = Number(v);
          return Number.isNaN(n) ? 0 : n;
        }
        return v as unknown;
      },
      z.number().int("Capacity must be an integer").min(1, "Capacity must be at least 1"),
    ),
    inviteeText: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    // End must be at least 30 minutes after start
    if (data.startTime && data.endTime) {
      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (endMins - startMins < 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be at least 30 minutes after start time",
          path: ["endTime"],
        });
      }
    }
    // If selected date is today, start must be at least +15min
    if (data.dateISO && data.startTime) {
      const todayIso = new Date().toISOString().slice(0, 10);
      if (data.dateISO === todayIso) {
        const now = new Date();
        const threshold = new Date(now.getTime() + 15 * 60 * 1000);
        const [hh, mm] = data.startTime.split(":");
        const chosen = new Date(`${data.dateISO}T${hh}:${mm}:00`);
        if (chosen < threshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Start time must be at least 15 minutes from now",
            path: ["startTime"],
          });
        }
      }
    }
  });

type FormValues = z.infer<typeof FormSchema>;

export default function CreateSlotPage() {
  const qc = useQueryClient();
  const { data: propsData, isLoading: isPropsLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => apiFetch<PropsResp>("/api/properties"),
  });

  const {
    register,
    handleSubmit,
    formState,
    setValue,
    watch,
    setFocus,
    control,
    setError,
    clearErrors,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as any,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const propertyField = useController({ name: "propertyId", control });
  const startTimeVal = watch("startTime");
  const endTimeVal = watch("endTime");
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!startTimeVal || !endTimeVal) {
      clearErrors("endTime");
      return;
    }
    const [sh, sm] = startTimeVal.split(":").map(Number);
    const [eh, em] = endTimeVal.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (endMins - startMins < 30) {
      setError("endTime", {
        type: "manual",
        message: "End time must be at least 30 minutes after start time",
      });
    } else {
      clearErrors("endTime");
    }
  }, [startTimeVal, endTimeVal, setError, clearErrors]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const emails = (values.inviteeText || "")
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      // compose UTC datetimes from date + time (assuming local timezone input)
      const startLocal = new Date(`${values.dateISO}T${values.startTime}:00`);
      const endLocal = new Date(`${values.dateISO}T${values.endTime}:00`);
      const payload = {
        propertyId: values.propertyId,
        startUtc: startLocal.toISOString(),
        endUtc: endLocal.toISOString(),
        capacity: values.capacity,
        invitees: emails,
      };
      return apiFetch<{ data: unknown }>("/api/slots", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onMutate: () => {
      setApiError(null);
      setSuccessMsg(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slots:list"] });
      setSuccessMsg("Slot created successfully");
      reset({
        propertyId: "",
        dateISO: "",
        startTime: "",
        endTime: "",
        capacity: undefined as unknown as number,
        inviteeText: "",
      });
      setTimeout(() => setSuccessMsg(null), 5000);
      setFocus("propertyId");
    },
    onError: (e: any) => {
      const rawBody = e?.body;
      const rawErr =
        (rawBody && (rawBody as any).error) ??
        e?.message ??
        (e?.status ? `request_failed_${e.status}` : undefined);
      let bannerMsg: string | null = null;
      if (rawErr && typeof rawErr === "object") {
        const formErrors = (rawErr as any).formErrors;
        if (Array.isArray(formErrors) && formErrors.length) {
          bannerMsg = formErrors.join(", ");
        }
      } else if (typeof rawErr === "string") {
        // If server sends a plain string as a general error, show it
        bannerMsg = rawErr;
      }
      setApiError(bannerMsg ?? "Please fix the highlighted fields.");
      const fe =
        (rawBody && (rawBody as any).error && (rawBody as any).error.fieldErrors) ||
        (rawBody && (rawBody as any).fieldErrors) ||
        e?.fieldErrors;
      if (fe && typeof fe === "object") {
        // Map backend field names to local fields
        const friendly = (s: any) => {
          const m = Array.isArray(s) ? s[0] : s;
          if (typeof m !== "string") return "Invalid value";
          if (m.toLowerCase().includes("expected date")) return "Please select a valid date/time";
          return m;
        };
        const mappings: Record<string, keyof FormValues> = {
          startUtc: "startTime",
          endUtc: "endTime",
          propertyId: "propertyId",
          capacity: "capacity",
        };
        const setIf = (key: string) => {
          const target = mappings[key];
          const m = (fe as any)[key];
          if (target && m) setError(target, { type: "server", message: friendly(m) });
        };
        setIf("propertyId");
        setIf("startUtc");
        setIf("endUtc");
        setIf("capacity");
        // Also propagate date error if startUtc invalid
        if ((fe as any)["startUtc"])
          setError("dateISO", { type: "server", message: friendly((fe as any)["startUtc"]) });

        const order: (keyof FormValues)[] = [
          "propertyId",
          "dateISO",
          "startTime",
          "endTime",
          "capacity",
        ];
        for (const k of order) {
          if (formState.errors[k]) {
            setFocus(k as any);
            break;
          }
        }
      }
    },
  });

  const onSubmit = (v: FormValues) => {
    // Cross-field validation: end must be at least 30 minutes after start
    if (v.startTime && v.endTime) {
      const [sh, sm] = v.startTime.split(":").map(Number);
      const [eh, em] = v.endTime.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (endMins - startMins < 30) {
        setError("endTime", {
          type: "manual",
          message: "End time must be at least 30 minutes after start time",
        });
        setFocus("endTime");
        return;
      }
    }
    // extra client guard: if selected date is today, enforce start >= now+15m
    const todayIso = new Date().toISOString().slice(0, 10);
    if (v.dateISO === todayIso && v.startTime) {
      const now = new Date();
      const threshold = new Date(now.getTime() + 15 * 60 * 1000);
      const [hh, mm] = v.startTime.split(":");
      const chosen = new Date(`${v.dateISO}T${hh}:${mm}:00`);
      if (chosen < threshold) {
        setError("startTime", {
          type: "manual",
          message: "Start time must be at least 15 minutes from now",
        });
        setFocus("startTime");
        return;
      }
    }
    mutation.mutate(v, {
      onError: () => {
        // focus the first field with error; prioritize property
        if (formState.errors.propertyId) {
          setFocus("propertyId");
          return;
        }
        const order: (keyof FormValues)[] = ["dateISO", "startTime", "endTime", "capacity"];
        for (const k of order) {
          if (formState.errors[k]) {
            setFocus(k as any);
            break;
          }
        }
      },
    });
  };

  const props = propsData?.data ?? [];

  if (isPropsLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-9 px-6 py-9">
        <PageHeader title="Create Slot" description="Schedule a new property viewing" />
        <Card className="border-token border p-6">
          <CardContent className="space-y-6">
            <div>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Skeleton className="mb-2 h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div>
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="mb-2 h-4 w-64" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-6 py-9">
      <PageHeader title="Create Slot" description="Schedule a new property viewing" />
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="shadow-card fixed top-[8rem] left-1/2 z-50 -translate-x-1/2 transform rounded-md bg-[var(--color-success-500)] px-4 py-2 text-sm font-semibold text-white"
        >
          {successMsg && (
            <div className="flex items-center gap-3">
              <span>{successMsg}</span>
              <button
                type="button"
                aria-label="Close"
                className="ml-2 rounded p-1 hover:bg-white/10"
              >
                <X className="h-4 w-4 cursor-pointer" onClick={() => setSuccessMsg(null)} />
              </button>
            </div>
          )}
        </div>
      )}
      <Card className="border-token border p-6">
        <CardContent>
          {apiError && (
            <div className="mb-4 py-2 text-sm text-[var(--color-danger-500)]">{apiError}</div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              if (errors.propertyId) {
                setFocus("propertyId");
                return;
              }
              const order: (keyof FormValues)[] = ["dateISO", "startTime", "endTime", "capacity"];
              for (const k of order) {
                if ((errors as any)[k]) {
                  setFocus(k as any);
                  break;
                }
              }
            })}
            className="space-y-6"
          >
            <div>
              <LabeledSelect
                label="Property"
                value={propertyField.field.value || ""}
                onChange={propertyField.field.onChange}
                name={propertyField.field.name}
                selectRef={propertyField.field.ref}
                options={[
                  { value: "", label: "Select property…" },
                  ...props.map((p) => ({ value: p.id, label: p.name })),
                ]}
                stacked
                labelIcon={<MapPin className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />}
              />
              {formState.errors.propertyId && (
                <p className="mt-1 text-sm text-red-600">
                  {formState.errors.propertyId.message as string}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="mb-1 block inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Calendar className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                  <span className="line-clamp-1">Date</span>
                </label>
                <DateInput
                  placeholder="Select date"
                  min={new Date().toISOString().slice(0, 10)}
                  max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                  {...register("dateISO")}
                />
                {formState.errors.dateISO && (
                  <p className="mt-1 text-sm text-red-600">
                    {formState.errors.dateISO.message as string}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="mb-1 block inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Clock className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                  <span className="line-clamp-1">Start time</span>
                </label>
                <TimeInput placeholder="HH:MM" {...register("startTime")} />
                {formState.errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {formState.errors.startTime.message as string}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="mb-1 block inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Clock className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                  <span className="line-clamp-1">End time</span>
                </label>
                <TimeInput placeholder="HH:MM" {...register("endTime")} />
                {formState.errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {formState.errors.endTime.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="mb-1 block inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Users className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                <span className="line-clamp-1">Capacity</span>
              </label>
              <Input
                type="number"
                min={1}
                placeholder="e.g., 3"
                {...register("capacity", { valueAsNumber: true })}
              />
              {formState.errors.capacity && (
                <p className="mt-1 text-sm text-red-600">
                  {formState.errors.capacity.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="mb-1 block inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Hash className="h-4 min-h-4 w-4 min-w-4 text-neutral-500" />
                <span className="line-clamp-1"> Invitees</span>
              </label>
              <TagInput
                value={(watch("inviteeText") || "").split(/\s*,\s*|\n/).filter(Boolean)}
                onChange={(arr) => setValue("inviteeText", arr.join(", "))}
                placeholder="Type email and press Enter or , to add"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="cursor-pointer" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => history.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
