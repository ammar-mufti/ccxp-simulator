import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fromDomainSlug, DOMAIN_TOPICS, toTopicSlug } from '../../utils/domainUtils'
import { useStageContent } from '../../hooks/useStageContent'
import { useLearnStore } from '../../store/learnStore'
import { DOMAIN_COLORS } from '../../store/examStore'
import { contentCache } from '../../services/contentCache'
import type { Stage1Summary, Stage2Topic, Stage4Question } from '../../types/content'
import Stage1SummaryComponent from './Stage1Summary'
import Stage2Concepts from './Stage2Concepts'
import Stage4Quiz from './Stage4Quiz'
import LearnLayout from './LearnLayout'

const SECTIONS = [
  { id: 'snapshot', label: 'Domain Snapshot' },
  { id: 'key-concepts', label: 'Key Concepts' },
  { id: 'quiz', label: 'Quick Quiz' },
]

function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-fail/10 border border-fail/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-fail text-sm">{message}</p>
      <button onClick={onRetry} className="bg-gold text-navy font-bold px-4 py-1.5 rounded-lg text-sm flex-shrink-0 hover:bg-amber-400 transition-colors">
        Retry
      </button>
    </div>
  )
}

function RegeneratePanel({ domain, onCancel }: { domain: string; onCancel: () => void }) {
  const generatedDate = contentCache.getGeneratedDate(domain)
  return (
    <div className="bg-ink border border-warn/30 rounded-xl p-4 space-y-3">
      <p className="text-cream text-sm">
        Regenerate content for <span className="text-gold font-semibold">{domain}</span>?
        {generatedDate && <span className="text-mist"> Current content from {generatedDate} will be replaced.</span>}
      </p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg border border-white/20 text-mist text-sm hover:text-cream transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { contentCache.clearDomain(domain); window.location.reload() }}
          className="px-4 py-1.5 rounded-lg bg-warn text-navy font-bold text-sm hover:bg-amber-500 transition-colors"
        >
          Yes, Regenerate
        </button>
      </div>
    </div>
  )
}

