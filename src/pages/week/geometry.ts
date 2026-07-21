/**
 * LIFE7 Week — honeycomb geometry (week.md "The Honeycomb Stage").
 *
 * Stage: 900×640 viewBox. Flower of seven: Thursday at the exact center,
 * petals clockwise from upper-left in chronological order
 * (Mon NW · Tue NE · Wed E · Fri SE · Sat SW · Sun W).
 * Cells are flat-top rounded hexagons (corner radius 18).
 */

import type { DayPlan, PlannedMeal } from '@/data/demoWeek';

export const STAGE_W = 900;
export const STAGE_H = 640;
export const CENTER_X = 450;
export const CENTER_Y = 320;

/** Center-to-corner radius of a cell hexagon (flat-top: corners L/R). */
export const CELL_R = 96;
/** Corner radius of the rounded hexagon (week.md: 18px). */
export const CELL_CORNER = 18;
/** Distance from the stage center to each petal center. */
export const RING_R = 218;

export interface Pt {
  readonly x: number;
  readonly y: number;
}

export interface CellSlot {
  readonly id: string;
  /** Clockwise petal angle in degrees (0 = East, positive = down-screen). */
  readonly angleDeg: number;
  readonly cx: number;
  readonly cy: number;
  /** Colony-breath phase index — wave ripples clockwise, center last. */
  readonly breatheIndex: number;
  /** Optimise-shimmer delay rank (center-out). */
  readonly centerOutIndex: number;
}

function polar(cx: number, cy: number, r: number, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Chronological clockwise order from upper-left (Thu handled separately). */
const RING_ORDER: ReadonlyArray<{ id: string; angleDeg: number }> = [
  { id: 'mon', angleDeg: 240 },
  { id: 'tue', angleDeg: 300 },
  { id: 'wed', angleDeg: 0 },
  { id: 'fri', angleDeg: 60 },
  { id: 'sat', angleDeg: 120 },
  { id: 'sun', angleDeg: 180 },
];

const SLOTS: readonly CellSlot[] = [
  { id: 'thu', angleDeg: 0, cx: CENTER_X, cy: CENTER_Y, breatheIndex: 6, centerOutIndex: 0 },
  ...RING_ORDER.map((p, i) => {
    const c = polar(CENTER_X, CENTER_Y, RING_R, p.angleDeg);
    // ring breathes clockwise (i), then center last (6); center-out starts at Thu (0)
    return { id: p.id, angleDeg: p.angleDeg, cx: c.x, cy: c.y, breatheIndex: i, centerOutIndex: i + 1 };
  }),
];

export function slotFor(dayId: string): CellSlot {
  const s = SLOTS.find((sl) => sl.id === dayId);
  if (!s) throw new Error(`No honeycomb slot for day ${dayId}`);
  return s;
}

export const ALL_SLOTS: readonly CellSlot[] = SLOTS;

/** Center-out application order for week-wide re-tweens (Thu first). */
export const CENTER_OUT_ORDER: readonly string[] = [...SLOTS]
  .sort((a, b) => a.centerOutIndex - b.centerOutIndex)
  .map((s) => s.id);

// ------------------------------------------------------------------ hex path

/**
 * Rounded flat-top hexagon path centered at (0,0): corners at angles
 * 0°, 60°, … 300° (points left/right, flat edges top/bottom), corners
 * softened with quadratic Béziers of the given corner radius.
 */
export function roundedHexPath(r: number = CELL_R, corner: number = CELL_CORNER): string {
  const pts: Pt[] = [];
  for (let i = 0; i < 6; i++) pts.push(polar(0, 0, r, i * 60));
  const cr = Math.min(corner, r / 2);
  let d = '';
  for (let i = 0; i < 6; i++) {
    const p = pts[i];
    const prev = pts[(i + 5) % 6];
    const next = pts[(i + 1) % 6];
    const v1x = prev.x - p.x;
    const v1y = prev.y - p.y;
    const v2x = next.x - p.x;
    const v2y = next.y - p.y;
    const l1 = Math.hypot(v1x, v1y);
    const l2 = Math.hypot(v2x, v2y);
    const p1x = p.x + (v1x / l1) * cr;
    const p1y = p.y + (v1y / l1) * cr;
    const p2x = p.x + (v2x / l2) * cr;
    const p2y = p.y + (v2y / l2) * cr;
    d += `${i === 0 ? 'M' : 'L'} ${p1x.toFixed(2)} ${p1y.toFixed(2)} Q ${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p2x.toFixed(2)} ${p2y.toFixed(2)} `;
  }
  return `${d}Z`;
}

/** Rounded diamond (mobile chain cells) — 4-corner rounded polygon. */
export function roundedDiamondPath(r: number, corner: number): string {
  const pts: Pt[] = [0, 1, 2, 3].map((i) => polar(0, 0, r, -90 + i * 90));
  const cr = Math.min(corner, r / 2);
  let d = '';
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    const prev = pts[(i + 3) % 4];
    const next = pts[(i + 1) % 4];
    const v1x = prev.x - p.x;
    const v1y = prev.y - p.y;
    const v2x = next.x - p.x;
    const v2y = next.y - p.y;
    const l1 = Math.hypot(v1x, v1y);
    const l2 = Math.hypot(v2x, v2y);
    d += `${i === 0 ? 'M' : 'L'} ${(p.x + (v1x / l1) * cr).toFixed(2)} ${(p.y + (v1y / l1) * cr).toFixed(2)} Q ${p.x.toFixed(2)} ${p.y.toFixed(2)} ${(p.x + (v2x / l2) * cr).toFixed(2)} ${(p.y + (v2y / l2) * cr).toFixed(2)} `;
  }
  return `${d}Z`;
}

// -------------------------------------------------------------- connector web

