export const CHECKLIST_STATUSES = [
  "Not Started",
  "Requested",
  "Submitted",
  "Accepted",
  "Needs Replacement",
  "Waived",
  "Not Applicable",
] as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

const ITEM_TRANSITIONS: Record<ChecklistStatus, ChecklistStatus[]> = {
  "Not Started": ["Requested", "Not Applicable", "Waived"],
  Requested: ["Submitted", "Waived", "Not Applicable"],
  Submitted: ["Accepted", "Needs Replacement", "Waived"],
  Accepted: ["Needs Replacement"],
  "Needs Replacement": ["Submitted", "Waived"],
  Waived: ["Requested"],
  "Not Applicable": ["Requested"],
};

export function canTransitionItem(from: string, to: string) {
  return (ITEM_TRANSITIONS[from as ChecklistStatus] ?? []).includes(to as ChecklistStatus);
}

export type ProgressItem = {
  required: boolean;
  status: string;
};

export function calculateReadiness(items: ProgressItem[]) {
  const required = items.filter((i) => i.required);
  if (required.length === 0) return 100;
  const complete = required.filter((i) =>
    ["Accepted", "Waived", "Not Applicable"].includes(i.status),
  ).length;
  return Math.round((complete / required.length) * 100);
}

export function nextChecklistAction(items: ProgressItem[]) {
  const overdueRequested = items.find((i) => i.status === "Requested");
  if (overdueRequested) return "Follow up on outstanding document requests";
  if (items.some((i) => i.status === "Submitted")) return "Review submitted documents";
  if (items.some((i) => i.status === "Needs Replacement")) return "Client must replace flagged documents";
  if (items.some((i) => i.status === "Not Started")) return "Request remaining checklist items";
  return "Ready for attorney review";
}

export function reminderShouldStop(status: string, caseStatus: string, paused: boolean) {
  if (paused) return true;
  if (["Closed", "Filed"].includes(caseStatus)) return true;
  return ["Submitted", "Accepted", "Waived", "Not Applicable"].includes(status);
}
