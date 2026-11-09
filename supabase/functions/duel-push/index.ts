// "⚔️ X challenged you to a duel": web push to every browser the challenged player turned notifications on in.
// Called by the game right after duel_challenge succeeds, with the duel code. It only sends for a challenge made
// by the signed-in caller in the last 10 minutes, and only once per duel (duels.push_sent_at), so it can't be used
// to spam anyone. Subscriptions the browser has dropped (404/410) are deleted.
// Deploy with JWT verification ON (the game sends the player's login).
// Secret: VAPID_PRIVATE_KEY (the same private key as the GitHub secret). SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUB = "BJEpwgfhvJQ6swBMTtNNy8GAjdiYDkMkzIj8F4KHl2wsm62rNk7IBR9dIkfMI2fA1PEWWWtQMfddNWqpn7aL4AI";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
webpush.setVapidDetails("mailto:joseasalasnl@gmail.com", VAPID_PUB, Deno.env.get("VAPID_PRIVATE_KEY")!);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return out(405, { error: "POST only" });
  // who is calling
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await db.auth.getUser(jwt);
  const me = who?.user?.id;
  if (!me) return out(401, { error: "sign in" });
  let code = "";
  try { code = String((await req.json()).code || "").slice(0, 40); } catch { /* empty */ }
  if (!code) return out(400, { error: "code" });

  // the duel: a fresh challenge from this caller, not yet notified
  const { data: duel } = await db.from("duels").select("id, code, challenged_user, created_at, push_sent_at").eq("code", code).maybeSingle();
  if (!duel || !duel.challenged_user || duel.push_sent_at) return out(200, { sent: 0 });
  if (Date.now() - new Date(duel.created_at).getTime() > 10 * 60 * 1000) return out(200, { sent: 0, reason: "old" });
  const { data: p1 } = await db.from("duel_players").select("user_id, name").eq("duel_id", duel.id).eq("slot", 1).maybeSingle();
  if (!p1 || p1.user_id !== me) return out(403, { error: "not your duel" });
  // claim it first so two calls can't both send
  const { data: claimed } = await db.from("duels").update({ push_sent_at: new Date().toISOString() }).eq("id", duel.id).is("push_sent_at", null).select("id");
  if (!claimed?.length) return out(200, { sent: 0 });

  const { data: subs } = await db.from("push_subs").select("endpoint, sub, lang").eq("user_id", duel.challenged_user);
  let sent = 0;
  for (const s of subs || []) {
    const es = s.lang === "es";
    const name = String(p1.name || "Someone").slice(0, 16);
    const payload = JSON.stringify({
      title: es ? `⚔️ ${name} te ha retado a un duelo` : `⚔️ ${name} challenged you to a duel`,
      body: es ? "Acepta antes de 3 días y que gane el que más sabe." : "Accept within 3 days and may the best ball knowledge win.",
      url: `/duel.html?d=${encodeURIComponent(duel.code)}`,
      tag: "duel-" + duel.code,
    });
    try {
      await webpush.sendNotification(s.sub, payload, { TTL: 3 * 24 * 3600 });
      sent++;
    } catch (e) {
      const st = (e as { statusCode?: number }).statusCode;
      if (st === 404 || st === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint);
    }
  }
  return out(200, { sent });
});
