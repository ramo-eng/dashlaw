"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function TemplateCreateForm() {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const created = await api("/templates", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        caseType: fd.get("caseType"),
        items: String(fd.get("items") || "")
          .split("\n")
          .filter(Boolean)
          .map((line) => ({ title: line, required: true })),
        questions: String(fd.get("questions") || "")
          .split("\n")
          .filter(Boolean)
          .map((line) => ({
            prompt: line,
            fieldKey: line.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
            required: true,
          })),
      }),
    });
    router.push(`/app/templates/${created.id}`);
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-2 rounded border border-[var(--line)] bg-white p-4">
      <div className="font-medium">New draft template</div>
      <input name="name" placeholder="Template name" required />
      <input name="caseType" placeholder="Case type (e.g. H-1B)" required />
      <textarea name="items" rows={4} placeholder="Checklist items, one per line" />
      <textarea name="questions" rows={3} placeholder="Intake questions, one per line" />
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Save draft</button>
    </form>
  );
}

export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white"
      onClick={async () => {
        const next = await api(`/templates/${id}/publish`, { method: "POST", body: "{}" });
        router.push(`/app/templates/${next.id}`);
      }}
    >
      Publish version
    </button>
  );
}
