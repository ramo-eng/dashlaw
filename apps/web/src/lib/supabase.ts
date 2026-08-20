import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let service: SupabaseClient | null = null;

export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function documentsBucket() {
  return process.env.SUPABASE_DOCUMENTS_BUCKET || "case-documents";
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceClient() {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see apps/web/.env.example).",
    );
  }
  if (!service) {
    service = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return service;
}

export async function ensureDocumentsBucket() {
  const supabase = createServiceClient();
  const bucket = documentsBucket();
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Supabase storage: ${error.message}`);
  if (!data?.some((b) => b.id === bucket || b.name === bucket)) {
    const created = await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    });
    if (created.error && !created.error.message.toLowerCase().includes("already")) {
      throw new Error(`Could not create storage bucket: ${created.error.message}`);
    }
  }
}
