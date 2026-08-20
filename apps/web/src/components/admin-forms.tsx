"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function InviteUserForm() {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/users", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        role: fd.get("role"),
        temporaryPassword: fd.get("temporaryPassword"),
      }),
    });
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-2">
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <select name="role" defaultValue="PARALEGAL">
        {["FIRM_ADMIN", "ATTORNEY", "PARALEGAL", "CASE_COORDINATOR", "READ_ONLY"].map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <input name="temporaryPassword" placeholder="Temporary password" defaultValue="ChangeMe123!" />
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Invite user</button>
    </form>
  );
}

export function SettingsForm(props: {
  timezone: string;
  reminderCadenceDays: number;
  aiEnabled: boolean;
  dataRetentionDays: number;
}) {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/settings", {
      method: "PATCH",
      body: JSON.stringify({
        timezone: fd.get("timezone"),
        reminderCadenceDays: Number(fd.get("reminderCadenceDays")),
        aiEnabled: fd.get("aiEnabled") === "true",
        dataRetentionDays: Number(fd.get("dataRetentionDays")),
      }),
    });
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-2">
      <div>
        <label htmlFor="timezone">Timezone</label>
        <input id="timezone" name="timezone" defaultValue={props.timezone} />
      </div>
      <div>
        <label htmlFor="reminderCadenceDays">Reminder cadence (days)</label>
        <input id="reminderCadenceDays" name="reminderCadenceDays" type="number" defaultValue={props.reminderCadenceDays} />
      </div>
      <div>
        <label htmlFor="aiEnabled">AI processing</label>
        <select id="aiEnabled" name="aiEnabled" defaultValue={props.aiEnabled ? "true" : "false"}>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>
      <div>
        <label htmlFor="dataRetentionDays">Retention (days)</label>
        <input id="dataRetentionDays" name="dataRetentionDays" type="number" defaultValue={props.dataRetentionDays} />
      </div>
      <button className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white">Save settings</button>
    </form>
  );
}

export function CheckoutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded bg-[var(--navy)] px-3 py-2 text-sm text-white"
      onClick={async () => {
        await api("/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "practice" }) });
        router.refresh();
      }}
    >
      Activate Practice plan (demo)
    </button>
  );
}
