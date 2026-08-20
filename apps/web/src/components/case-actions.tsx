"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";

export function CaseActions({
  caseId,
  status,
}: {
  caseId: string;
  status: string;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState<{ token: string; otp: string; portalPath: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextStatuses: Record<string, string[]> = {
    Draft: ["Intake", "Closed"],
    Intake: ["Collecting", "Draft", "Closed"],
    Collecting: ["Review", "Intake", "Closed"],
    Review: ["Ready", "Collecting", "Closed"],
    Ready: ["Filed", "Review", "Closed"],
    Filed: ["Closed"],
    Closed: [],
  };

  async function setStatus(next: string) {
    setError(null);
    try {
      await api(`/cases/${caseId}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function inviteClient() {
    setError(null);
    try {
      const data = await api(`/cases/${caseId}/invite-client`, { method: "POST", body: "{}" });
      setInvite(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-sm text-[var(--bad)]">{error}</span>}
      <button
        className="rounded border border-[var(--line)] bg-white px-3 py-1.5 text-sm"
        onClick={inviteClient}
      >
        Invite client
      </button>
      {nextStatuses[status]?.map((s) => (
        <button
          key={s}
          className="rounded border border-[var(--line)] bg-white px-3 py-1.5 text-sm"
          onClick={() => setStatus(s)}
        >
          Mark {s}
        </button>
      ))}
      {invite && (
        <div className="w-full rounded border border-[var(--line)] bg-[#fbf6e9] p-3 text-sm">
          Portal link: <a href={invite.portalPath}>{invite.portalPath}</a>
          <div>OTP: {invite.otp}</div>
        </div>
      )}
    </div>
  );
}

export function ItemActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");

  async function patch(body: Record<string, unknown>) {
    await api(`/checklist-items/${itemId}`, { method: "PATCH", body: JSON.stringify(body) });
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        className="rounded border border-[var(--line)] bg-white px-2 py-1 text-sm"
        onClick={() => api(`/checklist-items/${itemId}/request`, { method: "POST", body: "{}" }).then(() => router.refresh())}
      >
        Request
      </button>
      <button className="rounded border border-[var(--line)] bg-white px-2 py-1 text-sm" onClick={() => patch({ status: "Accepted" })}>
        Accept
      </button>
      <button
        className="rounded border border-[var(--line)] bg-white px-2 py-1 text-sm"
        onClick={() => patch({ status: "Needs Replacement" })}
      >
        Needs replacement
      </button>
      <input
        placeholder="Waive reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="max-w-[180px]"
      />
      <button
        className="rounded border border-[var(--line)] bg-white px-2 py-1 text-sm"
        onClick={() => patch({ status: "Waived", waiveReason: reason })}
      >
        Waive
      </button>
      <button
        className="rounded border border-[var(--line)] bg-white px-2 py-1 text-sm"
        onClick={() => patch({ remindersPaused: true })}
      >
        Pause reminders
      </button>
    </div>
  );
}

export function UploadForm({
  caseId,
  checklistItemId,
  staffOnly,
}: {
  caseId: string;
  checklistItemId?: string;
  staffOnly?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const contentBase64 = btoa(binary);
    try {
      await api("/documents/upload", {
        method: "POST",
        body: JSON.stringify({
          caseId,
          checklistItemId,
          filename: file.name,
          mimeType: file.type,
          contentBase64,
          visibility: staffOnly ? "staff" : "client",
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      <input type="file" onChange={onChange} />
    </div>
  );
}

export function TickJobsButton() {
  const router = useRouter();
  return (
    <button
      className="rounded border border-[var(--line)] bg-white px-3 py-1.5 text-sm"
      onClick={async () => {
        await api("/jobs/tick", { method: "POST", body: "{}" });
        router.refresh();
      }}
    >
      Run reminder/job tick
    </button>
  );
}
