import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import Shutter from "@/components/Shutter";
import Loader from "@/components/Loader";
import { AddedNote, BottomBar, Cart } from "@/components/Shop";
import { Footer } from "@/components/Info";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Royal Dum Heritage — Malabar Dum Biriyani",
  description: "Malabar dum biriyani from Royal Dum Heritage. From our chembu to your doorstep: order for delivery or pickup.",
};

export const viewport = { themeColor: "#fff7ef", viewportFit: "cover" }; // cover: safe-area insets for the mobile bar

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Before the first paint: hold the hero's entrance until the loader lifts (Loader.jsx removes this class);
            removed anyway after 9 s, so nothing can stay paused. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('is-loading');setTimeout(function(){document.documentElement.classList.remove('is-loading')},9000)" }} />
        <noscript>
          <style>{".loader{display:none}"}</style>
        </noscript>
      </head>
      <body>
        <a href="#main" className="sr-only z-[60] rounded-full bg-saffron px-5 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <Footer />
        <BottomBar />
        <AddedNote />
        <Cart />
        <Shutter />
        <Loader />
      </body>
    </html>
  );
}
