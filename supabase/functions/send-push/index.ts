import { createClient } from "jsr:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@fichas.app";

interface SendPushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function makeVapidJwt(audience: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: VAPID_SUBJECT };

  const encHeader = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header)),
  );
  const encPayload = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const sigInput = `${encHeader}.${encPayload}`;

  const keyData = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(sigInput),
  );

  const sig = uint8ArrayToBase64Url(new Uint8Array(sigBuf));
  return `${sigInput}.${sig}`;
}

async function sendPushToEndpoint(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  const origin = new URL(endpoint).origin;
  const jwt = await makeVapidJwt(origin);
  const authHeader = `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`;

  const body = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(body);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "Content-Length": String(encoded.length),
      TTL: "86400",
    },
    body: encoded,
  });

  return res.ok || res.status === 201;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: SendPushPayload;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const { userId, title, body: notifBody, url } = body;
  if (!userId || !title || !notifBody) {
    return new Response("Missing fields", { status: 400 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) return new Response(error.message, { status: 500 });
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = await Promise.allSettled(
    subs.map((s) => sendPushToEndpoint(s.endpoint, s.p256dh, s.auth, { title, body: notifBody, url })),
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
