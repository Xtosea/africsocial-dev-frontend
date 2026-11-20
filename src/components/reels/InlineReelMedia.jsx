import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";

const InlineReelMedia = ({ post, videoRef, onOpen }) => {
  const internalVideoRef = useRef(null);
  const musicRef = useRef(null);
  const voiceRef = useRef(null);

  const [musicEnabled, setMusicEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const music = post?.music || {};
  const voiceOver = post?.voiceOver || {};
  const musicUrl = music.audioUrl;
  const voiceUrl = voiceOver.audioUrl;
  const hasMusic = Boolean(musicUrl);
  const hasVoice = Boolean(voiceUrl);
  const hasSeparateAudio = hasMusic || hasVoice;

  const adjustments = post?.videoAdjustments || {};
  const stickers = Array.isArray(post?.stickers) ? post.stickers : [];
  const video =
    post?.media?.find((item) => item.type === "video") ||
    post?.media?.[0];

  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.max(min, Math.min(max, number))
      : fallback;
  };

  const filter = [
    `brightness(${clamp(adjustments.brightness, 0.5, 1.5, 1)})`,
    `contrast(${clamp(adjustments.contrast, 0.5, 1.5, 1)})`,
    `saturate(${clamp(adjustments.saturation, 0, 2, 1)})`,
    `sepia(${clamp(adjustments.sepia, 0, 1, 0)})`,
  ].join(" ");

  const setVideoRef = (element) => {
    internalVideoRef.current = element;

    if (typeof videoRef === "function") {
      videoRef(element);
    } else if (videoRef && typeof videoRef === "object") {
      videoRef.current = element;
    }
  };

  const syncAudio = (audio, element, enabled = true, volume = 1) => {
    if (!audio || !element || !enabled || element.paused || element.ended) {
      audio?.pause();
      return;
    }

    audio.volume = clamp(volume, 0, 1, 1);

    if (Math.abs(audio.currentTime - element.currentTime) > 0.5) {
      try {
        audio.currentTime = element.currentTime;
      } catch {
        // Wait for the audio metadata to load.
      }
    }

    if (audio.paused) {
      audio.play().catch(() => {
        if (audio === musicRef.current) {
          setMusicEnabled(false);
        }
      });
    }
  };

  useEffect(() => {
    const element = internalVideoRef.current;
    if (!element) return;

    const sync = () => {
      syncAudio(musicRef.current, element, hasMusic && musicEnabled);
      syncAudio(voiceRef.current, element, hasVoice, voiceOver.volume);
    };

    element.addEventListener("play", sync);
    element.addEventListener("pause", sync);
    element.addEventListener("timeupdate", sync);
    element.addEventListener("ended", sync);

    return () => {
      element.removeEventListener("play", sync);
      element.removeEventListener("pause", sync);
      element.removeEventListener("timeupdate", sync);
      element.removeEventListener("ended", sync);

      musicRef.current?.pause();
      voiceRef.current?.pause();
    };
  }, [post?._id, hasMusic, hasVoice, musicEnabled, voiceOver.volume]);

  const playVideo = (event) => {
    event.stopPropagation();

    const element = internalVideoRef.current;
    if (!element) return;

    element.dataset.userPaused = "false";
    element.play().catch(() => setIsPlaying(false));
  };

  const pauseVideo = (event) => {
    event.stopPropagation();

    const element = internalVideoRef.current;
    if (!element) return;

    element.dataset.userPaused = "true";
    element.pause();
  };

  const stopVideo = (event) => {
    event.stopPropagation();

    const element = internalVideoRef.current;
    if (!element) return;

    element.dataset.userPaused = "true";
    element.pause();

    try {
      element.currentTime = 0;
    } catch {
      // The video metadata may not have loaded yet.
    }

    musicRef.current?.pause();
    voiceRef.current?.pause();
  };

  const toggleMusic = (event) => {
    event.stopPropagation();

    const element = internalVideoRef.current;
    const audio = musicRef.current;

    if (!audio || !element) return;

    if (musicEnabled) {
      audio.pause();
      setMusicEnabled(false);
      return;
    }

    setMusicEnabled(true);

    if (!element.paused && !element.ended) {
      try {
        audio.currentTime = element.currentTime;
      } catch {
        // Audio metadata may not have loaded yet.
      }

      audio.play().catch(() => setMusicEnabled(false));
    }
  };

  if (!video?.url) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <video
        ref={setVideoRef}
        src={video.url}
        poster={video.thumbnailUrl}
        controls={false}
        playsInline
        preload="metadata"
        muted={hasSeparateAudio}
        data-is-reel="true"
        data-user-paused="false"
        data-has-separate-audio={hasSeparateAudio ? "true" : "false"}
        data-has-music={hasMusic ? "true" : "false"}
        onPlay={() => setIsPlaying(false)}
        onPlaying={() => setIsPlaying(true)}
        onWaiting={() => setIsPlaying(false)}
        onStalled={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={(event) => {
          event.stopPropagation();
          onOpen?.();
        }}
        className="block w-full max-h-[600px] object-contain"
        style={{ filter }}
      />

      {hasMusic && (
        <audio
          ref={musicRef}
          src={musicUrl}
          preload="metadata"
          loop
        />
      )}

      {hasVoice && (
        <audio
          ref={voiceRef}
          src={voiceUrl}
          preload="metadata"
        />
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stickers.map((sticker, index) => {
          if (!sticker?.url) return null;

          const x = clamp(sticker.x, 0, 1000, 500);
          const y = clamp(sticker.y, 0, 1000, 500);
          const scale = clamp(sticker.scale, 0.4, 3, 1);
          const rotation = clamp(sticker.rotation, -360, 360, 0);

          return (
            <img
              key={sticker._id || sticker.id || index}
              src={sticker.url}
              alt={sticker.name || "Reel sticker"}
              draggable={false}
              className="absolute object-contain"
              style={{
                left: `${x / 10}%`,
                top: `${y / 10}%`,
                width: `${72 * scale}px`,
                height: `${72 * scale}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute left-3 top-3 z-20 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={isPlaying ? pauseVideo : playVideo}
          aria-label={isPlaying ? "Pause Reel" : "Play Reel"}
          aria-pressed={isPlaying}
          title={isPlaying ? "Pause" : "Play"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition duration-200 hover:bg-black/80 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isPlaying ? (
            <Pause size={19} strokeWidth={2.4} />
          ) : (
            <Play size={19} strokeWidth={2.4} className="ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={stopVideo}
          aria-label="Stop Reel and return to beginning"
          title="Stop"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition duration-200 hover:bg-black/80 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Square size={16} strokeWidth={2.4} />
        </button>
      </div>

      {hasMusic && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={musicEnabled ? "Turn Reel music off" : "Turn Reel music on"}
          aria-pressed={musicEnabled}
          title={musicEnabled ? "Turn music off" : "Turn music on"}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition duration-200 hover:bg-black/80 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {musicEnabled ? (
            <Volume2 size={19} strokeWidth={2.2} />
          ) : (
            <VolumeX size={19} strokeWidth={2.2} />
          )}
        </button>
      )}

      {(post?.content || post?.location || hasMusic || hasVoice) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-10 pb-3 text-white pointer-events-none">
          {post?.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {post?.location && (
            <p className="mt-1 text-xs">📍 {post.location}</p>
          )}

          {Array.isArray(post?.taggedFriends) && post.taggedFriends.length > 0 && (
            <p className="mt-1 text-xs">
              With {post.taggedFriends
                .map((friend) => friend?.name || friend?.username)
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {hasMusic && (
            <p className="mt-1 text-xs truncate">
              ♫ {music.title || "Original Reel music"}
              {music.artist ? ` · ${music.artist}` : ""}
            </p>
          )}

          {hasVoice && (
            <p className="mt-1 text-xs">🎙 Voice-over</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineReelMedia;
