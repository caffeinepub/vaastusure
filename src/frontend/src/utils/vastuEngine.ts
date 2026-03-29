export type RoomType =
  | "Kitchen"
  | "Bedroom"
  | "Living Room"
  | "Entrance"
  | "Toilet"
  | "Pooja Room"
  | "Staircase"
  | "Main Door"
  | "Cooking"
  | "WC"
  | "Bed Head";

export interface RoomLabel {
  id: string;
  x: number;
  y: number;
  room: RoomType;
  direction: string;
  arrowAngle?: number;
}

export function getDirection(
  x: number,
  y: number,
  northAngle = 0,
  cx = 0.5,
  cy = 0.5,
): string {
  const dx = x - cx;
  const dy = y - cy;
  if (Math.sqrt(dx * dx + dy * dy) < 0.15) return "Center";

  const pixelAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  const bearing = pixelAngle + 90;
  const adjusted = (((bearing - northAngle) % 360) + 360) % 360;

  if (adjusted < 22.5 || adjusted >= 337.5) return "N";
  if (adjusted < 67.5) return "NE";
  if (adjusted < 112.5) return "E";
  if (adjusted < 157.5) return "SE";
  if (adjusted < 202.5) return "S";
  if (adjusted < 247.5) return "SW";
  if (adjusted < 292.5) return "W";
  return "NW";
}

export function angleToDirection(angleDeg: number): string {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return "N";
  if (a < 67.5) return "NE";
  if (a < 112.5) return "E";
  if (a < 157.5) return "SE";
  if (a < 202.5) return "S";
  if (a < 247.5) return "SW";
  if (a < 292.5) return "W";
  return "NW";
}

export const ROOM_COLORS: Record<RoomType, string> = {
  Kitchen: "#f97316",
  Bedroom: "#3b82f6",
  "Living Room": "#a855f7",
  Entrance: "#22c55e",
  Toilet: "#ef4444",
  "Pooja Room": "#eab308",
  Staircase: "#6b7280",
  "Main Door": "#22c55e",
  Cooking: "#f97316",
  WC: "#ef4444",
  "Bed Head": "#8b5cf6",
};

export const ALL_ROOM_TYPES: RoomType[] = [
  "Entrance",
  "Main Door",
  "Living Room",
  "Kitchen",
  "Cooking",
  "Toilet",
  "WC",
  "Bedroom",
  "Bed Head",
  "Pooja Room",
  "Staircase",
];

export type IssueSeverity = "high" | "medium" | "low";

export interface VastuIssue {
  severity: IssueSeverity;
  message: string;
}

export interface VastuResult {
  totalScore: number;
  breakdown: {
    entrance: number;
    mainDoor: number;
    livingRoom: number;
    kitchen: number;
    cooking: number;
    toilet: number;
    wc: number;
    bedroom: number;
    bedHead: number;
    poojaRoom: number;
  };
  issues: VastuIssue[];
  easyFixes: string[];
  structuralChanges: string[];
}

