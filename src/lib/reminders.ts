/**
 * LIFE7 — Planner timeline, reminder channels & notification composer.
 *
 * Pure and deterministic: the Thursday sunlight timeline (planner.md Zone A),
 * channel routing with WhatsApp/Telegram placeholders, quiet hours, and the
 * composer that produces the exact demo notification copies (§10).
 */

import { DEMO_NOTIFICATIONS, getNotification, type DemoNotification, type NotificationKind } from '../data/notifications';

// ---------------------------------------------------------------- timeline

export const EVENT_TYPES = [
  'wake',
  'hydration',
  'meal',
  'supplement',
  'movement',
  'sleep',
  'shopping',
  'prep',
  'recovery',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface TimelineEvent {
  readonly id: string;
  /** 'HH:MM' local time. */
  readonly time: string;
  /** Minutes since midnight. */
  readonly minutes: number;
  readonly type: EventType;
  readonly title: string;
  readonly detail: string;
  readonly actionLabel?: string;
  /** Link into the week plan / shopping / architect. */
  readonly mealId?: string;
  readonly route?: string;
  readonly done: boolean;
}

const EV = (
  id: string,
  time: string,
  type: EventType,
  title: string,
  detail: string,
  extra?: Partial<Pick<TimelineEvent, 'actionLabel' | 'mealId' | 'route' | 'done'>>,
): TimelineEvent => {
  const [h, m] = time.split(':').map(Number);
  return { id, time, minutes: h * 60 + m, type, title, detail, done: false, ...extra };
};

/**
 * The canonical Thursday timeline (planner.md Zone A). Macro captions are the
 * editorial card copies from the design.
 */
export function buildThursdayTimeline(): readonly TimelineEvent[] {
  return [
    EV('wake', '06:30', 'wake', 'Wake up', 'Light exposure 10 min', { actionLabel: 'Done', done: true }),
    EV('hydration-1', '07:00', 'hydration', 'Water 400 ml', 'Before coffee', { actionLabel: '+1 glass', done: true }),
    EV('breakfast', '08:00', 'meal', 'Breakfast, Banana Walnut Oats', '480 kcal · P 22 g', {
      actionLabel: 'View',
      mealId: 'thu-breakfast',
      done: true,
    }),
    EV('supplement-d3', '10:30', 'supplement', 'Vitamin D3', 'With food', { actionLabel: 'Mark taken' }),
    EV('lunch', '12:30', 'meal', 'Lunch, Herb Chicken & Rice Bowl', '612 kcal · P 44 g', {
      actionLabel: 'Start cooking (18 min)',
      mealId: 'thu-lunch',
    }),
    EV('walk', '14:00', 'movement', 'Walk 15 min', 'Post-lunch glucose curve', { actionLabel: 'Done' }),
    EV('snack', '16:00', 'meal', 'Snack, Greek Yoghurt & Walnuts', '310 kcal · P 18 g', {
      actionLabel: 'View',
      mealId: 'thu-snack',
    }),
    EV('market-run', '17:30', 'shopping', 'Farmers market run', '6 items · €18.40', {
      actionLabel: 'Open list',
      route: '/shopping',
    }),
    EV('prep-oats', '18:30', 'prep', 'Prep tomorrow’s oats', '4 min', { actionLabel: 'Done' }),
    EV('dinner', '19:30', 'meal', 'Dinner, Spinach Tomato Omelette', '540 kcal · P 36 g · uses expiring spinach', {
      actionLabel: 'Start cooking',
      mealId: 'thu-dinner',
    }),
    EV('wind-down', '21:30', 'recovery', 'Wind-down', 'Screens dim · magnesium', { actionLabel: 'Done' }),
    EV('sleep', '23:00', 'sleep', 'Sleep window', 'Target 7 h 45 min'),
  ];
}

/** Past events render dimmed below the sun dot. */
export function isPast(event: TimelineEvent, nowMinutes: number): boolean {
  return event.minutes < nowMinutes;
}

/** Reschedule (drag on the spine): returns re-sorted events + toast copy. */
export function rescheduleEvent(
  events: readonly TimelineEvent[],
  id: string,
  newMinutes: number,
): { readonly events: readonly TimelineEvent[]; readonly toast: string } {
  const snapped = Math.round(newMinutes / 5) * 5;
  const moved = events.find((e) => e.id === id);
  if (!moved) return { events, toast: '' };
  const hh = String(Math.floor(snapped / 60)).padStart(2, '0');
  const mm = String(snapped % 60).padStart(2, '0');
  const next = events
    .map((e) => (e.id === id ? { ...e, minutes: snapped, time: `${hh}:${mm}` } : e))
    .sort((a, b) => a.minutes - b.minutes);
  const shortName = moved.title.split(' … ')[0];
  return { events: next, toast: `${shortName} moved to ${hh}:${mm}, afternoon recalibrated.` };
}

/** Mark an event done (check draw + mint tint at the UI layer). */
export function markEventDone(events: readonly TimelineEvent[], id: string, done = true): readonly TimelineEvent[] {
  return events.map((e) => (e.id === id ? { ...e, done } : e));
}

/** Insert a custom event (＋ Add event popover). */
export function addEvent(events: readonly TimelineEvent[], event: TimelineEvent): readonly TimelineEvent[] {
  return [...events, event].sort((a, b) => a.minutes - b.minutes);
}

// ------------------------------------------------------------------ channels

export const CHANNEL_IDS = ['phone', 'smartwatch', 'email', 'browser', 'whatsapp', 'telegram'] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];

