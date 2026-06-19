import "server-only";
import webpush from "web-push";

/**
 * Configures web-push with VAPID credentials. SERVER ONLY.
 * Returns the configured `webpush` or null if VAPID keys are not set.
 */
let configured = false;

export function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) return null;

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends a push; returns the HTTP status (or 0 on transport error). */
export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<number> {
  const wp = getWebPush();
  if (!wp) return 0;
  try {
    const res = await wp.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
    );
    return res.statusCode;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return status ?? 0;
  }
}
