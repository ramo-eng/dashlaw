"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { useState } from "react";

export function GenerateSummary({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <button
      className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white"
      onClick={async () => {
        try {
          await api(`/cases/${caseId}/ai-summary`, { method: "POST", body: "{}" });
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed");
        }
      }}
    >
      Generate summary
      {error && <span className="ml-2 text-[var(--bad)]">{error}</span>}
    </button>
  );
}

export function ApproveSummary({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="rounded border border-[var(--line)] px-2 py-1 text-sm"
      onClick={async () => {
        await api(`/ai-summaries/${id}/approve`, { method: "POST", body: "{}" });
        router.refresh();
      }}
    >
      Approve
    </button>
  );
}

export function DeadlineForm({ caseId, timezone }: { caseId: string; timezone: string }) {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/deadlines", {
      method: "POST",
      body: JSON.stringify({
        caseId,
        title: fd.get("title"),
        type: fd.get("type"),
        dueAt: fd.get("dueAt"),
        timezone,
        critical: fd.get("critical") === "on",
        confirmed: fd.get("confirmed") === "on",
        source: "manual",
      }),
    });
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-2">
      <input name="title" placeholder="Deadline title" required />
      <select name="type" defaultValue="operational">
        <option value="operational">Operational</option>
        <option value="filing_window">Filing window (confirm with counsel)</option>
      </select>
      <input name="dueAt" type="datetime-local" required />
      <label className="flex items-center gap-2 text-sm">
        <input name="critical" type="checkbox" className="w-auto" /> Critical
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="confirmed" type="checkbox" className="w-auto" /> I confirm this critical deadline
      </label>
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Add deadline</button>
    </form>
  );
}

export function TaskForm({ caseId, users }: { caseId: string; users: { id: string; name: string }[] }) {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/tasks", {
      method: "POST",
      body: JSON.stringify({
        caseId,
        title: fd.get("title"),
        assigneeId: fd.get("assigneeId"),
      }),
    });
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-wrap gap-2">
      <input name="title" placeholder="Staff task" required className="max-w-xs" />
      <select name="assigneeId" className="max-w-[180px]">
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Add task</button>
    </form>
  );
}
