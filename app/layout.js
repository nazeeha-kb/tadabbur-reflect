import { Amiri, Cormorant_Garamond, Manrope, Patrick_Hand } from "next/font/google";
import "./globals.css";

const headingFont = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const arabicFont = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const writingFont = Patrick_Hand({
  variable: "--font-writing",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Quran Reflect",
  description: "A calm space to reflect on Quranic guidance.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${arabicFont.variable} ${writingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-stone-50 text-slate-900">{children}</body>
    </html>
  );
}
