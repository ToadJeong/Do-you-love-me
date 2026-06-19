import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCouple } from "@/lib/couples";
import { signout } from "../(auth)/actions";
import { SettingsForm } from "./SettingsForm";

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
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500"
      >
        <ChevronLeft size={16} /> 홈으로
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">설정</h1>

      <SettingsForm profile={profile} couple={couple} />

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
