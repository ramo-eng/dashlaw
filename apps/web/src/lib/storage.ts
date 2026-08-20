import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ROOT = path.join(process.cwd(), "storage", "documents");

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

export async function storeOriginal(buffer: Buffer, originalName: string, documentId: string, version: number) {
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  const key = `${documentId}/v${version}.${ext}`;
  const full = path.join(ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return key;
}

export async function readStored(storageKey: string) {
  return readFile(path.join(ROOT, storageKey));
}

export function newDocumentId() {
  return randomUUID();
}

export function looksMalicious(name: string, buffer: Buffer) {
  const hay = `${name} ${buffer.slice(0, 64).toString("utf8")}`.toLowerCase();
  return hay.includes("eicar") || hay.includes("malware") || hay.includes("x5o!p%@ap");
}
