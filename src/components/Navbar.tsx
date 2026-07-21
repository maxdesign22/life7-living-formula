import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sun,
  ChefHat,
  Hexagon,
  Sparkles,
  ShoppingBasket,
  Package,
  CalendarClock,
  MessageCircle,
  TrendingUp,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Life7Mark from '@/components/life7/Life7Mark'
import Footer from '@/components/Footer'

const EASE_GLIDE = [0.22, 1, 0.36, 1] as [number, number, number, number]

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: string
  dot?: 'burgundy' | 'gold'
}

const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/architect', label: 'Meal Architect', icon: ChefHat },
  { to: '/week', label: 'LIFE7 Week', icon: Hexagon },
  { to: '/generator', label: 'Week Generator', icon: Sparkles },
  { to: '/shopping', label: 'Shopping', icon: ShoppingBasket, badge: '9' },
  { to: '/pantry', label: 'Pantry', icon: Package, dot: 'burgundy' },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
  { to: '/coach', label: 'AI Coach', icon: MessageCircle, dot: 'gold' },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
]

const MORE_ITEMS: NavItem[] = [
  { to: '/shopping', label: 'Shopping', icon: ShoppingBasket, badge: '9' },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
  { to: '/coach', label: 'AI Coach', icon: MessageCircle, dot: 'gold' },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const WEEK_DOTS = [
  { day: 'M', score: 82, state: 'done' },
  { day: 'T', score: 78, state: 'done' },
  { day: 'W', score: 74, state: 'done' },
  { day: 'T', score: 71, state: 'today' },
  { day: 'F', score: 86, state: 'future' },
  { day: 'S', score: 80, state: 'future' },
  { day: 'S', score: 84, state: 'future' },
] as const

function ItemBadge({ item }: { item: NavItem }) {
  if (item.badge) {
    return (
      <span className="t-label tnum ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-r-pill bg-sunrise px-1 text-[10px] text-ink">
        {item.badge}
      </span>
    )
  }
  if (item.dot === 'burgundy') {
    return <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-burgundy" aria-label="expiring soon" />
  }
  if (item.dot === 'gold') {
    return (
      <span className="animate-gold-pulse ml-auto h-2 w-2 shrink-0 rounded-full bg-champagne" aria-label="new insight" />
    )
  }
  return null
}

/** Desktop floating side rail (design.md §8) */
function DesktopRail() {
  return (
    <nav
      aria-label="Primary"
      className="glass fixed bottom-4 left-4 top-4 z-50 hidden w-[248px] flex-col rounded-r-xl p-4 shadow-e-3 min-[900px]:flex min-[900px]:w-[76px] min-[900px]:p-3 min-[1200px]:w-[248px] min-[1200px]:p-4"
    >
      {/* brand */}
      <Link to="/today" className="mb-6 flex items-center gap-3 px-1 min-[900px]:justify-center min-[900px]:px-0 min-[1200px]:justify-start min-[1200px]:px-1">
        <Life7Mark size={36} />
        <span className="hidden min-[1200px]:block">
          <span className="font-display block text-[22px] leading-none tracking-[0.02em] text-ink">LIFE7</span>
          <span className="t-label mt-1 block text-[9px] text-gold-deep">Living Formula</span>
        </span>
      </Link>

      {/* items */}
      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-r-pill px-3 transition-colors duration-160 ease-soft',
                'hover:bg-[rgba(201,214,192,0.35)]',
                'min-[900px]:justify-center min-[900px]:px-0 min-[1200px]:justify-start min-[1200px]:px-3',
                isActive ? 'bg-soft-white text-forest shadow-e-1' : 'text-ink-soft',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-dot"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute -left-[9px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-champagne min-[900px]:-left-[7px] min-[1200px]:-left-[9px]"
                  />
                )}
                <item.icon
                  size={20}
                  strokeWidth={1.5}
                  className={cn(
                    'shrink-0 transition-all duration-160 ease-soft group-hover:translate-x-[2px] group-hover:text-forest',
                    'min-[900px]:group-hover:translate-x-0',
                    isActive ? 'text-gold-deep' : 'text-ink-soft',
                  )}
                />
                <span className="t-ui-sm hidden min-[1200px]:inline">{item.label}</span>
                <span className="hidden min-[1200px]:contents">
                  <ItemBadge item={item} />
                </span>
                {/* collapsed badge fallback: tiny corner dot */}
                <span className="min-[1200px]:hidden">
                  {(item.badge || item.dot) && (
                    <span
                      className={cn(
                        'absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full',
                        item.dot === 'burgundy' ? 'bg-burgundy' : 'bg-champagne',
                      )}
                    />
                  )}
                </span>
                {/* tooltip (icon-rail mode) */}
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded-r-sm px-2.5 py-1.5 opacity-0 shadow-e-2 transition-all duration-200 ease-soft group-hover:translate-x-0 group-hover:opacity-100 glass-strong t-ui-sm text-forest min-[1200px]:hidden min-[900px]:block">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <div className="mx-2 my-2 h-px bg-line" />

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'group relative flex h-10 items-center gap-3 rounded-r-pill px-3 transition-colors duration-160 ease-soft hover:bg-[rgba(201,214,192,0.35)]',
              'min-[900px]:justify-center min-[900px]:px-0 min-[1200px]:justify-start min-[1200px]:px-3',
              isActive ? 'bg-soft-white text-forest shadow-e-1' : 'text-ink-soft',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-dot"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute -left-[9px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-champagne min-[900px]:-left-[7px] min-[1200px]:-left-[9px]"
                />
              )}
              <Settings
                size={20}
                strokeWidth={1.5}
                className={cn(
                  'shrink-0 transition-all duration-160 ease-soft group-hover:translate-x-[2px] group-hover:text-forest min-[900px]:group-hover:translate-x-0',
                  isActive ? 'text-gold-deep' : 'text-ink-soft',
                )}
              />
              <span className="t-ui-sm hidden min-[1200px]:inline">Settings</span>
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded-r-sm px-2.5 py-1.5 opacity-0 shadow-e-2 transition-all duration-200 ease-soft group-hover:translate-x-0 group-hover:opacity-100 glass-strong t-ui-sm text-forest min-[1200px]:hidden min-[900px]:block">
                Settings
              </span>
            </>
          )}
        </NavLink>
      </div>

      {/* user chip */}
      <NavLink
        to="/settings"
        className="group mt-2 flex items-center gap-3 rounded-r-md p-1.5 transition-colors duration-160 hover:bg-[rgba(201,214,192,0.35)] min-[900px]:justify-center min-[900px]:p-1 min-[1200px]:justify-start min-[1200px]:p-1.5"
      >
        <img
          src="/avatar-alex.png"
          alt="Alex"
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-[1.5px] ring-champagne"
        />
        <span className="hidden min-w-0 min-[1200px]:block">
          <span className="t-ui-sm block truncate font-bold text-ink">Alex</span>
          <span className="t-label block text-[9px] text-gold-deep">LIFE7 Core</span>
        </span>
      </NavLink>

      {/* miniature week rhythm */}
      <Link
        to="/week"
        aria-label="Open LIFE7 Week"
        className="mt-3 hidden items-center justify-between rounded-r-md px-2 py-2 transition-colors duration-160 hover:bg-[rgba(201,214,192,0.35)] min-[1200px]:flex"
      >
        {WEEK_DOTS.map((d, i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                d.state === 'done' && 'bg-green',
                d.state === 'today' && 'bg-champagne ring-2 ring-champagne/30',
                d.state === 'future' && 'border border-ink-faint bg-transparent',
              )}
              title={`${d.day} · ${d.score}`}
            />
            <span className={cn('t-label text-[8px]', d.state === 'today' ? 'text-gold-deep' : 'text-ink-faint')}>
              {d.day}
            </span>
          </span>
        ))}
      </Link>

      {/* footer status */}
      <div className="mt-3 border-t border-line pt-3">
        <span className="hidden min-[1200px]:block">
          <Footer />
        </span>
        <span className="hidden min-[900px]:block min-[1200px]:hidden">
          <Footer compact />
        </span>
      </div>
    </nav>
  )
}