export function computeVastuScore(labels: RoomLabel[]): VastuResult {
  const issues: VastuIssue[] = [];
  const easyFixesSet = new Set<string>();
  const structuralSet = new Set<string>();

  const getFirst = (rooms: RoomType[]) =>
    labels.find((l) => rooms.includes(l.room));

  // ── Entrance location (10pts) — not S, SE, SW ─────────
  let entrance = 0;
  const entranceLabel = getFirst(["Entrance"]);
  if (entranceLabel) {
    const badDirs = ["S", "SE", "SW"];
    if (!badDirs.includes(entranceLabel.direction)) {
      entrance = 10;
    } else {
      issues.push({
        severity: "high",
        message: `Entrance faces ${entranceLabel.direction} — avoid South, Southeast, Southwest.`,
      });
      structuralSet.add(
        "Relocate entrance away from South, Southeast, or Southwest.",
      );
    }
  }

  // ── Main Door arrow (10pts) — not N, NE, NW ──────────
  let mainDoor = 0;
  const mainDoorLabel = getFirst(["Main Door"]);
  if (mainDoorLabel) {
    const badDirs = ["N", "NE", "NW"];
    if (!badDirs.includes(mainDoorLabel.direction)) {
      mainDoor = 10;
    } else {
      issues.push({
        severity: "high",
        message: `Main door faces ${mainDoorLabel.direction} — avoid North, Northeast, Northwest.`,
      });
      structuralSet.add(
        "Reorient main door away from North, Northeast, or Northwest.",
      );
    }
  }

  // ── Living Room location (10pts) — not S, SE ─────────
  let livingRoom = 0;
  const livingRoomLabel = getFirst(["Living Room"]);
  if (livingRoomLabel) {
    const badDirs = ["S", "SE"];
    if (!badDirs.includes(livingRoomLabel.direction)) {
      livingRoom = 10;
    } else {
      issues.push({
        severity: "medium",
        message: `Living room in ${livingRoomLabel.direction} — avoid South and Southeast.`,
      });
      structuralSet.add("Move living room away from South or Southeast.");
    }
  }

  // ── Kitchen location (10pts) — not NE ────────────────
  let kitchen = 0;
  const kitchenLabel = getFirst(["Kitchen"]);
  if (kitchenLabel) {
    if (kitchenLabel.direction !== "NE") {
      kitchen = 10;
    } else {
      issues.push({
        severity: "high",
        message: "Kitchen is in Northeast — major Vastu violation.",
      });
      structuralSet.add("Move kitchen out of the Northeast corner.");
    }
  }

  // ── Cooking arrow (10pts) — not S or N ───────────────
  let cooking = 0;
  const cookingLabel = getFirst(["Cooking"]);
  if (cookingLabel) {
    const badDirs = ["S", "N"];
    if (!badDirs.includes(cookingLabel.direction)) {
      cooking = 10;
    } else {
      issues.push({
        severity: "high",
        message: `Cooking direction faces ${cookingLabel.direction} — avoid South and North.`,
      });
      easyFixesSet.add(
        "Reposition the cooking stove to face East or Southeast.",
      );
    }
  }

  // ── Toilet location (10pts) — not NE ─────────────────
  let toilet = 0;
  const toiletLabel = getFirst(["Toilet"]);
  if (toiletLabel) {
    if (toiletLabel.direction !== "NE") {
      toilet = 10;
    } else {
      issues.push({
        severity: "high",
        message: "Toilet is in Northeast — serious Vastu defect.",
      });
      structuralSet.add("Relocate toilet out of the Northeast corner.");
    }
  }

  // ── WC arrow (10pts) — not E or W ─────────────────────
  let wc = 0;
  const wcLabel = getFirst(["WC"]);
  if (wcLabel) {
    const badDirs = ["E", "W"];
    if (!badDirs.includes(wcLabel.direction)) {
      wc = 10;
    } else {
      issues.push({
        severity: "medium",
        message: `WC faces ${wcLabel.direction} — avoid East and West.`,
      });
      easyFixesSet.add("Reorient WC to face North or South.");
    }
  }

  // ── Bedroom location (10pts) — not NE ────────────────
  let bedroom = 0;
  const bedroomLabel = getFirst(["Bedroom"]);
  if (bedroomLabel) {
    if (bedroomLabel.direction !== "NE") {
      bedroom = 10;
    } else {
      issues.push({
        severity: "high",
        message: "Bedroom is in Northeast — not recommended.",
      });
      structuralSet.add("Move bedroom away from Northeast — prefer Southwest.");
    }
  }

  // ── Bed Head arrow (10pts) — not N, NE, NW ───────────
  let bedHead = 0;
  const bedHeadLabel = getFirst(["Bed Head"]);
  if (bedHeadLabel) {
    const badDirs = ["N", "NE", "NW"];
    if (!badDirs.includes(bedHeadLabel.direction)) {
      bedHead = 10;
    } else {
      issues.push({
        severity: "medium",
        message: `Bed head faces ${bedHeadLabel.direction} — avoid North, Northeast, Northwest.`,
      });
      easyFixesSet.add("Reposition bed so the head faces South or East.");
    }
  }

  // ── Pooja Room location (10pts) — not S, SE, SW, NW ──
  let poojaRoom = 0;
  const poojaLabel = getFirst(["Pooja Room"]);
  if (poojaLabel) {
    const badDirs = ["S", "SE", "SW", "NW"];
    if (!badDirs.includes(poojaLabel.direction)) {
      poojaRoom = 10;
    } else {
      issues.push({
        severity: "medium",
        message: `Pooja room in ${poojaLabel.direction} — avoid South, SE, SW, Northwest.`,
      });
      structuralSet.add(
        "Move Pooja room to Northeast for maximum positive energy.",
      );
    }
  }

  const totalScore =
    entrance +
    mainDoor +
    livingRoom +
    kitchen +
    cooking +
    toilet +
    wc +
    bedroom +
    bedHead +
    poojaRoom;

  return {
    totalScore,
    breakdown: {
      entrance,
      mainDoor,
      livingRoom,
      kitchen,
      cooking,
      toilet,
      wc,
      bedroom,
      bedHead,
      poojaRoom,
    },
    issues,
    easyFixes: Array.from(easyFixesSet),
    structuralChanges: Array.from(structuralSet),
  };
}
