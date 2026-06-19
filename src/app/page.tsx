import { getCurrentUser } from "@/lib/auth";
import { signout } from "./(auth)/actions";

/**
 * Temporary authenticated landing.
 * Phase 3 will replace this with the D-Day dashboard + calendar.
 */
export default async function Home() {
  const { profile } = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {profile?.nickname ? `${profile.nickname}님, 환영해요 💕` : "환영해요 💕"}
      </h1>

      <div className="rounded-2xl border border-neutral-200 p-5 text-left text-sm text-neutral-600">
        <p>
          커플 연결 상태:{" "}
          <span className="font-medium text-neutral-900">
            {profile?.couple_id ? "연결됨" : "아직 연결되지 않음"}
          </span>
        </p>
        <p className="mt-1 break-all text-xs text-neutral-400">
          couple_id: {profile?.couple_id ?? "—"}
        </p>
      </div>

      <form action={signout}>
        <button
          type="submit"
          className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium transition active:scale-[0.99]"
        >
          로그아웃
        </button>
      </form>
    </main>
  );
}
