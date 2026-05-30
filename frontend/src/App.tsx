import { Route, Routes } from 'react-router-dom'
import { TopNav } from './components/TopNav'
import { InvestorPanel } from './components/InvestorPanel'
import { DashboardPage } from './pages/DashboardPage'
import { DealRoomPage } from './pages/DealRoomPage'
import { LeadViewPage } from './pages/LeadViewPage'

function App() {
  return (
    <div className="flex h-full flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <InvestorPanel />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/deals/:id" element={<DealRoomPage />} />
            <Route path="/lead-view" element={<LeadViewPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
