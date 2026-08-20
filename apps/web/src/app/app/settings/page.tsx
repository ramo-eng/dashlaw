import { requireStaffPage } from "@/lib/page-auth";
import { PageTitle } from "@/components/ui";
import { SettingsForm } from "@/components/admin-forms";

export default async function SettingsPage() {
  const { firm } = await requireStaffPage();
  return (
    <div>
      <PageTitle title="Settings" />
      <p className="mb-4 max-w-xl text-sm text-[var(--muted)]">
        MFA flags are stored per user for a managed-identity ready architecture. Integrations can be added against the
        existing REST API and job events.
      </p>
      <SettingsForm
        timezone={firm.timezone}
        reminderCadenceDays={firm.reminderCadenceDays}
        aiEnabled={firm.aiEnabled}
        dataRetentionDays={firm.dataRetentionDays}
      />
    </div>
  );
}
