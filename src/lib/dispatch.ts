export type DispatchCategory = 'restaurant' | 'grocery' | 'pharmacy' | 'general'
export type DispatchBadge = 'fastest' | 'cheapest' | 'balanced'
export type DispatchOrderStatus =
  | 'received'
  | 'confirmed'
  | 'preparing'
  | 'courier-assigned'
  | 'collected'
  | 'on-the-way'
  | 'arriving'
  | 'delivered'

export interface DispatchOffer {
  readonly id: string
  readonly provider: string
  readonly merchant: string
  readonly category: DispatchCategory
  readonly itemLabel: string
  readonly subtotalEur: number
  readonly deliveryEur: number
  readonly serviceEur: number
  readonly totalEur: number
  readonly etaMinutes: number
  readonly availabilityPct: number
  readonly badge: DispatchBadge
  readonly accent: 'forest' | 'gold' | 'sage'
}

export interface DispatchOrder {
  readonly id: string
  readonly query: string
  readonly offer: DispatchOffer
  readonly status: DispatchOrderStatus
  readonly createdAt: number
  readonly etaAt: number
}

export const DISPATCH_STORAGE_KEY = 'life7-dispatch-order'

export const DISPATCH_STEPS: readonly { readonly id: DispatchOrderStatus; readonly label: string; readonly detail: string }[] = [
  { id: 'received', label: 'Order received', detail: 'Request secured by LIFE7' },
  { id: 'confirmed', label: 'Merchant confirmed', detail: 'Stock and price locked' },
  { id: 'preparing', label: 'Preparing order', detail: 'Kitchen or picker is working' },
  { id: 'courier-assigned', label: 'Courier assigned', detail: 'Mila is heading to the merchant' },
  { id: 'collected', label: 'Order collected', detail: 'Temperature-safe handoff complete' },
  { id: 'on-the-way', label: 'On the way', detail: 'Live route is active' },
  { id: 'arriving', label: 'Arriving shortly', detail: 'Courier is in your neighbourhood' },
  { id: 'delivered', label: 'Delivered', detail: 'Added to your LIFE7 day' },
]

const round2 = (value: number) => Math.round(value * 100) / 100

function categoryFor(query: string): DispatchCategory {
  const value = query.toLowerCase()
  if (/pizza|burger|sushi|meal|dinner|lunch|restaurant|margarita|margherita/.test(value)) return 'restaurant'
  if (/medicine|pharmacy|vitamin|magnesium|pain|tablet/.test(value)) return 'pharmacy'
  if (/grocer|market|milk|egg|fruit|vegetable|banana|chicken|bread/.test(value)) return 'grocery'
  return 'general'
}

function itemFor(query: string, category: DispatchCategory): string {
  const clean = query.trim().replace(/^(life7[, ]*|please |i want |get me |deliver )+/i, '')
  if (clean.length >= 5) return clean.charAt(0).toUpperCase() + clean.slice(1)
  if (category === 'restaurant') return 'Two Margherita pizzas + sparkling water'
  if (category === 'pharmacy') return 'Wellness essentials'
  if (category === 'grocery') return 'Weekly grocery top-up'
  return 'Your requested delivery'
}

