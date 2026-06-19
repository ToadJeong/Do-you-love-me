import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCouple } from "@/lib/couples";
import { Download } from "lucide-react";
import { signout } from "../../(auth)/actions";
import { SettingsForm } from "./SettingsForm";
import { PushToggle } from "@/components/pwa/PushToggle";
import { ThemeToggle } from "@/components/pwa/ThemeToggle";
import { AccentPicker } from "@/components/pwa/AccentPicker";

export default async function SettingsPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const couple = await getCouple();
  if (!couple) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">설정</h1>

      <SettingsForm profile={profile} couple={couple} />

      <div className="mt-8 flex flex-col gap-8">
        <PushToggle />
        <ThemeToggle />
        <AccentPicker />

        <section>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            데이터 백업
          </label>
          <a
            href="/api/export"
            download
            className="mt-2 inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition dark:border-neutral-700 dark:text-neutral-200"
          >
            <Download size={16} />
            데이터 내보내기 (JSON)
          </a>
        </section>
      </div>

      <form action={signout} className="mt-10">
        <button
          type="submit"
          className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium transition active:scale-[0.99] dark:border-neutral-700"
        >
          로그아웃
        </button>
      </form>
    </main>
  );
}
