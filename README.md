# Reel Radar

A Next.js App Router MVP for saving movie and TV interests and testing release notifications.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `TMDB_API_KEY` to a TMDB API key.
3. Optionally add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable cross-device persistence.
4. For Supabase persistence, run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor and enable anonymous sign-ins in the project's Auth settings.
5. Start the development server with `npm run dev`.

Without Supabase credentials, radars and notifications are stored in localStorage.
With Supabase configured, the app signs in anonymously and stores each user's data
under row-level security; Supabase errors fall back to browser-local persistence.
The “Run Radar Check Now” action finds live TMDB matches, deduplicates alerts, and
prepares one grouped digest payload. It does not send email; it marks the payload
as processed in `emailed_at` for a future email-delivery integration.

## Discovery API

`GET /api/discover` accepts `format=movie|tv|both`, comma-separated TMDB genre
IDs in `genres` and `withoutGenres`, comma-separated `tags` (keyword or actor
names), and `minRating`. It queries TMDB's movie and/or TV discovery endpoints
for items released within the previous 90 days or next 365 days.
