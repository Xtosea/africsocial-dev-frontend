import React, { useEffect, useMemo, useRef, useState } from "react";

const getTrackKey = (song) =>
  String(song?._id || song?.id || song?.audioUrl || `${song?.title || ""}-${song?.artist || ""}`);

const getPlayableUrl = (song) =>
  typeof song?.audioUrl === "string" &&
  song.audioUrl.startsWith("https://") &&
  !song.audioUrl.includes("your-domain.com")
    ? song.audioUrl
    : null;

const getTrackCategories = (song) => {
  const values = [
    song?.category,
    song?.genre,
    ...(Array.isArray(song?.categories) ? song.categories : []),
    ...(Array.isArray(song?.genres) ? song.genres : []),
  ];

  return [...new Set(
    values
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim())
  )];
};

const MusicLibrary = ({ songs = [], onSelect, selectedSong }) => {
  const tracks = Array.isArray(songs) ? songs : [];
  const audioRef = useRef(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [previewTrackKey, setPreviewTrackKey] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const categories = useMemo(() => {
    const values = new Set();

    tracks.forEach((song) => {
      getTrackCategories(song).forEach((category) => values.add(category));
    });

    return [...values].sort((a, b) => a.localeCompare(b));
  }, [tracks]);

  const hasUncategorisedTracks = useMemo(
    () => tracks.some((song) => getTrackCategories(song).length === 0),
    [tracks]
  );

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tracks.filter((song) => {
      const songCategories = getTrackCategories(song);

      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Uncategorised"
          ? songCategories.length === 0
          : songCategories.some(
              (category) => category.toLowerCase() === activeCategory.toLowerCase()
            ));

      const searchableText = [
        song?.title,
        song?.artist,
        ...songCategories,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [tracks, search, activeCategory]);

  const stopPreview = () => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setPreviewTrackKey(null);
    setIsPlaying(false);
    setPreviewError("");
  };

  const playPreview = async (song) => {
    const audio = audioRef.current;
    const url = getPlayableUrl(song);
    const trackKey = getTrackKey(song);

    if (!audio || !url) {
      setPreviewError("Audio preview is unavailable for this track.");
      return;
    }

    if (previewTrackKey === trackKey && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (previewTrackKey !== trackKey) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = url;
      setPreviewTrackKey(trackKey);
    }

    setPreviewError("");

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Music preview failed:", error);
      setIsPlaying(false);
      setPreviewError("Unable to play this preview. Please try another track.");
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (
      previewTrackKey &&
      !tracks.some((song) => getTrackKey(song) === previewTrackKey)
    ) {
      stopPreview();
    }
  }, [tracks, previewTrackKey]);

  const previewSong = tracks.find(
    (song) => getTrackKey(song) === previewTrackKey
  );

  if (!tracks.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/60">
        No music tracks are available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setPreviewTrackKey(null);
        }}
        onError={() => {
          setIsPlaying(false);
          setPreviewError("This audio preview could not be loaded.");
        }}
      />

      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search songs or artists..."
          aria-label="Search music"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-500"
        />

        <div className="flex flex-wrap gap-2">
          {["All", ...categories, ...(hasUncategorisedTracks ? ["Uncategorised"] : [])].map(
            (category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                  activeCategory === category
                    ? "bg-blue-600 text-white"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {category}
              </button>
            )
          )}
        </div>

        {categories.length === 0 && (
          <p className="text-xs text-white/40">
            Category filters will appear when music categories are available.
          </p>
        )}
      </div>

      {previewSong && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-300">
              {isPlaying ? "NOW PLAYING" : "PREVIEW PAUSED"}
            </p>
            <p className="truncate text-sm text-white">
              {previewSong.title || "Untitled track"}
            </p>
            <p className="truncate text-xs text-white/50">
              {previewSong.artist || "Unknown artist"}
            </p>
          </div>

          <button
            type="button"
            onClick={stopPreview}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
          >
            Stop
          </button>
        </div>
      )}

      {previewError && (
        <p role="alert" className="text-xs text-amber-300">
          {previewError}
        </p>
      )}

      <div className="space-y-3">
        {filteredTracks.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/50">
            No tracks match your search or selected category.
          </div>
        ) : (
          filteredTracks.map((song) => {
            const trackKey = getTrackKey(song);
            const playableUrl = getPlayableUrl(song);
            const isSelected =
              getTrackKey(selectedSong || {}) === trackKey;
            const isCurrentPreview = previewTrackKey === trackKey;

            return (
              <div
                key={trackKey}
                className={`rounded-xl border p-3 ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                    🎵
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {song.title || "Untitled track"}
                    </p>
                    <p className="truncate text-sm text-white/60">
                      {song.artist || "Unknown artist"}
                    </p>
                    {getTrackCategories(song).length > 0 && (
                      <p className="mt-1 truncate text-xs text-blue-300/70">
                        {getTrackCategories(song).join(" · ")}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <span className="text-xs text-blue-400">Selected</span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {playableUrl ? (
                    <button
                      type="button"
                      onClick={() => playPreview(song)}
                      aria-pressed={isCurrentPreview && isPlaying}
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
                    >
                      {isCurrentPreview && isPlaying ? "Pause" : "Play preview"}
                    </button>
                  ) : (
                    <span className="py-2 text-xs text-amber-300/80">
                      Audio preview unavailable
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      stopPreview();
                      onSelect?.(song);
                    }}
                    aria-pressed={isSelected}
                    className={`ml-auto rounded-lg px-4 py-2 text-sm font-medium ${
                      isSelected
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MusicLibrary;
