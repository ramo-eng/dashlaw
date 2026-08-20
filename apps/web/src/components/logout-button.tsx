"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-sm text-[var(--muted)]"
      onClick={async () => {
        await api("/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
