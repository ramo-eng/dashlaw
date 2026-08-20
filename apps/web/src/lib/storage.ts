import { randomUUID } from "crypto";
import { createServiceClient, documentsBucket, ensureDocumentsBucket, isSupabaseConfigured } from "./supabase";

export function maxUploadBytes() {
  return Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
}

const ALLOWED: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "text/plain": ["txt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

export function inferMime(name: string, declared?: string | null) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  for (const [mime, exts] of Object.entries(ALLOWED)) {
    if (exts.includes(ext)) return mime;
  }
  if (declared && ALLOWED[declared]) return declared;
  return null;
}

export function assertAllowedFile(name: string, size: number, declared?: string | null) {
  if (size > maxUploadBytes()) {
    throw new Error("File exceeds the 10MB upload limit");
  }
  const mime = inferMime(name, declared);
  if (!mime) throw new Error("File type is not allowed. Use PDF, JPG, PNG, TXT, or DOCX.");
  return mime;
}

export async function storeOriginal(
  buffer: Buffer,
  originalName: string,
  documentId: string,
  version: number,
  mimeType?: string | null,
) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase storage is required. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  await ensureDocumentsBucket();
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  const key = `${documentId}/v${version}.${ext}`;
  const mime = mimeType || inferMime(originalName) || "application/octet-stream";
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(documentsBucket()).upload(key, new Uint8Array(buffer), {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) return key;
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
  return key;
}

export async function readStored(storageKey: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase storage is required.");
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(documentsBucket()).download(storageKey);
  if (error || !data) throw new Error(error?.message || "Document not found in storage");
  return Buffer.from(await data.arrayBuffer());
}

export function newDocumentId() {
  return randomUUID();
}

export function looksMalicious(name: string, buffer: Buffer) {
  const hay = `${name} ${buffer.slice(0, 64).toString("utf8")}`.toLowerCase();
  return hay.includes("eicar") || hay.includes("malware") || hay.includes("x5o!p%@ap");
}
