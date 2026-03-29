import { type RefObject, useCallback, useEffect, useRef } from "react";

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface CropOverlayProps {
  cropRect: CropRect;
  onChange: (rect: CropRect) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

const HANDLE_SIZE = 10;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function CropOverlay({
  cropRect,
  onChange,
  containerRef,
}: CropOverlayProps) {
  const dragState = useRef<{
    handle: Handle | "move";
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);

  const getContainerSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { width: 1, height: 1 };
    return { width: el.offsetWidth, height: el.offsetHeight };
  }, [containerRef]);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.current) return;
      const { handle, startX, startY, startRect } = dragState.current;
      const { width, height } = getContainerSize();
      const dx = (e.clientX - startX) / width;
      const dy = (e.clientY - startY) / height;

      let { x, y, w, h } = startRect;
      const MIN = 0.05;

      if (handle === "move") {
        x = clamp(startRect.x + dx, 0, 1 - w);
        y = clamp(startRect.y + dy, 0, 1 - h);
      } else {
        if (handle.includes("w")) {
          const newX = clamp(
            startRect.x + dx,
            0,
            startRect.x + startRect.w - MIN,
          );
          w = startRect.w + (startRect.x - newX);
          x = newX;
        }
        if (handle.includes("e")) {
          w = clamp(startRect.w + dx, MIN, 1 - startRect.x);
        }
        if (handle.includes("n")) {
          const newY = clamp(
            startRect.y + dy,
            0,
            startRect.y + startRect.h - MIN,
          );
          h = startRect.h + (startRect.y - newY);
          y = newY;
        }
        if (handle.includes("s")) {
          h = clamp(startRect.h + dy, MIN, 1 - startRect.y);
        }
      }

      onChange({ x, y, w, h });
    },
    [getContainerSize, onChange],
  );

  const onMouseUp = useCallback(() => {
    dragState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const startDrag = (handle: Handle | "move", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
    };
  };

  const { x, y, w, h } = cropRect;
  const left = `${x * 100}%`;
  const top = `${y * 100}%`;
  const width = `${w * 100}%`;
  const height = `${h * 100}%`;

  const handles: { id: Handle; style: React.CSSProperties; cursor: string }[] =
    [
      {
        id: "nw",
        style: { top: 0, left: 0, transform: "translate(-50%, -50%)" },
        cursor: "nw-resize",
      },
      {
        id: "n",
        style: { top: 0, left: "50%", transform: "translate(-50%, -50%)" },
        cursor: "n-resize",
      },
      {
        id: "ne",
        style: { top: 0, right: 0, transform: "translate(50%, -50%)" },
        cursor: "ne-resize",
      },
      {
        id: "e",
        style: { top: "50%", right: 0, transform: "translate(50%, -50%)" },
        cursor: "e-resize",
      },
      {
        id: "se",
        style: { bottom: 0, right: 0, transform: "translate(50%, 50%)" },
        cursor: "se-resize",
      },
      {
        id: "s",
        style: { bottom: 0, left: "50%", transform: "translate(-50%, 50%)" },
        cursor: "s-resize",
      },
      {
        id: "sw",
        style: { bottom: 0, left: 0, transform: "translate(-50%, 50%)" },
        cursor: "sw-resize",
      },
      {
        id: "w",
        style: { top: "50%", left: 0, transform: "translate(-50%, -50%)" },
        cursor: "w-resize",
      },
    ];

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 30 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Dark mask — top */}
      <div
        className="absolute bg-black/50"
        style={{ top: 0, left: 0, right: 0, height: top }}
      />
      {/* Dark mask — bottom */}
      <div
        className="absolute bg-black/50"
        style={{ top: `${(y + h) * 100}%`, left: 0, right: 0, bottom: 0 }}
      />
      {/* Dark mask — left */}
      <div
        className="absolute bg-black/50"
        style={{ top, left: 0, width: left, height }}
      />
      {/* Dark mask — right */}
      <div
        className="absolute bg-black/50"
        style={{ top, left: `${(x + w) * 100}%`, right: 0, height }}
      />

      {/* Crop rectangle */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top,
          left,
          width,
          height,
          border: "2px dashed white",
          boxSizing: "border-box",
          cursor: "move",
        }}
        onMouseDown={(e) => startDrag("move", e)}
      >
        {/* Rule of thirds grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bg-white/20"
            style={{ left: "33.33%", top: 0, bottom: 0, width: 1 }}
          />
          <div
            className="absolute bg-white/20"
            style={{ left: "66.66%", top: 0, bottom: 0, width: 1 }}
          />
          <div
            className="absolute bg-white/20"
            style={{ top: "33.33%", left: 0, right: 0, height: 1 }}
          />
          <div
            className="absolute bg-white/20"
            style={{ top: "66.66%", left: 0, right: 0, height: 1 }}
          />
        </div>

        {/* Resize handles */}
        {handles.map(({ id, style, cursor }) => (
          <div
            key={id}
            className="absolute bg-white border-2 border-blue-400 rounded-sm"
            style={{
              ...style,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              cursor,
              pointerEvents: "all",
            }}
            onMouseDown={(e) => startDrag(id, e)}
          />
        ))}
      </div>
    </div>
  );
}
