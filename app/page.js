"use client";

import { useEffect, useMemo, useState } from "react";
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

function posterStyle(item, index) {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(11,13,18,.1) 28%, rgba(11,13,18,.35) 58%, rgba(0,0,0,.96) 100%), ${
      item.poster ? `url("${item.poster}")` : POSTER_BACKDROPS[index % POSTER_BACKDROPS.length]
    }`,
  };
}

function InterestModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState("both");
  const [genres, setGenres] = useState([]);
  const [excludedGenres, setExcludedGenres] = useState([]);
  const [tagsText, setTagsText] = useState("");
  const [minRating, setMinRating] = useState(7);
  const [alerts, setAlerts] = useState(["On Release Day"]);

  const toggleItem = (items, setItems, value) => {
    setItems(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  };

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: `radar-${Date.now()}`,
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
      color: ["#e11d48", "#f59e0b", "#8b5cf6", "#22c55e"][Math.floor(Math.random() * 4)],
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="interest-modal" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="eyebrow">A little more of what you love</p>
            <h2 id="modal-title" className="mt-2 text-3xl font-semibold tracking-tight">Create an interest</h2>
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
            <FaWandMagicSparkles /> Create my radar
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
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("My Radars");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [radarsLoaded, setRadarsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedRadars = window.localStorage.getItem("reel-radar-radars");
      const savedNotifications = window.localStorage.getItem("reel-radar-notifications");
      if (savedRadars) setRadars(JSON.parse(savedRadars));
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
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

  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleRadars = useMemo(
    () => radars.filter((radar) => radar.name.toLowerCase().includes(search.toLowerCase())),
    [radars, search],
  );

  function saveRadar(radar) {
    setRadars((current) => [radar, ...current]);
    setIsModalOpen(false);
  }

  function removeRadar(id) {
    setRadars((current) => current.filter((radar) => radar.id !== id));
  }

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  function makeDemoNotifications() {
    const now = Date.now();
    return radars.slice(0, 3).map((radar, index) => {
      const title = SAMPLE_TITLES[index % SAMPLE_TITLES.length];
      return {
        id: `demo-${now}-${index}`,
        title: title.title,
        message: index === 1 ? "A new season is on the way" : "A fresh match just landed on your radar",
        radar: radar.name,
        createdAt: new Date(now - index * 60000).toISOString(),
        poster: title.poster,
        read: false,
      };
    });
  }

  async function checkForMatches() {
    if (!radars.length || isChecking) return;
    setIsChecking(true);
    setApiError("");
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
      const fresh = responses.flatMap(({ radar, results }) =>
        results.slice(0, 2).map((item, index) => ({
          id: `tmdb-${item.id}-${radar.id}-${Date.now()}-${index}`,
          title: item.title || item.name,
          message: "A new match just landed on your radar",
          radar: radar.name,
          createdAt: new Date().toISOString(),
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : "",
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
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "",
          overview: item.overview || "",
          badge: item.media_type === "tv" ? "New series" : "Coming soon",
          radar: radar.name,
        })),
      );
      if (feedMatches.length) setMatches(feedMatches);
      setNotifications((current) => [...fresh, ...current]);
      if (!fresh.length) {
        setMatches(SAMPLE_TITLES);
        setNotifications((current) => [...makeDemoNotifications(), ...current]);
        setApiError("No new TMDB matches in your date window. Added sample alerts so you can test the notification workflow.");
      }
    } catch (error) {
      console.error("Could not check for new matches:", error);
      setMatches(SAMPLE_TITLES);
      setNotifications((current) => [...makeDemoNotifications(), ...current]);
      setApiError(
        `${error instanceof Error ? error.message : "TMDB is unavailable."} Sample alerts were added so you can still test notifications.`,
      );
    } finally {
      setIsChecking(false);
    }
  }

  const openNotifications = () => {
    setActiveTab("Notifications");
    setIsDrawerOpen(true);
  };

  const navItems = ["My Radars", "Discover Feed", "Notifications"];
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
              className={activeTab === item ? "nav-link active" : "nav-link"}
              key={item}
              onClick={() => item === "Notifications" ? openNotifications() : setActiveTab(item)}
            >
              {item}
              {item === "Notifications" && unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}
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

        {activeTab !== "Notifications" && (
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

        {activeTab === "Notifications" ? (
          <section className="content-section">
            <div className="section-heading">
              <div><p className="eyebrow">YOUR UPDATES</p><h2>Notifications</h2></div>
              <button className="secondary-button" onClick={checkForMatches} disabled={isChecking}>
                <FaArrowRotateRight className={isChecking ? "spin" : ""} /> {isChecking ? "Checking…" : "Check for New Matches"}
              </button>
            </div>
            <div className="notification-list inline-notifications">
              {notifications.length ? notifications.map((item) => (
                <NotificationRow item={item} key={item.id} />
              )) : <EmptyState title="All caught up" copy="Check for new matches and we’ll let you know when something good is on the way." />}
            </div>
          </section>
        ) : (
          <>
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
                  <button className="primary-button" onClick={() => setIsModalOpen(true)}><FaPlus /> New radar</button>
                </div>
              </div>

              {visibleRadars.length ? (
                <div className="radar-grid">
                  {visibleRadars.map((radar, index) => (
                    <article className="radar-card" key={radar.id} style={{ "--radar-accent": radar.color || "#e11d48" }}>
                      <div className={`radar-card-art art-${index % 4}`}>
                        <div className="radar-orbit orbit-one" /><div className="radar-orbit orbit-two" />
                        <span className="radar-art-icon">{radar.format === "movie" ? <FaFilm /> : radar.format === "tv" ? <FaTv /> : <FaCirclePlay />}</span>
                        <span className="radar-format">{mediaLabel(radar.format)}</span>
                        <button className="radar-menu" aria-label={`Delete ${radar.name}`} onClick={() => removeRadar(radar.id)}><FaTrash /></button>
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

            <section className="content-section feed-section">
              <div className="section-heading feed-heading">
                <div><p className="eyebrow">FRESH ON YOUR FREQUENCY</p><h2>Coming into focus</h2><p className="section-subtitle">A few things we think you’ll want to know about.</p></div>
                <button className="text-link" onClick={() => setActiveTab("Discover Feed")}>Explore discover feed <FaArrowRight /></button>
              </div>
              <div className="title-grid">
                {matches.map((item, index) => <TitleCard item={item} index={index} key={item.id} />)}
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

      {isModalOpen && <InterestModal onClose={() => setIsModalOpen(false)} onSave={saveRadar} />}

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
  return (
    <article className="title-card">
      <div className={`poster art-${index % 4}`}>
        <div className="poster-image" style={posterStyle(item, index)} />
        <span className="poster-badge"><FaRegClock /> {item.badge}</span>
        <span className="poster-rating"><FaStar /> {item.vote_average.toFixed(1)}</span>
        <div className="poster-overlay">
          <span className="poster-title">{item.title}</span>
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
