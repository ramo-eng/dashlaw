"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function CreateCaseForm({
  clients,
  templates,
  owners,
  currentUserId,
}: {
  clients: { id: string; name: string; email: string }[];
  templates: { id: string; name: string; caseType: string; version: number }[];
  owners: { id: string; name: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      let clientId = String(fd.get("clientId") || "");
      if (mode === "new") {
        const client = await api("/clients", {
          method: "POST",
          body: JSON.stringify({
            name: fd.get("clientName"),
            email: fd.get("clientEmail"),
            phone: fd.get("clientPhone"),
          }),
        });
        clientId = client.id;
      }
      const tpl = templates.find((t) => t.id === fd.get("templateId"));
      const row = await api("/cases", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          clientId,
          templateId: fd.get("templateId"),
          title: fd.get("title"),
          caseType: tpl?.caseType,
          ownerId: fd.get("ownerId"),
        }),
      });
      router.push(`/app/cases/${row.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-3">
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Existing client
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> New client
        </label>
      </div>
      {mode === "existing" ? (
        <div>
          <label htmlFor="clientId">Client</label>
          <select id="clientId" name="clientId" required>
            <option value="">Select…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="clientName">Client name</label>
            <input id="clientName" name="clientName" required />
          </div>
          <div>
            <label htmlFor="clientEmail">Client email</label>
            <input id="clientEmail" name="clientEmail" type="email" required />
          </div>
          <div>
            <label htmlFor="clientPhone">Phone</label>
            <input id="clientPhone" name="clientPhone" />
          </div>
        </>
      )}
      <div>
        <label htmlFor="templateId">Case type / template</label>
        <select id="templateId" name="templateId" required>
          <option value="">Select…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.caseType} — {t.name} (v{t.version})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="title">Case title</label>
        <input id="title" name="title" required placeholder="Chen — H-1B cap FY27" />
      </div>
      <div>
        <label htmlFor="ownerId">Owner</label>
        <select id="ownerId" name="ownerId" defaultValue={currentUserId}>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Create case</button>
    </form>
  );
}
