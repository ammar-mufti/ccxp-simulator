import { useExamStore, DOMAINS } from '../../store/examStore'
import type { ExamMode } from '../../store/examStore'
import { useNavigate } from 'react-router-dom'


const DOMAIN_COLORS: Record<string, string> = {
  'CX Strategy': '#4A9EDB',
  'Customer-Centric Culture': '#E8904A',
  'Voice of Customer': '#7BC67A',
  'Experience Design': '#C97AC9',
  'Metrics & Measurement': '#E8C94A',
  'Organizational Adoption': '#7AC9C9',
}

export default function ConfigScreen() {
  const { setMode } = useExamStore()
  const navigate = useNavigate()

  function startExam(mode: ExamMode, domain?: string) {
    setMode(mode, domain)
    navigate('/exam/loading')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-cream font-serif text-3xl mb-2">Choose Your Exam</h1>
      <p className="text-mist mb-8">Select a format to begin AI-generated practice questions</p>

      <div className="grid gap-4 mb-8">
        <button
          onClick={() => startExam('full')}
          className="bg-ink border border-white/10 hover:border-gold/50 rounded-xl p-6 text-left transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-cream font-bold text-lg group-hover:text-gold transition-colors">Full Mock Exam</div>
              <div className="text-mist text-sm mt-1">100 questions · 3 hours · All 6 domains</div>
            </div>
            <div className="bg-gold/20 text-gold text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-1">
            {DOMAINS.map(d => (
              <div key={d} className="h-1.5 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[d] }} />
            ))}
          </div>
        </button>

        <button
          onClick={() => startExam('mini')}
          className="bg-ink border border-white/10 hover:border-gold/50 rounded-xl p-6 text-left transition-all group"
        >
          <div className="text-cream font-bold text-lg group-hover:text-gold transition-colors">Mini Drill</div>
          <div className="text-mist text-sm mt-1">20 questions · 1 hour · All domains (weighted)</div>
        </button>
      </div>

      <div>
        <h2 className="text-cream font-semibold mb-3">Domain Drill</h2>
        <p className="text-mist text-sm mb-4">10 questions · 30 minutes · Single domain</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOMAINS.map(domain => (
            <button
              key={domain}
              onClick={() => startExam('domain', domain)}
              className="bg-ink border border-white/10 hover:border-white/30 rounded-xl p-4 text-left transition-all flex items-center gap-3"
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DOMAIN_COLORS[domain] }} />
              <span className="text-cream text-sm font-medium">{domain}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
