export function containsInsensitive(q: string) {
  return { contains: q, mode: "insensitive" as const };
}
