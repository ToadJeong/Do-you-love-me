"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

/** base64url VAPID public key -> Uint8Array for PushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Toggle for D-Day / anniversary push notifications. Subscribes the browser to
 * Web Push (VAPID) and registers the subscription with the server.
 */
export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      !!vapid;
    // `supported` stays false unless we confirm support inside the async
    // callbacks below (avoids a synchronous setState in the effect body).
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSupported(true);
        setEnabled(!!sub);
      })
      .catch(() => setSupported(true));
  }, [vapid]);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("브라우저 알림 권한이 필요해요.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid!) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (res.ok) {
        setEnabled(true);
        setMsg("기념일 알림이 켜졌어요.");
      } else {
        setMsg("등록에 실패했어요.");
      }
    } catch {
      setMsg("알림 설정 중 문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("알림을 껐어요.");
    } catch {
      setMsg("문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <section>
        <label className="text-sm font-medium text-neutral-700">기념일 알림</label>
        <p className="mt-1 text-xs text-neutral-400">
          이 브라우저/환경에서는 푸시 알림을 사용할 수 없어요. (설치형 PWA 또는
          최신 브라우저에서 지원)
        </p>
      </section>
    );
  }

  return (
    <section>
      <label className="text-sm font-medium text-neutral-700">기념일 알림</label>
      <button
        type="button"
        onClick={enabled ? disable : enable}
        disabled={busy}
        className={`mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
          enabled
            ? "border border-neutral-300 text-neutral-700"
            : "bg-love text-white hover:bg-love-dark"
        }`}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : enabled ? (
          <BellOff size={16} />
        ) : (
          <Bell size={16} />
        )}
        {enabled ? "알림 끄기" : "기념일 알림 켜기"}
      </button>
      {msg && <p className="mt-2 text-xs text-neutral-500">{msg}</p>}
    </section>
  );
}