const PROVIDERS: Record<DispatchCategory, readonly { provider: string; merchant: string; subtotal: number; delivery: number; service: number; eta: number; availability: number }[]> = {
  restaurant: [
    { provider: 'MetroEats API', merchant: 'Forno 24', subtotal: 15.8, delivery: 2.6, service: 0.8, eta: 24, availability: 100 },
    { provider: 'QuickBite API', merchant: 'Casa Margherita', subtotal: 11.4, delivery: 1.2, service: 0.6, eta: 43, availability: 100 },
    { provider: 'CityFood API', merchant: 'Oliva Kitchen', subtotal: 12.9, delivery: 1.4, service: 0.6, eta: 31, availability: 100 },
  ],
  grocery: [
    { provider: 'Maxi Market API', merchant: 'Maxi Central', subtotal: 29.4, delivery: 1.99, service: 0.7, eta: 42, availability: 94 },
    { provider: 'Mercator API', merchant: 'Mercator Hyper', subtotal: 27.1, delivery: 2.49, service: 0.6, eta: 58, availability: 97 },
    { provider: 'FreshChain API', merchant: 'Fresh Market', subtotal: 28.2, delivery: 1.49, service: 0.7, eta: 47, availability: 100 },
  ],
  pharmacy: [
    { provider: 'Benu API', merchant: 'BENU Pharmacy', subtotal: 12.6, delivery: 2.2, service: 0.5, eta: 27, availability: 100 },
    { provider: 'Dr.Max API', merchant: 'Dr.Max', subtotal: 10.9, delivery: 1.8, service: 0.5, eta: 39, availability: 100 },
    { provider: 'WellnessNow API', merchant: 'Wellness Point', subtotal: 11.4, delivery: 1.5, service: 0.5, eta: 32, availability: 98 },
  ],
  general: [
    { provider: 'CityRunner API', merchant: 'Nearest available merchant', subtotal: 18.2, delivery: 3.4, service: 0.8, eta: 29, availability: 92 },
    { provider: 'ValueDrop API', merchant: 'Best-price partner', subtotal: 15.1, delivery: 2.2, service: 0.7, eta: 48, availability: 96 },
    { provider: 'OneCart API', merchant: 'LIFE7 verified partner', subtotal: 16.4, delivery: 2.1, service: 0.7, eta: 36, availability: 99 },
  ],
}

/** Normalises simulated partner API responses into one comparable contract. */
export function compareDispatchOffers(query: string): readonly DispatchOffer[] {
  const category = categoryFor(query)
  const itemLabel = itemFor(query, category)
  const raw = PROVIDERS[category]
  const totals = raw.map((offer) => round2(offer.subtotal + offer.delivery + offer.service))
  const fastestIndex = raw.reduce((best, offer, index) => offer.eta < raw[best].eta ? index : best, 0)
  const cheapestIndex = totals.reduce((best, total, index) => total < totals[best] ? index : best, 0)
  const balancedIndex = raw.reduce((best, offer, index) => {
    const score = offer.eta * 0.45 + totals[index] * 1.25 - offer.availability * 0.08
    const bestScore = raw[best].eta * 0.45 + totals[best] * 1.25 - raw[best].availability * 0.08
    return score < bestScore ? index : best
  }, 0)

  return raw.map((offer, index): DispatchOffer => {
    const badge: DispatchBadge = index === balancedIndex ? 'balanced' : index === fastestIndex ? 'fastest' : index === cheapestIndex ? 'cheapest' : 'balanced'
    return {
      id: `${category}-${index + 1}`,
      provider: offer.provider,
      merchant: offer.merchant,
      category,
      itemLabel,
      subtotalEur: offer.subtotal,
      deliveryEur: offer.delivery,
      serviceEur: offer.service,
      totalEur: totals[index],
      etaMinutes: offer.eta,
      availabilityPct: offer.availability,
      badge,
      accent: badge === 'fastest' ? 'forest' : badge === 'cheapest' ? 'sage' : 'gold',
    }
  }).sort((a, b) => ({ balanced: 0, fastest: 1, cheapest: 2 }[a.badge] - ({ balanced: 0, fastest: 1, cheapest: 2 }[b.badge])))
}

export function createDispatchOrder(query: string, offer: DispatchOffer): DispatchOrder {
  const now = Date.now()
  const order: DispatchOrder = {
    id: `L7-${Math.floor(1200 + (now % 8700))}`,
    query,
    offer,
    status: 'received',
    createdAt: now,
    etaAt: now + offer.etaMinutes * 60_000,
  }
  localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(order))
  return order
}

export function saveDispatchOrder(order: DispatchOrder): void {
  localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(order))
}

export function readDispatchOrder(): DispatchOrder | null {
  try {
    const raw = localStorage.getItem(DISPATCH_STORAGE_KEY)
    return raw ? JSON.parse(raw) as DispatchOrder : null
  } catch {
    return null
  }
}

