import { json } from "@/lib/server/http";
import { getPublicProducts } from "@/lib/server/publicProducts";

export const dynamic = "force-dynamic";

/** Public storefront catalogue: visible products only. */
export async function GET() {
  return json({ products: await getPublicProducts() });
}
