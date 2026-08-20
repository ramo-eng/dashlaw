"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { Footer, PublicNav } from "@/components/ui";

export default function ForgotPage() {
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = await api("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: fd.get("email") }),
    });
    setMsg(data.resetToken ? `Demo reset token: ${data.resetToken}` : "If the account exists, a reset email was queued.");
  }

  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <button className="rounded bg-[var(--navy)] px-3 py-2 text-white">Send reset</button>
        </form>
        {msg && (
          <p className="mt-4 break-all text-sm">
            {msg} {msg.includes("Demo") && <Link href={`/reset-password?token=${msg.split(": ")[1]}`}>Continue</Link>}
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
