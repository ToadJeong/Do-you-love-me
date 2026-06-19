import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingForms } from "./OnboardingForms";

/** Couple-connection onboarding. Users who already have a couple skip this. */
export default async function OnboardingPage() {
  const { profile } = await getCurrentUser();

  if (profile?.couple_id) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">커플 연결하기</h1>
        <p className="mt-2 text-sm text-neutral-500">
          두 사람이 연결되어야 D-Day와 기록을 함께 볼 수 있어요.
        </p>
      </div>
      <OnboardingForms />
    </main>
  );
}
