import { NextRequest } from "next/server";
import { downloadDocumentBuffer } from "@/lib/api/router";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { buf, doc } = await downloadDocumentBuffer(id);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.originalName.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
