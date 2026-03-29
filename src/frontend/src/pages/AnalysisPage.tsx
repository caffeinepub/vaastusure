import {
  CenterBoxOverlay,
  type CenterBoxRect,
} from "@/components/CenterBoxOverlay";
import { CompassSVG } from "@/components/CompassSVG";
import { CropOverlay, type CropRect } from "@/components/CropOverlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ALL_ROOM_TYPES,
  ROOM_COLORS,
  type RoomLabel,
  type RoomType,
  angleToDirection,
  getDirection,
} from "@/utils/vastuEngine";
import {
  ChevronLeft,
  Crop,
  Crosshair,
  FileText,
  Info,
  MapPin,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

const ORIENTATION_TYPES: RoomType[] = [
  "Main Door",
  "Cooking",
  "WC",
  "Bed Head",
];

function isOrientationType(room: RoomType): boolean {
  return ORIENTATION_TYPES.includes(room);
}

interface AnalysisPageProps {
  file: File;
  imagePreview: string | null;
  roomLabels: RoomLabel[];
  onLabelsChange: (labels: RoomLabel[]) => void;
  onRunAnalysis: () => void;
  onBack: () => void;
  onImageCrop?: (dataUrl: string) => void;
}

export function AnalysisPage({
  file,
  imagePreview,
  roomLabels,
  onLabelsChange,
  onRunAnalysis,
  onBack,
  onImageCrop,
}: AnalysisPageProps) {
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [northAngle, setNorthAngle] = useState(0);
  const [centerPoint, setCenterPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [setCenterMode, setSetCenterMode] = useState(false);
  const [centerBox, setCenterBox] = useState<CenterBoxRect | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [draggingArrow, setDraggingArrow] = useState<{ id: string } | null>(
    null,
  );
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isPDF = file.type === "application/pdf";

  const cx = centerPoint?.x ?? 0.5;
  const cy = centerPoint?.y ?? 0.5;

  const handleNorthAngleChange = useCallback(
    (angle: number) => {
      setNorthAngle(angle);
      if (roomLabels.length > 0) {
        onLabelsChange(
          roomLabels.map((l) => ({
            ...l,
            direction: isOrientationType(l.room)
              ? angleToDirection(l.arrowAngle ?? 0)
              : getDirection(l.x, l.y, angle, cx, cy),
          })),
        );
      }
    },
    [roomLabels, onLabelsChange, cx, cy],
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (cropMode) return;
      if (setCenterMode) return;
      if (draggingArrow) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setPendingPos({ x, y });
      setDialogOpen(true);
    },
    [cropMode, setCenterMode, draggingArrow],
  );

  const handleImageKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (cropMode || setCenterMode) return;
      if (e.key === "Enter" || e.key === " ") {
        setPendingPos({ x: 0.5, y: 0.5 });
        setDialogOpen(true);
        e.preventDefault();
      }
    },
    [cropMode, setCenterMode],
  );

  const handleContainerPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingArrow) return;
      const container = imageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const label = roomLabels.find((l) => l.id === draggingArrow.id);
      if (!label) return;

      const labelPx = label.x * rect.width;
      const labelPy = label.y * rect.height;
      const dx = e.clientX - rect.left - labelPx;
      const dy = e.clientY - rect.top - labelPy;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = angleRad * (180 / Math.PI) + 90;
      const normalized = ((angleDeg % 360) + 360) % 360;
      const direction = angleToDirection(normalized);

      onLabelsChange(
        roomLabels.map((l) =>
          l.id === draggingArrow.id
            ? { ...l, arrowAngle: normalized, direction }
            : l,
        ),
      );
    },
    [draggingArrow, roomLabels, onLabelsChange],
  );

  const handleContainerPointerUp = useCallback(() => {
    setDraggingArrow(null);
  }, []);

  const handleRoomSelect = (room: RoomType) => {
    if (!pendingPos) return;
    const isOrientation = isOrientationType(room);
    const direction = isOrientation
      ? "N"
      : getDirection(pendingPos.x, pendingPos.y, northAngle, cx, cy);
    const newLabel: RoomLabel = {
      id: `${Date.now()}`,
      x: pendingPos.x,
      y: pendingPos.y,
      room,
      direction,
      arrowAngle: isOrientation ? 0 : undefined,
    };
    onLabelsChange([...roomLabels, newLabel]);
    setDialogOpen(false);
    setPendingPos(null);
  };

  const removeLabel = (id: string) => {
    onLabelsChange(roomLabels.filter((l) => l.id !== id));
  };

  const handleEnterCropMode = () => {
    setCropMode(true);
    setSetCenterMode(false);
    setCenterBox(null);
    setCropRect({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  };

  const handleCancelCrop = () => {
    setCropMode(false);
    setCropRect(null);
  };

  const handleApplyCrop = useCallback(() => {
    if (!imagePreview || !cropRect || !onImageCrop) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const sw = img.naturalWidth * cropRect.w;
      const sh = img.naturalHeight * cropRect.h;
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        img,
        img.naturalWidth * cropRect.x,
        img.naturalHeight * cropRect.y,
        sw,
        sh,
        0,
        0,
        sw,
        sh,
      );
      const dataUrl = canvas.toDataURL("image/png");
      onImageCrop(dataUrl);
      setCropMode(false);
      setCropRect(null);
    };
    img.src = imagePreview;
  }, [imagePreview, cropRect, onImageCrop]);

  const handleConfirmCenter = useCallback(() => {
    if (!centerBox) return;
    const newCx = centerBox.x + centerBox.w / 2;
    const newCy = centerBox.y + centerBox.h / 2;
    setCenterPoint({ x: newCx, y: newCy });
    setSetCenterMode(false);
    setCenterBox(null);
    if (roomLabels.length > 0) {
      onLabelsChange(
        roomLabels.map((l) => ({
          ...l,
          direction: isOrientationType(l.room)
            ? angleToDirection(l.arrowAngle ?? 0)
            : getDirection(l.x, l.y, northAngle, newCx, newCy),
        })),
      );
    }
  }, [centerBox, roomLabels, onLabelsChange, northAngle]);

  const handleCancelCenter = useCallback(() => {
    setSetCenterMode(false);
    setCenterBox(null);
  }, []);

  const roomCounts: Partial<Record<RoomType, number>> = {};
  for (const l of roomLabels) {
    roomCounts[l.room] = (roomCounts[l.room] ?? 0) + 1;
  }

  const cursorClass = cropMode
    ? "cursor-default"
    : setCenterMode
      ? "cursor-default"
      : "cursor-crosshair";

  return (
    <main className="flex-1" data-ocid="analysis.page">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            data-ocid="analysis.secondary_button"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              Floor Plan Analysis
            </h1>
            <p className="text-sm text-muted-foreground">{file.name}</p>
          </div>
          <Button
            onClick={onRunAnalysis}
            disabled={roomLabels.length === 0}
            className="rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-2 text-sm px-6"
            data-ocid="analysis.primary_button"
          >
            <Play className="w-4 h-4" />
            Run Vastu Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Floor plan viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <h2 className="font-semibold text-foreground text-sm">
                  Floor Plan Viewer
                </h2>
                <div className="flex items-center gap-2 ml-auto">
                  {imagePreview && !isPDF && (
                    <Button
                      variant={cropMode ? "default" : "outline"}
                      size="sm"
                      onClick={
                        cropMode ? handleCancelCrop : handleEnterCropMode
                      }
                      className={`flex items-center gap-1.5 text-xs h-8 px-3 ${
                        cropMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-ocid="analysis.toggle"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      {cropMode ? "Exit Crop" : "Crop Image"}
                    </Button>
                  )}
                  <Button
                    variant={setCenterMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const next = !setCenterMode;
                      setSetCenterMode(next);
                      if (next) {
                        setCenterBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
                        setCropMode(false);
                        setCropRect(null);
                      } else {
                        setCenterBox(null);
                      }
                    }}
                    className={`flex items-center gap-1.5 text-xs h-8 px-3 ${
                      setCenterMode
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-ocid="analysis.toggle"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Set Center Point
                  </Button>
                  {centerPoint && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCenterPoint(null)}
                      className="flex items-center gap-1 text-xs h-8 px-2 text-muted-foreground hover:text-destructive"
                      data-ocid="analysis.delete_button"
                      title="Reset center point"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset Center
                    </Button>
                  )}
                  {!cropMode && !setCenterMode && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5" />
                      Click on the plan to label rooms
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {setCenterMode && (
                  <motion.div
                    key="center-banner"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2"
                  >
                    <Crosshair className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">
                      Adjust the box to fit your floor plan boundary &mdash; the{" "}
                      <strong>diagonal intersection</strong> marks the center
                      point. Click <strong>Confirm Center</strong> when ready.
                    </p>
                  </motion.div>
                )}
                {cropMode && (
                  <motion.div
                    key="crop-banner"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center gap-2"
                  >
                    <Crop className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <p className="text-xs text-blue-800 font-medium">
                      Drag the handles to select the crop area, then click{" "}
                      <strong>Apply Crop</strong>.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image area */}
              <div
                ref={imageContainerRef}
                aria-label="Floor plan canvas — click to add room labels"
                className={`relative select-none bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${cursorClass}`}
                style={!imagePreview ? { minHeight: "420px" } : undefined}
                onClick={handleImageClick}
                onKeyDown={handleImageKeyDown}
                onPointerMove={handleContainerPointerMove}
                onPointerUp={handleContainerPointerUp}
                data-ocid="analysis.canvas_target"
              >
                {isPDF ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <FileText className="w-16 h-16 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-medium">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF preview not available &mdash; click to add room labels
                    </p>
                  </div>
                ) : imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Uploaded floor plan"
                    className="w-full h-auto block pointer-events-none"
                    draggable={false}
                  />
                ) : null}

                {/* Center point marker */}
                {centerPoint && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${centerPoint.x * 100}%`,
                      top: `${centerPoint.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 20,
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-400/20" />
                      <div className="absolute w-12 h-0.5 bg-amber-400/70" />
                      <div className="absolute w-0.5 h-12 bg-amber-400/70" />
                      <div className="absolute w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <p className="text-[10px] font-semibold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded mt-1 text-center whitespace-nowrap backdrop-blur-sm">
                      Center
                    </p>
                  </div>
                )}

                {/* Room label overlays */}
                <AnimatePresence>
                  {roomLabels.map((label) => (
                    <motion.div
                      key={label.id}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center"
                      style={{
                        left: `${label.x * 100}%`,
                        top: `${label.y * 100}%`,
                        zIndex: 10,
                      }}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white shadow-md cursor-pointer whitespace-nowrap"
                        style={{ backgroundColor: ROOM_COLORS[label.room] }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLabel(label.id);
                        }}
                        title={`${label.room} (${label.direction}) — click to remove`}
                      >
                        <MapPin className="w-3 h-3" />
                        {label.room}
                        <span className="opacity-70 text-[10px]">
                          ({label.direction})
                        </span>
                        <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      {/* Draggable arrow for orientation types */}
                      {isOrientationType(label.room) && (
                        <div className="flex flex-col items-center mt-1">
                          <svg
                            width="36"
                            height="36"
                            viewBox="0 0 36 36"
                            role="img"
                            aria-label={`Direction arrow for ${label.room}`}
                            style={{
                              cursor: "grab",
                              transform: `rotate(${label.arrowAngle ?? 0}deg)`,
                              transformOrigin: "18px 18px",
                              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))",
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              e.currentTarget.setPointerCapture(e.pointerId);
                              setDraggingArrow({ id: label.id });
                            }}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                              setDraggingArrow(null);
                            }}
                            onPointerMove={(e) => {
                              if (
                                !draggingArrow ||
                                draggingArrow.id !== label.id
                              )
                                return;
                              e.stopPropagation();
                              const container = imageContainerRef.current;
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const labelPx = label.x * rect.width;
                              const labelPy = label.y * rect.height;
                              const dx = e.clientX - rect.left - labelPx;
                              const dy = e.clientY - rect.top - labelPy;
                              const angleRad = Math.atan2(dy, dx);
                              const angleDeg = angleRad * (180 / Math.PI) + 90;
                              const normalized = ((angleDeg % 360) + 360) % 360;
                              const direction = angleToDirection(normalized);
                              onLabelsChange(
                                roomLabels.map((l) =>
                                  l.id === label.id
                                    ? {
                                        ...l,
                                        arrowAngle: normalized,
                                        direction,
                                      }
                                    : l,
                                ),
                              );
                            }}
                          >
                            {/* Circle background */}
                            <circle
                              cx="18"
                              cy="18"
                              r="17"
                              fill="white"
                              stroke={ROOM_COLORS[label.room]}
                              strokeWidth="1.5"
                            />
                            {/* Arrow pointing up (North when angle=0) */}
                            <polygon
                              points="18,5 24,26 18,22 12,26"
                              fill={ROOM_COLORS[label.room]}
                            />
                          </svg>
                          <span className="text-[9px] text-gray-400 mt-0.5 select-none">
                            ↻ drag
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Center Box Overlay */}
                {setCenterMode && centerBox && (
                  <CenterBoxOverlay
                    rect={centerBox}
                    onChange={setCenterBox}
                    containerRef={imageContainerRef}
                    onConfirm={handleConfirmCenter}
                    onCancel={handleCancelCenter}
                  />
                )}

                {/* Crop Overlay */}
                {cropMode && cropRect && imagePreview && (
                  <CropOverlay
                    cropRect={cropRect}
                    onChange={setCropRect}
                    containerRef={imageContainerRef}
                  />
                )}

                {/* Crop action buttons */}
                {cropMode && (
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
                    style={{ zIndex: 40 }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-xs px-4 h-8"
                      onClick={handleApplyCrop}
                      data-ocid="analysis.confirm_button"
                    >
                      Apply Crop
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-black/40 hover:bg-black/60 text-white shadow-lg text-xs px-4 h-8 backdrop-blur-sm"
                      onClick={handleCancelCrop}
                      data-ocid="analysis.cancel_button"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Compass + Instructions tabbed panel */}
            <div className="bg-card rounded-xl border border-border shadow-card">
              <Tabs defaultValue="compass">
                <TabsList className="w-full rounded-t-xl rounded-b-none border-b border-border bg-muted/40 px-2 pt-2 h-auto justify-start gap-1">
                  <TabsTrigger
                    value="compass"
                    className="text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
                    data-ocid="analysis.tab"
                  >
                    Compass
                  </TabsTrigger>
                  <TabsTrigger
                    value="instructions"
                    className="text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
                    data-ocid="analysis.tab"
                  >
                    Instructions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="compass" className="p-6">
                  <div
                    className="flex flex-col items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <p className="text-xs text-muted-foreground font-medium">
                      Drag to align North
                    </p>
                    <CompassSVG
                      size={120}
                      rotation={northAngle}
                      onRotationChange={handleNorthAngleChange}
                      interactive
                    />
                    {northAngle !== 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5"
                      >
                        N: {northAngle}°
                      </Badge>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="instructions" className="p-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      How to use
                    </p>
                    <ol className="space-y-2 text-sm text-muted-foreground list-none">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                          1
                        </span>
                        Crop the image if needed to remove background clutter.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                          2
                        </span>
                        Set the center point — adjust the box to match your
                        floor plan boundary and confirm.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                          3
                        </span>
                        Align the compass North to match your floor plan
                        orientation.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                          4
                        </span>
                        Click on the plan to label rooms, then run the Vastu
                        analysis.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                          5
                        </span>
                        For <strong>Main Door</strong>, <strong>Cooking</strong>
                        , <strong>WC</strong>, and <strong>Bed Head</strong>{" "}
                        labels, drag the arrow to set the facing direction.
                      </li>
                    </ol>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Labels list */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">
                Room Labels
                <Badge variant="outline" className="ml-2 text-xs">
                  {roomLabels.length}
                </Badge>
              </h3>

              {roomLabels.length === 0 ? (
                <div
                  className="text-center py-6"
                  data-ocid="analysis.empty_state"
                >
                  <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Click on the floor plan to start labeling rooms
                  </p>
                </div>
              ) : (
                <ul className="space-y-2" data-ocid="analysis.list">
                  {roomLabels.map((label, i) => (
                    <li
                      key={label.id}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30"
                      data-ocid={`analysis.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ROOM_COLORS[label.room] }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {label.room}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {label.direction}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLabel(label.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        data-ocid={`analysis.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Center point info */}
            {centerPoint && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  Custom Center Set
                </p>
                <p className="text-xs text-amber-800/80">
                  All directions are calculated relative to your custom center
                  point ({Math.round(centerPoint.x * 100)}%,{" "}
                  {Math.round(centerPoint.y * 100)}%).
                </p>
              </div>
            )}

            {/* Room type legend */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">
                Room Types
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_ROOM_TYPES.map((room) => (
                  <div
                    key={room}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ROOM_COLORS[room] }}
                    />
                    <span>{room}</span>
                    {roomCounts[room] ? (
                      <span className="ml-auto text-primary font-semibold">
                        &times;{roomCounts[room]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Vastu tips */}
            <div className="bg-vastu-mint rounded-xl p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">
                Vastu Guidelines
              </p>
              <ul className="text-xs text-foreground/80 space-y-1.5">
                <li>Entrance &rarr; Not S/SE/SW (10pts)</li>
                <li>Main Door &rarr; Not N/NE/NW (10pts)</li>
                <li>Living Room &rarr; Not S/SE (10pts)</li>
                <li>Kitchen &rarr; Not NE (10pts)</li>
                <li>Cooking &rarr; Not S or N (10pts)</li>
                <li>Toilet &rarr; Not NE (10pts)</li>
                <li>WC &rarr; Not E or W (10pts)</li>
                <li>Bedroom &rarr; Not NE (10pts)</li>
                <li>Bed Head &rarr; Not N/NE/NW (10pts)</li>
                <li>Pooja Room &rarr; Not S/SE/SW/NW (10pts)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Room picker dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-sm bg-card rounded-2xl"
          data-ocid="analysis.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Select Room Type
            </DialogTitle>
          </DialogHeader>
          {pendingPos && (
            <p className="text-xs text-muted-foreground -mt-1">
              Direction:{" "}
              <strong>
                {getDirection(pendingPos.x, pendingPos.y, northAngle, cx, cy)}
              </strong>
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {ALL_ROOM_TYPES.map((room) => (
              <button
                type="button"
                key={room}
                onClick={() => handleRoomSelect(room)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-primary hover:bg-vastu-mint/30 transition-all text-left"
                data-ocid="analysis.button"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ROOM_COLORS[room] }}
                />
                {room}
                {isOrientationType(room) && (
                  <span className="ml-auto text-[9px] text-muted-foreground">
                    ↻
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-1 text-sm"
            onClick={() => {
              setDialogOpen(false);
              setPendingPos(null);
            }}
            data-ocid="analysis.cancel_button"
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
