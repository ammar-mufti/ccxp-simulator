import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fromDomainSlug, DOMAIN_TOPICS } from '../../utils/domainUtils'
import { useStageContent } from '../../hooks/useStageContent'
import { useLearnStore } from '../../store/learnStore'
import { DOMAIN_COLORS } from '../../store/examStore'
import { contentCache } from '../../services/contentCache'
import type { Stage1Summary, Stage2Topic, Stage4Question } from '../../types/content'
import Stage1SummaryComponent from './Stage1Summary'
import Stage2Concepts from './Stage2Concepts'
import Stage4Quiz from './Stage4Quiz'

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

  // Read exam-navigation target from sessionStorage once on mount
  useEffect(() => {
    const raw = sessionStorage.getItem('ccxp_navigate_to_topic')
    if (raw) {
      try {
        const { sourceTopic } = JSON.parse(raw) as { sourceTopic: string }
        sessionStorage.removeItem('ccxp_navigate_to_topic')
        setAutoExpandTopic(sourceTopic)
        setJumpedBannerTopic(sourceTopic)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (domain && !DOMAIN_TOPICS[domain]) navigate('/learn', { replace: true })
  }, [domain, navigate])

  const color = DOMAIN_COLORS[domain] ?? '#C9A84C'
  const topics = DOMAIN_TOPICS[domain] ?? []
  const generatedDate = contentCache.getGeneratedDate(domain)

  // Each stage has its own hook — caller drives loading via useEffect chains
  const s1 = useStageContent<Stage1Summary>(domain, 'stage1-summary')
  const s2 = useStageContent<Stage2Topic[]>(domain, 'stage2-concepts', { topics })
  const s4 = useStageContent<Stage4Question[]>(domain, 'stage4-quiz')

  // Stage 1 — load immediately on mount / domain change
  useEffect(() => {
    if (domain && DOMAIN_TOPICS[domain]) s1.load()
  }, [domain]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stage 2 — load once stage1 data arrives
  useEffect(() => {
    if (s1.data && !s2.data && !s2.loading) s2.load()
  }, [s1.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stage 4 / Flashcards — load in background once stage2 data arrives
  useEffect(() => {
    if (s2.data && !s4.data && !s4.loading) s4.load()
  }, [s2.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to auto-expand topic after stage2 loads
  useEffect(() => {
    if (autoExpandTopic && s2.data && topicRefs.current[autoExpandTopic]) {
      setTimeout(() => {
        topicRefs.current[autoExpandTopic]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [autoExpandTopic, s2.data])

  if (!domain || !DOMAIN_TOPICS[domain]) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/learn" className="text-mist hover:text-gold transition-colors">← Back</Link>
        <span className="text-white/20">/</span>
        <span className="text-mist">{domain}</span>
      </div>

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

      {/* ── STAGE 1 ── */}
      {s1.loading && <Skeleton lines={5} />}
      {s1.error && <ErrorRetry message={s1.error} onRetry={s1.load} />}
      {s1.data && <Stage1SummaryComponent data={s1.data} />}

      {/* ── STAGE 2: Key Concepts ── */}
      {(s1.data || s1.loading) && (
        <div>
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
        </div>
      )}

      {/* ── STAGE 4: Quiz ── */}
      {s2.data && (
        <div>
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
        </div>
      )}
    </div>
  )
}
