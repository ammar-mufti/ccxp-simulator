import { Routes, Route } from 'react-router-dom'
import TopNav from '../components/Nav/TopNav'
import LearnHome from '../components/Learn/LearnHome'
import DomainPage from '../components/Learn/DomainPage'

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-navy">
      <TopNav />
      <Routes>
        <Route index element={<LearnHome />} />
        <Route path=":domain" element={<DomainPage />} />
      </Routes>
    </div>
  )
}
