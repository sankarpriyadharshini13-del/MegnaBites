export const site = {
  name: "Magna Eco Bites",
  location: "Kolathur, Chennai",
  email: "hello@magnaecobites.com", // from existing site — confirm before launch
  phone: null as string | null, // missing on existing site
  nav: [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop for Home" },
    { href: "/#business", label: "For Business" },
    { href: "/#distributors", label: "Distributors" },
    { href: "/#export", label: "Export" },
  ],
};

/** Differentiators — all taken from the existing site's own copy. Owner to confirm. */
export const differentiators = [
  {
    title: "Sourced & packed in Kolathur",
    body: "Every pack is sourced and packed locally in Kolathur, Chennai — close enough that the founders can trace what goes in.",
    icon: "pin",
  },
  {
    title: "Stone-ground, the traditional way",
    body: "Time-honoured recipes, ground on stone in our own kitchen. No factory lines, no shortcuts to the taste you grew up with.",
    icon: "stone",
  },
  {
    title: "Small batches, family run",
    body: "Two founders run the show: Mageshwaran oversees sourcing and quality, Sathish runs the kitchen. Small batches, made fresh.",
    icon: "family",
  },
] as const;
