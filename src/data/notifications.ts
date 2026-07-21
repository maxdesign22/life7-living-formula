/**
 * LIFE7 — Notification copy library (design.md §10, planner.md Zone C).
 * The four demo notification strings are verbatim brand copy.
 */

export const NOTIFICATION_KINDS = [
  'meal-ready',
  'protein-adjusted',
  'expiry-move',
  'missed-meal',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface DemoNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  /** App label rendered above the body, e.g. "LIFE7 · now". */
  readonly appLabel: string;
  readonly body: string;
  readonly icon: string;
}

/** The four canonical demo notifications (exact copy — do not reword). */
export const DEMO_NOTIFICATIONS: readonly DemoNotification[] = [
  {
    id: 'notif-meal-ready',
    kind: 'meal-ready',
    appLabel: 'LIFE7 · now',
    body: 'Your lunch is ready in 8 minutes.',
    icon: 'seed',
  },
  {
    id: 'notif-protein-adjusted',
    kind: 'protein-adjusted',
    appLabel: 'LIFE7 · now',
    body: 'You are low on protein today. Dinner has been adjusted.',
    icon: 'wave',
  },
  {
    id: 'notif-expiry-move',
    kind: 'expiry-move',
    appLabel: 'LIFE7 · now',
    body: 'The spinach expires tomorrow. LIFE7 moved it into tonight’s meal.',
    icon: 'leaf',
  },
  {
    id: 'notif-missed-meal',
    kind: 'missed-meal',
    appLabel: 'LIFE7 · now',
    body: 'You missed Meal 2. The rest of your day has been recalculated.',
    icon: 'orbit',
  },
];

export function getNotification(kind: NotificationKind): DemoNotification {
  const found = DEMO_NOTIFICATIONS.find((n) => n.kind === kind);
  if (!found) throw new Error(`Unknown notification kind: ${kind}`);
  return found;
}
