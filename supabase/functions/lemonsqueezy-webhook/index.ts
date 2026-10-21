// Lemon Squeezy → Supabase: keeps public.infinity_subs in step with each player's Infinity subscription.
// Deploy with JWT verification OFF (Lemon Squeezy can't send a Supabase login); every request is checked against the webhook signing secret instead.
// Secret: LEMONSQUEEZY_WEBHOOK_SECRET (the "Signing secret" you typed when creating the webhook). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = new TextEncoder();

async function validSignature(body: string, sig: string | null) {
  if (!sig) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET")!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const body = await req.text();
  if (!(await validSignature(body, req.headers.get("x-signature")))) return new Response("bad signature", { status: 400 });
  const ev = JSON.parse(body);
  const name: string = ev?.meta?.event_name ?? "";
  if (!name.startsWith("subscription_") || ev?.data?.type !== "subscriptions") return new Response("ok");
  const a = ev.data.attributes ?? {};
  const uid = ev.meta?.custom_data?.user_id;
  const row = {
    stripe_customer: String(a.customer_id ?? ""),
    stripe_sub: String(ev.data.id),
    status: String(a.status ?? "unknown"),
    // a cancelled plan keeps working until the end of the month that was paid for
    period_end: a.ends_at ?? a.renews_at ?? null,
    updated_at: new Date().toISOString(),
  };
  try {
    if (uid && UUID.test(uid)) {
      const { error } = await db.from("infinity_subs").upsert({ user_id: uid, ...row }, { onConflict: "user_id" });
      if (error) throw error;
    } else {
      const { error } = await db.from("infinity_subs").update(row).eq("stripe_sub", row.stripe_sub);
      if (error) throw error;
    }
  } catch (e) {
    console.error(name, e);
    return new Response("error", { status: 500 }); // Lemon Squeezy retries
  }
  return new Response("ok");
});
