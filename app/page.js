"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  FaArrowRight,
  FaArrowRotateRight,
  FaBell,
  FaCalendar,
  FaCheck,
  FaChevronRight,
  FaCirclePlay,
  FaFilm,
  FaMagnifyingGlass,
  FaPen,
  FaPlus,
  FaRegClock,
  FaSliders,
  FaStar,
  FaTrash,
  FaTv,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10768, name: "War & Politics" },
];

const INITIAL_RADARS = [
  {
    id: "radar-romcom",
    name: "Cozy Rom-Coms",
    format: "movie",
    genres: [35, 10749],
    excludedGenres: [27],
    tags: ["friends to lovers"],
    minRating: 6.5,
    alerts: ["On Release Day", "Trailer Drop"],
    color: "#e5aa80",
  },
  {
    id: "radar-fantasy",
    name: "Epic Fantasy Worlds",
    format: "tv",
    genres: [14, 10765],
    excludedGenres: [27],
    tags: ["magic"],
    minRating: 7,
    alerts: ["New Season", "Trailer Drop"],
    color: "#9da8d3",
  },
  {
    id: "radar-indie",
    name: "Indie Darlings",
    format: "both",
    genres: [18],
    excludedGenres: [],
    tags: [],
    minRating: 7.5,
    alerts: ["On Release Day"],
    color: "#93b49a",
  },
];

const SAMPLE_TITLES = [
  {
    id: 1,
    title: "The Idea of You",
    release_date: "2026-11-24",
    vote_average: 7.8,
    media_type: "movie",
    overview: "A chance encounter turns into the kind of unexpected love story you can’t help rooting for.",
    genres: [35, 10749],
    badge: "Coming this week",
    radar: "Cozy Rom-Coms",
  },
  {
    id: 2,
    title: "The Clockwork Kingdom",
    release_date: "2026-11-28",
    vote_average: 8.4,
    media_type: "tv",
    overview: "In a kingdom powered by ancient magic, one unlikely crew is about to rewrite the rules of destiny.",
    genres: [14, 10765],
    badge: "New season",
    radar: "Epic Fantasy Worlds",
  },
  {
    id: 3,
    title: "Little, Big Feelings",
    release_date: "2026-12-02",
    vote_average: 7.6,
    media_type: "movie",
    overview: "A tender, quietly funny story about finding your way home when life takes an unexpected turn.",
    genres: [18],
    badge: "Just announced",
    radar: "Indie Darlings",
  },
  {
    id: 4,
    title: "Love, Offline",
    release_date: "2026-12-05",
    vote_average: 7.2,
    media_type: "movie",
    overview: "Two strangers put their phones away and discover that the best connections happen in real life.",
    genres: [35, 10749],
    badge: "Trailer dropped",
    radar: "Cozy Rom-Coms",
  },
];

const POSTER_BACKDROPS = [
  "linear-gradient(155deg, #dca578, #4f3d37 55%, #231f28)",
  "linear-gradient(145deg, #a6b0d7, #665f87 55%, #28283b)",
  "linear-gradient(145deg, #b5c5a5, #67775d 55%, #29332d)",
  "linear-gradient(145deg, #dd9c85, #904d4b 52%, #2f2632)",
];

const ALERT_OPTIONS = ["On Release Day", "New Season", "Trailer Drop"];
const OLDEST_ALLOWED_RELEASE = "2026-01-01";

function getAlertKey(item) {
  const radarId = item.radarId || item.radar || "unknown-radar";
  const mediaType = item.mediaType || item.type || item.media_type || "unknown";
  const tmdbId = item.tmdbId || item.id;
  return tmdbId === undefined || tmdbId === null
    ? null
    : `${radarId}-${mediaType}-${tmdbId}`;
}

function normalizeNotification(item, radars) {
  if (!item || typeof item !== "object") return null;

  const radar = radars.find((candidate) =>
    candidate.id === item.radarId || candidate.name === item.radar,
  );
  const legacyRadarId = radar?.id || item.radarId || item.radar || "unknown-radar";
  const legacyId = String(item.id ?? "");
  const legacyTmdbIdMarker = `-${legacyRadarId}-`;
  const legacyTmdbIdEnd = legacyId.startsWith("tmdb-")
    ? legacyId.indexOf(legacyTmdbIdMarker, 5)
    : -1;
  const sample = SAMPLE_TITLES.find((title) => title.title === item.title);
  const mediaType = item.mediaType || item.type || item.media_type || sample?.media_type || "unknown";
  const tmdbId =
    item.tmdbId ||
    (legacyTmdbIdEnd > 5 ? legacyId.slice(5, legacyTmdbIdEnd) : null) ||
    (legacyId.startsWith("demo-") ? sample?.id : null) ||
    item.id;
  if (tmdbId === undefined || tmdbId === null) return null;

  const normalized = {
    ...item,
    radarId: legacyRadarId,
    radar: radar?.name || item.radar || legacyRadarId,
    tmdbId: String(tmdbId),
    mediaType,
    releaseDate: item.releaseDate || item.release_date || sample?.release_date || "",
    rating: item.rating ?? item.vote_average ?? sample?.vote_average ?? 0,
    overview: item.overview || sample?.overview || "",
    posterUrl: item.posterUrl || item.poster || item.poster_path || "",
  };
  normalized.release_date = normalized.releaseDate;
  normalized.vote_average = normalized.rating;
  normalized.media_type = normalized.mediaType;
  normalized.poster = normalized.posterUrl;
  normalized.id = getAlertKey(normalized);
  return normalized;
}

