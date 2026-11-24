const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const MIN_RESULTS = 4;
const OLDEST_ALLOWED_RELEASE = "2026-01-01";
const MIN_NEW_TITLE_VOTE_COUNT = 20;
const TV_GENRE_MAPPINGS = {
  12: 10759,
  14: 10765,
  28: 10759,
  878: 10765,
  10752: 10768,
};

function splitIds(value) {
  return (value || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d+$/.test(id));
}

function mapGenresForMediaType(genreIds, mediaType) {
  if (mediaType !== "tv") return genreIds;
  return [...new Set(genreIds.map((id) => String(TV_GENRE_MAPPINGS[id] || id)))];
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

function mergeResults(...resultSets) {
  const byId = new Map();
  for (const item of resultSets.flat()) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function sortResults(results) {
  return results.sort((a, b) => {
    const posterDifference = Number(Boolean(b.poster_path)) - Number(Boolean(a.poster_path));
    return posterDifference || (b.popularity || 0) - (a.popularity || 0);
  });
}

function dateOffset(date, offsetDays) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + offsetDays);
  return result.toISOString().slice(0, 10);
}

function isWithinWindow(date, start, end) {
  return Boolean(date && date >= start && date <= end);
}

function getReturningSeasonDate(item, start, end) {
  const episodeDates = [
    item.next_episode_to_air,
    item.last_episode_to_air,
  ]
    .filter((episode) => episode && Number(episode.season_number) > 1)
    .map((episode) => episode.air_date)
    .filter((date) => isWithinWindow(date, start, end))
    .sort();
  return episodeDates[0] || "";
}

function isEligibleByRating(item, minimumRating, today) {
  const releaseDate = item.release_date;
  const upcoming = releaseDate > today;
  const lowVoteCount = Number(item.vote_count || 0) < MIN_NEW_TITLE_VOTE_COUNT;
  return upcoming || lowVoteCount || Number(item.vote_average || 0) >= minimumRating;
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
  const requestedMinimumRating = Number(searchParams.get("minRating") || 0);
  const minimumRating = Number.isFinite(requestedMinimumRating)
    ? Math.min(Math.max(requestedMinimumRating, 0), 10)
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = dateOffset(today, -90);
  const twelveMonthsAhead = dateOffset(today, 365);

  try {
    const { keywordIds, personIds } = await resolveTags(tags, apiKey);
    const commonParams = {
      with_keywords: keywordIds.join("|"),
      with_people: personIds.join("|"),
      sort_by: "popularity.desc",
      include_adult: "false",
      page: "1",
    };

    const types = format === "both" ? ["movie", "tv"] : [format];
    const results = await Promise.all(
      types.map(async (type) => {
        const typeParams = {
          ...commonParams,
          with_genres: mapGenresForMediaType(includedGenres, type).join("|"),
          without_genres: mapGenresForMediaType(excludedGenres, type).join("|"),
        };
        const dateParams =
          type === "movie"
            ? {
                "primary_release_date.gte": ninetyDaysAgo,
                "primary_release_date.lte": twelveMonthsAhead,
              }
            : {
                "air_date.gte": ninetyDaysAgo,
                "air_date.lte": twelveMonthsAhead,
                include_null_first_air_dates: "false",
              };
        const path = `/discover/${type}`;
        const normalize = (items) => items
          .map((item) => {
            const primaryDate = type === "movie" ? item.release_date : item.first_air_date;
            const returningSeasonDate = type === "tv"
              ? getReturningSeasonDate(item, ninetyDaysAgo, twelveMonthsAhead)
              : "";
            const releaseDate = type === "tv" && primaryDate < OLDEST_ALLOWED_RELEASE
              ? returningSeasonDate
              : primaryDate;
            return {
              ...item,
              media_type: type,
              release_date: releaseDate,
              posterUrl: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null,
            };
          })
          .filter((item) =>
            isWithinWindow(item.release_date, ninetyDaysAgo, twelveMonthsAhead) &&
            item.release_date >= OLDEST_ALLOWED_RELEASE &&
            isEligibleByRating(item, minimumRating, today),
          );
        const primaryData = await tmdbRequest(path, apiKey, { ...typeParams, ...dateParams });
        const primaryResults = normalize(primaryData.results || []);
        if (primaryResults.length >= MIN_RESULTS) return primaryResults;

        const fallbackData = await tmdbRequest(path, apiKey, {
          ...typeParams,
          ...dateParams,
          sort_by: type === "movie" ? "primary_release_date.asc" : "first_air_date.asc",
        });
        return mergeResults(primaryResults, normalize(fallbackData.results || []));
      }),
    );

    return Response.json({
      results: sortResults(results.flat()),
    });
  } catch (error) {
    console.error("TMDB discover request failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to fetch matches from TMDB." },
      { status: 502 },
    );
  }
}
