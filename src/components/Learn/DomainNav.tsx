import { useNavigate } from 'react-router-dom'
import { DOMAINS, DOMAIN_COLORS } from '../../store/examStore'
import { useLearnStore, DOMAIN_WEIGHTS_DISPLAY } from '../../store/learnStore'
import { DOMAIN_TOPICS, toDomainSlug } from '../../utils/domainUtils'
import { contentCache } from '../../services/contentCache'

const DOMAIN_ICONS: Record<string, string> = {
  'CX Strategy': '🎯',
  'Customer-Centric Culture': '🏛️',
  'Voice of Customer': '🎙️',
  'Experience Design': '✏️',
  'Metrics & Measurement': '📊',
  'Organizational Adoption': '🤝',
}

interface Props {
  activeDomain?: string
}

export default function DomainNav({ activeDomain }: Props) {
  const navigate = useNavigate()
  const { getDomainProgress, progress } = useLearnStore()

  const overallProgress = Math.round(
    DOMAINS.reduce((sum, d) => sum + getDomainProgress(d), 0) / DOMAINS.length
  )

  function handleTopicClick(domain: string, topic: string) {
    sessionStorage.setItem('ccxp_navigate_to_topic', JSON.stringify({
      sourceTopic: topic,
      sourceTopicSlug: '',
      domain,
    }))
    navigate(`/learn/${toDomainSlug(domain)}`)
  }

  return (
    <div className="w-full flex flex-col py-4 px-3 gap-1">
      {/* Home link */}
      <button
        onClick={() => navigate('/learn')}
        className={`text-left px-3 py-2 rounded-lg text-sm font-semibold mb-2 transition-colors ${
          !activeDomain ? 'bg-gold/20 text-gold' : 'text-mist hover:text-cream hover:bg-white/5'
        }`}
      >
        ← Learning Center
      </button>

      {DOMAINS.map(domain => {
        const color = DOMAIN_COLORS[domain]
        const prog = getDomainProgress(domain)
        const cached = contentCache.hasContent(domain)
        const isActive = activeDomain === domain
        const topicsRead = progress[domain]?.topicsRead ?? []
        const topics = DOMAIN_TOPICS[domain] ?? []
        const weight = DOMAIN_WEIGHTS_DISPLAY[domain]

        let statusDot = '⚫'
        if (cached && prog >= 80) statusDot = '🟢'
        else if (cached || prog > 0) statusDot = '🟡'

        return (
          <div key={domain}>
            <button
              onClick={() => navigate(`/learn/${toDomainSlug(domain)}`)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                isActive
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base flex-shrink-0">{DOMAIN_ICONS[domain]}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-semibold truncate leading-snug"
                    style={{ color: isActive ? color : undefined }}
                  >
                    <span className={isActive ? '' : 'text-cream group-hover:text-gold transition-colors'}>
                      {domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-mist/60">{weight}%</span>
                    <span className="text-[10px]">{statusDot}</span>
                    <span className="text-[10px] text-mist/60">{prog}%</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-1.5 h-0.5 bg-white/10 rounded-full">
                <div
                  className="h-0.5 rounded-full transition-all"
                  style={{ width: `${prog}%`, backgroundColor: color }}
                />
              </div>
            </button>

            {/* Topic list when active */}
            {isActive && topics.length > 0 && (
              <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l border-white/10 pl-3">
                {topics.map(topic => {
                  const isRead = topicsRead.includes(topic)
                  return (
                    <button
                      key={topic}
                      onClick={() => handleTopicClick(domain, topic)}
                      className="w-full text-left text-xs py-1 text-mist hover:text-cream transition-colors flex items-center gap-1.5 group"
                    >
                      {isRead
                        ? <span className="text-pass text-[10px] flex-shrink-0">✓</span>
                        : <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0 group-hover:bg-gold/60 transition-colors" />
                      }
                      <span className={`truncate ${isRead ? 'text-mist/60 line-through decoration-mist/40' : ''}`}>
                        {topic}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Overall progress at bottom */}
      <div className="mt-auto pt-4 px-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-mist">Overall Readiness</span>
          <span className="text-xs font-bold text-gold">{overallProgress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full">
          <div
            className="h-1.5 rounded-full bg-gold transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <button
          onClick={() => navigate('/exam')}
          className="mt-3 w-full py-2 rounded-lg bg-gold text-navy text-xs font-bold hover:bg-amber-400 transition-colors"
        >
          Take Practice Exam →
        </button>
      </div>
    </div>
  )
}