/** Chronological loop: Mon→Tue→Wed→Thu→Fri→Sat→Sun→Mon (through the heart). */
export const LOOP_ORDER: readonly string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Faint cross-links (week.md: Mon↔Thu, Tue↔Fri, Wed↔Sat). */
export const CROSS_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['mon', 'thu'],
  ['tue', 'fri'],
  ['wed', 'sat'],
];

export interface LoopData {
  /** Single path through all seven cells, closed. */
  readonly path: string;
  /** Fractions along the loop where each day node sits. */
  readonly nodeFractions: Readonly<Record<string, number>>;
  readonly totalLength: number;
}

function buildLoop(): LoopData {
  const nodes = LOOP_ORDER.map((id) => slotFor(id));
  const pts = nodes.map((n) => ({ id: n.id, x: n.cx, y: n.cy }));
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push(len);
    total += len;
  }
  const nodeFractions: Record<string, number> = {};
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    nodeFractions[pts[i].id] = acc / total;
    acc += segs[i];
  }
  const path = `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`;
  return { path, nodeFractions, totalLength: total };
}

export const LOOP: LoopData = buildLoop();

/** Individual chronological segments (for hover relationship focus). */
export const LOOP_SEGMENTS: ReadonlyArray<{ from: string; to: string; path: string }> = LOOP_ORDER.map(
  (id, i) => {
    const a = slotFor(id);
    const b = slotFor(LOOP_ORDER[(i + 1) % LOOP_ORDER.length]);
    return { from: id, to: b.id, path: `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}` };
  },
);

export const CROSS_LINK_PATHS: ReadonlyArray<{ from: string; to: string; path: string }> =
  buildCrossLinks();

function buildCrossLinks(): Array<{ from: string; to: string; path: string }> {
  return CROSS_LINKS.map(([a, b]) => {
    const pa = slotFor(a);
    const pb = slotFor(b);
    return { from: a, to: b, path: `M ${pa.cx} ${pa.cy} L ${pb.cx} ${pb.cy}` };
  });
}

/** Point on the chronological loop at t ∈ [0,1) — for the traveling pulse. */
export function pointOnLoop(t: number): Pt {
  const pts = LOOP_ORDER.map((id) => slotFor(id));
  const target = (((t % 1) + 1) % 1) * LOOP.totalLength;
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.cx - a.cx, b.cy - a.cy);
    if (target <= acc + len) {
      const k = len === 0 ? 0 : (target - acc) / len;
      return { x: a.cx + (b.cx - a.cx) * k, y: a.cy + (b.cy - a.cy) * k };
    }
    acc += len;
  }
  const last = pts[pts.length - 1];
  return { x: last.cx, y: last.cy };
}

// -------------------------------------------------------------- day theming

/**
 * Per-day color identity (week day hues). A tasteful 7-hue sequence inside
 * the warm LIFE7 palette family — no purple, no neon. Every pair of `strong`
 * accents is ≥ 17 ΔE apart (clearly distinguishable); every `deep` shade is
 * ≥ 5.2:1 on its own chip tint (WCAG AA for the small day-label chip).
 *
 *   Mon sage · Tue champagne gold · Wed soft terracotta · Thu sunlight amber
 *   (today) · Fri natural leaf green · Sat warm apricot · Sun deep olive.
 */
export interface DayTheme {
  /** Hue family name (design note / docs). */
  readonly hue: string;
  /** Light stop — score-ring gradient mid. */
  readonly bright: string;
  /** Core accent — ring gradient end, ring cap, medallion rim, mobile dot. */
  readonly strong: string;
  /** Dark AA-safe shade — day-label chip text, small overline labels. */
  readonly deep: string;
  /** Cell rim stroke (strong @ 42%). */
  readonly rim: string;
  /** Crisp medallion rim + mobile diamond stroke (strong @ 58%). */
  readonly medal: string;
  /** Day-label chip background (strong @ 16%). */
  readonly chipBg: string;
  /** Day-label chip inset ring (strong @ 30%). */
  readonly chipRing: string;
}

function theme(hue: string, bright: string, strong: string, deep: string, rgb: string): DayTheme {
  return {
    hue,
    bright,
    strong,
    deep,
    rim: `rgba(${rgb},0.42)`,
    medal: `rgba(${rgb},0.58)`,
    chipBg: `rgba(${rgb},0.16)`,
    chipRing: `rgba(${rgb},0.30)`,
  };
}

export const DAY_THEME: Readonly<Record<string, DayTheme>> = {
  mon: theme('sage', '#B4CBB6', '#80A488', '#44613C', '128,164,136'),
  tue: theme('champagne gold', '#E3C78E', '#BF9847', '#7A5E20', '191,152,71'),
  wed: theme('soft terracotta', '#DEA184', '#C16C44', '#7F4226', '193,108,68'),
  thu: theme('sunlight amber', '#F3C75C', '#D99F2C', '#75560D', '217,159,44'),
  fri: theme('natural leaf', '#A9CF8A', '#6D9F49', '#3D6026', '109,159,73'),
  sat: theme('warm apricot', '#F0BA7E', '#DE8F4A', '#7C4A14', '222,143,74'),
  sun: theme('deep olive', '#B3BD8C', '#74833F', '#454F24', '116,131,63'),
};

/** Fallback theme (Monday sage) for unknown ids. */
export function dayTheme(dayId: string): DayTheme {
  return DAY_THEME[dayId] ?? (DAY_THEME.mon as DayTheme);
}

/** The day's hero meal — the lunch slot anchors the day; dinner, then first. */
export function heroMealOf(day: DayPlan): PlannedMeal {
  return (
    day.meals.find((m) => m.mealType === 'lunch') ??
    day.meals.find((m) => m.mealType === 'dinner') ??
    day.meals[0]
  );
}
