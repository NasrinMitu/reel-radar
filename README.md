# Reel Radar

A Next.js App Router MVP for saving movie and TV interests and testing release notifications.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `TMDB_API_KEY` to a TMDB API key.
3. Start the development server with `npm run dev`.

The app remains usable in demo mode without a key: it shows sample titles and the
“Check for New Matches” action creates local demo notifications. TMDB-backed
discovery requires the key and reports configuration or API errors in the UI.
Radars and notifications are stored in the browser's local storage.

## Discovery API

`GET /api/discover` accepts `format=movie|tv|both`, comma-separated TMDB genre
IDs in `genres` and `withoutGenres`, comma-separated `tags` (keyword or actor
names), and `minRating`. It queries TMDB's movie and/or TV discovery endpoints
for items released within the previous 14 days or next 90 days.
