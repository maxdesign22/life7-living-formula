import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Mic,
  Navigation,
  PackageCheck,
  Pizza,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Square,
  Store,
  Truck,
  WalletCards,
} from 'lucide-react'
import { MagneticButton, useToast } from '@/components/life7'
import { cn } from '@/lib/utils'
import {
  DISPATCH_STEPS,
  compareDispatchOffers,
  createDispatchOrder,
  readDispatchOrder,
  saveDispatchOrder,
  type DispatchOffer,
  type DispatchOrder,
} from '@/lib/dispatch'
import { EASE_GLIDE, KineticWords } from './generator/bits'

type ScreenState = 'request' | 'searching' | 'offers' | 'confirm' | 'tracking'
type VoiceState = 'idle' | 'listening' | 'unsupported' | 'error'

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly [index: number]: { readonly transcript: string }
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number
  readonly results: { readonly length: number; readonly [index: number]: SpeechRecognitionResultLike }
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const EXAMPLES = [
  { icon: Pizza, label: 'Two Margherita pizzas and sparkling water' },
  { icon: ShoppingBasket, label: 'Milk, eggs, bananas and chicken for tomorrow' },
  { icon: PackageCheck, label: 'Magnesium and vitamin D3 from a pharmacy' },
] as const

const badgeCopy = {
  balanced: 'Best balance',
  fastest: 'Fastest',
  cheapest: 'Cheapest',
} as const

const eur = (value: number) => `€${value.toFixed(2)}`

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.97
  const voices = window.speechSynthesis.getVoices()
  utterance.voice = voices.find((voice) => /Samantha|Jenny|Aria/i.test(voice.name))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
    ?? null
  window.speechSynthesis.speak(utterance)
}

function OfferCard({ offer, onSelect }: { offer: DispatchOffer; onSelect: () => void }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-r-xl border bg-soft-white/85 p-5 shadow-e-2',
        offer.badge === 'balanced' ? 'border-champagne/70 shadow-gold-glow' : 'border-line',
      )}
    >
      {offer.badge === 'balanced' && <span className="absolute inset-x-0 top-0 h-1 bg-score-gradient" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={cn(
            't-label inline-flex rounded-r-pill px-2.5 py-1',
            offer.badge === 'balanced' && 'bg-sunrise text-gold-deep',
            offer.badge === 'fastest' && 'bg-forest text-soft-white',
            offer.badge === 'cheapest' && 'bg-sage-mist text-forest',
          )}>{badgeCopy[offer.badge]}</span>
          <h3 className="t-display-sm mt-3 truncate text-ink">{offer.merchant}</h3>
          <p className="t-ui-sm mt-1 text-ink-faint">Connected via {offer.provider}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-forest">
          {offer.category === 'restaurant' ? <Pizza size={20} /> : offer.category === 'pharmacy' ? <PackageCheck size={20} /> : <Store size={20} />}
        </span>
      </div>
      <p className="t-ui-sm mt-4 min-h-[38px] leading-relaxed text-ink-soft line-clamp-2">{offer.itemLabel}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-line py-3">
        <div><span className="t-label block text-[8px] text-ink-faint">Arrives</span><span className="t-metric-sm tnum mt-1 block text-ink">{offer.etaMinutes} min</span></div>
        <div><span className="t-label block text-[8px] text-ink-faint">Available</span><span className="t-metric-sm tnum mt-1 block text-green">{offer.availabilityPct}%</span></div>
        <div><span className="t-label block text-[8px] text-ink-faint">Total</span><span className="t-metric-sm tnum mt-1 block text-ink">{eur(offer.totalEur)}</span></div>
      </div>
      <button type="button" onClick={onSelect} className="t-ui-sm mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-r-pill bg-forest font-bold text-soft-white transition-shadow hover:shadow-gold-glow">
        Choose this delivery <ArrowRight size={15} />
      </button>
    </motion.article>
  )
}

