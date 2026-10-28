import "server-only";

/**
 * Which payment step checkout uses.
 *   "dummy"    — simulated payment (default). Orders are saved and emailed, no money moves.
 *   "razorpay" — real payments; needs RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.
 * Set PAYMENT_PROVIDER=razorpay in .env.local when you're ready to take real payments.
 */
export const paymentProvider: "dummy" | "razorpay" = process.env.PAYMENT_PROVIDER === "razorpay" ? "razorpay" : "dummy";

export const DUMMY_GATEWAY = "Test payment";
export const DUMMY_METHODS = ["UPI", "Card", "NetBanking"] as const;
