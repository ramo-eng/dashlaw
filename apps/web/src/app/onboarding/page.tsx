import { requireStaffPage } from "@/lib/page-auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const { firm } = await requireStaffPage();
  if (firm.onboardingComplete) redirect("/app/cases");
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold">Firm onboarding</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Timezone is used to display deadlines. Timestamps are stored in UTC.
      </p>
      <div className="mt-6">
        <OnboardingForm
          name={firm.name}
          timezone={firm.timezone}
          reminderCadenceDays={firm.reminderCadenceDays}
          aiEnabled={firm.aiEnabled}
        />
      </div>
    </main>
  );
}
