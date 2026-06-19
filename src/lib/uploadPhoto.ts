/**
 * Client-side direct-to-R2 upload:
 *   1) ask our Route Handler for a pre-signed PUT URL
 *   2) PUT the file straight to R2 (bytes never touch our server)
 *   3) return the final public URL to store in Supabase
 */
export async function uploadPhotoToR2(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  const presignRes = await fetch("/api/r2/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, ext }),
  });

  if (!presignRes.ok) {
    throw new Error("presign failed");
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("upload failed");
  }

  return publicUrl;
}
