// Stripe → Supabase: records each one-time Infinity purchase in public.infinity_subs (status 'paid', no end date).
// The Payment Link carries the player's account id as client_reference_id, so we know who paid.
// Deploy with JWT verification OFF (Stripe can't send a Supabase login); every request is checked against the webhook signing secret instead.
// Secret: STRIPE_WEBHOOK_SECRET (the whsec_... shown on the webhook endpoint in Stripe). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = new TextEncoder();
const TOLERANCE = 300; // seconds, same as Stripe's own libraries

// Stripe-Signature: t=<timestamp>,v1=<hex HMAC-SHA256 of "<timestamp>.<body>">
async function validSignature(body: string, header: string | null) {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(Deno.env.get("STRIPE_WEBHOOK_SECRET")!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${body}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => {
    if (s.length !== hex.length) return false;
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ s.charCodeAt(i);
    return diff === 0;
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const body = await req.text();
  if (!(await validSignature(body, req.headers.get("stripe-signature")))) return new Response("bad signature", { status: 400 });
  const ev = JSON.parse(body);
  const o = ev?.data?.object ?? {};
  try {
    if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
      if (o.payment_status !== "paid") return new Response("ok"); // bank transfers etc. arrive later as async_payment_succeeded
      const uid = o.client_reference_id;
      if (!uid || !UUID.test(uid)) {
        console.error("paid checkout without an account id", o.id);
        return new Response("ok");
      }
      const { error } = await db.from("infinity_subs").upsert({
        user_id: uid,
        stripe_customer: String(o.customer ?? o.customer_details?.email ?? ""),
        stripe_sub: String(o.payment_intent ?? o.id), // the payment, so a refund can find it
        status: "paid",
        period_end: null, // one-time purchase: never runs out
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
    } else if (ev.type === "charge.refunded" && o.refunded && o.payment_intent) {
      const { error } = await db.from("infinity_subs").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("stripe_sub", String(o.payment_intent));
      if (error) throw error;
    }
  } catch (e) {
    console.error(ev.type, e);
    return new Response("error", { status: 500 }); // Stripe retries
  }
  return new Response("ok");
});
