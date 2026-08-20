"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export default function PortalGatePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<{ caseTitle: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    try {
      const data = await api("/portal/magic", { method: "POST", body: JSON.stringify({ token }) });
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invitation");
    }
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/portal/otp", { method: "POST", body: JSON.stringify({ token, otp: fd.get("otp") }) });
      router.push("/portal/case");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Client portal</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Verify with the one-time code from your invitation. You will only see your own case.
      </p>
      {error && <p className="mt-3 text-sm text-[var(--bad)]">{error}</p>}
      {!info ? (
        <button className="mt-6 rounded bg-[var(--navy)] px-3 py-2 text-white" onClick={lookup}>
          Continue
        </button>
      ) : (
        <form onSubmit={verify} className="mt-6 grid gap-3">
          <p className="text-sm">
            {info.caseTitle} · {info.email}
          </p>
          <div>
            <label htmlFor="otp">One-time code</label>
            <input id="otp" name="otp" required inputMode="numeric" />
          </div>
          <button className="rounded bg-[var(--navy)] px-3 py-2 text-white">Open portal</button>
        </form>
      )}
    </main>
  );
}
