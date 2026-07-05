import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import {
  getCouple,
  getCoupleMembers,
  getUpcomingCustomAnniversaries,
} from "@/lib/couples";
import { getBucketItems } from "@/lib/bucket";
import { Hero } from "@/components/home/Hero";
import { BucketList } from "@/components/home/BucketList";

/** Main home: lovedays-style D-Day hero + shared bucket list. */
export default async function Home() {
  const { userId, profile } = await getCurrentUser();
  if (!userId || !profile?.couple_id) {
    redirect("/onboarding");
  }

  const couple = await getCouple();
  if (!couple) {
    redirect("/onboarding");
  }

  const todayISO = format(new Date(), "yyyy-MM-dd");
  const [members, customAnniversaries, bucketItems] = await Promise.all([
    getCoupleMembers(couple.id),
    getUpcomingCustomAnniversaries(todayISO),
    getBucketItems(),
  ]);

  return (
    <>
      <Hero
        startDate={couple.start_date}
        bgUrl={couple.main_bg_url}
        members={members}
        myId={userId}
        customAnniversaries={customAnniversaries}
      />
      <BucketList initialItems={bucketItems} />
    </>
  );
}
