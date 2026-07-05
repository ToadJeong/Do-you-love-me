import { createClient } from "@/lib/supabase/server";
import type { BucketItem } from "@/lib/types";

/** Fetch the couple's bucket-list items (RLS-scoped). */
export async function getBucketItems(): Promise<BucketItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bucket_items")
    .select("*")
    .order("done", { ascending: true })
    .order("sort_index", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as BucketItem[] | null) ?? [];
}
