export type JournalMeal = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'
export type JournalSource = 'voice' | 'text' | 'demo'

export interface NutritionEstimate {
  kcal: number
  protein: number
  fibre: number
  fruitVeg: number
  freeSugar: number
  sodium: number
}

export interface JournalEntry {
  id: string
  createdAt: string
  meal: JournalMeal
  description: string
  source: JournalSource
  estimate: NutritionEstimate
  confidence: 'high' | 'medium' | 'low'
}

export interface JournalDay {
  date: string
  kcal: number
  protein: number
  fibre: number
  fruitVeg: number
  freeSugar: number
  sodium: number
  entries: number
}

export interface JournalSignal {
  tone: 'attention' | 'watch' | 'positive'
  title: string
  detail: string
  evidence: string
  action: string
  confidence: 'High confidence' | 'Medium confidence' | 'Building confidence'
}

const STORAGE_KEY = 'life7-food-journal-v1'

const FOOD_LIBRARY: Array<{ test: RegExp; perMention: NutritionEstimate }> = [
  { test: /oat|porridge/i, perMention: { kcal: 280, protein: 10, fibre: 7, fruitVeg: 0, freeSugar: 0, sodium: 0.1 } },
  { test: /greek yog|yogh?urt/i, perMention: { kcal: 150, protein: 18, fibre: 0, fruitVeg: 0, freeSugar: 4, sodium: 0.12 } },
  { test: /chicken/i, perMention: { kcal: 260, protein: 45, fibre: 0, fruitVeg: 0, freeSugar: 0, sodium: 0.22 } },
  { test: /rice/i, perMention: { kcal: 235, protein: 5, fibre: 2, fruitVeg: 0, freeSugar: 0, sodium: 0.01 } },
  { test: /spinach|broccoli|salad|vegetable/i, perMention: { kcal: 75, protein: 5, fibre: 7, fruitVeg: 180, freeSugar: 2, sodium: 0.08 } },
  { test: /banana|apple|berries|fruit/i, perMention: { kcal: 110, protein: 1, fibre: 4, fruitVeg: 130, freeSugar: 0, sodium: 0 } },
  { test: /egg/i, perMention: { kcal: 155, protein: 13, fibre: 0, fruitVeg: 0, freeSugar: 0, sodium: 0.25 } },
  { test: /salmon|fish/i, perMention: { kcal: 330, protein: 38, fibre: 0, fruitVeg: 0, freeSugar: 0, sodium: 0.2 } },
  { test: /pizza/i, perMention: { kcal: 720, protein: 28, fibre: 5, fruitVeg: 70, freeSugar: 7, sodium: 2.1 } },
  { test: /burger/i, perMention: { kcal: 650, protein: 31, fibre: 4, fruitVeg: 40, freeSugar: 8, sodium: 1.6 } },
  { test: /cola|soda|soft drink/i, perMention: { kcal: 180, protein: 0, fibre: 0, fruitVeg: 0, freeSugar: 45, sodium: 0.05 } },
  { test: /bread|toast/i, perMention: { kcal: 190, protein: 7, fibre: 4, fruitVeg: 0, freeSugar: 3, sodium: 0.5 } },
  { test: /nuts|walnut|almond/i, perMention: { kcal: 190, protein: 6, fibre: 3, fruitVeg: 0, freeSugar: 1, sodium: 0.01 } },
]

const round = (value: number) => Math.round(value * 10) / 10
const emptyNutrition = (): NutritionEstimate => ({ kcal: 0, protein: 0, fibre: 0, fruitVeg: 0, freeSugar: 0, sodium: 0 })

function dateKey(offset = 0) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function isoAt(offset: number, hour: number, minute = 0) {
  const date = new Date(`${dateKey(offset)}T12:00:00`)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const seed = (): JournalEntry[] => [
  ['-6-1', -6, 8, 'Breakfast', 'Oats with Greek yoghurt, banana and walnuts', 620, 29, 13, 130, 4, 0.3],
  ['-6-2', -6, 13, 'Lunch', 'Herb chicken, rice and spinach', 610, 49, 9, 180, 1, 0.5],
  ['-5-1', -5, 8, 'Breakfast', 'Two eggs, wholegrain toast and an apple', 510, 24, 9, 130, 3, 0.8],
  ['-5-2', -5, 19, 'Dinner', 'Salmon, rice and broccoli', 680, 43, 10, 190, 2, 0.5],
  ['-4-1', -4, 8, 'Breakfast', 'Greek yoghurt with berries and oats', 480, 27, 10, 140, 5, 0.3],
  ['-4-2', -4, 19, 'Dinner', 'Chicken salad with bread', 590, 46, 11, 260, 3, 0.9],
  ['-3-1', -3, 12, 'Lunch', 'Burger and cola', 830, 31, 4, 40, 53, 1.7],
  ['-3-2', -3, 20, 'Dinner', 'Greek yoghurt and a banana', 260, 19, 4, 130, 4, 0.1],
  ['-2-1', -2, 8, 'Breakfast', 'Oats, banana and almonds', 580, 18, 14, 130, 1, 0.2],
  ['-2-2', -2, 13, 'Lunch', 'Chicken rice bowl with vegetables', 690, 51, 10, 210, 2, 0.7],
  ['-1-1', -1, 9, 'Breakfast', 'Eggs and toast', 345, 20, 4, 0, 3, 0.8],
  ['-1-2', -1, 19, 'Dinner', 'Pizza and salad', 795, 32, 10, 250, 9, 2.2],
  ['today-1', 0, 8, 'Breakfast', 'Oats with Greek yoghurt and banana', 540, 29, 11, 130, 4, 0.3],
  ['today-2', 0, 13, 'Lunch', 'Herb chicken and rice bowl with spinach', 612, 44, 7, 180, 1, 0.5],
].map(([id, offset, hour, meal, description, kcal, protein, fibre, fruitVeg, freeSugar, sodium]) => ({
  id: String(id), createdAt: isoAt(Number(offset), Number(hour)), meal: meal as JournalMeal,
  description: String(description), source: 'demo' as const,
  estimate: { kcal: Number(kcal), protein: Number(protein), fibre: Number(fibre), fruitVeg: Number(fruitVeg), freeSugar: Number(freeSugar), sodium: Number(sodium) },
  confidence: 'high' as const,
}))

export function readJournal(): JournalEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as JournalEntry[]
  } catch { /* use demo data */ }
  const entries = seed()
  saveJournal(entries)
  return entries
}

