import { Room } from "@/components/room/Room";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Room filmId={id} />;
}
