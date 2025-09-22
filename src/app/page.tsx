import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Calendar, Users, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(ellipse_at_top,rgba(255,90,95,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.04),transparent_50%)]">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Organize property viewings with clarity and ease
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Create, manage, and track viewing slots. Share secure invites and keep everyone in
              sync.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild>
                <Link href="/slots">View Slots</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/slots/create">Create Slot</Link>
              </Button>
            </div>
          </div>
          <div className="border-token rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-700)]">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm text-neutral-600">Next viewing</div>
                <div className="text-[15px] font-medium">Wed, 10:00 AM – 10:45 AM (IST)</div>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--neutral-100)] text-neutral-700">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm text-neutral-600">Attendees</div>
                <div className="text-[15px] font-medium">3 confirmed • 2 pending</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--neutral-100)] text-neutral-700">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm text-neutral-600">Secure invites</div>
                <div className="text-[15px] font-medium">
                  Tokenized links with one‑click responses
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-token rounded-lg border bg-white p-5">
            <div className="text-sm font-semibold">Fast</div>
            <p className="mt-1 text-sm text-neutral-600">
              Snappy UI with caching and instant feedback.
            </p>
          </div>
          <div className="border-token rounded-lg border bg-white p-5">
            <div className="text-sm font-semibold">Accessible</div>
            <p className="mt-1 text-sm text-neutral-600">
              Keyboard friendly and screen‑reader aware.
            </p>
          </div>
          <div className="border-token rounded-lg border bg-white p-5">
            <div className="text-sm font-semibold">Secure</div>
            <p className="mt-1 text-sm text-neutral-600">Hash‑based tokens and safe defaults.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
