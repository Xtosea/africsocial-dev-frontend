import React, { useState } from "react";
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
  setShowUpload,
  progress,
  loading,
}) => {
  const [stage, setStage] = useState("edit");
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (panel) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm">
      <div className="flex h-[94dvh] max-h-[850px] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 text-white shadow-2xl">

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

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">

          {stage === "edit" ? (
            <div className="space-y-4">

              {preview ? (
                <ReelStickerEditor
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
                    controls
                    playsInline
                  />
                </ReelStickerEditor>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mx-auto flex aspect-[9/16] w-full max-w-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-600 bg-black/40 text-white/70"
                >
                  <span className="text-5xl">＋</span>
                  <span className="text-sm font-semibold">Select a video</span>
                  <span className="text-xs text-white/40">Reels must be 1–60 seconds</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {preview && (
                <p className="text-center text-xs text-white/50">
                  Drag text and stickers directly on the video to position them.
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "music", label: "🎵 Music" },
                  { id: "stickers", label: "😀 Stickers" },
                  { id: "text", label: "T Text" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePanel(item.id)}
                    aria-pressed={activePanel === item.id}
                    className={`rounded-xl border py-3 text-sm font-semibold ${
                      activePanel === item.id
                        ? "border-blue-400 bg-blue-600 text-white"
                        : "border-white/10 bg-black/40 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {activePanel === "music" && (
                <section className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Choose music</h3>
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="text-xs text-white/50"
                    >
                      Close
                    </button>
                  </div>
                  <MusicLibrary
                    songs={songs}
                    selectedSong={selectedSong}
                    onSelect={setSelectedSong}
                  />
                </section>
              )}

              {activePanel === "stickers" && (
                <section className="flex h-[380px] flex-col overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">Choose stickers</h3>
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="text-xs text-white/50"
                    >
                      Close
                    </button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <StickerLibrary onSelect={addSticker} />
                  </div>
                </section>
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

              {selectedSong && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-500/10 p-3">
                  <span className="min-w-0 truncate text-sm text-blue-300">
                    🎵 {selectedSong.title || "Selected music"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSong(null)}
                    className="shrink-0 text-sm text-red-400"
                  >
                    Remove
                  </button>
                </div>
              )}

              {selectedStickers.length > 0 && (
                <p className="rounded-lg bg-white/10 p-3 text-sm text-white/70">
                  😀 {selectedStickers.length} sticker(s) added.
                </p>
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
      </div>
    </div>
  );
};

export default ReelUploadModal;
