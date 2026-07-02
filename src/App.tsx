import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Kanban } from '@/pages/Kanban'
import { LeadsTable } from '@/pages/LeadsTable'
import { Weekly } from '@/pages/Weekly'
import { Playbook } from '@/pages/Playbook'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/leads" element={<LeadsTable />} />
        <Route path="/semana" element={<Weekly />} />
        <Route path="/playbook" element={<Playbook />} />
      </Route>
    </Routes>
  )
}
