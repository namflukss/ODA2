import { StoryMap } from "@/components/story/StoryMap";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryMap filmId={id} />;
}
