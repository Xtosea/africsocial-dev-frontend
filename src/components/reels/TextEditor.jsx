import React from "react";

export default function TextEditor({
  text = "",
  setText,
  textColor = "#FFFFFF",
  setTextColor,
  textSize = 32,
  setTextSize,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-3">
      <label className="block text-sm font-semibold text-white">
        Text overlay
      </label>

      <input
        type="text"
        maxLength={500}
        value={text}
        onChange={(event) => setText?.(event.target.value)}
        placeholder="Type something..."
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-blue-500"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-white/80">
          Text colour
          <input
            type="color"
            value={textColor}
            onChange={(event) => setTextColor?.(event.target.value)}
            className="h-9 w-10 cursor-pointer rounded"
          />
        </label>

        <label className="flex flex-1 items-center gap-2 text-sm text-white/80">
          Size
          <input
            type="range"
            min="12"
            max="80"
            value={textSize}
            onChange={(event) =>
              setTextSize?.(Number(event.target.value))
            }
            className="min-w-0 flex-1"
          />
          <span>{textSize}px</span>
        </label>

        <button
          type="button"
          onClick={() => setText?.("")}
          className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-300"
        >
          Remove text
        </button>
      </div>

      <p className="text-xs text-white/50">
        Drag the text directly on the video preview to position it.
      </p>
    </div>
  );
}
