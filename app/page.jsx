import Story from "@/components/Story";

export default function Home() {
  return (
    <main>
      <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-charcoal/80 to-transparent">
        <div className="flex h-20 items-center justify-between px-5 sm:px-10">
          <a href="#opening" className="flex items-center gap-3" aria-label="Royal Dum Heritage — back to top">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 font-serif text-lg text-gold">RD</span>
            <span className="hidden font-serif text-lg tracking-[0.25em] text-ivory sm:block">ROYAL DUM HERITAGE</span>
          </a>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.25em] text-stone-300">
            <a href="#spice-vault" className="hidden transition hover:text-gold sm:inline">Spice Vault</a>
            <a href="#delivery" className="hidden transition hover:text-gold sm:inline">Delivery</a>
            <a href="#menu" className="rounded-full border border-gold/50 px-5 py-2 text-gold transition hover:bg-gold hover:text-charcoal">
              Order
            </a>
          </nav>
        </div>
      </header>

      <Story />

      <footer className="relative z-10 border-t border-gold/15 bg-charcoal px-5 py-14 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-stone-400 md:flex-row md:items-center md:justify-between">
          <p className="font-serif text-lg tracking-[0.25em] text-ivory">ROYAL DUM HERITAGE</p>
          <p>Malabar dum biriyani, sealed to order.</p>
          <p className="text-stone-600">Imagery: AI-generated for illustration.</p>
        </div>
      </footer>
    </main>
  );
}
