import { ThinkWithTheFilm } from "@/components/ai/ThinkWithTheFilm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThinkWithTheFilm filmId={id} />;
}