function TrackingMap({ progress }: { progress: number }) {
  return (
    <div className="relative h-[250px] overflow-hidden rounded-r-xl border border-champagne/30 bg-[#e8ecdf] shadow-e-2">
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(31deg, transparent 47%, #fff 48%, #fff 52%, transparent 53%), linear-gradient(118deg, transparent 47%, #d9b26a 48%, #d9b26a 50%, transparent 51%)', backgroundSize: '92px 78px, 150px 130px' }} />
      <svg viewBox="0 0 600 260" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M68 205 C145 210 150 120 242 135 S355 78 430 105 S500 58 548 48" fill="none" stroke="rgba(255,255,255,.92)" strokeWidth="15" strokeLinecap="round" />
        <path d="M68 205 C145 210 150 120 242 135 S355 78 430 105 S500 58 548 48" fill="none" stroke="#d9b26a" strokeWidth="3" strokeDasharray="7 8" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-[16%] left-[8%] flex h-10 w-10 items-center justify-center rounded-full bg-soft-white text-forest shadow-e-2"><Store size={18} /></span>
      <span className="absolute right-[5%] top-[9%] flex h-11 w-11 items-center justify-center rounded-full bg-forest text-soft-white shadow-e-2"><MapPin size={20} /></span>
      <motion.span
        className="absolute flex h-10 w-10 items-center justify-center rounded-full border-2 border-soft-white bg-champagne text-forest shadow-e-3"
        animate={{ left: `${12 + progress * 75}%`, top: `${72 - progress * 57}%` }}
        transition={{ duration: 0.8, ease: EASE_GLIDE }}
      ><Navigation size={18} fill="currentColor" /></motion.span>
      <span className="glass t-label absolute left-4 top-4 rounded-r-pill px-3 py-2 text-forest">Live route · encrypted</span>
    </div>
  )
}

export default function Dispatch() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const restoredOrder = useMemo(() => readDispatchOrder(), [])
  const [query, setQuery] = useState(restoredOrder?.query ?? '')
  const [screen, setScreen] = useState<ScreenState>(restoredOrder ? 'tracking' : 'request')
  const [offers, setOffers] = useState<readonly DispatchOffer[]>([])
  const [selected, setSelected] = useState<DispatchOffer | null>(null)
  const [order, setOrder] = useState<DispatchOrder | null>(restoredOrder)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => () => {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
  }, [])

  const statusIndex = order ? DISPATCH_STEPS.findIndex((step) => step.id === order.status) : 0
  const routeProgress = Math.max(0, statusIndex / (DISPATCH_STEPS.length - 1))

  useEffect(() => {
    if (!order || screen !== 'tracking' || order.status === 'delivered') return
    const timer = window.setTimeout(() => {
      const current = DISPATCH_STEPS.findIndex((step) => step.id === order.status)
      const nextStatus = DISPATCH_STEPS[Math.min(current + 1, DISPATCH_STEPS.length - 1)].id
      const next = { ...order, status: nextStatus }
      setOrder(next)
      saveDispatchOrder(next)
      if (nextStatus === 'courier-assigned') toast('Courier assigned · Mila, electric bike.', { tone: 'gold' })
      if (nextStatus === 'arriving') speak('Your LIFE7 delivery is arriving in three minutes.')
      if (nextStatus === 'delivered') {
        toast('Delivered and connected to your LIFE7 day.', { tone: 'sage' })
        speak('Delivery complete. I added the order to your day and updated the plan.')
      }
    }, 2400)
    return () => window.clearTimeout(timer)
  }, [order, screen, toast])

  const searchOffers = (value = query) => {
    const clean = value.trim()
    if (!clean) return
    setQuery(clean)
    setScreen('searching')
    window.setTimeout(() => {
      const results = compareDispatchOffers(clean)
      setOffers(results)
      setScreen('offers')
      speak(`I found three verified options. ${results[0].merchant} is the best balance at ${results[0].totalEur.toFixed(2)} euros, arriving in ${results[0].etaMinutes} minutes.`)
    }, 1250)
  }

  const toggleVoice = () => {
    if (voiceState === 'listening') {
      recognitionRef.current?.stop()
      return
    }
    const voiceWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceState('unsupported')
      return
    }
    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    let failed = false
    recognition.onstart = () => {
      setQuery('')
      setVoiceState('listening')
    }
    recognition.onresult = (event) => {
      let spoken = ''
      let final = false
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        spoken += event.results[index][0]?.transcript ?? ''
        if (event.results[index].isFinal) final = true
      }
      setQuery(spoken)
      if (final && spoken.trim()) searchOffers(spoken)
    }
    recognition.onerror = () => {
      failed = true
      setVoiceState('error')
    }
    recognition.onend = () => {
      if (!failed) setVoiceState('idle')
    }
    recognition.start()
  }

  const confirmOrder = () => {
    if (!selected) return
    const next = createDispatchOrder(query, selected)
    setOrder(next)
    setScreen('tracking')
    toast(`Order ${next.id} placed. Tracking is live.`, { tone: 'gold' })
  }

  const reset = () => {
    setScreen('request')
    setOffers([])
    setSelected(null)
    setOrder(null)
    setQuery('')
  }

  const etaLabel = useMemo(() => {
    if (!order) return ''
    return new Date(order.etaAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [order])

  return (
    <div className="mx-auto max-w-[1280px] pb-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="t-label text-gold-deep">LIFE7 · Universal delivery intelligence</span>
          <h1 className="t-display-lg mt-2 text-ink"><KineticWords text="Dispatch" /></h1>
          <p className="t-serif-quote mt-2 max-w-[65ch] text-ink-soft">Say what you need. LIFE7 finds the right merchant, price and arrival.</p>
        </div>
        <span className="glass t-ui-sm flex items-center gap-2 rounded-r-pill px-4 py-2.5 text-forest shadow-e-1"><ShieldCheck size={15} /> 6 partner APIs connected</span>
      </header>

      {screen !== 'tracking' && (
        <section className="relative overflow-hidden rounded-r-xl border border-champagne/30 bg-soft-white/75 p-5 shadow-e-2 min-[720px]:p-7">
          <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sunrise/60 blur-3xl" />
          <div className="relative">
            <span className="t-label text-gold-deep">Voice request</span>
            <h2 className="t-display-sm mt-1 text-ink">What should LIFE7 bring you?</h2>
            <div className="glass mt-5 flex items-center gap-2 rounded-r-pill p-2 shadow-e-2">
              <Search size={18} className="ml-2 shrink-0 text-ink-faint" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && searchOffers()}
                placeholder={voiceState === 'listening' ? 'Listening…' : 'Pizza, groceries, pharmacy — ask for anything'}
                aria-label="Delivery request"
                className="t-ui-md min-w-0 flex-1 bg-transparent px-1 py-2.5 text-ink outline-none placeholder:text-ink-faint"
              />
              <motion.button
                type="button"
                onClick={toggleVoice}
                aria-label={voiceState === 'listening' ? 'Stop listening' : 'Speak delivery request'}
                className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border', voiceState === 'listening' ? 'border-burgundy bg-burgundy text-white' : 'border-champagne/50 bg-sunrise text-gold-deep')}
                whileTap={{ scale: 0.92 }}
              >
                {voiceState === 'listening' ? <Square size={13} fill="currentColor" /> : <Mic size={18} />}
                {voiceState === 'listening' && <span className="absolute inset-0 -z-10 animate-ping rounded-full border border-burgundy/40" />}
              </motion.button>
              <button type="button" disabled={!query.trim() || screen === 'searching'} onClick={() => searchOffers()} className="t-ui-sm hidden h-11 items-center gap-2 rounded-r-pill bg-forest px-5 font-bold text-soft-white disabled:opacity-40 min-[560px]:flex">
                Compare <ArrowRight size={15} />
              </button>
            </div>
            {(voiceState === 'unsupported' || voiceState === 'error') && <p className="t-ui-sm mt-2 text-burgundy">{voiceState === 'unsupported' ? 'Voice needs Chrome, Edge or Safari. You can still type the request.' : 'Microphone unavailable. Check permission or type the request.'}</p>}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {EXAMPLES.map(({ icon: Icon, label }) => (
                <button key={label} type="button" onClick={() => searchOffers(label)} className="glass t-ui-sm flex shrink-0 items-center gap-2 rounded-r-pill px-3.5 py-2 text-ink-soft shadow-e-1 hover:text-forest"><Icon size={14} /> {label}</button>
              ))}
            </div>
          </div>
        </section>
      )}

      <AnimatePresence mode="wait">
        {screen === 'searching' && (
          <motion.section key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 grid gap-3 min-[760px]:grid-cols-3">
            {[0, 1, 2].map((index) => <div key={index} className="h-[310px] animate-pulse rounded-r-xl border border-line bg-soft-white/55 p-5"><div className="h-5 w-24 rounded bg-cream" /><div className="mt-6 h-8 w-3/4 rounded bg-cream" /><div className="mt-20 h-20 rounded bg-cream/70" /></div>)}
            <p className="t-label col-span-full flex items-center justify-center gap-2 text-gold-deep"><Sparkles size={14} className="animate-spin-slow" /> Checking live stock, prices, fees and arrival windows…</p>
          </motion.section>
        )}

        {(screen === 'offers' || screen === 'confirm') && (
          <motion.section key="offers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><span className="t-label text-gold-deep">Normalised partner responses</span><h2 className="t-display-sm mt-1 text-ink">Three honest choices. No hidden trade-off.</h2></div><span className="t-ui-sm text-ink-faint">Prices include delivery and service fees</span></div>
            <div className="grid gap-4 min-[760px]:grid-cols-3">{offers.map((offer) => <OfferCard key={offer.id} offer={offer} onSelect={() => { setSelected(offer); setScreen('confirm') }} />)}</div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'confirm' && selected && (
          <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(43,38,32,.24)] p-3 min-[640px]:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setScreen('offers')}>
            <motion.section role="dialog" aria-label="Confirm delivery" onClick={(event) => event.stopPropagation()} initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="glass-strong w-full max-w-[520px] rounded-r-xl p-6 shadow-e-3">
              <span className="t-label text-gold-deep">Explicit confirmation</span>
              <h2 className="t-display-sm mt-2 text-ink">Review before LIFE7 orders.</h2>
              <div className="mt-5 space-y-3 rounded-r-lg border border-line bg-soft-white/70 p-4">
                <div className="flex items-center gap-3"><Store size={17} className="text-gold-deep" /><div><p className="t-ui-sm font-bold text-ink">{selected.merchant}</p><p className="t-ui-sm text-ink-faint">{selected.itemLabel}</p></div></div>
                <div className="flex items-center gap-3"><MapPin size={17} className="text-gold-deep" /><div><p className="t-ui-sm font-bold text-ink">Home · Alex</p><p className="t-ui-sm text-ink-faint">Bulevar LIFE7 24 · door delivery</p></div></div>
                <div className="flex items-center gap-3"><WalletCards size={17} className="text-gold-deep" /><div><p className="t-ui-sm font-bold text-ink">Visa ···· 4242</p><p className="t-ui-sm text-ink-faint">Charged only after confirmation</p></div></div>
              </div>
              <div className="mt-4 flex items-center justify-between border-y border-line py-3"><span className="t-ui-md text-ink-soft">Arrives in {selected.etaMinutes} min</span><span className="t-metric-lg tnum text-ink">{eur(selected.totalEur)}</span></div>
              <p className="t-ui-sm mt-3 flex items-start gap-2 text-ink-faint"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-green" /> Voice never places an order by itself. This confirmation authorises the purchase.</p>
              <div className="mt-5 flex gap-2"><MagneticButton variant="glass" size="lg" className="flex-1" onClick={() => setScreen('offers')}>Back</MagneticButton><MagneticButton variant="primary" size="lg" className="flex-1" onClick={confirmOrder}>Confirm order</MagneticButton></div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {screen === 'tracking' && order && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><span className="t-label text-gold-deep">Order {order.id} · live partner webhooks</span><h2 className="t-display-md mt-1 text-ink">{order.status === 'delivered' ? 'Delivered. LIFE7 closed the loop.' : `Arriving by ${etaLabel}`}</h2></div><MagneticButton variant="glass" size="sm" onClick={reset}>New delivery</MagneticButton></div>
          <div className="grid items-start gap-5 min-[920px]:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
            <div><TrackingMap progress={routeProgress} /><div className="glass mt-4 flex flex-wrap items-center justify-between gap-3 rounded-r-lg p-4 shadow-e-1"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-sunrise text-forest"><Truck size={19} /></span><div><p className="t-ui-md font-bold text-ink">Mila · electric bike</p><p className="t-ui-sm text-ink-faint">Courier ID 724 · verified partner</p></div></div><div className="text-right"><p className="t-label text-ink-faint">Live ETA</p><p className="t-metric-sm tnum mt-1 text-forest">{order.status === 'delivered' ? 'Delivered' : `${Math.max(3, Math.round(order.offer.etaMinutes * (1 - routeProgress)))} min`}</p></div></div></div>
            <aside className="rounded-r-xl border border-line bg-soft-white/80 p-5 shadow-e-2">
              <span className="t-label text-gold-deep">Journey</span>
              <div className="mt-4 space-y-0">{DISPATCH_STEPS.map((step, index) => { const done = index <= statusIndex; const current = index === statusIndex; return <div key={step.id} className="relative flex gap-3 pb-4 last:pb-0">{index < DISPATCH_STEPS.length - 1 && <span className={cn('absolute left-[13px] top-7 h-[calc(100%-12px)] w-px', index < statusIndex ? 'bg-sage' : 'bg-line')} />}<motion.span animate={{ scale: current ? [1, 1.12, 1] : 1 }} transition={{ duration: 1.4, repeat: current && step.id !== 'delivered' ? Infinity : 0 }} className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border', done ? 'border-sage bg-sage-mist text-forest' : 'border-line bg-cream text-ink-faint')}>{done ? <Check size={13} /> : <Clock3 size={12} />}</motion.span><div className={cn(!done && 'opacity-45')}><p className="t-ui-sm font-bold text-ink">{step.label}</p><p className="t-ui-sm text-ink-faint">{step.detail}</p></div></div> })}</div>
            </aside>
          </div>
          {order.status === 'delivered' && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-r-xl border border-sage bg-sage-mist/75 p-5 shadow-e-2"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-soft-white"><PackageCheck size={20} /></span><div><span className="t-label text-green">Continuum updated</span><h3 className="t-display-sm mt-1 text-ink">Delivery became part of your day.</h3><p className="t-ui-sm mt-1 text-ink-soft">The order is recorded; affected meals, Shopping and Pantry are ready for review.</p></div></div><MagneticButton variant="primary" size="md" onClick={() => navigate('/planner')}>Open updated Planner</MagneticButton></div></motion.div>}
        </motion.section>
      )}
    </div>
  )
}
