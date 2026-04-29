import { useNavigate } from 'react-router-dom'
import { useLearnStore, DOMAIN_WEIGHTS_DISPLAY } from '../../store/learnStore'
import { DOMAIN_COLORS, DOMAINS } from '../../store/examStore'
import StudyPlanPanel from './StudyPlanPanel'

const DOMAIN_ICONS: Record<string, string> = {
  'CX Strategy': '🎯',
  'Customer-Centric Culture': '🏛️',
  'Voice of Customer': '🎙️',
  'Experience Design': '✏️',
  'Metrics & Measurement': '📊',
  'Organizational Adoption': '🤝',
}

export default function LearnHome() {
  const navigate = useNavigate()
  const { getDomainProgress } = useLearnStore()

  const examDate = localStorage.getItem('ccxp_exam_date')
  const daysLeft = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const overallProgress = Math.round(
    DOMAINS.reduce((sum, d) => sum + getDomainProgress(d), 0) / DOMAINS.length
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-cream font-serif text-3xl">Learning Center</h1>
          <p className="text-mist text-sm mt-1">Master all 6 CCXP domains before Saturday</p>
        </div>
        <div className="flex gap-4">
          {daysLeft !== null && (
            <div className="bg-ink rounded-xl p-3 text-center border border-white/10">
              <div className={`text-2xl font-bold ${daysLeft <= 2 ? 'text-warn' : 'text-gold'}`}>{daysLeft}</div>
              <div className="text-mist text-xs">days left</div>
            </div>
          )}
          <div className="bg-ink rounded-xl p-3 text-center border border-white/10">
            <div className="text-2xl font-bold text-gold">{overallProgress}%</div>
            <div className="text-mist text-xs">readiness</div>
          </div>
        </div>
      </div>

      {/* Exam date setter */}
      {!examDate && (
        <div className="bg-warn/10 border border-warn/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-warn">⚠</span>
          <span className="text-cream text-sm flex-1">Set your exam date to see countdown</span>
          <input
            type="date"
            className="bg-navy border border-white/20 rounded-lg px-3 py-1 text-cream text-sm"
            onChange={e => { localStorage.setItem('ccxp_exam_date', e.target.value); window.location.reload() }}
          />
        </div>
      )}

      {/* Domain cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {DOMAINS.map(domain => {
          const progress = getDomainProgress(domain)
          const color = DOMAIN_COLORS[domain]
          const weight = DOMAIN_WEIGHTS_DISPLAY[domain]
          const circumference = 2 * Math.PI * 20
          const offset = circumference - (progress / 100) * circumference

          return (
            <button
              key={domain}
              onClick={() => navigate(`/learn/${encodeURIComponent(domain)}`)}
              className="bg-ink border border-white/10 hover:border-white/30 rounded-xl p-5 text-left transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl mb-1">{DOMAIN_ICONS[domain]}</div>
                  <div className="text-cream font-semibold text-sm group-hover:text-gold transition-colors">{domain}</div>
                  <div className="text-mist text-xs mt-0.5">{weight}% of exam</div>
                </div>
                <svg width="48" height="48" className="-rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#1A2B3C" strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-1.5 flex-1 bg-navy rounded-full mr-3">
                  <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                </div>
                <span className="text-mist text-xs">{progress}%</span>
              </div>

              <div className="mt-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: color + '22',
                    color: color,
                  }}
                >
                  {progress === 0 ? 'Not started' : progress < 50 ? 'In progress' : progress < 90 ? 'Good' : 'Ready'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center mb-10">
        <button
          onClick={() => navigate('/exam')}
          className="bg-gold text-navy font-bold px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors text-lg"
        >
          Take Full Practice Exam →
        </button>
      </div>

      {/* Study plan */}
      <StudyPlanPanel />
    </div>
  )
}
