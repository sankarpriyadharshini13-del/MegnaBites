/**
 * Brand story content for the home page and the About Us page.
 *
 * Everything here restates what the existing site already says about Magna Eco Bites
 * (data/site.ts, the original About/Sourcing/Usage sections and the product copy). Nothing adds
 * health benefits, certifications or dietary guarantees — keep it that way unless the owners
 * confirm a new claim in writing.
 */

export const story = {
  inspiration:
    "Magna Eco Bites draws inspiration from traditional South Indian cooking — stone-ground podis, slow methods and the care that goes into every step.",
  roots:
    "We are family-run from Kolathur, Chennai, close to where our ingredients come from and to the people we cook for.",
  family:
    "Two founders run the show: Mageshwaran oversees sourcing and quality, and Sathish runs the kitchen. Small batches, made fresh.",
};

/** Organic cultivation, ingredient sourcing and thoughtful food choices. */
export const sourcingPrinciples = [
  {
    key: "cultivation",
    title: "Organic cultivation",
    body: "We favour organically grown ingredients from trusted farms in Tamil Nadu, chosen for flavour and freshness.",
  },
  {
    key: "sourcing",
    title: "Ingredient sourcing",
    body: "Every pack is sourced and packed locally in Kolathur, Chennai — close enough that the founders can trace what goes in.",
  },
  {
    key: "choices",
    title: "Thoughtful food choices",
    body: "Simple, traditional recipes — lentils, spices, moringa leaf and minimally processed country sugar — so you know what is on your plate.",
  },
] as const;

export const team = [
  {
    name: "Mageshwaran",
    role: "Co-founder · Director & Export Sales",
    focus: "Oversees sourcing and quality.",
    founder: true,
  },
  {
    name: "Sathish",
    role: "Co-founder · Branch Manager",
    focus: "Runs the kitchen where every batch is stone-ground.",
    founder: true,
  },
  {
    name: "Dinesh Kumar",
    role: "Digital Marketing & E-commerce",
    focus: "Brings Magna Eco Bites to customers online.",
    founder: false,
  },
] as const;

export interface ServingIdea {
  dish: string;
  /** Product this idea is built around (matched against the live catalogue). */
  productSlug: string;
  productName: string;
  summary: string;
  steps: string[];
  tip: string;
}

/** Serving suggestions with South Indian dishes. Product links resolve against the database. */
export const servingIdeas: ServingIdea[] = [
  {
    dish: "Idli with podi & sesame oil",
    productSlug: "idli-podi",
    productName: "Idli Podi",
    summary: "The classic South Indian breakfast: soft, steamed idlis with a spoon of stone-ground podi.",
    steps: [
      "Spoon one or two teaspoons of idli podi onto your plate.",
      "Make a small well and pour in sesame (gingelly) oil or a little ghee.",
      "Mix into a paste and dip hot idlis straight in.",
    ],
    tip: "Best with sesame oil or ghee",
  },
  {
    dish: "Dosa with moringa podi",
    productSlug: "moringa-idli-podi",
    productName: "Moringa Idli Podi",
    summary: "Crisp dosa with our moringa-leaf podi blend — for breakfast or an evening tiffin.",
    steps: [
      "Spread the dosa batter thin on a hot tawa.",
      "Sprinkle moringa idli podi over it and drizzle a few drops of oil.",
      "Fold and serve hot, with chutney on the side.",
    ],
    tip: "Also great mixed into hot rice",
  },
  {
    dish: "Payasam & sweets",
    productSlug: "country-sugar",
    productName: "Country Sugar",
    summary: "Minimally processed country sugar brings a rich, rustic sweetness to traditional desserts.",
    steps: [
      "Use it in payasam, kesari or halwa as you would regular sugar.",
      "Stir it into tea or coffee for an everyday rustic note.",
      "Store in an airtight jar to keep it free-flowing.",
    ],
    tip: "Ideal for desserts, tea and coffee",
  },
];

export const faqs = [
  {
    q: "How do I place an order?",
    a: "Add products to your cart and choose “Place order by email”. This opens a pre-filled email to us — we reply to confirm availability, the total and payment details.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Online payment is coming soon. For now we share payment options when we confirm your order by email.",
  },
  {
    q: "How are your products sourced?",
    a: "We source from trusted farms in Tamil Nadu, and every product is ground and packed in small batches in our Kolathur, Chennai kitchen.",
  },
  {
    q: "How should I store the products?",
    a: "Store in a cool, dry place away from direct sunlight. Once opened, keep in an airtight container to maintain freshness.",
  },
  {
    q: "What is your shipping policy?",
    a: "We ship across India. Orders are typically processed within 1–2 business days; delivery times vary by location.",
  },
  {
    q: "Can I return or exchange products?",
    a: "Because these are food products, we accept returns only for damaged or incorrect items. Please contact us within 48 hours of delivery.",
  },
  {
    q: "Do the products suit my diet or allergies?",
    a: "Please check the ingredients on the pack, and contact us before ordering if you have specific dietary requirements or allergies — we're happy to help.",
  },
  {
    q: "Do you take bulk orders for businesses?",
    a: "Yes — we welcome bulk orders from restaurants, cafés and retail stores. Contact us for pricing and availability.",
  },
];
