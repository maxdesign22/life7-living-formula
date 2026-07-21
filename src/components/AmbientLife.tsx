import { memo, useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  wobblePhase: number
  wobbleAmp: number
  twinklePeriod: number
  twinkleOffset: number
  hue: number // 0 = gold, 1 = soft-white
}

/**
 * Canvas-2D dust particles (design.md §6.2): 42 desktop / 18 mobile,
 * slow upward-diagonal drift with sine wobble + twinkle. Pauses when the
 * tab is hidden; disabled entirely under prefers-reduced-motion.
 */
function DustCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    let particles: Particle[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const spawn = (w: number, h: number): Particle[] => {
      const count = window.innerWidth < 900 ? 18 : 42
      return Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 1.5,
        vx: 4 + Math.random() * 5, // px/s diagonal
        vy: -(3 + Math.random() * 5), // upward
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: 6 + Math.random() * 10,
        twinklePeriod: 3 + Math.random() * 4,
        twinkleOffset: Math.random() * Math.PI * 2,
        hue: Math.random(),
      }))
    }

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = spawn(window.innerWidth, window.innerHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    const step = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)
      const t = now / 1000
      for (const p of particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.y < -12) {
          p.y = h + 12
          p.x = Math.random() * w
        }
        if (p.x > w + 12) p.x = -12
        const wobble = Math.sin(t * 0.6 + p.wobblePhase) * p.wobbleAmp
        const tw = (Math.sin((t / p.twinklePeriod) * Math.PI * 2 + p.twinkleOffset) + 1) / 2
        const alpha = 0.2 + tw * 0.35
        ctx.beginPath()
        ctx.arc(p.x + wobble, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle =
          p.hue < 0.6 ? `rgba(217,178,106,${(alpha * 0.8).toFixed(3)})` : `rgba(255,253,247,${alpha.toFixed(3)})`
        ctx.fill()
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    const onVis = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(step)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      aria-hidden="true"
    />
  )
}

const Dust = memo(DustCanvas)

/**
 * The Ambient Life System (design.md §6) — persistent fixed background,
 * back→front: sunlight field → grain → botanical sprigs → dust → sun disc.
 */
function AmbientLifeInner() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* 1. sunlight field — two drifting radial-gradient layers (120% sized) */}
      <div
        className="ambient-drift-a absolute -left-[10%] -top-[10%] h-[120%] w-[120%]"
        style={{
          background: 'radial-gradient(60% 50% at 70% 10%, rgba(247,223,167,0.55), transparent 70%)',
        }}
      />
      <div
        className="ambient-drift-b absolute -left-[10%] -top-[10%] h-[120%] w-[120%]"
        style={{
          background: 'radial-gradient(50% 40% at 15% 85%, rgba(201,214,192,0.45), transparent 70%)',
        }}
      />

      {/* 2. grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: 'url(/texture-grain.png)', backgroundRepeat: 'repeat', backgroundSize: '220px 220px' }}
      />

      {/* 3. botanical sprigs */}
      <img
        src="/botanical-sprig-1.svg"
        alt=""
        className="sprig-sway-a absolute -left-10 bottom-0 h-[46vh] max-h-[480px] opacity-[0.14]"
        style={{ filter: 'blur(0.4px)' }}
      />
      <img
        src="/botanical-sprig-2.svg"
        alt=""
        className="sprig-sway-b absolute -right-8 top-0 h-[40vh] max-h-[420px] opacity-[0.14]"
        style={{ filter: 'blur(0.4px)' }}
      />

      {/* 4. breathing sun disc */}
      <div
        className="sun-disc-breathe absolute -top-[130px] right-[8%] h-[520px] w-[520px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(242,193,78,0.5), rgba(242,193,78,0.12) 45%, transparent 70%)',
        }}
      />

      {/* 5. dust particles (canvas, front of field, behind content) */}
      <Dust />
    </div>
  )
}

const AmbientLife = memo(AmbientLifeInner)
export default AmbientLife
