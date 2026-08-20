"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { api } from "@/lib/client-api";
import { Footer, PublicNav } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold">Verify email</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
          <p className="break-all font-mono text-xs text-[var(--muted)]">{token}</p>
          <button className="rounded bg-[var(--navy)] px-3 py-2 text-white">Confirm</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