function filterOutOldNotifications(items) {
  return items.filter((item) => {
    const releaseDate = item.releaseDate || item.release_date;
    return !releaseDate || releaseDate >= OLDEST_ALLOWED_RELEASE;
  });
}

function metadataCompleteness(item) {
  return ["releaseDate", "rating", "overview", "posterUrl"].reduce((score, field) => {
    const value = item[field];
    return score + (value !== undefined && value !== null && value !== "" && value !== 0 ? 1 : 0);
  }, 0);
}

function mergeNotificationMetadata(preferred, other) {
  const merged = { ...other, ...preferred };
  for (const field of ["releaseDate", "rating", "overview", "posterUrl"]) {
    const value = preferred[field];
    if (value === undefined || value === null || value === "" || value === 0) {
      merged[field] = other[field] ?? value;
    }
  }
  merged.read = Boolean(preferred.read || other.read);
  merged.createdAt = preferred.createdAt || other.createdAt;
  return normalizeNotification(merged, []);
}

function deduplicateNotifications(items, radars) {
  const byKey = new Map();
  for (const candidate of items) {
    const normalized = normalizeNotification(candidate, radars);
    if (!normalized) continue;

    const existing = byKey.get(normalized.id);
    if (!existing) {
      byKey.set(normalized.id, normalized);
      continue;
    }

    const preferred = metadataCompleteness(normalized) > metadataCompleteness(existing)
      ? normalized
      : existing;
    const other = preferred === normalized ? existing : normalized;
    byKey.set(normalized.id, mergeNotificationMetadata(preferred, other));
  }
  return [...byKey.values()];
}

function countNewNotifications(existing, incoming) {
  const knownKeys = new Set(existing.map(getAlertKey).filter(Boolean));
  const newKeys = new Set();
  for (const item of incoming) {
    const key = getAlertKey(item);
    if (key) newKeys.add(key);
  }
  return [...newKeys].filter((key) => !knownKeys.has(key)).length;
}

