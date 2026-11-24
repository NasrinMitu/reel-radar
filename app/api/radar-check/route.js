import {
  getAuthenticatedSupabase,
  isSupabaseServerConfigured,
  supabaseErrorResponse,
} from "../../../lib/supabase-server";

function radarFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    format: row.format,
    genres: row.genres || [],
    excludedGenres: row.excluded_genres || [],
    tags: row.tags || [],
    alerts: row.alerts || [],
    color: row.color,
    minRating: Number(row.min_rating),
    isActive: row.is_active,
  };
}

function notificationFromMatch(radar, item) {
  return {
    user_id: radar.userId,
    radar_id: radar.id,
    tmdb_id: String(item.id),
    media_type: item.media_type,
    title: item.title || item.name,
    release_date: item.release_date || item.first_air_date || null,
    rating: Number(item.vote_average) || 0,
    poster_url: item.posterUrl || (item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : null),
    overview: item.overview || "",
    is_read: false,
    emailed_at: null,
  };
}

function toClientNotification(row, radar) {
  return {
    dbId: row.id,
    radarId: row.radar_id,
    radar: radar?.name || row.radar_id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    releaseDate: row.release_date || "",
    rating: Number(row.rating) || 0,
    posterUrl: row.poster_url || "",
    poster: row.poster_url || "",
    overview: row.overview || "",
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function discoverRadar(request, radar) {
  const query = new URLSearchParams({
    format: radar.format,
    genres: radar.genres.join(","),
    withoutGenres: radar.excludedGenres.join(","),
    tags: radar.tags.join(","),
    minRating: String(radar.minRating),
  });
  const url = new URL(`/api/discover?${query}`, request.url);
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Could not discover matches for ${radar.name}.`);
  }
  return data.results || [];
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The radar check request must contain valid JSON." }, { status: 400 });
  }
  let client = null;
  let userId = null;
  let radars;
  let allRadars;

  if (isSupabaseServerConfigured()) {
    try {
      ({ client, userId } = await getAuthenticatedSupabase(request));
      const { data, error } = await client
        .from("radars")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      const ownedRadars = (data || []).map((row) => ({ ...radarFromRow(row), userId }));
      radars = ownedRadars.filter((radar) => radar.isActive);
      allRadars = ownedRadars;
    } catch (error) {
      console.error("Could not load radars for radar check:", error);
      return supabaseErrorResponse(error);
    }
  } else {
    radars = Array.isArray(body.radars)
      ? body.radars.filter((radar) => radar?.isActive !== false)
      : [];
  }

  if (!radars.length && !client) {
    return Response.json({
      mode: client ? "supabase" : "local",
      matches: [],
      newNotifications: [],
      queuedCount: 0,
      digest: [],
    });
  }

  try {
    const matches = await Promise.all(radars.map(async (radar) => ({
      radar,
      results: await discoverRadar(request, radar),
    })));

    if (!client) {
      return Response.json({
        mode: "local",
        matches,
        newNotifications: [],
        queuedCount: 0,
        digest: [],
      });
    }

    const rows = matches.flatMap(({ radar, results }) =>
      results.map((item) => notificationFromMatch(radar, item)),
    );
    let insertedRows = [];
    if (rows.length) {
      const { data, error } = await client
        .from("notifications")
        .upsert(rows, {
          onConflict: "user_id,radar_id,media_type,tmdb_id",
          ignoreDuplicates: true,
        })
        .select("*");
      if (error) throw error;
      insertedRows = data || [];
    }

    const { data: pendingRows, error: pendingError } = await client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .is("emailed_at", null)
      .order("created_at", { ascending: false });
    if (pendingError) throw pendingError;

    const radarById = new Map((allRadars || radars).map((radar) => [radar.id, radar]));
    const digestByRadar = new Map();
    for (const row of pendingRows || []) {
      const radar = radarById.get(row.radar_id);
      if (!radar) continue;
      const group = digestByRadar.get(row.radar_id) || { radarId: row.radar_id, radar: radar.name, matches: [] };
      group.matches.push(toClientNotification(row, radar));
      digestByRadar.set(row.radar_id, group);
    }

    const processedAt = new Date().toISOString();
    const pendingIds = (pendingRows || []).map((row) => row.id);
    if (pendingIds.length) {
      const { error } = await client
        .from("notifications")
        .update({ emailed_at: processedAt })
        .eq("user_id", userId)
        .is("emailed_at", null)
        .in("id", pendingIds);
      if (error) throw error;
    }

    return Response.json({
      mode: "supabase",
      matches,
      newNotifications: insertedRows.map((row) =>
        toClientNotification(row, radarById.get(row.radar_id)),
      ),
      queuedCount: insertedRows.length,
      digest: [...digestByRadar.values()],
      processedAt,
    });
  } catch (error) {
    console.error("Radar check failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to run the radar check." },
      { status: 502 },
    );
  }
}
