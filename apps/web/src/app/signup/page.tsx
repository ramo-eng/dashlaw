"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { Footer, PublicNav } from "@/components/ui";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          firmName: fd.get("firmName"),
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      setToken(data.verifyToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold">Create your firm</h1>
        {token ? (
          <div className="mt-4 rounded border border-[var(--line)] bg-white p-4 text-sm">
            <p>Verification email would be sent. For this demo, continue with the token:</p>
            <p className="mt-2 break-all font-mono text-xs">{token}</p>
            <Link className="mt-3 inline-block" href={`/verify-email?token=${token}`}>
              Verify email →
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
            <div>
              <label htmlFor="firmName">Firm name</label>
              <input id="firmName" name="firmName" required />
            </div>
            <div>
              <label htmlFor="name">Your name</label>
              <input id="name" name="name" required />
            </div>
            <div>
              <label htmlFor="email">Work email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={8} />
            </div>
            <button className="rounded bg-[var(--navy)] px-3 py-2 text-white">Create account</button>
          </form>
        )}
        <p className="mt-4 text-sm">
          Already registered? <Link href="/login">Log in</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
