import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Server-only Cloudflare R2 (S3-compatible) client.
 *
 * R2 credentials must NEVER reach the browser — this module imports
 * "server-only" so any accidental client import fails the build.
 */

export function getR2Config() {
  const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
  } = process.env;

  if (
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_ENDPOINT ||
    !R2_BUCKET_NAME
  ) {
    throw new Error(
      "Missing R2 env vars. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, " +
        "R2_ENDPOINT and R2_BUCKET_NAME (see .env.local.example).",
    );
  }

  return {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    endpoint: R2_ENDPOINT,
    bucket: R2_BUCKET_NAME,
  };
}

let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;
  const cfg = getR2Config();
  cached = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return cached;
}

/** Build the public read URL for an object key (served via R2 public bucket / CDN). */
export function publicUrlForKey(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_R2_PUBLIC_URL.");
  }
  return `${base}/${key}`;
}
