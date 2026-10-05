import { FilmShell } from "@/components/shell/FilmShell";

export default async function FilmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FilmShell filmId={id}>{children}</FilmShell>;
}
