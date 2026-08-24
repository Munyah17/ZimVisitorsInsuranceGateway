import type { Metadata } from "next";
import { fetchActiveProducts } from "@/lib/live-products";
import { QuoteWizard } from "./quote-wizard";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Get a Zimbabwe visitor insurance quote in minutes.",
};

export const dynamic = "force-dynamic";

export default async function QuotePage() {
  const products = await fetchActiveProducts();
  return <QuoteWizard products={products} />;
}
