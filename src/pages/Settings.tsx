/**
 * Screen 10 — SETTINGS & MEMBERSHIP (/settings). "Quiet control room":
 * profile, preferences, notifications summary (left) + membership tiers,
 * data & privacy, about (right). Cards stagger in 70 ms, y 20→0, 500 ms.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { USER_PROFILE } from '@/data/profile'
import { EASE_GLIDE, KineticWords } from '@/pages/planner/ui'
import ProfileCard from '@/pages/settings/ProfileCard'
import type { ProfileState } from '@/pages/settings/ProfileCard'
import PreferencesCard from '@/pages/settings/PreferencesCard'
import NotificationsCard from '@/pages/settings/NotificationsCard'
import Membership from '@/pages/settings/Membership'
import DataPrivacy from '@/pages/settings/DataPrivacy'
import About from '@/pages/settings/About'

const cardEntrance = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 + i * 0.07, duration: 0.5, ease: EASE_GLIDE },
})

export default function Settings() {
  const [profile, setProfile] = useState<ProfileState>({
    age: USER_PROFILE.age,
    sex: 'Male',
    heightCm: USER_PROFILE.heightCm,
    weightKg: USER_PROFILE.weightKg,
    goalId: USER_PROFILE.goalId,
    country: USER_PROFILE.country,
  })
  const [mealsPerDay, setMealsPerDay] = useState(USER_PROFILE.mealsPerDay)
  const [maxCooking, setMaxCooking] = useState(USER_PROFILE.maxCookingMinutes)
  const [budget, setBudget] = useState(USER_PROFILE.weeklyBudgetEur)
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')
  const [restrictions, setRestrictions] = useState<ReadonlySet<string>>(new Set(['No shellfish']))
  const [boostActive, setBoostActive] = useState(false)
  const [boostTarget, setBoostTarget] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* header */}
      <header className="mb-8">
        <motion.span
          className="t-label block text-gold-deep"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Control room · Week 24
        </motion.span>
        <h1 className="t-display-lg mt-2 text-ink">
          <KineticWords text="Settings" />
        </h1>
        <motion.p
          className="t-serif-quote mt-2 text-ink-soft"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Set once. Then let the system carry it.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-12">
        {/* left column (7) — A, B, C */}
        <div className="space-y-6 min-[1024px]:col-span-7">
          <motion.div {...cardEntrance(0)}>
            <ProfileCard profile={profile} onChange={setProfile} units={units} boostActive={boostActive} />
          </motion.div>
          <motion.div {...cardEntrance(1)}>
            <PreferencesCard
              mealsPerDay={mealsPerDay}
              setMealsPerDay={setMealsPerDay}
              maxCooking={maxCooking}
              setMaxCooking={setMaxCooking}
              budget={budget}
              setBudget={setBudget}
              units={units}
              setUnits={setUnits}
              restrictions={restrictions}
              setRestrictions={setRestrictions}
            />
          </motion.div>
          <motion.div {...cardEntrance(2)}>
            <NotificationsCard />
          </motion.div>
        </div>

        {/* right column (5) — D, E, F */}
        <div className="space-y-6 min-[1024px]:col-span-5">
          <motion.div {...cardEntrance(1)}>
            <Membership
              boostActive={boostActive}
              setBoostActive={setBoostActive}
              boostTarget={boostTarget}
              setBoostTarget={setBoostTarget}
            />
          </motion.div>
          <motion.div {...cardEntrance(2)}>
            <DataPrivacy />
          </motion.div>
          <motion.div {...cardEntrance(3)}>
            <About />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
