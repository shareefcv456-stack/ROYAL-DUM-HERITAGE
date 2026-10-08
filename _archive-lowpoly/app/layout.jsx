import { Cormorant_Garamond, Inter } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Royal Dum Heritage — Slow-Cooked Biriyani",
  description: "Hand-sealed copper handi biriyani, slow-cooked on dum the royal way.",
};

export const viewport = { themeColor: "#0A0A0A" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
