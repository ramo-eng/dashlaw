"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { Footer, PublicNav } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      router.push(data.onboardingComplete ? "/app/cases" : "/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold">Staff log in</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required defaultValue="admin@harbor.example" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required defaultValue="password123" />
          </div>
          <button className="rounded bg-[var(--navy)] px-3 py-2 text-white">Log in</button>
        </form>
        <p className="mt-4 text-sm">
          <Link href="/forgot-password">Forgot password</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
