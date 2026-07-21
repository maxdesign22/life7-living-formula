export type ContinuumScenarioId = 'sleep' | 'schedule' | 'budget' | 'expiry'

export interface ContinuumDemoState {
  scenarioId: ContinuumScenarioId
  title: string
  appliedAt: number
}

export const CONTINUUM_DEMO_EVENT = 'life7:continuum-demo-change'
const STORAGE_KEY = 'life7-continuum-demo'

export const CONTINUUM_ROUTE_MESSAGES: Record<ContinuumScenarioId, Record<string, string>> = {
  sleep: {
    '/today': 'Breakfast energy steadied after the recovery signal.',
    '/week': 'Strength moved to Friday; weekly training volume is protected.',
    '/shopping': 'The adjustment uses food already on the list — €0 added.',
    '/pantry': 'Expiring spinach remains protected in tonight’s dinner.',
  },
  schedule: {
    '/today': 'Yoghurt moved to 17:45 to bridge the later dinner.',
    '/week': 'Friday starts 30 minutes later while training fuel stays intact.',
    '/shopping': 'The coordinated update needs no new items.',
    '/pantry': 'Spinach moved into lunch so it is not lost at late dinner.',
  },
  budget: {
    '/today': 'Today stays unchanged — prepared meals remain protected.',
    '/week': 'Two dinners were recomposed without lowering protein adequacy.',
    '/shopping': 'Three swaps bring the market run below the new €55 ceiling.',
    '/pantry': 'Rice, eggs and olive oil now absorb more of the week’s cost.',
  },
  expiry: {
    '/today': 'Tonight’s omelette now uses the 300 g spinach at risk.',
    '/week': 'Saturday’s displaced greens slot now uses broccoli.',
    '/shopping': 'Replacement spinach was removed from the list — €1.80 saved.',
    '/pantry': 'The spinach expiry risk is resolved in tonight’s plan.',
  },
}

export function readContinuumDemoState(): ContinuumDemoState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ContinuumDemoState>
    if (!parsed.scenarioId || !parsed.title || typeof parsed.appliedAt !== 'number') return null
    return parsed as ContinuumDemoState
  } catch {
    return null
  }
}

export function applyContinuumDemoState(state: ContinuumDemoState) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(CONTINUUM_DEMO_EVENT))
}

export function clearContinuumDemoState() {
  window.sessionStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(CONTINUUM_DEMO_EVENT))
}
