const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function splitIds(value) {
  return (value || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d+$/.test(id));
}

async function tmdbRequest(path, apiKey, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status}) for ${path}`);
  }
  return response.json();
}

async function resolveTags(tags, apiKey) {
  const keywordIds = [];
  const personIds = [];

  await Promise.all(
    tags.map(async (tag) => {
      const [keywordResults, personResults] = await Promise.all([
        tmdbRequest("/search/keyword", apiKey, { query: tag, page: "1" }),
        tmdbRequest("/search/person", apiKey, { query: tag, page: "1" }),
      ]);
      const keyword = keywordResults.results?.[0];
      const person = personResults.results?.[0];
      if (keyword && keyword.name.toLowerCase() === tag.toLowerCase()) {
        keywordIds.push(String(keyword.id));
      }
      if (person && person.name.toLowerCase() === tag.toLowerCase()) {
        personIds.push(String(person.id));
      }
    }),
  );

  return {
    keywordIds: [...new Set(keywordIds)],
    personIds: [...new Set(personIds)],
  };
}

export async function GET(request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "TMDB is not configured. Add TMDB_API_KEY to .env.local and restart the app." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "both";
  if (!["movie", "tv", "both"].includes(format)) {
    return Response.json({ error: "format must be movie, tv, or both." }, { status: 400 });
  }

  const includedGenres = splitIds(searchParams.get("genres"));
  const excludedGenres = splitIds(searchParams.get("withoutGenres"));
  const tags = (searchParams.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);
  const minimumRating = Number(searchParams.get("minRating") || 0);
  const days = Math.min(Math.max(Number(searchParams.get("days") || 90), 1), 180);
  const start = new Date();
  start.setDate(start.getDate() - 14);
  const end = new Date();
  end.setDate(end.getDate() + days);
  const dateFrom = start.toISOString().slice(0, 10);
  const dateTo = end.toISOString().slice(0, 10);

  try {
    const { keywordIds, personIds } = await resolveTags(tags, apiKey);
    const commonParams = {
      with_genres: includedGenres.join("|"),
      without_genres: excludedGenres.join("|"),
      with_keywords: keywordIds.join("|"),
      with_people: personIds.join("|"),
      "vote_average.gte": Number.isFinite(minimumRating)
        ? String(Math.min(Math.max(minimumRating, 0), 10))
        : "0",
      "vote_count.gte": "5",
      sort_by: "popularity.desc",
      include_adult: "false",
      page: "1",
    };

    const types = format === "both" ? ["movie", "tv"] : [format];
    const results = await Promise.all(
      types.map(async (type) => {
        const dateParams =
          type === "movie"
            ? {
                "release_date.gte": dateFrom,
                "release_date.lte": dateTo,
              }
            : {
                "first_air_date.gte": dateFrom,
                "first_air_date.lte": dateTo,
              };
        const data = await tmdbRequest(`/discover/${type}`, apiKey, {
          ...commonParams,
          ...dateParams,
        });
        return (data.results || []).map((item) => ({
          ...item,
          media_type: type,
          release_date: type === "movie" ? item.release_date : item.first_air_date,
        }));
      }),
    );

    return Response.json({
      results: results.flat().sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
    });
  } catch (error) {
    console.error("TMDB discover request failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to fetch matches from TMDB." },
      { status: 502 },
    );
  }
}
