import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listRegions } from "@/app/actions/map";
import { TravelMap } from "@/components/map/TravelMap";

/** Scratch travel map — 시군구 단위, Seoul at 구 level. */
export default async function MapPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const visited = await listRegions();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 md:max-w-4xl md:px-8">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">여행 지도</h1>
      <p className="mb-4 text-sm text-neutral-400">
        다녀온 지역을 긁어서 사진으로 채워보세요
      </p>
      <TravelMap initialRegions={visited} />
    </main>
  );
}
