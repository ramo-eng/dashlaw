import { NextRequest } from "next/server";
import { handleApi } from "@/lib/api/router";
import { errorResponse, json } from "@/lib/http";

export const runtime = "nodejs";

async function run(req: NextRequest, path: string[]) {
  try {
    const data = await handleApi(req, path);
    return json(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return run(req, path ?? []);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return run(req, path ?? []);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return run(req, path ?? []);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return run(req, path ?? []);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return run(req, path ?? []);
}
