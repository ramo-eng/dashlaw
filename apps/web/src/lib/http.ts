import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return json({ error: err.message, code: err.code }, err.status);
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (message.startsWith("Invalid")) {
    return json({ error: message }, 400);
  }
  console.error(err);
  return json({ error: "Internal server error" }, 500);
}
