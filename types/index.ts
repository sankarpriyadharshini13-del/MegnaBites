export interface Product {
  id: string;
  slug: string;
  name: string;
  tag?: string;
  /** Short card description. Keep to claims the founders can verify. */
  description: string;
  /** Longer copy for the product page. */
  longDescription: string;
  /** Pack size label, e.g. "200 g". null until confirmed by Magna Eco Bites. */
  packSize: string | null;
  /** Price in whole INR. null until confirmed — never guess. */
  priceInr: number | null;
  /** Path under /public. null renders an honest "photo coming soon" tile. */
  image: string | null;
  /** All photos (first one = `image`). Optional for the bundled fallback catalogue. */
  images?: string[];
  imageAlt: string;
  featured: boolean;
  /** Units in stock. null when stock isn't tracked (static fallback catalogue). */
  stock: number | null;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}
