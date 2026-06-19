import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPhotos } from "@/lib/photos";
import { Gallery } from "@/components/gallery/Gallery";

export default async function GalleryPage() {
  const { profile } = await getCurrentUser();
  if (!profile?.couple_id) {
    redirect("/onboarding");
  }

  const photos = await getPhotos();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500"
      >
        <ChevronLeft size={16} /> 홈으로
      </Link>
      <Gallery initialPhotos={photos} />
    </main>
  );
}
