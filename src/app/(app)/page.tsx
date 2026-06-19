import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCouple, getCoupleMembers } from "@/lib/couples";
import { Hero } from "@/components/home/Hero";

/** Main home: lovedays-style D-Day hero. */
export default async function Home() {
  const { userId, profile } = await getCurrentUser();
  if (!userId || !profile?.couple_id) {
    redirect("/onboarding");
  }

  const couple = await getCouple();
  if (!couple) {
    redirect("/onboarding");
  }

  const members = await getCoupleMembers(couple.id);

  return (
    <Hero
      startDate={couple.start_date}
      bgUrl={couple.main_bg_url}
      members={members}
      myId={userId}
    />
  );
}