export interface ReminderChannel {
  readonly id: ChannelId;
  readonly label: string;
  readonly enabled: boolean;
  readonly caption: string;
  /** WhatsApp / Telegram ship with the mobile app — toggling shows a toast. */
  readonly placeholder: boolean;
}

export const DEFAULT_CHANNELS: readonly ReminderChannel[] = [
  { id: 'phone', label: 'Phone', enabled: true, caption: 'Push, 10 min before', placeholder: false },
  { id: 'smartwatch', label: 'Smartwatch', enabled: true, caption: 'Haptic tap', placeholder: false },
  { id: 'email', label: 'Email', enabled: false, caption: '06:45 daily brief', placeholder: false },
  { id: 'browser', label: 'Browser', enabled: true, caption: 'While LIFE7 is open', placeholder: false },
  { id: 'whatsapp', label: 'WhatsApp', enabled: false, caption: 'Available on mobile app', placeholder: true },
  { id: 'telegram', label: 'Telegram', enabled: false, caption: 'Available on mobile app', placeholder: true },
];

export const PLACEHOLDER_TOAST = 'Coming with the mobile app, you’re on the list.';

/** Toggle a channel; placeholder channels never enable, they return a toast. */
export function toggleChannel(
  channels: readonly ReminderChannel[],
  id: ChannelId,
): { readonly channels: readonly ReminderChannel[]; readonly toast?: string } {
  const channel = channels.find((c) => c.id === id);
  if (!channel) return { channels };
  if (channel.placeholder) {
    return { channels, toast: PLACEHOLDER_TOAST };
  }
  return {
    channels: channels.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
  };
}

// --------------------------------------------------------------- quiet hours

export interface QuietHours {
  readonly startMinutes: number; // 22:30
  readonly endMinutes: number; // 06:30
}

export const DEFAULT_QUIET_HOURS: QuietHours = { startMinutes: 22 * 60 + 30, endMinutes: 6 * 60 + 30 };

export function isQuietTime(minutes: number, quiet: QuietHours = DEFAULT_QUIET_HOURS): boolean {
  // window wraps midnight
  return minutes >= quiet.startMinutes || minutes < quiet.endMinutes;
}

/** Prep reminder lead-time options (segmented control). */
export const PREP_LEAD_OPTIONS = [10, 20, 30] as const;

/** When a reminder fires for an event (event time − lead). */
export function reminderTimeFor(event: TimelineEvent, leadMinutes: number): number {
  return event.minutes - leadMinutes;
}

// ------------------------------------------------------- notification routing

export type DeliveryStatus = 'sent' | 'held-quiet-hours' | 'placeholder' | 'disabled';

export interface ChannelDelivery {
  readonly channelId: ChannelId;
  readonly status: DeliveryStatus;
  readonly caption: string;
}

export interface RoutedNotification {
  readonly notification: DemoNotification;
  readonly deliveries: readonly ChannelDelivery[];
}

/**
 * Compose + route a notification to the enabled channels. Deterministic:
 * quiet hours hold everything except expiry alerts; placeholders are skipped
 * with their caption.
 */
export function routeNotification(
  kind: NotificationKind,
  channels: readonly ReminderChannel[] = DEFAULT_CHANNELS,
  atMinutes?: number,
): RoutedNotification {
  const notification = getNotification(kind);
  const quiet = atMinutes !== undefined && isQuietTime(atMinutes);
  const deliveries: ChannelDelivery[] = channels.map((channel) => {
    if (channel.placeholder) {
      return { channelId: channel.id, status: 'placeholder', caption: channel.caption };
    }
    if (!channel.enabled) {
      return { channelId: channel.id, status: 'disabled', caption: 'Off' };
    }
    if (quiet && kind !== 'expiry-move') {
      return { channelId: channel.id, status: 'held-quiet-hours', caption: 'Held until 06:30' };
    }
    return { channelId: channel.id, status: 'sent', caption: channel.caption };
  });
  return { notification, deliveries };
}

/** The composer: exact demo copy by kind (design.md §10). */
export function composeNotification(kind: NotificationKind): DemoNotification {
  return getNotification(kind);
}

/** All four demo notifications (Planner Zone C stack). */
export function getDemoNotifications(): readonly DemoNotification[] {
  return DEMO_NOTIFICATIONS;
}

/** Send-test result for the "Send test" links (fires a live toast preview). */
export function sendTest(
  channelId: ChannelId,
  kind: NotificationKind,
  channels: readonly ReminderChannel[] = DEFAULT_CHANNELS,
): { readonly ok: boolean; readonly toast: string; readonly notification: DemoNotification } {
  const channel = channels.find((c) => c.id === channelId);
  const notification = getNotification(kind);
  if (!channel || channel.placeholder) {
    return { ok: false, toast: PLACEHOLDER_TOAST, notification };
  }
  if (!channel.enabled) {
    return { ok: false, toast: `${channel.label} is off, enable it to receive tests.`, notification };
  }
  return { ok: true, toast: `Test sent to ${channel.label}: “${notification.body}”`, notification };
}

/** Planner Zone D footer line (verbatim). */
export const PLANNER_FOOTER_LINE = 'I will only interrupt you when it changes your day for the better.';
