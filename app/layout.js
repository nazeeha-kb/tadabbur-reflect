import { Cormorant_Garamond, Inter, Patrick_Hand, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { UISettingsProvider } from "@/components/UISettingsProvider";
import "./globals.css";

const headingFont = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const numberFont = Instrument_Serif({
  variable: "--number-font",
  subsets: ["latin"],
  weight: ["400"],
  // style: ["normal", "italic"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
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
      className={`${headingFont.variable} ${bodyFont.variable} ${writingFont.variable} ${numberFont.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden bg-stone-50 text-slate-900">
        <UISettingsProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </UISettingsProvider>
      </body>
    </html>
  );
}
