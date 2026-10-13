import { CartButton } from "./Shop";
import { MobileNav } from "./Widgets";

// The header on every page: logo, Menu, Story, Order Biriyani, Cart. Links point at the home page's sections
// ("/#menu"), so they work from a product page too; on the home page itself they just scroll.
const NAV = [
  ["/#menu", "Menu"],
  ["/#story", "Story"],
];

export default function SiteHeader() {
  return (
    <header className="nav fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-paper/95 text-ink backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-10 xl:px-16">
        <a href="/#top" className="flex min-h-11 items-center gap-3" aria-label="Royal Dum Heritage, home">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-crimson font-serif text-lg text-ivory">RD</span>
          <span className="hidden font-serif text-lg tracking-[0.22em] sm:block">ROYAL DUM HERITAGE</span>
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
          {NAV.map(([h, l]) => (
            <a key={h} href={h} className="hidden min-h-11 content-center px-3 opacity-80 transition hover:opacity-100 lg:block">
              {l}
            </a>
          ))}
          <a href="/#menu" className="ml-2 inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-crimson px-4 font-semibold text-ivory transition hover:bg-crimson-deep sm:px-5">
            Order Biriyani
          </a>
          <CartButton className="ml-2" />
          <MobileNav links={NAV} />
        </nav>
      </div>
    </header>
  );
}