export function saveJournal(entries: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function parseJournalText(description: string, meal: JournalMeal, source: JournalSource): JournalEntry {
  const estimate = emptyNutrition()
  let matches = 0
  FOOD_LIBRARY.forEach(({ test, perMention }) => {
    if (!test.test(description)) return
    matches += 1
    ;(Object.keys(estimate) as Array<keyof NutritionEstimate>).forEach((key) => { estimate[key] += perMention[key] })
  })
  if (!matches) Object.assign(estimate, { kcal: 450, protein: 20, fibre: 6, fruitVeg: 80, freeSugar: 5, sodium: 0.7 })
  ;(Object.keys(estimate) as Array<keyof NutritionEstimate>).forEach((key) => { estimate[key] = round(estimate[key]) })
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(), meal, description: description.trim(), source, estimate,
    confidence: matches >= 3 ? 'high' : matches >= 1 ? 'medium' : 'low',
  }
}

export function journalDays(entries: JournalEntry[], days: number): JournalDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = dateKey(index - days + 1)
    const matches = entries.filter((entry) => entry.createdAt.slice(0, 10) === date)
    return matches.reduce<JournalDay>((day, entry) => ({
      date,
      kcal: day.kcal + entry.estimate.kcal,
      protein: day.protein + entry.estimate.protein,
      fibre: day.fibre + entry.estimate.fibre,
      fruitVeg: day.fruitVeg + entry.estimate.fruitVeg,
      freeSugar: day.freeSugar + entry.estimate.freeSugar,
      sodium: round(day.sodium + entry.estimate.sodium),
      entries: day.entries + 1,
    }), { date, kcal: 0, protein: 0, fibre: 0, fruitVeg: 0, freeSugar: 0, sodium: 0, entries: 0 })
  })
}

export function buildSignals(days: JournalDay[]): JournalSignal[] {
  const logged = days.filter((day) => day.entries > 0)
  const divisor = Math.max(1, logged.length)
  const average = (key: keyof Omit<JournalDay, 'date'>) => logged.reduce((sum, day) => sum + day[key], 0) / divisor
  const confidence = logged.length >= 6 ? 'High confidence' : logged.length >= 3 ? 'Medium confidence' : 'Building confidence'
  const signals: JournalSignal[] = []
  if (average('fibre') < 25) signals.push({ tone: 'attention', title: 'Fibre pattern is below the reference', detail: 'Your logged days average less than 25 g of fibre.', evidence: `${round(average('fibre'))} g/day across ${logged.length} logged days`, action: 'Add oats, beans, vegetables or seeds to one daily meal.', confidence })
  if (average('fruitVeg') < 400) signals.push({ tone: 'watch', title: 'Plant variety has room to grow', detail: 'The current log is below the general 400 g fruit-and-vegetable reference.', evidence: `${Math.round(average('fruitVeg'))} g/day logged average`, action: 'Add one colourful vegetable portion to lunch or dinner.', confidence })
  const highSodiumDays = logged.filter((day) => day.sodium > 2).length
  if (highSodiumDays >= 2) signals.push({ tone: 'watch', title: 'Sodium is clustering on some days', detail: 'Several logged days exceed the general 2 g sodium reference.', evidence: `${highSodiumDays} of ${logged.length} logged days`, action: 'Review sauces, takeaway meals and packaged foods first.', confidence })
  if (!signals.length) signals.push({ tone: 'positive', title: 'No persistent pattern needs attention', detail: 'The currently logged period stays within the app’s general reference bands.', evidence: `${logged.length} days with usable data`, action: 'Keep logging consistently to make the signal stronger.', confidence })
  return signals.slice(0, 3)
}

export function resetJournal() {
  localStorage.removeItem(STORAGE_KEY)
}
