import { Memory } from "@/components/memory/Memory";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Memory filmId={id} />;
}
