import Intro from "@/components/Intro";
import Motion from "@/components/Motion";
import Shop from "@/components/Shop";
import { Delivery, Faq } from "@/components/Info";
import Combos from "@/components/Combos";
import Chapters from "@/components/Chapters";
import Heritage from "@/components/Heritage";
import Assembly from "@/components/Assembly";
import FinalOrder from "@/components/FinalOrder";

// The home page's scenes. The header, footer, cart and page transition live in the layout (app/layout.jsx), shared
// with the product pages. (Flavours, MenuBoard, Pack, Promos, the Ticker and the OfferRail are unmounted for a
// calmer page; their components are kept.)
export default function Home() {
  return (
    <>
      <main id="main">
        <Intro />
        <Heritage />
        <Assembly />
        <Shop />
        <Combos />
        <Chapters />
        <FinalOrder />
        <Delivery />
        <Faq />
      </main>
      <Motion />
    </>
  );
}
