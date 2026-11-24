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
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ notifications: data });
  } catch (error) {
    console.error("Could not load Supabase notifications:", error);
    return supabaseErrorResponse(error);
  }
}

export async function PATCH(request) {
  if (!isSupabaseServerConfigured()) return unavailableResponse();
  try {
    const { client, userId } = await getAuthenticatedSupabase(request);
    const body = await request.json();
    let query = client.from("notifications").update({ is_read: true }).eq("user_id", userId);
    if (body.markAll !== true) {
      const ids = Array.isArray(body.ids)
        ? body.ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
        : [];
      if (!ids.length) return Response.json({ success: true });
      query = query.in("id", ids);
    }
    const { error } = await query;
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("Could not mark Supabase notifications read:", error);
    return supabaseErrorResponse(error);
  }
}

export async function DELETE(request) {
  if (!isSupabaseServerConfigured()) return unavailableResponse();
  try {
    const { client, userId } = await getAuthenticatedSupabase(request);
    const { error } = await client
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("Could not clear Supabase notifications:", error);
    return supabaseErrorResponse(error);
  }
}
