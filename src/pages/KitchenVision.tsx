import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Camera, Check, ChefHat, Clock3, ImagePlus, Info, LoaderCircle, PackageCheck, RefreshCw, Sparkles, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeKitchenImage, saveKitchenVision, type KitchenVisionResult } from '@/lib/kitchenVision'

type ScanState = 'idle' | 'ready' | 'analyzing' | 'done' | 'error'

async function imageToDataUrl(file: Blob) {
  const source = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale); canvas.height = Math.round(source.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot prepare the image.')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function KitchenVision() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<KitchenVisionResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => () => { if (image?.startsWith('blob:')) URL.revokeObjectURL(image) }, [image])
  const loadFile = async (file?: File) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Choose a JPEG, PNG or WebP image.'); setState('error'); return }
    if (file.size > 8_000_000) { setError('Use an image smaller than 8 MB.'); setState('error'); return }
    try { setImage(await imageToDataUrl(file)); setResult(null); setSaved(false); setState('ready'); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Image preparation failed.'); setState('error') }
  }
  const loadDemo = async () => {
    const response = await fetch('/meal-chicken-bowl.jpg')
    const blob = await response.blob()
    setImage(await imageToDataUrl(blob)); setResult(null); setSaved(false); setState('ready'); setError('')
  }
  const analyze = async () => {
    if (!image) return
    setState('analyzing'); setError('')
    try { setResult(await analyzeKitchenImage(image)); setState('done') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Analysis failed.'); setState('error') }
  }
  const updateGrams = (id: string, grams: number) => {
    if (!result || !Number.isFinite(grams) || grams < 1) return
    const oldTotal = result.items.reduce((sum, item) => sum + item.estimatedGrams, 0)
    const items = result.items.map((item) => item.ingredientId === id ? { ...item, estimatedGrams: grams, confidence: 'high' as const } : item)
    const ratio = items.reduce((sum, item) => sum + item.estimatedGrams, 0) / Math.max(1, oldTotal)
    const scale = (value: number) => Math.round(value * ratio * 10) / 10
    setResult({ ...result, items, recipe: { ...result.recipe, nutritionEstimate: {
      kcal: scale(result.recipe.nutritionEstimate.kcal), proteinG: scale(result.recipe.nutritionEstimate.proteinG),
      fibreG: scale(result.recipe.nutritionEstimate.fibreG), vegetablesG: scale(result.recipe.nutritionEstimate.vegetablesG),
    } } })
  }
  const save = () => { if (!result) return; saveKitchenVision(result); setSaved(true) }

  return <div className="mx-auto max-w-[1280px]">
    <header className="mb-7 flex flex-col justify-between gap-5 min-[760px]:flex-row min-[760px]:items-end">
      <div><span className="t-label text-gold-deep">PANTRY VISION · SEE WHAT CAN BECOME DINNER</span><h1 className="t-display-lg mt-2 text-ink">Kitchen Vision</h1><p className="t-serif-quote mt-2 max-w-[700px] text-ink-soft">Photograph what you have. LIFE7 composes what comes next.</p></div>
      <div className="t-ui-sm flex items-center gap-2 rounded-r-pill border border-sage bg-sage-mist/70 px-4 py-2 text-forest"><Sparkles size={15}/> Live multimodal analysis</div>
    </header>

    <div className="grid gap-6 min-[1024px]:grid-cols-[.82fr_1.18fr]">
      <section className="rounded-r-xl border border-line bg-soft-white/85 p-5 shadow-e-2 min-[640px]:p-6">
        <div className="flex items-center justify-between"><div><span className="t-label text-gold-deep">1 · Capture</span><h2 className="t-display-sm mt-2">Show the ingredients</h2></div><Camera className="text-gold-deep"/></div>
        <button type="button" onClick={() => inputRef.current?.click()} className={cn('relative mt-5 flex min-h-[330px] w-full items-center justify-center overflow-hidden rounded-r-xl border border-dashed transition-colors', image ? 'border-champagne bg-ink' : 'border-sand bg-ivory/55 hover:border-champagne')}>
          {image ? <img src={image} alt="Ingredients ready for analysis" className="absolute inset-0 h-full w-full object-cover opacity-90"/> : <span className="flex flex-col items-center px-6 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-sunrise text-forest"><ImagePlus size={26}/></span><strong className="t-ui-lg mt-4 text-ink">Take a photo or choose one</strong><span className="t-ui-sm mt-2 max-w-[300px] text-ink-faint">Place ingredients in one layer with labels visible when possible.</span></span>}
          {image && <span className="glass-strong t-ui-sm absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-r-pill px-4 py-2 text-forest"><RefreshCw size={14}/> Change photo</span>}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => loadFile(event.target.files?.[0])}/>
        <div className="mt-4 grid gap-2 min-[520px]:grid-cols-2"><button type="button" onClick={loadDemo} className="t-ui-sm h-11 rounded-r-pill border border-line bg-soft-white font-semibold text-forest">Use demo photograph</button><button type="button" onClick={analyze} disabled={!image || state === 'analyzing'} className="t-ui-sm flex h-11 items-center justify-center gap-2 rounded-r-pill bg-forest font-bold text-soft-white disabled:opacity-40">{state === 'analyzing' ? <LoaderCircle size={16} className="animate-spin"/> : <Sparkles size={16}/>} {state === 'analyzing' ? 'Reading the kitchen…' : 'Identify & compose'}</button></div>
        {error && <p className="t-ui-sm mt-3 flex gap-2 rounded-r-md bg-[#fbf0ec] p-3 text-burgundy"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>{error}</p>}
        <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ink-faint"><Info size={14} className="mt-0.5 shrink-0"/>The photo estimates visible edible quantities. Hidden weight, packaging and freshness must be confirmed by the user.</p>
      </section>

      <div className="space-y-6">
        {!result && <section className="flex min-h-[360px] flex-col items-center justify-center rounded-r-xl border border-line bg-soft-white/65 p-8 text-center shadow-e-1"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-mist text-forest"><ChefHat size={32}/></span><h2 className="t-display-sm mt-5">A recipe will grow here.</h2><p className="t-ui-md mt-2 max-w-[430px] text-ink-soft">LIFE7 will identify visible food, estimate grams, show confidence and compose one practical meal.</p></section>}
        {result && <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <section className="rounded-r-xl border border-line bg-soft-white/85 p-5 shadow-e-2 min-[640px]:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="t-label text-green">2 · Confirm what LIFE7 sees</span><h2 className="t-display-sm mt-2">{result.sceneSummary}</h2></div><span className="t-label rounded-r-pill bg-sage-mist px-3 py-1.5 text-green">{result.overallConfidence} confidence</span></div><div className="mt-5 grid gap-3 min-[620px]:grid-cols-2">{result.items.map((item) => <article key={item.ingredientId} className="rounded-r-lg border border-line bg-ivory/45 p-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunrise text-forest"><PackageCheck size={17}/></span><div className="min-w-0 flex-1"><strong className="t-ui-sm block truncate text-ink">{item.name}</strong><span className="text-xs capitalize text-ink-faint">{item.confidence} confidence</span></div><label className="t-label text-[8px] text-ink-faint">Grams<input aria-label={`${item.name} grams`} type="number" min="1" value={item.estimatedGrams} onChange={(event) => updateGrams(item.ingredientId, Number(event.target.value))} className="t-ui-sm tnum mt-1 h-9 w-20 rounded-r-sm border border-sand bg-soft-white px-2 text-right text-ink"/></label></div><p className="mt-2 text-xs leading-relaxed text-ink-faint">{item.evidence}</p></article>)}</div></section>

          <section className="overflow-hidden rounded-r-xl border border-champagne/45 bg-soft-white/90 shadow-e-3"><div className="bg-sunrise/35 p-5 min-[640px]:p-6"><span className="t-label text-gold-deep">3 · Cook from what you have</span><h2 className="t-display-md mt-2 text-ink">{result.recipe.title}</h2><div className="mt-3 flex flex-wrap gap-2"><span className="t-ui-sm inline-flex items-center gap-1.5 rounded-r-pill bg-soft-white px-3 py-1.5"><Clock3 size={14}/> {result.recipe.prepMinutes + result.recipe.cookMinutes} min</span><span className="t-ui-sm rounded-r-pill bg-soft-white px-3 py-1.5">{result.recipe.servings} serving{result.recipe.servings > 1 ? 's' : ''}</span><span className="t-ui-sm rounded-r-pill bg-soft-white px-3 py-1.5">{Math.round(result.recipe.nutritionEstimate.kcal)} kcal</span><span className="t-ui-sm rounded-r-pill bg-soft-white px-3 py-1.5">P {Math.round(result.recipe.nutritionEstimate.proteinG)} g</span></div></div><div className="p-5 min-[640px]:p-6"><ol className="space-y-4">{result.recipe.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="t-label flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-soft-white">{index + 1}</span><p className="t-ui-md pt-0.5 leading-relaxed text-ink">{step}</p></li>)}</ol>{result.recipe.optionalStaples.length > 0 && <p className="t-ui-sm mt-5 border-t border-line pt-4 text-ink-soft"><strong className="text-ink">Optional staples:</strong> {result.recipe.optionalStaples.join(', ')}</p>}<p className="t-ui-sm mt-4 flex gap-2 rounded-r-md bg-[#fff8e8] p-3 text-ink-soft"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-gold-deep"/>{result.recipe.foodSafety}</p><div className="mt-5 flex flex-col gap-2 min-[520px]:flex-row"><button type="button" onClick={save} className={cn('t-ui-sm inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-r-pill font-bold', saved ? 'bg-sage-mist text-forest' : 'bg-forest text-soft-white')}>{saved ? <Check size={16}/> : <PackageCheck size={16}/>} {saved ? 'Saved to Pantry' : 'Save confirmed ingredients'}</button><button type="button" onClick={() => navigate('/pantry')} className="t-ui-sm inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-r-pill border border-line bg-soft-white font-semibold text-forest">Open Pantry <ArrowRight size={15}/></button></div></div></section>
        </motion.div>}
      </div>
    </div>
    <footer className="mt-6 flex items-start gap-3 rounded-r-lg border border-sage bg-sage-mist/55 p-4"><UtensilsCrossed size={18} className="mt-0.5 shrink-0 text-green"/><p className="t-ui-sm text-forest">Kitchen Vision suggests a meal from visible ingredients; it never guarantees weight, freshness, allergens or safe doneness from a photograph alone.</p></footer>
  </div>
}
