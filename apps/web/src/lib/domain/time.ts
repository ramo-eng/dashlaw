export function toFirmLocal(isoUtc: Date | string, timeZone: string) {
  const date = typeof isoUtc === "string" ? new Date(isoUtc) : isoUtc;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function parseLocalAsUtc(localNaive: string) {
  return new Date(localNaive);
}
