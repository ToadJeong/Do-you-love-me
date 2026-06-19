import { ImageResponse } from "next/og";

// 512×512 PNG app icon (also used as the maskable icon — full-bleed bg keeps
// the heart inside the maskable safe zone). Generated at build via next/og.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF1EC, #FDDDD7)",
        }}
      >
        <svg width="320" height="320" viewBox="0 0 100 100">
          <path
            d="M50 88 C50 88 12 61 12 36 C12 22 22 14 33 14 C41 14 47 19 50 26 C53 19 59 14 67 14 C78 14 88 22 88 36 C88 61 50 88 50 88 Z"
            fill="#C8546B"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
