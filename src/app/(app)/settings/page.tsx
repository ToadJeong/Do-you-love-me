import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCouple } from "@/lib/couples";
import { signout } from "../../(auth)/actions";
import { SettingsForm } from "./SettingsForm";
import { PushToggle } from "@/components/pwa/PushToggle";

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

      <div className="mt-8">
        <PushToggle />
      </div>

      <form action={signout} className="mt-10">
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