function formatDate(date) {
  if (!date) return "Date TBA";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mediaLabel(format) {
  if (format === "movie") return "Movie";
  if (format === "tv") return "TV Series";
  return "Movies & TV";
}

function getGenreLabel(item) {
  const genreIds = item.genre_ids || item.genres || [];
  const genreId = genreIds[0];
  const tvGenreNames = {
    10759: "Action & Adventure",
    10765: "Sci-Fi & Fantasy",
    10768: "War & Politics",
  };
  return GENRES.find((genre) => genre.id === genreId)?.name || tvGenreNames[genreId] || "Genre match";
}

function getReleaseBadge(releaseDate) {
  if (!releaseDate) return "Release date TBA";
  const today = new Date().toISOString().slice(0, 10);
  if (releaseDate > today) return "Upcoming";
  const ninetyDaysAgo = new Date(`${today}T00:00:00.000Z`);
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
  return releaseDate >= ninetyDaysAgo.toISOString().slice(0, 10) ? "New Release" : "Released";
}

function posterStyle(item, index) {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(11,13,18,.1) 28%, rgba(11,13,18,.35) 58%, rgba(0,0,0,.96) 100%), ${
      item.poster ? `url("${item.poster}")` : POSTER_BACKDROPS[index % POSTER_BACKDROPS.length]
    }`,
  };
}

function InterestModal({ radar, onClose, onSave }) {
  const [name, setName] = useState(radar?.name || "");
  const [format, setFormat] = useState(radar?.format || "both");
  const [genres, setGenres] = useState(radar?.genres || []);
  const [excludedGenres, setExcludedGenres] = useState(radar?.excludedGenres || []);
  const [tagsText, setTagsText] = useState(radar?.tags?.join(", ") || "");
  const [minRating, setMinRating] = useState(radar?.minRating ?? 7);
  const [alerts, setAlerts] = useState(radar?.alerts || ["On Release Day"]);

  const toggleItem = (items, setItems, value) => {
    setItems(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  };

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: radar?.id || `radar-${Date.now()}`,
      name: name.trim(),
      format,
      genres,
      excludedGenres,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5),
      minRating: Number(minRating),
      alerts,
      color: radar?.color || ["#e11d48", "#f59e0b", "#8b5cf6", "#22c55e"][Math.floor(Math.random() * 4)],
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="interest-modal" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="eyebrow">A little more of what you love</p>
            <h2 id="modal-title" className="mt-2 text-3xl font-semibold tracking-tight">{radar ? "Edit interest radar" : "Create an interest"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <FaXmark />
          </button>
        </div>

        <form className="mt-7 space-y-6" onSubmit={submit}>
          <label className="field-label">
            Give your radar a name
            <input
              autoFocus
              className="text-input"
              maxLength={40}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Mind-bending mysteries"
              required
              value={name}
            />
          </label>

          <div>
            <p className="field-label">I’m looking for</p>
            <div className="segmented-control mt-2">
              {[
                ["movie", "Movies"],
                ["tv", "TV Series"],
                ["both", "Both"],
              ].map(([value, label]) => (
                <button
                  className={format === value ? "segment active" : "segment"}
                  key={value}
                  onClick={() => setFormat(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">Genres I’m into</p>
            <div className="chip-list mt-2">
              {GENRES.slice(0, 12).map((genre) => (
                <button
                  className={genres.includes(genre.id) ? "choice-chip selected" : "choice-chip"}
                  key={genre.id}
                  onClick={() => toggleItem(genres, setGenres, genre.id)}
                  type="button"
                >
                  {genres.includes(genre.id) && <FaCheck />}
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">Not for me</p>
            <div className="chip-list mt-2">
              {[27, 53, 80, 10768].map((id) => {
                const genre = GENRES.find((item) => item.id === id);
                return (
                  <button
                    className={excludedGenres.includes(id) ? "choice-chip excluded selected" : "choice-chip excluded"}
                    key={id}
                    onClick={() => toggleItem(excludedGenres, setExcludedGenres, id)}
                    type="button"
                  >
                    {excludedGenres.includes(id) && <FaCheck />}
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="field-label">
            Keywords or actors <span className="font-normal text-[#89908a]">· optional, comma separated</span>
            <input
              className="text-input"
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="slow burn, Florence Pugh…"
              value={tagsText}
            />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <p className="field-label">Minimum rating</p>
              <span className="rating-number"><FaStar /> {Number(minRating).toFixed(1)}+</span>
            </div>
            <input
              aria-label="Minimum rating"
              className="rating-slider mt-3"
              max="9"
              min="5"
              onChange={(event) => setMinRating(event.target.value)}
              step="0.5"
              type="range"
              value={minRating}
            />
            <div className="flex justify-between text-xs text-[#8c938d]"><span>5.0</span><span>9.0</span></div>
          </div>

          <div>
            <p className="field-label">Let me know when</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {ALERT_OPTIONS.map((alert) => (
                <button
                  className={alerts.includes(alert) ? "alert-choice selected" : "alert-choice"}
                  key={alert}
                  onClick={() => toggleItem(alerts, setAlerts, alert)}
                  type="button"
                >
                  {alerts.includes(alert) ? <FaCheck /> : <span className="check-placeholder" />}
                  {alert}
                </button>
              ))}
            </div>
          </div>

          <button className="primary-button w-full justify-center" type="submit">
            <FaWandMagicSparkles /> {radar ? "Save changes" : "Create my radar"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const [radars, setRadars] = useState(INITIAL_RADARS);
  const [matches, setMatches] = useState(SAMPLE_TITLES);
  const [previewItem, setPreviewItem] = useState(null);
  const [editingRadar, setEditingRadar] = useState(null);
  const [activeRadarFilter, setActiveRadarFilter] = useState(null);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("My Radars");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [apiError, setApiError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [search, setSearch] = useState("");
  const [radarsLoaded, setRadarsLoaded] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    try {
      const savedRadars = window.localStorage.getItem("reel-radar-radars");
      const savedNotifications = window.localStorage.getItem("reel-radar-notifications");
      const parsedRadars = savedRadars ? JSON.parse(savedRadars) : null;
      const loadedRadars = Array.isArray(parsedRadars) ? parsedRadars : INITIAL_RADARS;
      if (Array.isArray(parsedRadars)) setRadars(parsedRadars);
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        if (Array.isArray(parsedNotifications)) {
          setNotifications(
            filterOutOldNotifications(deduplicateNotifications(parsedNotifications, loadedRadars)),
          );
        }
      }
    } catch (error) {
      console.error("Could not load saved Reel Radar data:", error);
    } finally {
      setRadarsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!radarsLoaded) return;
    try {
      window.localStorage.setItem("reel-radar-radars", JSON.stringify(radars));
      window.localStorage.setItem("reel-radar-notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Could not save Reel Radar data:", error);
      setApiError("Your browser couldn’t save changes. Check local storage settings.");
    }
  }, [radars, notifications, radarsLoaded]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timeout = window.setTimeout(() => setStatusMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleRadars = useMemo(
    () => radars.filter((radar) => radar.name.toLowerCase().includes(search.toLowerCase())),
    [radars, search],
  );
  const currentRadarFilter = radars.find((radar) => radar.id === activeRadarFilter) || null;
  const filteredMatches = useMemo(
    () => currentRadarFilter ? matches.filter((item) => item.radar === currentRadarFilter.name) : matches,
    [currentRadarFilter, matches],
  );
  const filteredNotifications = useMemo(() => {
    if (notificationFilter === "unread") return notifications.filter((item) => !item.read);
    if (notificationFilter.startsWith("radar:")) {
      const radar = radars.find((item) => item.id === notificationFilter.slice(6));
      return radar ? notifications.filter((item) => item.radar === radar.name) : [];
    }
    return notifications;
  }, [notificationFilter, notifications, radars]);

  useEffect(() => {
    if (activeTab === "Discover Feed" && activeRadarFilter) {
      requestAnimationFrame(() => feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [activeRadarFilter, activeTab]);

  function saveRadar(radar) {
    setRadars((current) => editingRadar
      ? current.map((item) => item.id === radar.id ? radar : item)
      : [radar, ...current]);
    setEditingRadar(null);
    setIsModalOpen(false);
  }

  function removeRadar(id) {
    setRadars((current) => current.filter((radar) => radar.id !== id));
    if (activeRadarFilter === id) setActiveRadarFilter(null);
  }

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function markNotificationRead(id) {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  }

  function selectRadar(radar) {
    setActiveRadarFilter(radar.id);
    setActiveTab("Discover Feed");
  }

  function makeDemoNotifications() {
    const now = Date.now();
    return radars.slice(0, 3).map((radar, index) => {
      const title = SAMPLE_TITLES[index % SAMPLE_TITLES.length];
      return {
        id: `demo-${now}-${index}`,
        radarId: radar.id,
        tmdbId: String(title.id),
        mediaType: title.media_type,
        title: title.title,
        message: index === 1 ? "A new season is on the way" : "A fresh match just landed on your radar",
        radar: radar.name,
        createdAt: new Date(now - index * 60000).toISOString(),
        poster: title.poster,
        posterUrl: title.poster || "",
        releaseDate: title.release_date,
        rating: title.vote_average,
        overview: title.overview,
        release_date: title.release_date,
        vote_average: title.vote_average,
        media_type: title.media_type,
        badge: title.badge,
        read: false,
      };
    });
  }

  async function checkForMatches() {
    if (!radars.length || isChecking) return;
    setIsChecking(true);
    setApiError("");
    setStatusMessage("");
    try {
      const responses = await Promise.all(
        radars.map(async (radar) => {
          const query = new URLSearchParams({
            format: radar.format,
            genres: radar.genres.join(","),
            withoutGenres: radar.excludedGenres.join(","),
            tags: radar.tags.join(","),
            minRating: String(radar.minRating),
          });
          const response = await fetch(`/api/discover?${query}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not check TMDB for new matches.");
          return { radar, results: data.results || [] };
        }),
      );
      const incoming = responses.flatMap(({ radar, results }) =>
        results.slice(0, 2).map((item) => ({
          radarId: radar.id,
          tmdbId: String(item.tmdbId || item.id),
          mediaType: item.mediaType || item.type || item.media_type,
          title: item.title || item.name,
          message: "A new match just landed on your radar",
          radar: radar.name,
          createdAt: new Date().toISOString(),
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
          releaseDate: item.releaseDate || item.release_date || item.first_air_date || "",
          rating: item.rating ?? item.vote_average ?? 0,
          overview: item.overview || "",
          type: item.type || item.mediaType || item.media_type,
          release_date: item.releaseDate || item.release_date || item.first_air_date || "",
          vote_average: item.rating ?? item.vote_average ?? 0,
          media_type: item.mediaType || item.type || item.media_type,
          badge: (item.mediaType || item.type || item.media_type) === "tv" ? "New series" : "Coming soon",
          read: false,
        })),
      );
      const feedMatches = responses.flatMap(({ radar, results }) =>
        results.slice(0, 2).map((item) => ({
          id: `${item.media_type}-${item.id}-${radar.id}`,
          title: item.title || item.name,
          release_date: item.release_date,
          vote_average: item.vote_average || 0,
          media_type: item.media_type,
          posterUrl: item.posterUrl || "",
          poster: item.posterUrl || "",
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "",
          overview: item.overview || "",
          genre_ids: item.genre_ids || [],
          badge: getReleaseBadge(item.release_date || item.first_air_date),
          radar: radar.name,
        })),
      );
      if (feedMatches.length) setMatches(feedMatches);
      const freshCount = countNewNotifications(notifications, incoming);
      setNotifications((current) => deduplicateNotifications([...incoming, ...current], radars));
      if (freshCount === 0) {
        setStatusMessage("All caught up — no new matches found.");
      }
    } catch (error) {
      console.error("Could not check for new matches:", error);
      setMatches(SAMPLE_TITLES);
      const demoNotifications = makeDemoNotifications();
      const freshCount = countNewNotifications(notifications, demoNotifications);
      setNotifications((current) => deduplicateNotifications([...demoNotifications, ...current], radars));
      if (freshCount === 0) setStatusMessage("All caught up — no new matches found.");
      setApiError(
        `${error instanceof Error ? error.message : "TMDB is unavailable."} Sample alerts were added so you can still test notifications.`,
      );
    } finally {
      setIsChecking(false);
    }
  }

  const openNotifications = () => {
    setIsDrawerOpen(true);
  };

  const navItems = [
    { label: "My Radars", value: "My Radars" },
    { label: "Discover Feed", value: "Discover Feed" },
    { label: "Notifications", value: "notifications" },
  ];
  const spotlightMatch = matches[0] || SAMPLE_TITLES[0];
  const spotlightImage = spotlightMatch.backdrop || spotlightMatch.poster;
  const spotlightStyle = spotlightImage
    ? { backgroundImage: `linear-gradient(90deg, #0b0d12 0%, rgba(11,13,18,.94) 27%, rgba(11,13,18,.62) 57%, rgba(11,13,18,.2) 100%), linear-gradient(0deg, #0b0d12 0%, transparent 42%), url("${spotlightImage}")` }
    : undefined;

  return (
    <main className="min-h-screen app-shell">
      <header className="site-header">
        <a className="brand" href="#" onClick={() => setActiveTab("My Radars")}>
          <span className="brand-mark"><FaCirclePlay /></span>
          <span>reel<span className="brand-light">radar</span></span>
          <span className="brand-period">.</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={activeTab === item.value ? "nav-link active" : "nav-link"}
              key={item.value}
              onClick={() => item.value === "notifications" ? setActiveTab("notifications") : setActiveTab(item.value)}
            >
              {item.label}
              {item.value === "notifications" && unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="header-bell" aria-label={`Notifications, ${unreadCount} unread`} onClick={openNotifications}>
            <FaBell />
            {unreadCount > 0 && <span className="bell-dot" />}
          </button>
          <button className="primary-button header-create" onClick={() => setIsModalOpen(true)}>
            <FaPlus /> <span>Create Interest</span>
          </button>
        </div>
      </header>

      <div className="page-wrap">
        {apiError && (
          <div className="api-notice" role="status">
            <span>{apiError}</span>
            <button onClick={() => setApiError("")} aria-label="Dismiss message"><FaXmark /></button>
          </div>
        )}
        {statusMessage && <div className="caught-up-notice" role="status">{statusMessage}</div>}

        {activeTab !== "notifications" && (
          <section className="spotlight" style={spotlightStyle}>
            <div className="spotlight-content">
              <p className="eyebrow"><span className="eyebrow-dot" /> {activeTab === "Discover Feed" ? "PICKED FOR YOUR RADARS" : "YOUR NEXT GREAT WATCH"}</p>
              <span className="match-score"><FaWandMagicSparkles /> 96% Radar Match</span>
              <h1>{spotlightMatch.title}</h1>
              <div className="spotlight-meta">
                <span className="spotlight-date"><FaCalendar /> {formatDate(spotlightMatch.release_date)}</span>
                <span className="spotlight-rating"><FaStar /> {Number(spotlightMatch.vote_average).toFixed(1)}</span>
                <span className="spotlight-type">{mediaLabel(spotlightMatch.media_type)}</span>
              </div>
              <p className="spotlight-synopsis">{spotlightMatch.overview || "A new story is finding its way to your watchlist. Your radars are keeping an eye on it."}</p>
              <div className="spotlight-actions">
                <span className="hero-alert"><FaCheck /> Alert Active</span>
                <button className="preview-button" onClick={() => setPreviewItem(spotlightMatch)}><FaCirclePlay /> Preview Details</button>
              </div>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><span className="stat-icon"><FaSliders /></span><b>{radars.length}</b><small>Active Radars</small></div>
              <div className="hero-stat"><span className="stat-icon"><FaRegClock /></span><b>{matches.length}</b><small>Coming Soon</small></div>
              <div className="hero-stat"><span className="stat-icon"><FaBell /></span><b>{unreadCount}</b><small>Unread Alerts</small></div>
            </div>
          </section>
        )}

        {activeTab === "notifications" ? (
          <section className="content-section notification-center">
            <div className="notification-center-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-dot" /> YOUR UPDATES</p>
                <h1>Notifications Center</h1>
                <p className="section-subtitle">A closer look at everything your radars have found.</p>
              </div>
              <div className="notification-bulk-actions">
                <button className="secondary-button" onClick={markAllRead} disabled={!unreadCount}><FaCheck /> Mark all as read</button>
                  <button className="clear-all-button" onClick={clearNotifications} disabled={!notifications.length}><FaTrash /> Clear all</button>
                <button className="primary-button" onClick={checkForMatches} disabled={isChecking || !radars.length}>
                  <FaArrowRotateRight className={isChecking ? "spin" : ""} /> {isChecking ? "Checking…" : "Check for New Matches"}
                </button>
              </div>
            </div>
            <div className="notification-filters" aria-label="Filter notifications">
              <button className={notificationFilter === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setNotificationFilter("all")}>All Alerts <span>{notifications.length}</span></button>
              <button className={notificationFilter === "unread" ? "filter-pill active" : "filter-pill"} onClick={() => setNotificationFilter("unread")}>Unread <span>{unreadCount}</span></button>
              {radars.map((radar) => (
                <button className={notificationFilter === `radar:${radar.id}` ? "filter-pill active radar-filter" : "filter-pill radar-filter"} key={radar.id} onClick={() => setNotificationFilter(`radar:${radar.id}`)}>
                  <i style={{ backgroundColor: radar.color || "#e11d48" }} /> {radar.name}
                </button>
              ))}
            </div>
            <div className="notification-center-list">
              {filteredNotifications.length ? filteredNotifications.map((item) => (
                <NotificationCard
                  item={item}
                  key={item.id}
                  onMarkRead={() => markNotificationRead(item.id)}
                  onPreview={() => setPreviewItem(item)}
                />
              )) : <EmptyState title={notificationFilter === "unread" ? "You’re all caught up" : "No alerts here yet"} copy="Check for new matches to see what your radars have found." />}
            </div>
          </section>
        ) : (
          <>
            {activeTab === "My Radars" && (
            <section className="content-section radar-section">
              <div className="section-heading">
                <div>
                  <div className="heading-with-count">
                    <h2>{activeTab === "Discover Feed" ? "Your radar picks" : "Your interest radars"}</h2>
                    <span className="count-pill">{radars.length}</span>
                  </div>
                  <p className="section-subtitle">{activeTab === "Discover Feed" ? "Stories that fit your kind of story." : "Every radar is tuned to your kind of story."}</p>
                </div>
                <div className="section-actions">
                  <label className="search-box">
                    <FaMagnifyingGlass />
                    <input aria-label="Search radars" onChange={(event) => setSearch(event.target.value)} placeholder="Find a radar" value={search} />
                  </label>
                  <button className="text-link notification-center-link" onClick={() => setActiveTab("notifications")}>View notifications <FaArrowRight /></button>
                  <button className="primary-button" onClick={() => setIsModalOpen(true)}><FaPlus /> New radar</button>
                </div>
              </div>

              {visibleRadars.length ? (
                <div className="radar-grid">
                  {visibleRadars.map((radar, index) => (
                    <article
                      className="radar-card"
                      key={radar.id}
                      onClick={() => selectRadar(radar)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectRadar(radar);
                        }
                      }}
                      role="group"
                      tabIndex={0}
                      style={{ "--radar-accent": radar.color || "#e11d48" }}
                      aria-label={`Show matches for ${radar.name}`}
                    >
                      <div className={`radar-card-art art-${index % 4}`}>
                        <div className="radar-orbit orbit-one" /><div className="radar-orbit orbit-two" />
                        <span className="radar-art-icon">{radar.format === "movie" ? <FaFilm /> : radar.format === "tv" ? <FaTv /> : <FaCirclePlay />}</span>
                        <span className="radar-format">{mediaLabel(radar.format)}</span>
                        <div className="radar-card-actions">
                          <button className="radar-menu" aria-label={`Edit ${radar.name}`} onClick={(event) => { event.stopPropagation(); setEditingRadar(radar); setIsModalOpen(true); }} onKeyDown={(event) => event.stopPropagation()}><FaPen /></button>
                          <button className="radar-menu delete" aria-label={`Delete ${radar.name}`} onClick={(event) => { event.stopPropagation(); removeRadar(radar.id); }} onKeyDown={(event) => event.stopPropagation()}><FaTrash /></button>
                        </div>
                      </div>
                      <div className="radar-card-body">
                        <div className="flex items-start justify-between gap-3">
                          <div className="radar-name-wrap"><h3>{radar.name}</h3></div>
                          <span className="radar-rating"><FaStar /> {Number(radar.minRating).toFixed(1)}+</span>
                        </div>
                        <div className="radar-genre-list">
                          {radar.genres.length ? radar.genres.map((id) => GENRES.find((genre) => genre.id === id)?.name).filter(Boolean).map((genre) => <span className="genre-pill" key={genre}>{genre}</span>) : <span className="genre-pill">All genres</span>}
                          {radar.excludedGenres?.map((id) => GENRES.find((genre) => genre.id === id)?.name).filter(Boolean).slice(0, 1).map((genre) => <span className="genre-pill excluded" key={`exclude-${genre}`}>− {genre}</span>)}
                        </div>
                        <div className="radar-card-bottom">
                          <span className="match-indicator"><i /> Watching</span>
                          <span className="radar-arrow"><FaArrowRight /></span>
                        </div>
                      </div>
                    </article>
                  ))}
                  <button className="add-radar-card" onClick={() => setIsModalOpen(true)}>
                    <span className="add-radar-icon"><FaPlus /></span>
                    <span><b>Make room for more</b><small>Create a radar for your next obsession.</small></span>
                    <FaArrowRight className="add-radar-arrow" />
                  </button>
                </div>
              ) : <EmptyState title="No radars found" copy="Try a different search or create a new interest radar." />}
            </section>
            )}

            <section className="content-section feed-section" id="discover-feed" ref={feedRef}>
              <div className="section-heading feed-heading">
                <div><p className="eyebrow">FRESH ON YOUR FREQUENCY</p><h2>Coming into focus</h2><p className="section-subtitle">A few things we think you’ll want to know about.</p></div>
                <button className="text-link" onClick={() => setActiveTab("Discover Feed")}>Explore discover feed <FaArrowRight /></button>
              </div>
              {activeRadarFilter && currentRadarFilter && (
                <div className="radar-filter-banner">
                  <span>Showing matches for: <b>{currentRadarFilter.name}</b></span>
                  <button onClick={() => setActiveRadarFilter(null)}>Clear Filter <FaXmark /></button>
                </div>
              )}
              <div className="title-grid">
                {filteredMatches.length ? filteredMatches.map((item, index) => <TitleCard item={item} index={index} key={item.id} />) : <EmptyState title="No matches for this radar yet" copy="Check for new matches and we’ll let you know when something fits." />}
              </div>
            </section>

            <section className="check-banner">
              <div className="check-banner-art"><span>✦</span><span>✳</span><span>✦</span></div>
              <div className="check-banner-copy"><p className="eyebrow">DON’T MISS A THING</p><h2>Anything new on your radar?</h2><p>We’ll check your interests and surface anything worth a watch.</p></div>
              <button className="primary-button" disabled={isChecking || !radars.length} onClick={checkForMatches}>
                {isChecking ? <FaArrowRotateRight className="spin" /> : <FaWandMagicSparkles />}
                {isChecking ? "Checking your radars…" : "Check for New Matches"}
              </button>
            </section>
          </>
        )}

        <footer className="page-footer"><span>Made for people who love a good story.</span><span>Powered by your taste <span className="footer-spark">✳</span></span></footer>
      </div>

      {isModalOpen && <InterestModal key={editingRadar?.id || "new"} radar={editingRadar} onClose={() => { setIsModalOpen(false); setEditingRadar(null); }} onSave={saveRadar} />}

      {previewItem && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPreviewItem(null)}>
          <section className="preview-modal" aria-labelledby="preview-title" role="dialog" aria-modal="true">
            <div className="preview-art" style={posterStyle(previewItem, 0)} />
            <div className="preview-details">
              <button className="icon-button preview-close" onClick={() => setPreviewItem(null)} aria-label="Close preview"><FaXmark /></button>
              <p className="eyebrow"><span className="eyebrow-dot" /> RADAR MATCH</p>
              <h2 id="preview-title">{previewItem.title}</h2>
              <div className="spotlight-meta">
                <span className="spotlight-date"><FaCalendar /> {formatDate(previewItem.release_date)}</span>
                <span className="spotlight-rating"><FaStar /> {Number(previewItem.vote_average).toFixed(1)}</span>
                <span className="spotlight-type">{mediaLabel(previewItem.media_type)}</span>
              </div>
              <p className="preview-synopsis">{previewItem.overview || "Keep this title on your radar. We’ll let you know when there’s more to see."}</p>
              <div className="preview-match"><FaWandMagicSparkles /> Matched by <b>{previewItem.radar || "your interest radars"}</b></div>
              <button className="primary-button preview-done" onClick={() => setPreviewItem(null)}>Back to your radars</button>
            </div>
          </section>
        </div>
      )}

      {isDrawerOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsDrawerOpen(false)}>
          <aside className="notification-drawer" aria-label="Notifications">
            <div className="drawer-header">
              <div><p className="eyebrow">YOUR UPDATES</p><h2>Notifications {unreadCount > 0 && <span className="drawer-count">{unreadCount}</span>}</h2></div>
              <button className="icon-button" aria-label="Close notifications" onClick={() => setIsDrawerOpen(false)}><FaXmark /></button>
            </div>
            <div className="drawer-tools">
              <span>{notifications.length ? `${notifications.length} recent alerts` : "Nothing new just yet"}</span>
              {unreadCount > 0 && <button onClick={markAllRead}>Mark all as read</button>}
            </div>
            <div className="notification-list">
              {notifications.length ? notifications.map((item) => <NotificationRow item={item} key={item.id} />) : (
                <div className="drawer-empty"><span className="empty-bell"><FaBell /></span><h3>Quiet for now</h3><p>When a story matches your taste, you’ll find it here.</p><button className="secondary-button" disabled={isChecking || !radars.length} onClick={checkForMatches}><FaArrowRotateRight className={isChecking ? "spin" : ""} /> Check for matches</button></div>
              )}
            </div>
            <button className="drawer-check-button" onClick={checkForMatches} disabled={isChecking || !radars.length}><FaArrowRotateRight className={isChecking ? "spin" : ""} /> {isChecking ? "Checking…" : "Check for New Matches"}</button>
          </aside>
        </div>
      )}
    </main>
  );
}

