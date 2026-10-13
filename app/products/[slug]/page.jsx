import { notFound } from "next/navigation";
import { DISHES, bySlug, slugOf } from "@/components/dishes";
import DishPage from "@/components/DishPage";

// One page per biriyani, at /products/<its name> (dishes.js slugOf), built ahead of time from the menu. Any other
// address under /products is the not-found page (app/not-found.jsx).
export const dynamicParams = false;
export const generateStaticParams = () => DISHES.map((x) => ({ slug: slugOf(x) }));

export async function generateMetadata({ params }) {
  const x = bySlug((await params).slug);
  return x ? { title: `${x.full} — Royal Dum Heritage`, description: x.note } : {};
}

export default async function Product({ params }) {
  const x = bySlug((await params).slug);
  if (!x) notFound();
  return <DishPage id={x.id} />;
}
