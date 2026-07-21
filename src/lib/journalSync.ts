import type { JournalEntry } from './foodJournal'

const DEVICE_KEY = 'life7-journal-device-v1'

function deviceId() {
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) return existing
  const id = `alex-${crypto.randomUUID()}`
  localStorage.setItem(DEVICE_KEY, id)
  return id
}

async function request(method: 'GET' | 'PUT', body?: JournalEntry[]) {
  const response = await fetch('/api/journal', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-life7-user': deviceId(),
    },
    body: body ? JSON.stringify({ entries: body }) : undefined,
  })
  if (!response.ok) throw new Error('Journal sync is temporarily unavailable.')
  return response.json() as Promise<{ entries: JournalEntry[]; syncedAt: string }>
}

export async function syncJournal(localEntries: JournalEntry[]) {
  const remote = await request('GET')
  const byId = new Map<string, JournalEntry>()
  for (const entry of [...remote.entries, ...localEntries]) byId.set(entry.id, entry)
  const merged = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const saved = await request('PUT', merged)
  return saved
}