function TitleCard({ item, index }) {
  const posterUrl = item.posterUrl || item.poster || "";
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    setPosterFailed(false);
  }, [posterUrl]);

  return (
    <article className="title-card">
      <div className={`poster art-${index % 4}`}>
        {posterUrl && !posterFailed ? (
          <Image
            className="poster-image"
            src={posterUrl}
            alt=""
            fill
            sizes="(max-width: 700px) 50vw, 220px"
            unoptimized
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <div className="poster-fallback">
            <span className="poster-fallback-icon">{item.media_type === "movie" ? <FaFilm /> : <FaTv />}</span>
            <strong>{item.title}</strong>
            <span className="poster-fallback-genre">{getGenreLabel(item)}</span>
          </div>
        )}
        <span className="poster-badge"><FaRegClock /> {getReleaseBadge(item.release_date)}</span>
        <span className="poster-rating"><FaStar /> {item.vote_average.toFixed(1)}</span>
        <div className="poster-overlay">
          {!posterFailed && posterUrl && <span className="poster-title">{item.title}</span>}
          <span className="poster-date">{formatDate(item.release_date)}</span>
          <span className="poster-radar">{item.radar}</span>
        </div>
      </div>
      <div className="title-card-info">
        <div className="flex items-center justify-between gap-2"><h3>{item.title}</h3><span className="media-icon" title={mediaLabel(item.media_type)}>{item.media_type === "movie" ? <FaFilm /> : <FaTv />}</span></div>
        <p><FaCalendar /> {formatDate(item.release_date)} <span>·</span> <b>{item.radar}</b></p>
      </div>
    </article>
  );
}

