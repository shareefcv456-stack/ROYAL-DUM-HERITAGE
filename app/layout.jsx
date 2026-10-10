import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Royal Dum Heritage — Malabar Dum Biriyani",
  description: "Malabar dum biriyani from Royal Dum Heritage. From our chembu to your doorstep: order for delivery or pickup.",
};

export const viewport = { themeColor: "#10231a", viewportFit: "cover" }; // cover: safe-area insets for the mobile bar

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
