import Hero from "@/components/Hero";
import Story from "@/components/Story";
import Shop, { BottomBar, Cart, CartButton } from "@/components/Shop";
import { Craft, Delivery, Faq, Footer, Ticker } from "@/components/Info";
import Flavours from "@/components/Flavours";
import Clock from "@/components/Clock";

const NAV = [
  ["#menu", "Menu"],
  ["#story", "The Dum"],
  ["#flavours", "Flavours"],
  ["#craft", "Craft"],
  ["#delivery", "Delivery"],
  ["#faq", "FAQ"],
];

export default function Home() {
  return (
    <>
      <a href="#menu" className="sr-only z-[60] rounded-full bg-saffron px-5 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to menu
      </a>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-ivory/10 bg-leaf-deep/90 text-ivory backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-10 xl:px-16">
          <a href="#top" className="flex min-h-11 items-center gap-3" aria-label="Royal Dum Heritage, back to top">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/60 font-serif text-lg text-gold">RD</span>
            <span className="hidden font-serif text-lg tracking-[0.22em] sm:block">ROYAL DUM HERITAGE</span>
          </a>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm lg:gap-3">
            {NAV.map(([h, l]) => (
              <a key={h} href={h} className="hidden min-h-11 content-center px-2 text-ivory/80 transition hover:text-gold lg:block">
                {l}
              </a>
            ))}
            <a href="#menu" className="ml-2 inline-flex min-h-11 items-center rounded-full bg-saffron px-5 font-semibold text-ink transition hover:bg-gold-soft">
              Order Biriyani
            </a>
            <span className="ml-3 hidden md:block">
              <CartButton />
            </span>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <Ticker />
        <Story />
        <Ticker tone="light" reverse />
        <Flavours />
        <Shop />
        <Craft />
        <Delivery />
        <Faq />
        <Clock />
      </main>
      <Footer />
      <BottomBar />
      <Cart />
    </>
  );
}