function DockSlot({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      aria-label={item.label}
      className="relative flex h-full flex-1 flex-col items-center justify-center gap-1"
    >
      <item.icon
        size={22}
        strokeWidth={1.5}
        className={cn('transition-colors duration-160', active ? 'text-gold-deep' : 'text-ink-soft')}
      />
      {active && (
        <motion.span
          layoutId="dock-dot"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute bottom-2 h-1 w-1 rounded-full bg-champagne"
        />
      )}
      {item.dot === 'burgundy' && <span className="absolute right-[26%] top-3 h-1.5 w-1.5 rounded-full bg-burgundy" />}
    </Link>
  )
}

/** Mobile floating bottom dock + More sheet (design.md §8) */
function MobileDock() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const path = location.pathname
  const moreActive = MORE_ITEMS.some((i) => path.startsWith(i.to))

  return (
    <>
      <nav
        aria-label="Primary mobile"
        className="glass fixed inset-x-3 bottom-3 z-50 flex h-16 items-stretch rounded-r-pill px-2 shadow-e-3 min-[900px]:hidden"
      >
        <DockSlot item={NAV_ITEMS[0]} active={path.startsWith('/today')} />
        <DockSlot item={NAV_ITEMS[1]} active={path.startsWith('/architect')} />

        {/* center: LIFE7 Week — elevated living mark */}
        <Link to="/week" aria-label="LIFE7 Week" className="relative flex h-full flex-1 items-start justify-center">
          <span
            className={cn(
              'glass -mt-[14px] flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-e-2 transition-shadow duration-300',
              path.startsWith('/week') && 'shadow-gold-glow',
            )}
          >
            <Life7Mark size={34} />
          </span>
        </Link>

        <DockSlot item={NAV_ITEMS[5]} active={path.startsWith('/pantry')} />

        <button
          type="button"
          aria-label="More"
          onClick={() => setOpen(true)}
          className="relative flex h-full flex-1 flex-col items-center justify-center gap-1"
        >
          <MoreHorizontal size={22} strokeWidth={1.5} className={moreActive ? 'text-gold-deep' : 'text-ink-soft'} />
          {moreActive && <span className="absolute bottom-2 h-1 w-1 rounded-full bg-champagne" />}
        </button>
      </nav>

      {/* More sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-[rgba(43,38,32,0.25)] min-[900px]:hidden"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.42, ease: EASE_GLIDE }}
              className="glass-strong fixed inset-x-0 bottom-0 z-[70] rounded-t-r-xl p-6 pb-10 shadow-e-3 min-[900px]:hidden"
              role="dialog"
              aria-label="More screens"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="t-label text-gold-deep">More</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="glass flex h-8 w-8 items-center justify-center rounded-full text-ink-soft"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {MORE_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex h-12 items-center gap-3 rounded-r-md px-3 transition-colors duration-160',
                        isActive ? 'bg-soft-white text-forest shadow-e-1' : 'text-ink-soft hover:bg-[rgba(201,214,192,0.35)]',
                      )
                    }
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                    <span className="t-ui-md">{item.label}</span>
                    <ItemBadge item={item} />
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * App navigation (design.md §8): floating glass side rail on desktop
 * (collapses to icon rail <1200px), floating bottom dock <900px.
 */
export default function Navbar() {
  return (
    <>
      <DesktopRail />
      <MobileDock />
    </>
  )
}
