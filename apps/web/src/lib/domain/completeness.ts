export type ExtractedField = {
  key: string;
  value: string | null;
  confidence: number;
};

export type CompletenessFinding = {
  itemTitle: string;
  severity: "info" | "warning" | "error";
  message: string;
  recommendation: string;
};

export function evaluateCompleteness(input: {
  itemTitle: string;
  required: boolean;
  status: string;
  expectedFields: string[];
  extracted?: ExtractedField[];
}): CompletenessFinding[] {
  const findings: CompletenessFinding[] = [];
  if (input.required && ["Not Started", "Requested"].includes(input.status)) {
    findings.push({
      itemTitle: input.itemTitle,
      severity: "warning",
      message: "Required document is missing.",
      recommendation: "Request the item from the client. This is an administrative gap, not a legal determination.",
    });
  }
  if (input.status === "Submitted" && input.extracted) {
    for (const key of input.expectedFields) {
      const field = input.extracted.find((f) => f.key === key);
      if (!field?.value) {
        findings.push({
          itemTitle: input.itemTitle,
          severity: "warning",
          message: `Expected field "${key}" was not found in the upload.`,
          recommendation: "Staff should visually confirm the document before accepting.",
        });
      } else if (field.confidence < 0.7) {
        findings.push({
          itemTitle: input.itemTitle,
          severity: "info",
          message: `Field "${key}" was extracted with low confidence (${field.confidence}).`,
          recommendation: "Flag for human review. Do not treat extracted values as facts until confirmed.",
        });
      }
    }
  }
  return findings;
}
