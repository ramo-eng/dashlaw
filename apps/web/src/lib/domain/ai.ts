export type SourceRef = {
  documentId: string;
  documentName: string;
  page: number;
  excerpt: string;
};

export function wrapUntrustedDocumentText(text: string) {
  return `<untrusted-document>\n${text}\n</untrusted-document>`;
}

export function detectPromptInjection(text: string) {
  const lowered = text.toLowerCase();
  const needles = [
    "ignore previous instructions",
    "disregard the system prompt",
    "you are now",
    "reveal your prompt",
  ];
  return needles.some((n) => lowered.includes(n));
}

export function classifyDocument(filename: string, text: string) {
  const hay = `${filename} ${text}`.toLowerCase();
  const rules: [string, string, number][] = [
    ["passport", "passport", 0.92],
    ["i-94", "i94", 0.9],
    ["i94", "i94", 0.9],
    ["birth", "birth_certificate", 0.88],
    ["diploma", "diploma", 0.86],
    ["transcript", "transcript", 0.84],
    ["resume", "resume", 0.9],
    ["cv", "resume", 0.8],
    ["employment", "employment_letter", 0.85],
    ["offer letter", "employment_letter", 0.88],
    ["marriage", "marriage_certificate", 0.88],
  ];
  for (const [needle, type, confidence] of rules) {
    if (hay.includes(needle)) return { type, confidence };
  }
  return { type: "other", confidence: 0.4 };
}

export function extractFields(type: string, text: string) {
  const fields: { key: string; value: string | null; confidence: number }[] = [];
  const name = text.match(/name[:\s]+([A-Za-z ,.'-]{3,60})/i);
  const dob = text.match(/(?:dob|date of birth)[:\s]+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const passport = text.match(/passport[:\s#]+([A-Z0-9]{6,12})/i);
  const employer = text.match(/employer[:\s]+([A-Za-z0-9 &.,'-]{3,80})/i);

  if (type === "passport") {
    fields.push({ key: "full_name", value: name?.[1]?.trim() ?? null, confidence: name ? 0.82 : 0.35 });
    fields.push({ key: "date_of_birth", value: dob?.[1] ?? null, confidence: dob ? 0.8 : 0.3 });
    fields.push({ key: "passport_number", value: passport?.[1] ?? null, confidence: passport ? 0.86 : 0.25 });
  } else if (type === "employment_letter") {
    fields.push({ key: "employer", value: employer?.[1]?.trim() ?? null, confidence: employer ? 0.8 : 0.3 });
    fields.push({ key: "employee_name", value: name?.[1]?.trim() ?? null, confidence: name ? 0.7 : 0.3 });
  } else {
    fields.push({ key: "full_name", value: name?.[1]?.trim() ?? null, confidence: name ? 0.6 : 0.2 });
  }
  return fields;
}

export function generateGroundedSummary(input: {
  caseTitle: string;
  caseType: string;
  clientName: string;
  status: string;
  readiness: number;
  checklist: { title: string; status: string }[];
  facts: { key: string; value: string; source: string }[];
  sources: SourceRef[];
  documentTexts: { name: string; text: string }[];
}) {
  const injection = input.documentTexts.some((d) => detectPromptInjection(d.text));
  const lines: string[] = [];
  lines.push(`# Administrative case summary (draft)`);
  lines.push("");
  lines.push("This draft is assistive only. It is not legal advice, an eligibility determination, or a government filing strategy.");
  lines.push("");
  lines.push(`- Case: ${input.caseTitle}`);
  lines.push(`- Client: ${input.clientName}`);
  lines.push(`- Case type: ${input.caseType}`);
  lines.push(`- Status: ${input.status}`);
  lines.push(`- Checklist readiness: ${input.readiness}%`);
  lines.push("");
  lines.push("## Checklist state");
  for (const item of input.checklist) {
    lines.push(`- ${item.title}: ${item.status}`);
  }
  lines.push("");
  lines.push("## Source-backed facts");
  if (input.facts.length === 0) {
    lines.push("- No staff-confirmed extracted facts are available. Missing information is labeled missing rather than inferred.");
  } else {
    for (const fact of input.facts) {
      lines.push(`- ${fact.key}: ${fact.value} (source: ${fact.source})`);
    }
  }
  lines.push("");
  lines.push("## Document excerpts used");
  if (input.sources.length === 0) {
    lines.push("- No document excerpts were selected.");
  } else {
    for (const s of input.sources) {
      const safe = wrapUntrustedDocumentText(s.excerpt.slice(0, 280));
      lines.push(`- ${s.documentName} p.${s.page}: ${safe.replace(/\n/g, " ").slice(0, 200)}`);
    }
  }
  if (injection) {
    lines.push("");
    lines.push("Note: Uploaded text contained instruction-like language. It was treated as untrusted document content and ignored as instructions.");
  }
  lines.push("");
  lines.push("Unknown items remain unknown. Do not export this draft until an attorney reviews it.");
  return {
    content: lines.join("\n"),
    citations: input.sources,
    injectionDetected: injection,
  };
}
