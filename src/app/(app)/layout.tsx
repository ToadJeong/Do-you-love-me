import { AppNav } from "@/components/shell/AppNav";

/**
 * Shell for the authenticated app: responsive primary nav (bottom tab on
 * mobile, left sidebar on desktop) plus the page content. Auth/onboarding
 * pages live outside this group and render without the shell.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="md:pl-60">
      <AppNav />
      {/* pb leaves room for the mobile bottom tab bar */}
      <div className="min-h-dvh pb-16 md:pb-0">{children}</div>
    </div>
  );
}
