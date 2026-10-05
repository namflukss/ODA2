import type { Metadata } from "next";
import { MyFilms } from "@/components/films/MyFilms";

export const metadata: Metadata = { title: "My films" };

export default function FilmsPage() {
  return <MyFilms />;
}
