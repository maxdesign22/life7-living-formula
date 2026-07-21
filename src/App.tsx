import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import { ToastProvider } from '@/components/life7'
import Splash from '@/pages/Splash'
import Today from '@/pages/Today'
import Architect from '@/pages/Architect'
import Week from '@/pages/Week'
import Generator from '@/pages/Generator'
import Shopping from '@/pages/Shopping'
import Pantry from '@/pages/Pantry'
import Planner from '@/pages/Planner'
import Coach from '@/pages/Coach'
import Progress from '@/pages/Progress'
import Settings from '@/pages/Settings'

/** `/` → first-run splash once per session, otherwise straight to /today */
function RootGate() {
  const seen = sessionStorage.getItem('life7-splash-seen') === '1'
  return seen ? <Navigate to="/today" replace /> : <Splash />
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<RootGate />} />
        <Route element={<Layout />}>
          <Route path="/today" element={<Today />} />
          <Route path="/architect" element={<Architect />} />
          <Route path="/week" element={<Week />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
