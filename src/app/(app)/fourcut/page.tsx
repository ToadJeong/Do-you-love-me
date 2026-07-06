import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCouple } from "@/lib/couples";
import { FourCutMaker } from "@/components/fourcut/FourCutMaker";

/** 인생네컷 — compose 4 photos into a branded photo-booth strip. */
export default async function FourCutPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }
  const couple = await getCouple();
  if (!couple) redirect("/onboarding");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">인생네컷</h1>
      <p className="mb-5 text-sm text-neutral-400">
        사진 4장을 골라 우리만의 네컷을 만들어보세요
      </p>
      <FourCutMaker startDate={couple.start_date} />
    </main>
  );
}
