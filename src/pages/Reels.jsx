import React, { useEffect, useRef, useState, useCallback } from "react";

import { API_BASE } from "../api/api";
import { getSocket } from "../socket";
import { use2Upload } from "../hooks/use2Upload";
import generateThumbnail from "../utils/generateThumbnail";
import validateVideoDuration from "../utils/validateVideoDuration";

import ReelCard from "../components/reels/ReelCard";
import ReelUploadModal from "../components/reels/ReelUploadModal";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Reels = () => {
  const [reels, setReels] = useState([]);
  const [likes, setLikes] = useState({});
  const [shares, setShares] = useState({});

  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState(null);

  const [activeIndex, setActiveIndex] = useState(0);
const [selectedFile, setSelectedFile] = useState(null);
const [durationSeconds, setDurationSeconds] = useState(null);


const [songs, setSongs] = useState([]);
const [selectedSong, setSelectedSong] = useState(null);

const [voiceOverFile, setVoiceOverFile] = useState(null);
const [voiceOverDurationSeconds, setVoiceOverDurationSeconds] = useState(0);
const [videoAdjustments, setVideoAdjustments] = useState({
  brightness: 1,
  contrast: 1,
  saturation: 1,
  sepia: 0,
});

const [stickers, setStickers] = useState([]);
const [selectedStickers, setSelectedStickers] = useState([]);

  // Reel editing and publishing details
  const [editorText, setEditorText] = useState("");
  const [editorTextPosition, setEditorTextPosition] = useState({
    x: 500,
    y: 500,
  });
  const [editorTextColor, setEditorTextColor] = useState("#FFFFFF");
  const [editorTextSize, setEditorTextSize] = useState(32);
  const [reelLocation, setReelLocation] = useState("");
  const [taggedFriendsInput, setTaggedFriendsInput] = useState("");
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowRemix, setAllowRemix] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);