export default function DomainPage() {
  const { domainSlug } = useParams<{ domainSlug: string }>()
  const domain = fromDomainSlug(domainSlug ?? '')
  const navigate = useNavigate()
  const topicRefs = useRef<Record<string, HTMLDivElement | null>>({})
  useLearnStore()


  const [autoExpandTopic, setAutoExpandTopic] = useState<string | null>(null)
  const [jumpedBannerTopic, setJumpedBannerTopic] = useState<string | null>(null)
  const [showRegenPanel, setShowRegenPanel] = useState(false)

  // Scroll center panel to top on mount (component remounts per domain via key prop)
  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 })
  }, [])

  // Read navigation target from sessionStorage on mount
  useEffect(() => {
    const sidebarNav = sessionStorage.getItem('ccxp_sidebar_expand_topic')
    if (sidebarNav) {
      try {
        const { topic } = JSON.parse(sidebarNav) as { topic: string }
        sessionStorage.removeItem('ccxp_sidebar_expand_topic')
        setAutoExpandTopic(topic)
        console.log('Auto expand target set (sidebar):', topic)
      } catch { /* ignore */ }
    }

    const examNav = sessionStorage.getItem('ccxp_navigate_to_topic')
    if (examNav) {
      try {
        const { sourceTopic } = JSON.parse(examNav) as { sourceTopic: string }
        sessionStorage.removeItem('ccxp_navigate_to_topic')
        setAutoExpandTopic(sourceTopic)
        setJumpedBannerTopic(sourceTopic)
        console.log('Auto expand target set (exam nav):', sourceTopic)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (domain && !DOMAIN_TOPICS[domain]) navigate('/learn', { replace: true })
  }, [domain, navigate])

  const color = DOMAIN_COLORS[domain] ?? '#C9A84C'
  const generatedDate = contentCache.getGeneratedDate(domain)

  const s1 = useStageContent<Stage1Summary>(domain, 'stage1-summary')
  const s2 = useStageContent<Stage2Topic[]>(domain, 'stage2-concepts', { topics: DOMAIN_TOPICS[domain] ?? [] })
  const s4 = useStageContent<Stage4Question[]>(domain, 'stage4-quiz')

  useEffect(() => {
    if (domain && DOMAIN_TOPICS[domain]) s1.load()
  }, [domain]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s1.data && !s2.data && !s2.loading) s2.load()
  }, [s1.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s2.data && !s4.data && !s4.loading) s4.load()
  }, [s2.data]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTopicExpand(topic: string) {
    setTimeout(() => {
      const slug = toTopicSlug(topic)
      const el = document.getElementById(`topic-${slug}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        console.log('Scrolled to topic:', topic)
      } else {
        console.warn('Topic element not found:', `topic-${slug}`)
        document.getElementById('key-concepts')?.scrollIntoView({ behavior: 'smooth' })
      }
    }, 150)
  }

  // Trigger auto-expand once Stage 2 data is ready
  useEffect(() => {
    if (!autoExpandTopic || !s2.data) return
    console.log('Stage 2 ready, expanding topic:', autoExpandTopic)
    setTimeout(() => {
      handleTopicExpand(autoExpandTopic)
      setAutoExpandTopic(null)
    }, 300)
  }, [autoExpandTopic, s2.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for same-page expand-topic custom event (sidebar click while already on this domain)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      console.log('expand-topic event received:', e.detail.topic)
      handleTopicExpand(e.detail.topic)
    }
    window.addEventListener('expand-topic', handler as EventListener)
    return () => window.removeEventListener('expand-topic', handler as EventListener)
  }, [s2.data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!domain || !DOMAIN_TOPICS[domain]) return null

  return (
    <LearnLayout showPageNav activeDomain={domain} sections={SECTIONS}>
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-12">
        {/* Domain header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl mb-1" style={{ color }}>{domain}</h1>
            {generatedDate && (
              <p className="text-mist text-xs">Content generated: {generatedDate}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate(`/exam?domain=${encodeURIComponent(domain)}`)}
              className="text-sm px-3 py-1.5 rounded-lg border text-gold border-gold/50 hover:bg-gold/10 transition-colors"
            >
              Domain Drill
            </button>
            <button
              onClick={() => setShowRegenPanel(p => !p)}
              className="text-mist/50 hover:text-mist text-xs transition-colors"
            >
              ↺ Regenerate
            </button>
          </div>
        </div>

        {showRegenPanel && (
          <RegeneratePanel domain={domain} onCancel={() => setShowRegenPanel(false)} />
        )}

        {jumpedBannerTopic && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-gold flex-shrink-0">📍</span>
            <p className="text-cream text-sm">
              Jumped here from exam — <span className="font-semibold text-gold">"{jumpedBannerTopic}"</span> is expanded below
            </p>
            <button onClick={() => setJumpedBannerTopic(null)} className="text-mist/40 hover:text-mist ml-auto flex-shrink-0">✕</button>
          </div>
        )}

        {/* ── STAGE 1: Domain Snapshot ── */}
        <section id="snapshot">
          <h2 className="text-cream font-semibold text-lg mb-3">Domain Snapshot</h2>
          {s1.loading && <Skeleton lines={5} />}
          {s1.error && <ErrorRetry message={s1.error} onRetry={s1.load} />}
          {s1.data && <Stage1SummaryComponent data={s1.data} />}
        </section>

        {/* ── STAGE 2: Key Concepts ── */}
        {(s1.data || s1.loading) && (
          <section id="key-concepts">
            <h2 className="text-cream font-semibold text-lg mb-3">Key Concepts</h2>
            {s2.loading && <Skeleton lines={6} />}
            {s2.error && <ErrorRetry message={s2.error} onRetry={s2.load} />}
            {!s2.loading && !s2.error && !s2.data && s1.data && (
              <div className="text-mist text-sm p-4 bg-white/5 rounded-xl flex items-center justify-between">
                <span>Concepts not yet generated</span>
                <button onClick={s2.load} className="text-gold text-sm font-semibold hover:underline">Generate →</button>
              </div>
            )}
            {s2.data && s2.data.length > 0 && (
              <Stage2Concepts
                domain={domain}
                topics={s2.data}
                autoExpandTopic={autoExpandTopic}
                topicRefs={topicRefs}
              />
            )}
          </section>
        )}

        {/* ── STAGE 4: Quiz ── */}
        {s2.data && (
          <section id="quiz">
            <h2 className="text-cream font-semibold text-lg mb-3">Quick Quiz</h2>
            {s4.loading && <Skeleton lines={4} />}
            {s4.error && <ErrorRetry message={s4.error} onRetry={s4.load} />}
            {s4.data && Array.isArray(s4.data) && s4.data.length > 0 && (
              <Stage4Quiz questions={s4.data as Stage4Question[]} domain={domain} />
            )}
            {!s4.loading && !s4.error && (!s4.data || (s4.data as Stage4Question[]).length === 0) && (
              <div className="text-mist text-sm p-4 bg-white/5 rounded-xl flex items-center justify-between">
                <span>Quiz not yet generated</span>
                <button onClick={s4.load} className="text-gold text-sm font-semibold hover:underline">Generate →</button>
              </div>
            )}
          </section>
        )}
      </div>
    </LearnLayout>
  )
}
