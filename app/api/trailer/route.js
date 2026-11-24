const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "TMDB is not configured. Add TMDB_API_KEY to .env.local and restart the app." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  const type = searchParams.get("type") || "";
  if (!/^\d+$/.test(id) || !["movie", "tv"].includes(type)) {
    return Response.json({ error: "A numeric id and type of movie or tv are required." }, { status: 400 });
  }

  try {
    const url = new URL(`${TMDB_BASE_URL}/${type}/${id}/videos`);
    url.searchParams.set("api_key", apiKey);
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`TMDB trailer request failed (${response.status}).`);
    }

    const data = await response.json();
    const youtubeVideos = (data.results || []).filter((video) => video.site === "YouTube");
    const trailer =
      youtubeVideos.find((video) => video.official && video.type === "Trailer") ||
      youtubeVideos.find((video) => video.type === "Trailer") ||
      youtubeVideos.find((video) => video.type === "Teaser");
    return Response.json({ key: trailer?.key || null });
  } catch (error) {
    console.error("TMDB trailer request failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to fetch trailer from TMDB." },
      { status: 502 },
    );
  }
}