function NotificationCard({ item, onMarkRead, onPreview }) {
  const releaseDate = item.release_date || item.releaseDate;
  const mediaType = item.media_type || "movie";

  return (
    <article className={item.read ? "notification-card read" : "notification-card unread"}>
      <div className="notification-card-poster" style={item.poster ? { backgroundImage: `url("${item.poster.replace("/w200", "/w500")}")` } : undefined}>
        {!item.poster && <FaCirclePlay />}
        <span className="notification-card-rating"><FaStar /> {Number(item.vote_average || 0).toFixed(1)}</span>
      </div>
      <div className="notification-card-content">
        <div className="notification-card-topline">
          <span className="notification-card-type">{mediaLabel(mediaType)}</span>
          <span className="notification-time">{releaseDate ? formatDate(releaseDate) : "Release date TBA"} <i>·</i> {formatRelativeTime(item.createdAt)}</span>
        </div>
        <h2>{item.title}</h2>
        <p className="notification-card-description">{item.overview || item.message || "A new title matched your interests. Open the preview for more details."}</p>
        <div className="notification-card-footer">
          <span className="notification-radar-badge"><FaWandMagicSparkles /> {item.radar || "Interest Radar"}</span>
          <div className="notification-card-actions">
            <button className="notification-preview-button" onClick={onPreview}>Preview Details <FaArrowRight /></button>
            <button className="notification-read-button" onClick={onMarkRead} disabled={item.read}>
              {item.read ? <><FaCheck /> Read</> : <><FaCheck /> Mark Read</>}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatRelativeTime(value) {
  if (!value) return "Recently";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (!Number.isFinite(elapsedMinutes)) return "Recently";
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}

function NotificationRow({ item }) {
  const time = new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <article className={item.read ? "notification-row read" : "notification-row"}>
      <div className="notification-thumb" style={item.poster ? { backgroundImage: `url("${item.poster}")` } : undefined}><FaCirclePlay /></div>
      <div className="notification-copy">
        <div className="notification-title"><b>{item.title}</b>{!item.read && <i />}</div>
        <p>{item.message}</p><small><span>{item.radar}</span> · {time}</small>
      </div>
      <FaChevronRight className="notification-chevron" />
    </article>
  );
}

function EmptyState({ title, copy }) {
  return <div className="empty-state"><span><FaMagnifyingGlass /></span><h3>{title}</h3><p>{copy}</p></div>;
}
