import type { Product } from "@/types";

/**
 * FALLBACK catalogue. The live catalogue is the `products` table in Supabase, managed from
 * Admin → Products & Stock and read through lib/server/publicProducts.ts. This list is only
 * shown if the database can't be reached (or isn't set up yet) so the storefront never goes blank.
 *
 * Names + descriptions come from the existing Magna Eco Bites site.
 * `priceInr` and `packSize` are intentionally null: the existing site shows
 * "₹—" and lists no pack sizes. Fill them in here and the whole shop
 * (cards, product pages, cart subtotal, checkout summary) updates.
 * `image: null` shows a placeholder tile until real photography is added to
 * /public/images/products.
 */
export const products: Product[] = [
  {
    id: "idli-podi",
    slug: "idli-podi",
    name: "Idli Podi",
    tag: "Bestseller",
    description: "Traditional stone-ground idli podi — a lentil and spice blend.",
    longDescription:
      "Our classic idli podi: a traditional lentil and spice blend, stone-ground in small batches in Kolathur, Chennai. Stir into sesame or ghee oil and serve with idli, dosa or hot rice.",
    packSize: null,
    priceInr: null,
    image: null,
    imageAlt: "Magna Eco Bites Idli Podi pack",
    featured: true,
    stock: null,
  },
  {
    id: "country-sugar",
    slug: "country-sugar",
    name: "Country Sugar",
    tag: "Unrefined",
    description: "Minimally processed country sugar with a rich, rustic flavour.",
    longDescription:
      "Minimally processed country sugar, packed in Kolathur, Chennai. A rustic alternative for tea, coffee, payasam and everyday sweets.",
    packSize: null,
    priceInr: null,
    image: null,
    imageAlt: "Magna Eco Bites Country Sugar pack",
    featured: true,
    stock: null,
  },
  {
    id: "moringa-idli-podi",
    slug: "moringa-idli-podi",
    name: "Moringa Idli Podi",
    tag: "New",
    description: "Classic idli podi blended with moringa leaf — our newest blend.",
    longDescription:
      "Our classic idli podi blended with moringa leaf. Stone-ground in small batches in Kolathur, Chennai — traditional taste, naturally yours.",
    packSize: null,
    priceInr: null,
    image: "/images/products/moringa-idli-podi.jpg",
    imageAlt:
      "Kraft pack of Magna Eco Bites Moringa Idli Podi beside a wooden bowl of the podi",
    featured: true,
    stock: null,
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const featuredProducts = () => products.filter((p) => p.featured);
