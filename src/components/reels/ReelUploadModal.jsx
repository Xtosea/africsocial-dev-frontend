import React, { useEffect, useRef, useState } from "react";
import MusicLibrary from "./MusicLibrary";
import StickerLibrary from "./StickerLibrary";
import ReelStickerEditor from "./ReelStickerEditor";
import TextEditor from "./TextEditor";

const ReelUploadModal = ({
  preview,
  caption,
  setCaption,
  visibility,
  setVisibility,
  songs,
  selectedSong,
  setSelectedSong,
  selectedStickers = [],
  addSticker,
  updateSticker,
  removeSticker,
  editorText = "",
  setEditorText,
  editorTextPosition = { x: 500, y: 500 },
  setEditorTextPosition,
  editorTextColor = "#FFFFFF",
  setEditorTextColor,
  editorTextSize = 32,
  setEditorTextSize,
  reelLocation = "",
  setReelLocation,
  taggedFriendsInput = "",
  setTaggedFriendsInput,
  hashtagsInput = "",
  setHashtagsInput,
  allowComments = true,
  setAllowComments,
  allowDuet = false,
  setAllowDuet,
  allowRemix = false,
  setAllowRemix,
  allowDownload = false,
  setAllowDownload,
  fileRef,
  handleFileChange,
  uploadReel,
  onVideoRecorded,
  voiceOverFile = null,
  voiceOverDurationSeconds = 0,
  onVoiceOverRecorded,
  videoAdjustments = { brightness: 1, contrast: 1, saturation: 1, sepia: 0 },
  setVideoAdjustments,
  durationSeconds = 0,
  setShowUpload,
  progress,
  loading,
}) => {
  const [stage, setStage] = useState("edit");
  const [activePanel, setActivePanel] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [voiceOverRecording, setVoiceOverRecording] = useState(false);
  const [voiceOverSeconds, setVoiceOverSeconds] = useState(0);
  const [voiceOverError, setVoiceOverError] = useState("");
  const [voiceOverPreview, setVoiceOverPreview] = useState("");

  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const discardRecordingRef = useRef(false);
  const voiceOverStreamRef = useRef(null);
  const voiceOverRecorderRef = useRef(null);
  const voiceOverTimerRef = useRef(null);
  const voiceOverChunksRef = useRef([]);
  const voiceOverSecondsRef = useRef(0);
  const voiceOverMaxSecondsRef = useRef(60);
  const discardVoiceOverRef = useRef(false);

  useEffect(() => {
    if (!cameraOpen || !cameraVideoRef.current || !cameraStreamRef.current) {
      return;
    }

    cameraVideoRef.current.srcObject = cameraStreamRef.current;
    cameraVideoRef.current.play().catch(() => {});
  }, [cameraOpen]);

  useEffect(() => {
    if (!voiceOverFile) {
      setVoiceOverPreview("");
      return;
    }

    const url = URL.createObjectURL(voiceOverFile);
    setVoiceOverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [voiceOverFile]);

  useEffect(() => {
    return () => {
      discardRecordingRef.current = true;

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());

      if (voiceOverTimerRef.current) {
        clearInterval(voiceOverTimerRef.current);
      }

      if (voiceOverRecorderRef.current?.state === "recording") {
        discardVoiceOverRef.current = true;
        voiceOverRecorderRef.current.stop();
      }

      voiceOverStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const closeCamera = () => {
    discardRecordingRef.current = true;

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraOpen(false);
      setIsRecording(false);
      setRecordingSeconds(0);
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const openCamera = async () => {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setCameraError("Camera recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (error) {
      setCameraError(
        error?.message || "Camera or microphone permission was denied."
      );
    }
  };

  const startRecording = () => {
    const stream = cameraStreamRef.current;
    if (!stream || isRecording) return;

    try {
      const supportedTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (!discardRecordingRef.current && blob.size > 0) {
          const extension = blob.type.includes("mp4") ? "mp4" : "webm";
          const file = new File(
            [blob],
            `africsocial-reel-${Date.now()}.${extension}`,
            { type: blob.type }
          );

          onVideoRecorded?.(file);
        }

        stream.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
        setCameraOpen(false);
        setIsRecording(false);
        setRecordingSeconds(0);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((current) => {
          if (current >= 59) {
            if (recorder.state === "recording") recorder.stop();
            return 60;
          }
          return current + 1;
        });
      }, 1000);
    } catch (error) {
      setCameraError(error?.message || "Could not start recording.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const stopVoiceOver = (discard = false) => {
    if (discard) discardVoiceOverRef.current = true;

    if (voiceOverRecorderRef.current?.state === "recording") {
      voiceOverRecorderRef.current.stop();
    }

    if (voiceOverTimerRef.current) {
      clearInterval(voiceOverTimerRef.current);
      voiceOverTimerRef.current = null;
    }
  };

  const startVoiceOver = async () => {
    setVoiceOverError("");

    if (cameraOpen || isRecording) {
      setVoiceOverError("Close camera recording before recording a voice-over.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceOverError("Audio recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceOverStreamRef.current = stream;

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];

      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const maxSeconds = Math.max(
        1,
        Math.min(60, Math.ceil(Number(durationSeconds) || 60))
      );

      voiceOverMaxSecondsRef.current = maxSeconds;
      voiceOverSecondsRef.current = 0;
      voiceOverChunksRef.current = [];
      discardVoiceOverRef.current = false;
      voiceOverRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          voiceOverChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(voiceOverChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (!discardVoiceOverRef.current && blob.size > 0) {
          const type = blob.type || "audio/webm";
          const extension = type.includes("mp4")
            ? "m4a"
            : type.includes("ogg")
              ? "ogg"
              : type.includes("mpeg")
                ? "mp3"
                : "webm";

          const file = new File(
            [blob],
            `africsocial-voiceover-${Date.now()}.${extension}`,
            { type }
          );

          onVoiceOverRecorded?.(file, voiceOverSecondsRef.current);
        }

        stream.getTracks().forEach((track) => track.stop());
        voiceOverStreamRef.current = null;
        voiceOverRecorderRef.current = null;
        setVoiceOverRecording(false);

        if (voiceOverTimerRef.current) {
          clearInterval(voiceOverTimerRef.current);
          voiceOverTimerRef.current = null;
        }
      };

      recorder.start(250);
      setVoiceOverRecording(true);
      setVoiceOverSeconds(0);

      voiceOverTimerRef.current = setInterval(() => {
        const next = voiceOverSecondsRef.current + 1;
        voiceOverSecondsRef.current = next;
        setVoiceOverSeconds(next);

        if (
          next >= voiceOverMaxSecondsRef.current &&
          recorder.state === "recording"
        ) {
          recorder.stop();
        }
      }, 1000);
    } catch (error) {
      voiceOverStreamRef.current?.getTracks().forEach((track) => track.stop());
      voiceOverStreamRef.current = null;
      setVoiceOverRecording(false);
      setVoiceOverError(error?.message || "Could not access the microphone.");
    }
  };

  const togglePanel = (panel) => {
    setVoiceOverError("");
    setActivePanel((current) => current === panel ? null : panel);
  };

  const PermissionSwitch = ({ label, checked, onChange, description }) => (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="mt-1 block text-xs text-white/50">
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={loading}
        className="mt-1 h-5 w-5 accent-blue-500"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
      <div className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-zinc-950 text-white">

        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h2 className="text-lg font-bold">
              {stage === "edit" ? "Edit your Reel" : "Reel details"}
            </h2>
            <p className="text-xs text-white/50">
              {stage === "edit" ? "Step 1 of 2 · Create your video" : "Step 2 of 2 · Prepare to publish"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUpload(false)}
            disabled={loading}
            aria-label="Close Reel editor"
            className="rounded-lg px-3 py-2 text-2xl text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <main className={stage === "edit"
          ? "relative min-h-0 flex-1 overflow-hidden bg-black"
          : "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"}>

          {stage === "edit" ? (
            <div className="relative h-full w-full overflow-hidden bg-black">
              {preview ? (
                <>
                  <div className="absolute inset-0">
                    <ReelStickerEditor
                      fullScreen
                      stickers={selectedStickers}
                      onUpdate={updateSticker}
                      onRemove={removeSticker}
                      text={editorText}
                      textPosition={editorTextPosition}
                      textColor={editorTextColor}
                      textSize={editorTextSize}
                      onTextPositionChange={setEditorTextPosition}
                    >
                      <video
                        src={preview}
                        className="h-full w-full bg-black object-contain"
                        style={{
                          filter: `brightness(${videoAdjustments?.brightness ?? 1}) contrast(${videoAdjustments?.contrast ?? 1}) saturate(${videoAdjustments?.saturation ?? 1}) sepia(${videoAdjustments?.sepia ?? 0})`,
                        }}
                        controls
                        playsInline
                      />
                    </ReelStickerEditor>
                  </div>

                  <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
                    {[
                      { id: "music", icon: "🎵", label: "Music" },
                      { id: "stickers", icon: "😀", label: "Stickers" },
                      { id: "text", icon: "T", label: "Text" },
                      { id: "adjustments", icon: "🎚️", label: "Adjust" },
                      { id: "voiceover", icon: "🎙️", label: "Voice-over" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePanel(item.id)}
                        aria-pressed={activePanel === item.id}
                        className={`flex w-16 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold shadow-lg ${
                          activePanel === item.id
                            ? "border-blue-400 bg-blue-600 text-white"
                            : "border-white/20 bg-black/75 text-white"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={openCamera}
                      disabled={loading || voiceOverRecording}
                      className="flex w-16 flex-col items-center gap-1 rounded-xl border border-red-400/50 bg-red-600/90 px-2 py-3 text-xs font-semibold shadow-lg disabled:opacity-50"
                    >
                      <span className="text-xl">●</span>
                      Record
                    </button>
                  </div>

                  {activePanel && (
                    <section className="absolute bottom-3 left-3 right-[5.5rem] z-30 flex max-h-[55%] flex-col overflow-hidden rounded-2xl border border-white/20 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md">
                      <div className="mb-2 flex shrink-0 items-center justify-between">
                        <h3 className="font-semibold">
                          {activePanel === "music" && "Choose music"}
                          {activePanel === "stickers" && "Choose stickers"}
                          {activePanel === "text" && "Add text"}
                          {activePanel === "adjustments" && "Adjust video"}
                          {activePanel === "voiceover" && "Voice-over"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActivePanel(null)}
                          className="rounded-lg px-3 py-1 text-sm text-white/70 hover:bg-white/10"
                        >
                          Close
                        </button>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        {activePanel === "music" && (
                          <MusicLibrary
                            songs={songs}
                            selectedSong={selectedSong}
                            onSelect={setSelectedSong}
                          />
                        )}

                        {activePanel === "stickers" && (
                          <StickerLibrary onSelect={addSticker} />
                        )}

                        {activePanel === "text" && (
                          <TextEditor
                            text={editorText}
                            setText={setEditorText}
                            textColor={editorTextColor}
                            setTextColor={setEditorTextColor}
                            textSize={editorTextSize}
                            setTextSize={setEditorTextSize}
                          />
                        )}

                        {activePanel === "adjustments" && (
                          <div className="space-y-4">
                            {[
                              { key: "brightness", label: "Brightness", min: 0.5, max: 1.5, step: 0.05 },
                              { key: "contrast", label: "Contrast", min: 0.5, max: 1.5, step: 0.05 },
                              { key: "saturation", label: "Saturation", min: 0, max: 2, step: 0.05 },
                              { key: "sepia", label: "Sepia", min: 0, max: 1, step: 0.05 },
                            ].map((item) => (
                              <label key={item.key} className="block">
                                <span className="mb-1 flex justify-between text-xs text-white/80">
                                  <span>{item.label}</span>
                                  <span>{Number(videoAdjustments?.[item.key] ?? (item.key === "sepia" ? 0 : 1)).toFixed(2)}</span>
                                </span>
                                <input
                                  type="range"
                                  min={item.min}
                                  max={item.max}
                                  step={item.step}
                                  value={videoAdjustments?.[item.key] ?? (item.key === "sepia" ? 0 : 1)}
                                  onChange={(event) =>
                                    setVideoAdjustments?.((current) => ({
                                      ...current,
                                      [item.key]: Number(event.target.value),
                                    }))
                                  }
                                  className="w-full accent-blue-500"
                                />
                              </label>
                            ))}

                            <button
                              type="button"
                              onClick={() => setVideoAdjustments?.({
                                brightness: 1,
                                contrast: 1,
                                saturation: 1,
                                sepia: 0,
                              })}
                              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold"
                            >
                              Reset adjustments
                            </button>
                          </div>
                        )}

                        {activePanel === "voiceover" && (
                          <div className="space-y-3">
                            <p className="text-xs text-white/60">
                              Record narration for this Reel. Maximum duration: {Math.max(1, Math.min(60, Math.ceil(Number(durationSeconds) || 60)))} seconds.
                            </p>

                            {voiceOverPreview && (
                              <audio
                                key={voiceOverPreview}
                                src={voiceOverPreview}
                                controls
                                className="w-full"
                              />
                            )}

                            {voiceOverFile && !voiceOverRecording && (
                              <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-950/60 p-2 text-xs">
                                <span>Voice-over ready · {voiceOverDurationSeconds || voiceOverSeconds}s</span>
                                <button
                                  type="button"
                                  onClick={() => onVoiceOverRecorded?.(null, 0)}
                                  className="text-red-300 underline"
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            {voiceOverRecording ? (
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-sm text-red-300">
                                  ● Recording {voiceOverSeconds}s
                                </span>
                                <button
                                  type="button"
                                  onClick={() => stopVoiceOver(false)}
                                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold"
                                >
                                  Stop
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={startVoiceOver}
                                disabled={loading || cameraOpen}
                                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold disabled:opacity-50"
                              >
                                {voiceOverFile ? "Record again" : "Start voice-over"}
                              </button>
                            )}

                            {voiceOverError && (
                              <p className="text-xs text-red-300">{voiceOverError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {(selectedSong || selectedStickers.length > 0) && (
                    <div className="absolute bottom-3 left-3 z-10 max-w-[65%] space-y-1">
                      {selectedSong && (
                        <div className="flex items-center gap-2 rounded-lg bg-black/75 px-3 py-2 text-xs text-blue-200">
                          <span className="min-w-0 truncate">
                            🎵 {selectedSong.title || "Selected music"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSong(null)}
                            className="shrink-0 text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {selectedStickers.length > 0 && (
                        <p className="rounded-lg bg-black/75 px-3 py-2 text-xs text-white/80">
                          😀 {selectedStickers.length} sticker(s)
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
                  <div className="text-6xl">🎬</div>
                  <p className="text-center text-sm text-white/70">
                    Select a video or record a new Reel.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full max-w-xs rounded-xl bg-blue-600 px-5 py-4 font-semibold"
                  >
                    Select from gallery
                  </button>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="w-full max-w-xs rounded-xl bg-red-600 px-5 py-4 font-semibold"
                  >
                    ● Record video · Up to 60 seconds
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {cameraError && !cameraOpen && (
                <div className="absolute bottom-3 left-3 right-3 z-40 rounded-xl bg-red-950/95 p-3 text-sm text-red-200">
                  {cameraError}
                  <button
                    type="button"
                    onClick={() => setCameraError("")}
                    className="ml-3 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">

              <section>
                <label className="mb-2 block text-sm font-semibold">
                  Description
                </label>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={5000}
                  rows={4}
                  placeholder="Write something about your Reel..."
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-black p-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-right text-xs text-white/40">
                  {caption.length}/5000
                </p>
              </section>

              <section>
                <label className="mb-2 block text-sm font-semibold">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={hashtagsInput}
                  onChange={(event) => setHashtagsInput?.(event.target.value)}
                  placeholder="#AfricSocial #Reels"
                  className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-white/40">
                  Separate hashtags with spaces or commas.
                </p>
              </section>

              <section>
                <label className="mb-2 block text-sm font-semibold">
                  Tag people
                </label>
                <input
                  type="text"
                  value={taggedFriendsInput}
                  onChange={(event) => setTaggedFriendsInput?.(event.target.value)}
                  placeholder="Enter usernames separated by commas"
                  className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-white/40">
                  Enter the usernames you want to tag.
                </p>
              </section>

              <section>
                <label className="mb-2 block text-sm font-semibold">
                  Location
                </label>
                <input
                  type="text"
                  value={reelLocation}
                  onChange={(event) => setReelLocation?.(event.target.value)}
                  maxLength={200}
                  placeholder="Add a location"
                  className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </section>

              <section className="rounded-xl border border-zinc-700 bg-black/40 p-3">
                <label htmlFor="reel-visibility" className="block text-sm font-semibold">
                  Who can see this Reel?
                </label>
                <select
                  id="reel-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-3 text-sm text-white"
                >
                  <option value="public">Public — Everyone</option>
                  <option value="friends">Friends — Accepted friends</option>
                  <option value="private">Private — Only me</option>
                </select>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold">Interaction and permissions</h3>

                <PermissionSwitch
                  label="Allow comments"
                  description="Let viewers comment on this Reel."
                  checked={allowComments}
                  onChange={setAllowComments}
                />

                <PermissionSwitch
                  label="Allow Duet"
                  description="Let other creators make a split-screen Duet."
                  checked={allowDuet}
                  onChange={setAllowDuet}
                />

                <PermissionSwitch
                  label="Allow Remix"
                  description="Let other creators reuse this Reel in a Remix."
                  checked={allowRemix}
                  onChange={setAllowRemix}
                />

                <PermissionSwitch
                  label="Allow downloads"
                  description="Allow viewers to download this Reel where permitted."
                  checked={allowDownload}
                  onChange={setAllowDownload}
                />
              </section>

              <div className="rounded-xl bg-blue-500/10 p-3 text-xs leading-5 text-blue-200/80">
                Your Reel will use the audience selected above. Private or
                restricted content remains subject to account and friendship
                privacy rules.
              </div>
            </div>
          )}
        </main>

        {loading && (
          <div className="shrink-0 border-t border-white/10 px-4 py-3">
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-3 bg-blue-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, Number(progress) || 0))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-center text-sm">
              Uploading... {progress}%
            </p>
          </div>
        )}

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/10 bg-zinc-900 p-3">
          {stage === "edit" ? (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="rounded-xl bg-zinc-700 py-3 text-sm font-semibold hover:bg-zinc-600 disabled:opacity-50"
              >
                Change video
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePanel(null);
                  setStage("details");
                }}
                disabled={loading || !preview}
                className="rounded-xl bg-blue-600 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Next →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStage("edit")}
                disabled={loading}
                className="rounded-xl bg-zinc-700 py-3 text-sm font-semibold hover:bg-zinc-600 disabled:opacity-50"
              >
                ← Back to edit
              </button>

              <button
                type="button"
                onClick={uploadReel}
                disabled={loading || !preview}
                className="rounded-xl bg-blue-600 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Publishing..." : "Publish Reel"}
              </button>
            </>
          )}
        </footer>

        {cameraOpen && (
          <div className="absolute inset-0 z-[60] flex flex-col bg-black">
            <div className="flex shrink-0 items-center justify-between p-4">
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <span className="text-sm font-semibold">
                Record your Reel
              </span>
              <span className="min-w-14 text-right font-mono text-sm">
                00:{String(recordingSeconds).padStart(2, "0")}
              </span>
            </div>

            <div className="relative min-h-0 flex-1 bg-black">
              <video
                ref={cameraVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-contain"
              />
              <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70">
                Maximum recording time: 60 seconds
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-center gap-8 p-6">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="h-20 w-20 rounded-full border-4 border-white bg-red-600 shadow-lg"
                  aria-label="Start recording"
                />
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-400 bg-red-600 text-sm font-bold"
                >
                  STOP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelUploadModal;
