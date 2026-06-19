import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCouple } from "@/lib/couples";
import { getRecentMessages } from "@/lib/chat";
import { ChatRoom } from "@/components/chat/ChatRoom";

export default async function ChatPage() {
  const { userId, profile } = await getCurrentUser();
  if (!userId || !profile?.couple_id) {
    redirect("/onboarding");
  }

  const [couple, messages] = await Promise.all([
    getCouple(),
    getRecentMessages(),
  ]);
  if (!couple) redirect("/onboarding");

  return (
    <main className="mx-auto w-full max-w-2xl">
      <ChatRoom
        initialMessages={messages}
        initialMemo={couple.memo}
        myId={userId}
        coupleId={couple.id}
      />
    </main>
  );
}
