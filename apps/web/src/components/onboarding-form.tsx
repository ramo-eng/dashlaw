"use client";

import { ApiForm } from "@/components/api-form";
import { useRouter } from "next/navigation";

export function OnboardingForm(props: {
  name: string;
  timezone: string;
  reminderCadenceDays: number;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  return (
    <ApiForm
      path="/onboarding"
      submitLabel="Finish setup"
      onSuccess={() => router.push("/app/cases")}
      fields={[
        { name: "name", label: "Firm name", required: true, defaultValue: props.name },
        { name: "timezone", label: "Timezone", required: true, defaultValue: props.timezone },
        {
          name: "reminderCadenceDays",
          label: "Default reminder cadence (days)",
          type: "number",
          defaultValue: String(props.reminderCadenceDays),
        },
        {
          name: "aiEnabled",
          label: "Enable AI processing",
          options: [
            { value: "true", label: "Enabled (assistive only)" },
            { value: "false", label: "Disabled" },
          ],
          defaultValue: props.aiEnabled ? "true" : "false",
        },
      ]}
    />
  );
}
