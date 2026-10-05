import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
import { FilmRoomProvider } from "@/lib/store";
import "./globals.css";

const grotesk = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-grotesk",
});

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

export const metadata: Metadata = {
  title: { default: "Film Room", template: "%s — Film Room" },
  description: "A creative workspace for developing and understanding a film.",
};

export const viewport: Viewport = {
  themeColor: "#f3efe6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${editorial.variable}`}>
      <body>
        <FilmRoomProvider>{children}</FilmRoomProvider>
      </body>
    </html>
  );
}
