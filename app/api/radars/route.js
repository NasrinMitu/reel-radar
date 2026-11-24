import {
  getAuthenticatedSupabase,
  isSupabaseServerConfigured,
  supabaseErrorResponse,
} from "../../../lib/supabase-server";

function unavailableResponse() {
  return Response.json({ error: "Supabase is not configured." }, { status: 503 });
}

export async function GET(request) {
  if (!isSupabaseServerConfigured()) return unavailableResponse();
  try {
    const { client, userId } = await getAuthenticatedSupabase(request);
    const { data, error } = await client
      .from("radars")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ radars: data });
  } catch (error) {
    console.error("Could not load Supabase radars:", error);
    return supabaseErrorResponse(error);
  }
}

export async function POST(request) {
  if (!isSupabaseServerConfigured()) return unavailableResponse();
  try {
    const { client, userId } = await getAuthenticatedSupabase(request);
    const radar = await request.json();
    if (
      typeof radar.id !== "string" ||
      typeof radar.name !== "string" ||
      !["movie", "tv", "both"].includes(radar.format)
    ) {
      return Response.json({ error: "A radar id, name, and valid format are required." }, { status: 400 });
    }

    const row = {
      id: radar.id,
      user_id: userId,
      name: radar.name.trim(),
      format: radar.format,
      genres: Array.isArray(radar.genres) ? radar.genres : [],
      excluded_genres: Array.isArray(radar.excludedGenres) ? radar.excludedGenres : [],
      tags: Array.isArray(radar.tags) ? radar.tags : [],
      alerts: Array.isArray(radar.alerts) ? radar.alerts : [],
      color: typeof radar.color === "string" ? radar.color : "#e11d48",
      min_rating: Number(radar.minRating) || 0,
      is_active: radar.isActive !== false,
    };
    const { data, error } = await client
      .from("radars")
      .upsert(row, { onConflict: "user_id,id" })
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ radar: data });
  } catch (error) {
    console.error("Could not save Supabase radar:", error);
    return supabaseErrorResponse(error);
  }
}

export async function DELETE(request) {
  if (!isSupabaseServerConfigured()) return unavailableResponse();
  try {
    const { client, userId } = await getAuthenticatedSupabase(request);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "A radar id is required." }, { status: 400 });
    const { error } = await client
      .from("radars")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("Could not delete Supabase radar:", error);
    return supabaseErrorResponse(error);
  }
}
