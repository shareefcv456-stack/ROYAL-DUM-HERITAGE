// Any address the site does not have, including a dish that is not on the menu.
export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[80svh] place-items-center bg-paper px-5 pt-24 text-center text-ink">
      <div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-copper-deep">Not on the menu</p>
        <h1 className="mt-3 font-serif text-5xl font-medium">We couldn&apos;t find that dish.</h1>
        <p className="mx-auto mt-4 max-w-md text-ink/65">It may have moved or never been on our menu. Every biriyani we make is on the menu page.</p>
        <a href="/#menu" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-crimson px-7 text-sm font-semibold text-ivory transition hover:bg-crimson-deep">
          Browse the menu
        </a>
      </div>
    </main>
  );
}
