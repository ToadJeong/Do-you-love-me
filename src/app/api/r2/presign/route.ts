import { NextResponse, type NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2Config, publicUrlForKey } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];

/**
 * Mints a short-lived pre-signed PUT URL so the client can upload a photo
 * directly to R2 (the bytes never pass through our server). We only ever sign
 * a key scoped to the caller's own couple, derived from the session.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle<{ couple_id: string | null }>();

  if (!profile?.couple_id) {
    return NextResponse.json({ error: "no couple" }, { status: 403 });
  }

  let body: { contentType?: string; ext?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const contentType = body.contentType ?? "";
  if (!ALLOWED.includes(contentType)) {
    return NextResponse.json(
      { error: "unsupported content type" },
      { status: 400 },
    );
  }

  const ext = (body.ext ?? contentType.split("/")[1] ?? "jpg").replace(
    /[^a-z0-9]/gi,
    "",
  );
  const key = `couples/${profile.couple_id}/${crypto.randomUUID()}.${ext}`;

  try {
    const { bucket } = getR2Config();
    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 },
    );

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: publicUrlForKey(key),
    });
  } catch {
    return NextResponse.json(
      { error: "failed to sign upload" },
      { status: 500 },
    );
  }
}
