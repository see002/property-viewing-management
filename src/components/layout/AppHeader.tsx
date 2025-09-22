"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--neutral-200)] bg-[var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          VistaManage
        </Link>
        <nav className="flex items-center gap-3 text-sm text-neutral-600">
          <Button asChild variant="outline" size="md">
            <Link href="/slots/create">Create Slot</Link>
          </Button>
          <Button asChild size="md">
            <Link href="/slots">View Slots</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
