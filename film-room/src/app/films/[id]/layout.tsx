import { Suspense } from "react";
import { FilmShell } from "@/components/shell/FilmShell";
import { seedState } from "@/data/seed";

/** Pre-render the sample films; other films render on demand (or client-side in a static export). */
export function generateStaticParams() {
  return seedState.films.map((f) => ({ id: f.id }));
}

export default async function FilmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <FilmShell filmId={id}>
      {/* Pages read the URL's search params (deep links); this keeps pre-rendering happy. */}
      <Suspense>{children}</Suspense>
    </FilmShell>
  );
}
