"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { UploadForm } from "@/components/case-actions";

export function PortalIntake({
  answers,
}: {
  answers: { fieldKey: string; prompt: string; answer: string }[];
}) {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    for (const [k, v] of fd.entries()) payload[k] = String(v);
    await api("/portal/intake", { method: "POST", body: JSON.stringify({ answers: payload }) });
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-3">
      {answers.map((a) => (
        <div key={a.fieldKey}>
          <label htmlFor={a.fieldKey}>{a.prompt}</label>
          <input id={a.fieldKey} name={a.fieldKey} defaultValue={a.answer} />
        </div>
      ))}
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Save answers</button>
    </form>
  );
}

export function PortalUpload({ caseId, checklistItemId }: { caseId: string; checklistItemId: string }) {
  return <UploadForm caseId={caseId} checklistItemId={checklistItemId} />;
}