const addSticker = (sticker) => {
  setSelectedStickers((current) => {
    if (current.length >= 20) {
      alert("You can add up to 20 stickers.");
      return current;
    }

    const id = `${sticker.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return [...current, {
      ...sticker,
      id,
      _id: id,
      x: 500,
      y: 500,
      scale: 1,
      rotation: 0,
    }];
  });
};

const updateSticker = (id, updates) => {
  setSelectedStickers((current) =>
    current.map((item) => item.id === id ? { ...item, ...updates } : item)
  );
};

const removeSticker = (id) => {
  setSelectedStickers((current) =>
    current.filter((item) => item.id !== id)
  );
};


  const videoRefs = useRef([]);
  const observerRef = useRef(null);
  const fileRef = useRef();
  const navigate = useNavigate();


  const { uploadFile, loading, progress } = use2Upload();
  const token = localStorage.getItem("token");

    /* ================= FETCH REELS ================= */

  const fetchReels = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/posts/reels`, {
        headers: currentToken
          ? { Authorization: `Bearer ${currentToken}` }
          : {},
      });
      const data = await res.json();

      console.log("REELS API STATUS:", res.status);
      console.log("REELS API RESPONSE:", data);

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to fetch reels (${res.status})`
        );
      }

      // The API should return an array.
      // If it returns { reels: [...] }, support that too.
      const reelsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.reels)
        ? data.reels
        : [];

      if (!Array.isArray(data) && !Array.isArray(data?.reels)) {
        console.error(
          "REELS API DID NOT RETURN AN ARRAY:",
          data
        );
      }

      setReels(reelsData);

      const likesObj = {};
      const sharesObj = {};

      reelsData.forEach((reel) => {
        likesObj[reel._id] =
          Array.isArray(reel.likes)
            ? reel.likes.length
            : 0;

        sharesObj[reel._id] =
          reel.shares || 0;
      });

      setLikes(likesObj);
      setShares(sharesObj);

    } catch (err) {
      console.error("FETCH REELS ERROR:", err);
      setReels([]);
      setLikes({});
      setShares({});
    }
  };
  /* ================= OPTIMIZED AUTOPLAY ================= */
  useEffect(() => {
    if (!reels.length) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = Number(video.dataset.index);

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(index);

            // pause others
            videoRefs.current.forEach((v) => {
              if (v && v !== video) {
                v.pause();
                v.muted = true;
              }
            });

            // Keep the video muted when separate Reel music is attached.
            video.muted = video.dataset.hasMusic === "true";
            video.play().catch(() => {});
          } else {
            video.pause();
            video.muted = true;
          }
        });
      },
      {
        threshold: [0.4, 0.6, 0.8],
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) observerRef.current.observe(video);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [reels]);




/* ================= MUSIC /STICKERS================= */
useEffect(() => {
  fetchReels();

  fetch(`${API_BASE}/api/story-music`)
    .then(r => r.json())
    .then(setSongs);

  fetch(`${API_BASE}/api/stickers`)
    .then(r => r.json())
    .then(setStickers);
}, []);

    /* ================= LIKE ================= */
  const likeReel = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("LIKE API STATUS:", res.status);
      console.log("LIKE API RESPONSE:", data);

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to like reel (${res.status})`
        );
      }

      const likeCount = Array.isArray(data?.likes)
        ? data.likes.length
        : Number(data?.likesCount) || 0;

      setLikes((prev) => ({
        ...prev,
        [id]: likeCount,
      }));
    } catch (err) {
      console.error("LIKE REEL ERROR:", err);
    }
  };

  /* ================= SHARE ================= */
  const shareReel = async (id) => {
    try {
      const reel = reels.find((r) => r._id === id);
      if (!reel) return;

      const url = `${window.location.origin}/reel/${id}`;

      if (navigator.share) {
        await navigator.share({ title: "Reel", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Copied");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= VIEW ================= */
  const recordView = async (id) => {
    try {
      await fetch(`${API_BASE}/api/posts/reels/view/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= CREATOR QUALIFYING WATCH ================= */

  const recordQualifyingWatch = async (
    contentId,
    sessionId,
    watchedSeconds
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/posts/reels/watch`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentId,
            sessionId,
            watchedSeconds,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "QUALIFYING WATCH API ERROR:",
          data
        );
        return;
      }

      console.log(
        "QUALIFYING WATCH:",
        data
      );
    } catch (err) {
      console.error(
        "QUALIFYING WATCH ERROR:",
        err
      );
    }
  };

const uploadReel = async () => {
  try {
    if (!selectedFile) {
      alert("Please select a video.");
      return;
    }

    // Upload video
const { videoUrl } = await uploadFile(selectedFile);

// Generate and upload thumbnail (optional)
    let thumbnailUrl = "";

    try {
      const thumbnailBlob = await generateThumbnail(selectedFile);

      if (thumbnailBlob && thumbnailBlob.size > 0) {
        const thumbnailFile = new File(
          [thumbnailBlob],
          "thumbnail.jpg",
          { type: "image/jpeg" }
        );

        const uploadedThumbnail = await uploadFile(thumbnailFile);
        thumbnailUrl = uploadedThumbnail?.videoUrl || "";
      }
    } catch (thumbnailError) {
      console.warn("Reel thumbnail generation/upload failed:", thumbnailError);
    }

    let voiceOver = null;

    if (voiceOverFile) {
      const uploadedVoiceOver = await uploadFile(voiceOverFile);

      if (!uploadedVoiceOver?.videoUrl) {
        throw new Error("Voice-over audio upload failed.");
      }

      voiceOver = {
        audioUrl: uploadedVoiceOver.videoUrl,
        contentType: voiceOverFile.type.split(";")[0].trim().toLowerCase(),
        durationSeconds: voiceOverDurationSeconds,
        volume: 1,
      };
    }

    const res = await fetch(`${API_BASE}/api/posts/reels`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  caption,
          visibility,
  videoUrl,
  thumbnailUrl,
  durationSeconds,

  music: selectedSong,
  voiceOver,
  videoAdjustments,
  stickers: selectedStickers,
  location: reelLocation.trim(),
  taggedFriends: taggedFriendsInput
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean),
  tags: hashtagsInput
    .split(/[,\s]+/)
    .map((tag) => tag.replace(/^#/, "").trim())
    .filter(Boolean),
  editor: {
    text: editorText,
    textPosition: editorTextPosition,
    textSize: editorTextSize,
    textColor: editorTextColor,
  },
  allowComments,
  allowDuet,
  allowRemix,
  allowDownload,
}),
    });

    if (!res.ok) {
      throw new Error("Failed to upload reel.");
    }

    setCaption("");
    setVisibility("public");
    setPreview(null);
    setSelectedFile(null);
    setDurationSeconds(null);
    setSelectedStickers([]);
    setSelectedSong(null);
    setVoiceOverFile(null);
    setVoiceOverDurationSeconds(0);
    setVideoAdjustments({
      brightness: 1,
      contrast: 1,
      saturation: 1,
      sepia: 0,
    });
    setEditorText("");
    setEditorTextPosition({ x: 500, y: 500 });
    setEditorTextColor("#FFFFFF");
    setEditorTextSize(32);
    setReelLocation("");
    setTaggedFriendsInput("");
    setHashtagsInput("");
    setAllowComments(true);
    setAllowDuet(false);
    setAllowRemix(false);
    setAllowDownload(false);
    setShowUpload(false);

    fetchReels();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black">


      <button
  onClick={() => navigate("/")}
  className="
    fixed
    top-[max(env(safe-area-inset-top),16px)]
    left-4
    z-[100]
    w-12
    h-12
    rounded-full
    bg-black/40
    backdrop-blur-md
    border
    border-white/20
    flex
    items-center
    justify-center
    text-white
    transition-all
    active:scale-95
  "
  aria-label="Back to Home"
>
  <ArrowLeft size={24} strokeWidth={2.5} />
</button>

      {reels.map((reel, i) => (
        <ReelCard
          key={reel._id}
          reel={reel}
          index={i}
          activeIndex={activeIndex}
          reelRef={(el) => (videoRefs.current[i] = el)}
          recordView={recordView}
          recordQualifyingWatch={recordQualifyingWatch}
          likeReel={likeReel}
          shareReel={shareReel}
          likes={likes}
          shares={shares}
        />
      ))}

      <button
        onClick={() => setShowUpload(true)}
        className="
fixed
bottom-6
left-1/2
-translate-x-1/2
bg-white
text-black
w-14
h-14
rounded-full
text-3xl
z-50
shadow-lg
"
      >
        +
      </button>

      {showUpload && (
        <ReelUploadModal
  preview={preview}
  caption={caption}
  visibility={visibility}
  setVisibility={setVisibility}
  setCaption={setCaption}

  songs={songs}
  selectedSong={selectedSong}
  setSelectedSong={setSelectedSong}
  voiceOverFile={voiceOverFile}
  voiceOverDurationSeconds={voiceOverDurationSeconds}
  onVoiceOverRecorded={(file, duration) => {
    setVoiceOverFile(file);
    setVoiceOverDurationSeconds(duration);
  }}
  videoAdjustments={videoAdjustments}
  setVideoAdjustments={setVideoAdjustments}
  durationSeconds={durationSeconds}

  selectedStickers={selectedStickers}
  addSticker={addSticker}
  updateSticker={updateSticker}
  removeSticker={removeSticker}
  editorText={editorText}
  setEditorText={setEditorText}
  editorTextPosition={editorTextPosition}
  setEditorTextPosition={setEditorTextPosition}
  editorTextColor={editorTextColor}
  setEditorTextColor={setEditorTextColor}
  editorTextSize={editorTextSize}
  setEditorTextSize={setEditorTextSize}
  reelLocation={reelLocation}
  setReelLocation={setReelLocation}
  taggedFriendsInput={taggedFriendsInput}
  setTaggedFriendsInput={setTaggedFriendsInput}
  hashtagsInput={hashtagsInput}
  setHashtagsInput={setHashtagsInput}
  allowComments={allowComments}
  setAllowComments={setAllowComments}
  allowDuet={allowDuet}
  setAllowDuet={setAllowDuet}
  allowRemix={allowRemix}
  setAllowRemix={setAllowRemix}
  allowDownload={allowDownload}
  setAllowDownload={setAllowDownload}

  fileRef={fileRef}

  onVideoRecorded={async (file) => {
    if (!file) return;

    try {
      const duration = await validateVideoDuration(file, 60);
      setSelectedFile(file);
      setDurationSeconds(duration);
      setPreview(URL.createObjectURL(file));
    } catch (err) {
      setSelectedFile(null);
      setDurationSeconds(null);
      setPreview(null);
      alert(
        typeof err === "string"
          ? err
          : err?.message || "The recorded video is invalid."
      );
    }
  }}

  handleFileChange={async (e) => {
    const file = e.target.files[0];

    if (!file) {
      setSelectedFile(null);
      setDurationSeconds(null);
      return;
    }

    try {
      const duration = await validateVideoDuration(file, 60);

      setSelectedFile(file);
      setDurationSeconds(duration);
      setPreview(URL.createObjectURL(file));
    } catch (err) {
      setSelectedFile(null);
      setDurationSeconds(null);
      setPreview(null);

      alert(
        typeof err === "string"
          ? err
          : err?.message || "Invalid video file"
      );

      e.target.value = "";
    }
  }}

  uploadReel={uploadReel}
  setShowUpload={setShowUpload}
  progress={progress}
  loading={loading}
/>
      )}
    </div>
  );
};

export default Reels;