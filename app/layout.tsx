import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "@/app/globals.css";

const fira = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Stable Manager",
  description: "Riding lessons and boarding billing tracker."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={fira.className}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,180,105,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(47,75,58,0.25),_transparent_60%)]">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
