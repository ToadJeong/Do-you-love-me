import { redirect } from "next/navigation";
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
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <Gallery initialPhotos={photos} />
    </main>
  );
}
