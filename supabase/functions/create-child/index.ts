import { createClient } from "jsr:@supabase/supabase-js@2";

interface CreateChildPayload {
  displayName: string;
  emoji: string;
  pin: string;
  familyId: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Verify caller is authenticated parent (check Authorization header)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Verify the calling user is a parent in the same family
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: parentProfile } = await supabaseAdmin
    .from("profiles")
    .select("family_id, role")
    .eq("id", user.id)
    .single();

  if (!parentProfile || parentProfile.role !== "parent") {
    return new Response("Forbidden", { status: 403 });
  }

  let body: CreateChildPayload;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const { displayName, emoji, pin, familyId } = body;
  if (!displayName || !pin || !familyId || familyId !== parentProfile.family_id) {
    return new Response("Bad Request", { status: 400 });
  }

  // Create auth user with synthetic email
  const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: `child-${crypto.randomUUID()}@app.local`,
    password: pin,
    email_confirm: true,
  });

  if (createError || !authUser.user) {
    return new Response(JSON.stringify({ error: createError?.message ?? "Failed to create user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update the synthetic email to include the real user ID (needed for login)
  const childId = authUser.user.id;
  await supabaseAdmin.auth.admin.updateUserById(childId, {
    email: `child-${childId}@app.local`,
  });

  // Create profile
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: childId,
    family_id: familyId,
    display_name: displayName,
    emoji: emoji || "🧒",
    role: "child",
    locale: "es",
  });

  if (profileError) {
    // Clean up the auth user if profile creation failed
    await supabaseAdmin.auth.admin.deleteUser(childId);
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ id: childId, display_name: displayName, emoji: emoji || "🧒" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
