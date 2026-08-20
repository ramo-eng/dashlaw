import { ensureDocumentsBucket, isSupabaseConfigured } from "../src/lib/supabase";

if (!isSupabaseConfigured()) {
  console.error("Supabase env vars are missing.");
  process.exit(1);
}

await ensureDocumentsBucket();
console.log("Supabase documents bucket is ready.");
