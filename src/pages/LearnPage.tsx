import { useParams } from 'react-router-dom'
import TopNav from '../components/Nav/TopNav'
import LearnHome from '../components/Learn/LearnHome'
import DomainPage from '../components/Learn/DomainPage'

export default function LearnPage() {
  const { domainSlug } = useParams<{ domainSlug?: string }>()

  return (
    <div className="min-h-screen bg-navy">
      <TopNav />
      {domainSlug ? <DomainPage /> : <LearnHome />}
    </div>
  )
}
