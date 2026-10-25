import type { Settings } from "./types";

/** Used until the owner saves Settings for the first time (the row is created on first save). */
export const defaultSettings = (): Settings => ({
  store: {
    name: "Magna Eco Bites",
    owner: "Magesh",
    address: "Kolathur, Chennai – 600099, Tamil Nadu",
    phone: "",
    email: "hello@magnaecobites.in",
    gstin: "",
    udyam: "",
  },
  razorpay: { mode: "Live", upi: true, cards: true, netbanking: true, cod: false, payoutAccount: "" },
  notifications: { newOrder: true, lowStock: true, orderEmail: true, whatsapp: false },
  invoice: {
    footer: "Thank you for choosing organic. Questions? hello@magnaecobites.in",
    numberFormat: "MEB-0000",
    logo: null,
  },
});

export const PRODUCT_COLORS = ["#c8602b", "#d9a441", "#3b5a3a", "#7a8fbf", "#b8654f", "#8a7a5a"];
