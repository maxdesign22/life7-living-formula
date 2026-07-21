import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BarChart3, Check, ChevronRight, Clock3, Cloud, Info, Leaf, LoaderCircle, Mic, Plus, Sparkles, Trash2, Utensils, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildSignals, journalDays, parseJournalText, readJournal, saveJournal, type JournalEntry, type JournalMeal } from '@/lib/foodJournal'
import { syncJournal } from '@/lib/journalSync'

type Period = 'today' | 'week' | 'month'
type VoiceState = 'idle' | 'listening' | 'unsupported' | 'error'
type SyncState = 'idle' | 'syncing' | 'synced' | 'error'
interface SpeechRecognitionLike { lang: string; continuous: boolean; interimResults: boolean; onstart: (() => void) | null; onresult: ((event: { results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start(): void; abort(): void }
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const examples = ['Oats with yoghurt, banana and walnuts', 'Chicken, rice and spinach for lunch', 'Two slices of pizza and a cola']

function Metric({ label, value, unit, pct }: { label: string; value: number; unit: string; pct: number }) {
  return <div className="rounded-r-lg border border-line bg-soft-white/75 p-4"><span className="t-label block truncate text-[9px] text-ink-faint">{label}</span><div className="mt-2 flex items-end justify-between gap-2"><strong className="tnum text-xl text-ink">{Math.round(value)}<small className="ml-1 text-xs font-semibold text-ink-faint">{unit}</small></strong><span className="t-ui-sm text-ink-faint">{Math.min(100, Math.round(pct))}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} className="h-full rounded-full bg-metric-fill" /></div></div>
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>(readJournal)
  const [period, setPeriod] = useState<Period>('today')
  const [text, setText] = useState('')
  const [meal, setMeal] = useState<JournalMeal>('Lunch')
  const [draft, setDraft] = useState<JournalEntry | null>(null)
  const [voice, setVoice] = useState<VoiceState>('idle')
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => () => recognitionRef.current?.abort(), [])
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayEntries = useMemo(() => entries.filter((entry) => entry.createdAt.slice(0, 10) === todayKey).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [entries, todayKey])
  const range = period === 'today' ? journalDays(entries, 1) : journalDays(entries, period === 'week' ? 7 : 30)
  const logged = range.filter((day) => day.entries > 0)
  const divisor = Math.max(1, logged.length)
  const totals = logged.reduce((sum, day) => ({ kcal: sum.kcal + day.kcal, protein: sum.protein + day.protein, fibre: sum.fibre + day.fibre, fruitVeg: sum.fruitVeg + day.fruitVeg }), { kcal: 0, protein: 0, fibre: 0, fruitVeg: 0 })
  const average = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / divisor])) as typeof totals
  const signals = buildSignals(journalDays(entries, 7))

  const preview = (value = text, source: 'voice' | 'text' = 'text') => {
    if (!value.trim()) return
    setDraft(parseJournalText(value, meal, source))
  }
  const confirm = () => {
    if (!draft) return
    const next = [...entries, draft]
    setEntries(next); saveJournal(next); setText(''); setDraft(null)
  }
  const remove = (id: string) => { const next = entries.filter((entry) => entry.id !== id); setEntries(next); saveJournal(next) }
  const updatePortion = (grams: number) => {
    if (!draft || !Number.isFinite(grams) || grams < 1) return
    const ratio = grams / draft.portionGrams
    const scale = (value: number) => Math.round(value * ratio * 10) / 10
    const estimate: JournalEntry['estimate'] = {
      kcal: scale(draft.estimate.kcal), protein: scale(draft.estimate.protein),
      fibre: scale(draft.estimate.fibre), fruitVeg: scale(draft.estimate.fruitVeg),
      freeSugar: scale(draft.estimate.freeSugar), sodium: scale(draft.estimate.sodium),
    }
    setDraft({ ...draft, portionGrams: grams, estimate, confidence: 'high' })
  }
  const updateEstimate = (key: keyof JournalEntry['estimate'], value: number) => {
    if (!draft || !Number.isFinite(value) || value < 0) return
    setDraft({ ...draft, estimate: { ...draft.estimate, [key]: value }, confidence: 'high' })
  }
  const sync = async () => {
    setSyncState('syncing')
    try {
      const result = await syncJournal(entries)
      setEntries(result.entries); saveJournal(result.entries); setSyncedAt(result.syncedAt); setSyncState('synced')
    } catch { setSyncState('error') }
  }
  const listen = () => {
    const Recognition = (window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
    if (!Recognition) { setVoice('unsupported'); return }
    const recognition = new Recognition(); recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = true
    recognition.onstart = () => setVoice('listening')
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript
      setText(transcript)
      if (event.results[event.results.length - 1].isFinal) preview(transcript, 'voice')
    }
    recognition.onerror = () => setVoice('error'); recognition.onend = () => setVoice((state) => state === 'listening' ? 'idle' : state)
    recognitionRef.current = recognition; recognition.start()
  }

  return <div className="mx-auto max-w-[1280px]">
    <header className="mb-7 flex flex-col justify-between gap-5 min-[760px]:flex-row min-[760px]:items-end">
      <div><span className="t-label text-gold-deep">LIFE7 MEMORY · YOUR FOOD, REMEMBERED</span><h1 className="t-display-lg mt-2 text-ink">Food Journal</h1><p className="t-serif-quote mt-2 text-ink-soft">Say what you ate. See the pattern, not just the plate.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={sync} disabled={syncState === 'syncing'} className={cn('t-ui-sm inline-flex h-10 items-center gap-2 rounded-r-pill border px-4 shadow-e-1', syncState === 'synced' ? 'border-sage bg-sage-mist text-forest' : syncState === 'error' ? 'border-burgundy/35 bg-[#fbf0ec] text-burgundy' : 'border-line bg-soft-white/80 text-ink-soft')}>
          {syncState === 'syncing' ? <LoaderCircle size={15} className="animate-spin"/> : syncState === 'synced' ? <Check size={15}/> : <Cloud size={15}/>}
          {syncState === 'syncing' ? 'Syncing…' : syncState === 'synced' ? 'Synced' : syncState === 'error' ? 'Retry sync' : 'Sync journal'}
        </button>
        <div className="inline-flex w-fit rounded-r-pill border border-line bg-soft-white/80 p-1 shadow-e-1">{(['today','week','month'] as Period[]).map((item) => <button key={item} onClick={() => setPeriod(item)} className={cn('t-ui-sm rounded-r-pill px-4 py-2 capitalize', period === item ? 'bg-forest text-soft-white' : 'text-ink-soft')}>{item === 'week' ? '7 days' : item === 'month' ? '30 days' : item}</button>)}</div>
        {syncedAt && <span className="sr-only">Last synced {new Date(syncedAt).toLocaleString()}</span>}
      </div>
    </header>

    <section className="mb-6 overflow-hidden rounded-r-xl border border-champagne/35 bg-soft-white/85 shadow-e-2">
      <div className="grid min-[900px]:grid-cols-[1.15fr_.85fr]">
        <div className="p-5 min-[640px]:p-7"><div className="flex items-center gap-2"><Sparkles size={16} className="text-gold-deep"/><span className="t-label text-gold-deep">Tell LIFE7 what you ate</span></div><h2 className="t-display-sm mt-3 text-ink">One sentence becomes a useful memory.</h2>
          <div className="mt-5 flex gap-2"><input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') preview() }} placeholder="e.g. Chicken, rice and spinach for lunch" className="t-ui-md min-w-0 flex-1 rounded-r-pill border border-sand bg-ivory/70 px-5 text-ink placeholder:text-ink-faint"/><button type="button" onClick={listen} aria-label="Log food by voice" className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all', voice === 'listening' ? 'animate-pulse bg-burgundy text-soft-white shadow-gold-glow' : 'bg-sunrise text-forest')}><Mic size={20}/></button><button type="button" onClick={() => preview()} aria-label="Review entry" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-soft-white"><ChevronRight size={20}/></button></div>
          {voice === 'listening' && <p className="t-ui-sm mt-2 text-burgundy">Listening… say the meal and approximate portions.</p>}{voice === 'unsupported' && <p className="t-ui-sm mt-2 text-burgundy">Voice input is not available in this browser. You can type the same sentence.</p>}
          <div className="mt-4 flex flex-wrap gap-2">{examples.map((example) => <button key={example} onClick={() => { setText(example); preview(example) }} className="t-ui-sm rounded-r-pill border border-line bg-ivory/55 px-3 py-2 text-left text-ink-soft hover:border-champagne">{example}</button>)}</div>
        </div>
        <div className="border-t border-line bg-sage-mist/45 p-5 min-[900px]:border-l min-[900px]:border-t-0 min-[640px]:p-7"><span className="t-label text-green">Why it matters</span><p className="t-serif-quote mt-3 text-forest">“The journal closes the loop between what LIFE7 planned and what actually happened.”</p><div className="mt-5 flex gap-3 text-ink-soft"><Check size={18} className="shrink-0 text-green"/><p className="t-ui-sm">Every estimate is reviewed before it changes your reports.</p></div></div>
      </div>
    </section>

    <AnimatePresence>{draft && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 rounded-r-xl border border-champagne bg-[#fff8e8] p-5 shadow-gold-glow">
      <div className="flex items-start justify-between gap-4"><div><span className="t-label text-gold-deep">Review and correct before adding</span><h3 className="t-display-sm mt-2 text-ink">{draft.description}</h3></div><button onClick={() => setDraft(null)} aria-label="Close"><X size={18}/></button></div>
      <div className="mt-5 grid gap-3 min-[560px]:grid-cols-3 min-[900px]:grid-cols-6">
        <label className="t-label text-[9px] text-ink-faint">Meal<select value={meal} onChange={(event) => { const nextMeal = event.target.value as JournalMeal; setMeal(nextMeal); setDraft({ ...draft, meal: nextMeal }) }} className="t-ui-sm mt-1 h-11 w-full rounded-r-md border border-sand bg-soft-white px-3 text-ink">{(['Breakfast','Lunch','Snack','Dinner'] as JournalMeal[]).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="t-label text-[9px] text-ink-faint">Portion<input aria-label="Portion grams" type="number" min="1" value={draft.portionGrams} onChange={(event) => updatePortion(Number(event.target.value))} className="t-ui-sm tnum mt-1 h-11 w-full rounded-r-md border border-sand bg-soft-white px-3 text-ink"/></label>
        <label className="t-label text-[9px] text-ink-faint">Energy<input aria-label="Energy kcal" type="number" min="0" value={draft.estimate.kcal} onChange={(event) => updateEstimate('kcal', Number(event.target.value))} className="t-ui-sm tnum mt-1 h-11 w-full rounded-r-md border border-sand bg-soft-white px-3 text-ink"/></label>
        <label className="t-label text-[9px] text-ink-faint">Protein g<input aria-label="Protein grams" type="number" min="0" value={draft.estimate.protein} onChange={(event) => updateEstimate('protein', Number(event.target.value))} className="t-ui-sm tnum mt-1 h-11 w-full rounded-r-md border border-sand bg-soft-white px-3 text-ink"/></label>
        <label className="t-label text-[9px] text-ink-faint">Fibre g<input aria-label="Fibre grams" type="number" min="0" value={draft.estimate.fibre} onChange={(event) => updateEstimate('fibre', Number(event.target.value))} className="t-ui-sm tnum mt-1 h-11 w-full rounded-r-md border border-sand bg-soft-white px-3 text-ink"/></label>
        <label className="t-label text-[9px] text-ink-faint">Plants g<input aria-label="Fruit and vegetables grams" type="number" min="0" value={draft.estimate.fruitVeg} onChange={(event) => updateEstimate('fruitVeg', Number(event.target.value))} className="t-ui-sm tnum mt-1 h-11 w-full rounded-r-md border border-sand bg-soft-white px-3 text-ink"/></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-ink-faint"><Info size={13}/>Changing the portion rescales every estimate; any direct correction becomes confirmed data.</p><button onClick={confirm} className="t-ui-sm inline-flex h-11 items-center gap-2 rounded-r-pill bg-forest px-6 font-bold text-soft-white"><Plus size={15}/> Add confirmed entry</button></div>
    </motion.div>}</AnimatePresence>

    <div className="grid gap-6 min-[1024px]:grid-cols-[1.08fr_.92fr]">
      <section className="rounded-r-xl border border-line bg-soft-white/80 p-5 shadow-e-2 min-[640px]:p-6"><div className="flex items-center justify-between"><div><span className="t-label text-gold-deep">Today · {todayEntries.length} entries</span><h2 className="t-display-sm mt-2">What actually happened</h2></div><Utensils className="text-green"/></div><div className="mt-5 space-y-3">{todayEntries.map((entry) => <article key={entry.id} className="group flex gap-3 rounded-r-lg border border-line bg-ivory/45 p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-mist text-forest"><Clock3 size={17}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3"><strong className="t-ui-sm text-ink">{entry.meal}</strong><span className="text-xs text-ink-faint">{new Date(entry.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span><span className="text-xs capitalize text-gold-deep">{entry.source}</span></div><p className="t-ui-md mt-1 text-ink">{entry.description}</p><p className="mt-1 text-xs text-ink-faint">{entry.estimate.kcal} kcal · {entry.estimate.protein} g protein · {entry.estimate.fibre} g fibre</p></div><button onClick={() => remove(entry.id)} aria-label={`Remove ${entry.description}`} className="self-center p-2 text-ink-faint opacity-70 hover:text-burgundy min-[900px]:opacity-0 min-[900px]:group-hover:opacity-100"><Trash2 size={15}/></button></article>)}{!todayEntries.length && <div className="py-12 text-center text-ink-faint"><Leaf className="mx-auto mb-3"/><p>No meals logged yet. Tell LIFE7 what you ate.</p></div>}</div></section>

      <div className="space-y-6"><section className="rounded-r-xl border border-line bg-soft-white/80 p-5 shadow-e-2 min-[640px]:p-6"><div className="flex items-center justify-between"><div><span className="t-label text-green">{period === 'today' ? 'Today' : period === 'week' ? '7-day report' : '30-day report'}</span><h2 className="t-display-sm mt-2">Your nutrition pattern</h2></div><BarChart3 className="text-green"/></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Energy" value={average.kcal} unit="kcal" pct={average.kcal/20}/><Metric label="Protein" value={average.protein} unit="g" pct={average.protein/1.1}/><Metric label="Fibre" value={average.fibre} unit="g" pct={average.fibre/0.25}/><Metric label="Fruit & veg" value={average.fruitVeg} unit="g" pct={average.fruitVeg/4}/></div>{period !== 'today' && <div className="mt-5 flex h-28 items-end gap-1.5" aria-label="Daily energy chart">{range.map((day) => <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><motion.div initial={{ height: 0 }} animate={{ height: `${day.entries ? Math.max(12, Math.min(88, day.kcal / 22)) : 4}px` }} className={cn('w-full max-w-5 rounded-t-full', day.entries ? 'bg-gradient-to-t from-green to-champagne' : 'bg-sand')}/><span className="hidden text-[8px] text-ink-faint min-[520px]:block">{new Date(`${day.date}T12:00`).toLocaleDateString([], { weekday:'narrow' })}</span></div>)}</div>}<p className="mt-4 text-xs text-ink-faint">Average per logged day · {logged.length} of {range.length} days have data</p></section>

        <section className="rounded-r-xl border border-line bg-soft-white/80 p-5 shadow-e-2 min-[640px]:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7e4dd] text-burgundy"><AlertTriangle size={19}/></span><div><span className="t-label text-burgundy">Signals worth attention</span><h2 className="t-display-sm mt-1">Patterns, not diagnoses</h2></div></div><div className="mt-5 space-y-3">{signals.map((signal) => <article key={signal.title} className={cn('rounded-r-lg border-l-2 p-4', signal.tone === 'attention' ? 'border-burgundy bg-[#fbf0ec]' : signal.tone === 'watch' ? 'border-champagne bg-[#fff8e8]' : 'border-green bg-sage-mist/55')}><div className="flex flex-wrap justify-between gap-2"><strong className="t-ui-sm text-ink">{signal.title}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{signal.confidence}</span></div><p className="t-ui-sm mt-1 text-ink-soft">{signal.detail}</p><p className="mt-2 text-xs font-semibold text-ink">{signal.evidence}</p><p className="mt-2 text-xs text-green">Next: {signal.action}</p></article>)}</div><p className="mt-4 flex gap-2 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint"><Info size={14} className="mt-0.5 shrink-0"/>General WHO reference bands are used only to spot repeated patterns. LIFE7 does not diagnose illness or replace advice from a doctor or registered dietitian.</p></section></div>
    </div>
  </div>
}
