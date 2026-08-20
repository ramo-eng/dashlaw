"use client";

import { useState } from "react";
import { api } from "@/lib/client-api";

export function ApiForm({
  path,
  method = "POST",
  fields,
  submitLabel,
  extra,
  onSuccess,
  hidden,
}: {
  path: string;
  method?: string;
  fields: { name: string; label: string; type?: string; required?: boolean; options?: { value: string; label: string }[]; defaultValue?: string }[];
  submitLabel: string;
  extra?: Record<string, unknown>;
  onSuccess?: (data: unknown) => void;
  hidden?: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { ...(extra || {}), ...(hidden || {}) };
    for (const [k, v] of fd.entries()) {
      if (v === "on") body[k] = true;
      else if (v === "true" || v === "false") body[k] = v === "true";
      else body[k] = v;
    }
    try {
      const data = await api(path, { method, body: JSON.stringify(body) });
      setOk("Saved.");
      onSuccess?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-3">
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      {ok && <p className="text-sm text-[var(--ok)]">{ok}</p>}
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          {f.options ? (
            <select id={f.name} name={f.name} required={f.required} defaultValue={f.defaultValue}>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea id={f.name} name={f.name} required={f.required} rows={4} defaultValue={f.defaultValue} />
          ) : (
            <input
              id={f.name}
              name={f.name}
              type={f.type || "text"}
              required={f.required}
              defaultValue={f.defaultValue}
            />
          )}
        </div>
      ))}
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white disabled:opacity-50" disabled={pending}>
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}
