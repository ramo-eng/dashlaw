export const CASE_STATUSES = [
  "Draft",
  "Intake",
  "Collecting",
  "Review",
  "Ready",
  "Filed",
  "Closed",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  Draft: ["Intake", "Closed"],
  Intake: ["Collecting", "Draft", "Closed"],
  Collecting: ["Review", "Intake", "Closed"],
  Review: ["Ready", "Collecting", "Closed"],
  Ready: ["Filed", "Review", "Closed"],
  Filed: ["Closed"],
  Closed: [],
};

export function canTransitionCase(from: string, to: string) {
  return (TRANSITIONS[from as CaseStatus] ?? []).includes(to as CaseStatus);
}

export function assertCaseTransition(from: string, to: string) {
  if (from === to) return;
  if (!canTransitionCase(from, to)) {
    throw new Error(`Invalid case status transition: ${from} → ${to}`);
  }
}
