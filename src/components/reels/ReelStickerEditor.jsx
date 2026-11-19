import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

function ReelStickerItem({ sticker, width, height, onUpdate, onRemove }) {
  const nodeRef = useRef(null);

  const x = (Number(sticker.x ?? 500) / 1000) * width;
  const y = (Number(sticker.y ?? 500) / 1000) * height;

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={{ x, y }}
      onStop={(_, data) =>
        onUpdate?.(sticker.id, {
          x: Math.round(clamp(data.x / width, 0, 1) * 1000),
          y: Math.round(clamp(data.y / height, 0, 1) * 1000),
        })
      }
    >
      <div
        ref={nodeRef}
        className="absolute left-0 top-0 z-20"
        style={{ cursor: "move", touchAction: "none" }}
      >
        <div
          className="relative flex h-20 w-20 items-center justify-center"
          style={{
            transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
            transformOrigin: "center",
          }}
        >
          <img
            src={sticker.url}
            alt={sticker.name || "Reel sticker"}
            draggable={false}
            className="h-full w-full select-none object-contain"
          />

          <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/90 p-1 shadow-lg">
            <button
              type="button"
              aria-label="Delete sticker"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={() => onRemove?.(sticker.id)}
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-red-600 px-3 text-sm font-bold text-white shadow-lg"
            >
              ✕
            </button>

            <button
              type="button"
              aria-label="Make sticker smaller"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={() =>
                onUpdate?.(sticker.id, {
                  scale: clamp((sticker.scale || 1) - 0.2, 0.4, 3),
                })
              }
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-black/80 px-3 text-base font-bold text-white shadow-lg ring-1 ring-white/30"
            >
              −
            </button>

            <button
              type="button"
              aria-label="Make sticker larger"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={() =>
                onUpdate?.(sticker.id, {
                  scale: clamp((sticker.scale || 1) + 0.2, 0.4, 3),
                })
              }
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-black/80 px-3 text-base font-bold text-white shadow-lg ring-1 ring-white/30"
            >
              +
            </button>

            <button
              type="button"
              aria-label="Rotate sticker"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={() =>
                onUpdate?.(sticker.id, {
                  rotation: ((sticker.rotation || 0) + 15) % 360,
                })
              }
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-black/80 px-3 text-base font-bold text-white shadow-lg ring-1 ring-white/30"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
    </Draggable>
  );
}

function ReelTextOverlay({
  text,
  textPosition,
  textColor,
  textSize,
  width,
  height,
  onPositionChange,
}) {
  const nodeRef = useRef(null);

  if (!text || width <= 0 || height <= 0) return null;

  const x = (Number(textPosition?.x ?? 500) / 1000) * width;
  const y = (Number(textPosition?.y ?? 500) / 1000) * height;

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={{ x, y }}
      onStop={(_, data) => {
        onPositionChange?.({
          x: Math.round(clamp(data.x / width, 0, 1) * 1000),
          y: Math.round(clamp(data.y / height, 0, 1) * 1000),
        });
      }}
    >
      <div
        ref={nodeRef}
        className="absolute left-0 top-0 z-30 max-w-[90%] cursor-move break-words text-center font-bold drop-shadow-lg"
        style={{
          color: textColor || "#FFFFFF",
          fontSize: `${textSize || 32}px`,
          transform: "translate(-50%, -50%)",
          touchAction: "none",
          textShadow: "0 2px 5px rgba(0,0,0,0.85)",
        }}
      >
        {text}
      </div>
    </Draggable>
  );
}

export default function ReelStickerEditor({
  stickers = [],
  onUpdate,
  onRemove,
  children,
  text = "",
  textPosition = { x: 500, y: 500 },
  textColor = "#FFFFFF",
  textSize = 32,
  onTextPositionChange,
  fullScreen = false,
}) {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const { width, height } = stageSize;

  return (
    <div
      ref={stageRef}
      className={fullScreen
        ? "relative h-full w-full overflow-hidden bg-black"
        : "relative mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-xl border border-white/20 bg-black"
      }
    >
      <div className="absolute inset-0">
        {children}
      </div>

      {width > 0 && height > 0 && (
        <>
          {stickers.map((sticker) => (
            <ReelStickerItem
              key={sticker.id}
              sticker={sticker}
              width={width}
              height={height}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}

          <ReelTextOverlay
            text={text}
            textPosition={textPosition}
            textColor={textColor}
            textSize={textSize}
            width={width}
            height={height}
            onPositionChange={onTextPositionChange}
          />
        </>
      )}
    </div>
  );
}
