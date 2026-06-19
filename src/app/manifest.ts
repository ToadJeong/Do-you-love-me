import type { MetadataRoute } from "next";

/** Web app manifest (served at /manifest.webmanifest). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Do you love me",
    short_name: "DoULoveMe",
    description: "우리 둘만의 D-Day · 캘린더 · 갤러리",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FDEEE9",
    theme_color: "#C8546B",
    lang: "ko",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
