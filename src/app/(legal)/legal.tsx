import Link from "next/link";

/** Shared shell for public legal pages (privacy / terms). */
export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm font-medium text-love">
        ♥ 럽노트 (LuvNote)
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-col gap-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-10 text-xs text-neutral-400">
        시행일: 2026년 7월 6일 · 문의: jws.wonseok@gmail.com
      </p>
    </main>
  );
}
