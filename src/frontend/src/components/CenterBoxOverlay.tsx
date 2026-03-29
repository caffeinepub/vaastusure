import { Button } from "@/components/ui/button";
import { type RefObject, useCallback, useEffect, useRef } from "react";

export interface CenterBoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = "nw" | "ne" | "se" | "sw";

interface CenterBoxOverlayProps {
  rect: CenterBoxRect;
  onChange: (rect: CenterBoxRect) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

const HANDLE_SIZE = 12;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function CenterBoxOverlay({
  rect,
  onChange,
  containerRef,
  onConfirm,
  onCancel,
}: CenterBoxOverlayProps) {
  const dragState = useRef<{
    handle: Handle | "move";
    startX: number;
    startY: number;
    startRect: CenterBoxRect;
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
        if (handle === "nw") {
          const newX = clamp(
            startRect.x + dx,
            0,
            startRect.x + startRect.w - MIN,
          );
          const newY = clamp(
            startRect.y + dy,
            0,
            startRect.y + startRect.h - MIN,
          );
          w = startRect.w + (startRect.x - newX);
          h = startRect.h + (startRect.y - newY);
          x = newX;
          y = newY;
        } else if (handle === "ne") {
          const newY = clamp(
            startRect.y + dy,
            0,
            startRect.y + startRect.h - MIN,
          );
          w = clamp(startRect.w + dx, MIN, 1 - startRect.x);
          h = startRect.h + (startRect.y - newY);
          y = newY;
        } else if (handle === "se") {
          w = clamp(startRect.w + dx, MIN, 1 - startRect.x);
          h = clamp(startRect.h + dy, MIN, 1 - startRect.y);
        } else if (handle === "sw") {
          const newX = clamp(
            startRect.x + dx,
            0,
            startRect.x + startRect.w - MIN,
          );
          w = startRect.w + (startRect.x - newX);
          h = clamp(startRect.h + dy, MIN, 1 - startRect.y);
          x = newX;
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
      startRect: { ...rect },
    };
  };

  const { x, y, w, h } = rect;
  const leftPct = `${x * 100}%`;
  const topPct = `${y * 100}%`;
  const widthPct = `${w * 100}%`;
  const heightPct = `${h * 100}%`;

  const handles: { id: Handle; style: React.CSSProperties; cursor: string }[] =
    [
      {
        id: "nw",
        style: { top: 0, left: 0, transform: "translate(-50%, -50%)" },
        cursor: "nw-resize",
      },
      {
        id: "ne",
        style: { top: 0, right: 0, transform: "translate(50%, -50%)" },
        cursor: "ne-resize",
      },
      {
        id: "se",
        style: { bottom: 0, right: 0, transform: "translate(50%, 50%)" },
        cursor: "se-resize",
      },
      {
        id: "sw",
        style: { bottom: 0, left: 0, transform: "translate(-50%, 50%)" },
        cursor: "sw-resize",
      },
    ];

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 30 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* The adjustable box */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: topPct,
          left: leftPct,
          width: widthPct,
          height: heightPct,
          border: "2px solid #f59e0b",
          boxSizing: "border-box",
          cursor: "move",
        }}
        onMouseDown={(e) => startDrag("move", e)}
      >
        {/* Diagonal SVG lines — decorative */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ overflow: "visible" }}
        >
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="100"
            y1="0"
            x2="0"
            y2="100"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Center crosshair dot */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="absolute rounded-full border-2 border-amber-400 animate-ping"
            style={{
              width: 20,
              height: 20,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div
            className="absolute rounded-full border-2 border-amber-500"
            style={{
              width: 16,
              height: 16,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div
            className="absolute rounded-full bg-amber-500"
            style={{
              width: 6,
              height: 6,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* Label near top-left */}
        <div
          className="absolute pointer-events-none"
          style={{ top: 6, left: 6 }}
        >
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap shadow-sm">
            Adjust box to match floor plan boundary
          </span>
        </div>

        {/* Corner handles */}
        {handles.map(({ id, style, cursor }) => (
          <div
            key={id}
            className="absolute bg-white border-2 border-amber-400 rounded-sm"
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

      {/* Action buttons — bottom center of the overlay */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto"
        style={{ zIndex: 40 }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-xs px-4 h-8 border-0"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          data-ocid="analysis.confirm_button"
        >
          Confirm Center
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="bg-black/40 hover:bg-black/60 text-white shadow-lg text-xs px-4 h-8 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          data-ocid="analysis.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
