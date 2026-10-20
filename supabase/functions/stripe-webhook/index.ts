// Stripe → Supabase: keeps public.infinity_subs in step with each player's Infinity subscription.
// Deploy with JWT verification OFF (Stripe can't send a Supabase login); every request is checked against the Stripe signing secret instead.
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// newer Stripe API versions keep the period end on the subscription item, older ones on the subscription
const periodEnd = (s: Stripe.Subscription) => {
  const t = (s as any).current_period_end ?? (s.items?.data?.[0] as any)?.current_period_end;
  return t ? new Date(t * 1000).toISOString() : null;
};

async function save(subId: string, userId?: string | null) {
  // always read the subscription fresh, so events arriving out of order can't write an old state
  const s = await stripe.subscriptions.retrieve(subId);
  const row = {
    stripe_customer: typeof s.customer === "string" ? s.customer : s.customer.id,
    stripe_sub: s.id,
    status: s.status,
    period_end: periodEnd(s),
    updated_at: new Date().toISOString(),
  };
  if (userId) {
    const { error } = await db.from("infinity_subs").upsert({ user_id: userId, ...row }, { onConflict: "user_id" });
    if (error) throw error;
    return;
  }
  const { data, error } = await db.from("infinity_subs").update(row).eq("stripe_sub", s.id).select("user_id");
  if (error) throw error;
  if (!data?.length) {
    const r = await db.from("infinity_subs").update(row).eq("stripe_customer", row.stripe_customer);
    if (r.error) throw r.error;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const body = await req.text();
  let ev: Stripe.Event;
  try {
    ev = await stripe.webhooks.constructEventAsync(body, req.headers.get("stripe-signature") ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, crypto);
  } catch {
    return new Response("bad signature", { status: 400 });
  }
  try {
    if (ev.type === "checkout.session.completed") {
      const s = ev.data.object as Stripe.Checkout.Session;
      const uid = s.client_reference_id;
      if (s.subscription && uid && UUID.test(uid)) await save(typeof s.subscription === "string" ? s.subscription : s.subscription.id, uid);
      else console.warn("checkout without a player id", s.id);
    } else if (ev.type.startsWith("customer.subscription.")) {
      await save((ev.data.object as Stripe.Subscription).id);
    }
  } catch (e) {
    console.error(ev.type, e);
    return new Response("error", { status: 500 }); // Stripe retries
  }
  return new Response("ok");
});
