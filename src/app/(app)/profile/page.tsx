import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCoupleMembers } from "@/lib/couples";
import { listPartnerNotes } from "@/app/actions/notes";
import { ProfileClient } from "./ProfileClient";

/** Couple profile: both partners' life info + notes about each other. */
export default async function ProfilePage() {
  const { userId, profile } = await getCurrentUser();
  if (!userId || !profile?.couple_id) {
    redirect("/onboarding");
  }

  const [members, notes] = await Promise.all([
    getCoupleMembers(profile.couple_id),
    listPartnerNotes(),
  ]);
  const partner = members.find((m) => m.id !== userId) ?? null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 md:max-w-3xl md:px-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">우리 프로필</h1>
      <ProfileClient
        me={profile}
        partner={partner}
        myId={userId}
        initialNotes={notes}
      />
    </main>
  );
}
