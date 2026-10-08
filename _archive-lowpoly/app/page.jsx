import Story from "@/components/Story";
import SpiceVault from "@/components/SpiceVault";
import Menu from "@/components/Menu";

const PILLARS = [
  { title: "24-hour marination", body: "Meat rests overnight in hung curd, raw papaya and whole spices before it meets the rice." },
  { title: "Copper handi dum", body: "Tin-lined copper spreads the heat evenly, so the bottom layer never scorches while the top steams." },
  { title: "Single-origin saffron", body: "We buy Pampore saffron directly from the growers, at roughly a gram for every three pots." },
];

export default function Home() {
  return (
    <main>
      <nav className="glass bg-charcoal/90! fixed inset-x-0 top-0 z-50 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <a href="#top" className="font-serif text-xl font-semibold tracking-wide text-gold">Royal Dum</a>
          <div className="flex items-center gap-5 text-sm text-stone-300 sm:gap-8">
            <a href="#vault" className="hidden transition hover:text-gold sm:inline">Spice Vault</a>
            <a href="#menu" className="transition hover:text-gold">Menu</a>
            <a href="#order" className="rounded-full border border-gold/50 px-4 py-1.5 text-gold transition hover:bg-gold hover:text-charcoal">Order</a>
          </div>
        </div>
      </nav>

      <Story />

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pt-24 sm:px-8 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="glass rounded-2xl p-7">
            <div className="mb-5 h-px w-12 bg-gold" />
            <h3 className="font-serif text-2xl font-semibold text-gold-soft">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-400">{p.body}</p>
          </div>
        ))}
      </section>

      <SpiceVault />
      <Menu />

      <footer id="order" className="border-t border-gold/15 px-4 py-20 text-center sm:px-8">
        <h2 className="gold-text font-serif text-5xl font-semibold sm:text-6xl">Unseal tonight.</h2>
        <p className="mx-auto mt-4 max-w-md text-stone-400">Delivered in its sealed handi within 45 minutes. Open it at the table.</p>
        <a href="tel:+910000000000" className="mt-8 inline-block rounded-full bg-gold px-8 py-3.5 font-semibold text-charcoal transition hover:bg-gold-soft">
          Call to order
        </a>
        <p className="mt-16 text-xs uppercase tracking-[0.3em] text-stone-600">© Royal Dum Heritage</p>
      </footer>
    </main>
  );
}
