import { useCallback, useRef, useState } from "react";

interface CompassSVGProps {
  size?: number;
  className?: string;
  rotation?: number;
  onRotationChange?: (angle: number) => void;
  interactive?: boolean;
}

export function CompassSVG({
  size = 120,
  className = "",
  rotation = 0,
  onRotationChange,
  interactive = false,
}: CompassSVGProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;
  const innerR = size * 0.3;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartAngleRef = useRef(0);
  const dragStartRotationRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const getAngleFromCenter = useCallback(
    (clientX: number, clientY: number): number => {
      if (!svgRef.current) return 0;
      const rect = svgRef.current.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      return Math.atan2(y, x) * (180 / Math.PI);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!interactive) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStartAngleRef.current = getAngleFromCenter(e.clientX, e.clientY);
      dragStartRotationRef.current = rotation;
    },
    [interactive, rotation, getAngleFromCenter],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging || !interactive) return;
      const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
      const delta = currentAngle - dragStartAngleRef.current;
      const newRotation =
        (((dragStartRotationRef.current + delta) % 360) + 360) % 360;
      onRotationChange?.(Math.round(newRotation));
    },
    [isDragging, interactive, getAngleFromCenter, onRotationChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const cardinals = [
    { label: "N", angle: -90, color: "#2F6B43", bold: true, dist: 0.76 },
    { label: "S", angle: 90, color: "#6B6256", bold: false, dist: 0.76 },
    { label: "E", angle: 0, color: "#6B6256", bold: false, dist: 0.76 },
    { label: "W", angle: 180, color: "#6B6256", bold: false, dist: 0.76 },
    { label: "NE", angle: -45, color: "#6B6256", bold: false, dist: 0.65 },
    { label: "NW", angle: -135, color: "#6B6256", bold: false, dist: 0.65 },
    { label: "SE", angle: 45, color: "#6B6256", bold: false, dist: 0.65 },
    { label: "SW", angle: 135, color: "#6B6256", bold: false, dist: 0.65 },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const pointerTip = (angle: number, len: number) => ({
    x: cx + Math.cos(toRad(angle)) * len,
    y: cy + Math.sin(toRad(angle)) * len,
  });

  const northTip = pointerTip(-90, innerR * 0.95);
  const southTip = pointerTip(90, innerR * 0.75);
  const eastTip = pointerTip(0, innerR * 0.75);
  const westTip = pointerTip(180, innerR * 0.75);

  const ticks = Array.from({ length: 36 }, (_, i) => i);

  const cursorStyle = interactive
    ? isDragging
      ? "cursor-grabbing"
      : "cursor-grab"
    : "";

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className} ${cursorStyle} select-none`}
      role={interactive ? "slider" : "img"}
      aria-label={
        interactive
          ? "Compass — drag to set North direction"
          : "Compass rose showing cardinal directions"
      }
      aria-valuenow={interactive ? rotation : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? 360 : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <title>{interactive ? "Drag to align North" : "Compass rose"}</title>

      {/* Outer ring — fixed, does not rotate */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#F6F1E6"
        stroke={interactive ? "#2F6B43" : "#E7E0D3"}
        strokeWidth={interactive ? "2" : "1.5"}
      />

      {/* Pulsing ring when interactive */}
      {interactive && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 3}
          fill="none"
          stroke="#2F6B43"
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray="4 4"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Rotatable content group */}
      <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
        {/* Inner ring */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="white"
          stroke="#E7E0D3"
          strokeWidth="1"
        />

        {/* Tick marks */}
        {ticks.map((i) => {
          const a = toRad(i * 10 - 90);
          const isMajor = i % 9 === 0;
          const r1 = r - (isMajor ? 8 : 5);
          return (
            <line
              key={`tick-${i}`}
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r}
              y2={cy + Math.sin(a) * r}
              stroke={isMajor ? "#6B6256" : "#C4B8A8"}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}

        {/* N pointer (green) */}
        <polygon
          points={`${northTip.x},${northTip.y} ${cx - 5},${cy} ${cx + 5},${cy}`}
          fill="#2F6B43"
          opacity="0.9"
        />
        {/* S pointer */}
        <polygon
          points={`${southTip.x},${southTip.y} ${cx - 4},${cy} ${cx + 4},${cy}`}
          fill="#A89E90"
          opacity="0.7"
        />
        {/* E pointer */}
        <polygon
          points={`${eastTip.x},${eastTip.y} ${cx},${cy - 4} ${cx},${cy + 4}`}
          fill="#A89E90"
          opacity="0.7"
        />
        {/* W pointer */}
        <polygon
          points={`${westTip.x},${westTip.y} ${cx},${cy - 4} ${cx},${cy + 4}`}
          fill="#A89E90"
          opacity="0.7"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3.5} fill="#2F6B43" />

        {/* Cardinal labels */}
        {cardinals.map(({ label, angle, color, bold, dist }) => {
          const lx = cx + Math.cos(toRad(angle)) * (r * dist);
          const ly = cy + Math.sin(toRad(angle)) * (r * dist);
          const fontSize = bold ? size * 0.115 : size * 0.08;
          return (
            <text
              key={`label-${label}`}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontSize={fontSize}
              fontWeight={bold ? "700" : "500"}
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
