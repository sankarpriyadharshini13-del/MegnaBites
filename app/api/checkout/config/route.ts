import { json } from "@/lib/server/http";
import { paymentProvider } from "@/lib/server/payments";
import { razorpayConfigured } from "@/lib/server/razorpay";
import { serviceConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** Public: tells the checkout which payment step to show and whether online ordering is available. */
export async function GET() {
  const ready = serviceConfigured && (paymentProvider === "dummy" || razorpayConfigured);
  return json({ provider: paymentProvider, ready });
}
