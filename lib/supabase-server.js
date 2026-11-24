import { createClient } from "@supabase/supabase-js";

export function isSupabaseServerConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getAuthenticatedSupabase(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) throw new Error("A Supabase access token is required.");

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("The Supabase session is invalid or has expired.");
  }
  return { client, userId: data.user.id };
}

export function supabaseErrorResponse(error) {
  const message = error instanceof Error ? error.message : "Supabase request failed.";
  const status = message.includes("access token") || message.includes("session")
    ? 401
    : 502;
  return Response.json({ error: message }, { status });
}
