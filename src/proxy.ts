import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 "proxy" (the renamed middleware). Runs before routes render and
 * keeps the Supabase session fresh on every request.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - _next/static (static files)
     *  - _next/image (image optimization)
     *  - PWA assets that must stay publicly reachable (manifest, sw, icons)
     *  - favicon.ico and common static asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|apple-icon|icon.svg|icon-192|icon-512|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|json|webmanifest|ico)$).*)",
  ],
};
