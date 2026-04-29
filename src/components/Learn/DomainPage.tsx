import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fromDomainSlug, DOMAIN_TOPICS } from '../../utils/domainUtils'
import { useStageContent } from '../../hooks/useStageContent'
import { useLearnStore } from '../../store/learnStore'
import { DOMAIN_COLORS } from '../../store/examStore'
import { contentCache } from '../../services/contentCache'
import type { Stage1Summary, Stage2Topic, Stage4Question } from '../../types/content'
import type { Flashcard } from '../../store/learnStore'
import Stage1SummaryComponent from './Stage1Summary'
import Stage2Concepts from './Stage2Concepts'
import Stage4Quiz from './Stage4Quiz'
import FlashcardDeck from './FlashcardDeck'

function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-white/10 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-fail text-sm mb-3">{message}</p>
      <button onClick={onRetry} className="bg-gold text-navy font-bold px-6 py-2 rounded-xl hover:bg-amber-400 transition-colors text-sm">
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
  const { progress, markFlashcardKnown } = useLearnStore()

  const [autoExpandTopic, setAutoExpandTopic] = useState<string | null>(null)
  const [jumpedBannerTopic, setJumpedBannerTopic] = useState<string | null>(null)
  const [showRegenPanel, setShowRegenPanel] = useState(false)

  // Check for exam-navigation target
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

  // Redirect if invalid domain
  useEffect(() => {
    if (domain && !DOMAIN_TOPICS[domain]) navigate('/learn', { replace: true })
  }, [domain, navigate])

  const color = DOMAIN_COLORS[domain] ?? '#C9A84C'
  const topics = DOMAIN_TOPICS[domain] ?? []
  const generatedDate = contentCache.getGeneratedDate(domain)
  const domainProgress = progress[domain]

  const {
    data: stage1, loading: s1Loading, error: s1Error, retry: s1Retry,
  } = useStageContent<Stage1Summary>(domain, 'stage1-summary', { enabled: !!domain })

  const {
    data: stage2, loading: s2Loading, error: s2Error, retry: s2Retry,
  } = useStageContent<Stage2Topic[]>(domain, 'stage2-concepts', {
    enabled: !!stage1,
    topics,
  })

  const {
    data: flashcards, loading: flashLoading,
  } = useStageContent<Flashcard[]>(domain, 'stage4-quiz', { enabled: !!stage1 })

  const {
    data: quizQuestions, loading: quizLoading, error: quizError, retry: quizRetry,
  } = useStageContent<Stage4Question[]>(domain, 'stage4-quiz', { enabled: !!stage2 })

  // Scroll to auto-expand topic after stage2 loads
  useEffect(() => {
    if (autoExpandTopic && stage2 && topicRefs.current[autoExpandTopic]) {
      setTimeout(() => {
        topicRefs.current[autoExpandTopic]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [autoExpandTopic, stage2])

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
            title="Regenerate content"
          >
            ↺ Regenerate
          </button>
        </div>
      </div>

      {showRegenPanel && (
        <RegeneratePanel domain={domain} onCancel={() => setShowRegenPanel(false)} />
      )}

      {/* Jumped from exam banner */}
      {jumpedBannerTopic && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-gold flex-shrink-0">📍</span>
          <p className="text-cream text-sm">
            Jumped here from exam — <span className="font-semibold text-gold">"{jumpedBannerTopic}"</span> is expanded below
          </p>
          <button onClick={() => setJumpedBannerTopic(null)} className="text-mist/40 hover:text-mist ml-auto flex-shrink-0">✕</button>
        </div>
      )}

      {/* STAGE 1 */}
      {s1Loading && <Skeleton lines={8} />}
      {s1Error && <ErrorRetry message={s1Error} onRetry={s1Retry} />}
      {stage1 && <Stage1SummaryComponent data={stage1} />}

      {/* STAGE 2 */}
      {stage1 && (
        <div>
          <h2 className="text-cream font-semibold text-lg mb-3">Key Concepts</h2>
          {s2Loading && <Skeleton lines={6} />}
          {s2Error && <ErrorRetry message={s2Error} onRetry={s2Retry} />}
          {stage2 && (
            <Stage2Concepts
              domain={domain}
              topics={stage2}
              autoExpandTopic={autoExpandTopic}
              topicRefs={topicRefs}
            />
          )}
        </div>
      )}

      {/* FLASHCARDS */}
      {stage1 && (
        <div>
          <h2 className="text-cream font-semibold text-lg mb-3">Flashcards</h2>
          {flashLoading && <Skeleton lines={4} />}
          {flashcards && Array.isArray(flashcards) && flashcards.length > 0 && (
            <div className="bg-ink rounded-2xl border border-white/10 p-6">
              <FlashcardDeck
                flashcards={flashcards as Flashcard[]}
                knownIndices={domainProgress?.flashcardsKnown ?? []}
                onMarkKnown={i => markFlashcardKnown(domain, i)}
              />
            </div>
          )}
        </div>
      )}

      {/* STAGE 4 QUIZ */}
      {stage2 && (
        <div>
          <h2 className="text-cream font-semibold text-lg mb-3">Quick Quiz</h2>
          {quizLoading && <Skeleton lines={4} />}
          {quizError && <ErrorRetry message={quizError} onRetry={quizRetry} />}
          {quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0 && (
            <Stage4Quiz questions={quizQuestions as Stage4Question[]} domain={domain} />
          )}
        </div>
      )}
    </div>
  )
}
