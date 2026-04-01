import { VT323 } from "next/font/google";
import "./globals.css";

const pixelFont = VT323({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Quran Reflect",
  description: "A calm space to reflect on Quranic guidance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${pixelFont.variable} h-full`}>
      <body className="min-h-full win-desktop">{children}</body>
    </html>
  );
}
