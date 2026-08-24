/** GET /api/products — public, live active insurance products. */

import { NextResponse } from "next/server";
import { fetchActiveProducts } from "@/lib/live-products";

export async function GET() {
  try {
    const products = await fetchActiveProducts();
    return NextResponse.json({ products });
  } catch (err) {
    console.error("Products list failed", err);
    return NextResponse.json({ products: [] }, { status: 503 });
  }
}
