"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client-api";
import { Footer, PublicNav } from "@/components/ui";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: fd.get("password") }),
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
          <div>
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </div>
          <button className="rounded bg-[var(--navy)] px-3 py-2 text-white">Update password</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
