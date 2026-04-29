import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useLearnStore } from '../../store/learnStore'
import { useContentGen } from '../../hooks/useContentGen'
import { DOMAIN_COLORS, DOMAINS } from '../../store/examStore'
import TopicCard from './TopicCard'
import FlashcardDeck from './FlashcardDeck'
import QuickQuiz from './QuickQuiz'
import KeyFrameworks from './KeyFrameworks'
import ProgressTracker from './ProgressTracker'

const TABS = ['Overview', 'Topics', 'Flashcards', 'Quick Quiz', 'Frameworks']

export default function DomainPage() {
  const { domain: encodedDomain } = useParams<{ domain: string }>()
  const domain = decodeURIComponent(encodedDomain ?? '')
  const navigate = useNavigate()
  const { activeTab, setActiveTab, progress, markTopicRead, markFlashcardKnown, setQuizScore } = useLearnStore()
  const tab = activeTab[domain] ?? 0
  const { overview, topics, flashcards, quiz, loading, error, loadOverview, loadTopics, loadFlashcards, loadQuiz } = useContentGen(domain)
  const color = DOMAIN_COLORS[domain] ?? '#C9A84C'
  const domainProgress = progress[domain]

  useEffect(() => {
    if (!DOMAINS.includes(domain)) navigate('/learn')
  }, [domain, navigate])

  useEffect(() => {
    if (tab === 0 && !overview) loadOverview()
    if (tab === 1 && !topics) loadTopics()
    if (tab === 2 && !flashcards) loadFlashcards()
    if (tab === 3 && !quiz) loadQuiz()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  function retry() {
    if (tab === 0) loadOverview()
    if (tab === 1) loadTopics()
    if (tab === 2) loadFlashcards()
    if (tab === 3) loadQuiz()
  }

  const currentError = [error.overview, error.topics, error.flashcards, error.quiz][tab]
  const isLoading = [loading.overview, loading.topics, loading.flashcards, loading.quiz][tab]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link to="/learn" className="text-mist hover:text-gold transition-colors">← Back</Link>
        <span className="text-white/20">/</span>
        <span className="text-mist">{domain}</span>
      </div>

      {/* Domain header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-cream font-serif text-2xl mb-1" style={{ color }}>{domain}</h1>
          <ProgressTracker domain={domain} />
        </div>
        <button
          onClick={() => navigate(`/exam?domain=${encodeURIComponent(domain)}`)}
          className="text-sm px-4 py-2 rounded-lg border text-gold border-gold/50 hover:bg-gold/10 transition-colors flex-shrink-0"
        >
          Domain Drill
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(domain, i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
              tab === i
                ? 'border-current text-gold border-gold'
                : 'border-transparent text-mist hover:text-cream'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Error state */}
      {currentError && (
        <div className="text-center py-8">
          <p className="text-fail mb-4">{currentError}</p>
          <button onClick={retry} className="bg-gold text-navy font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !currentError && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-ink rounded-xl" />
          ))}
        </div>
      )}

      {/* Tab content */}
      {!isLoading && !currentError && (
        <>
          {tab === 0 && overview && (
            <div className="prose prose-invert max-w-none">
              {overview.split('\n\n').map((para, i) => (
                <p key={i} className="text-mist leading-relaxed mb-4">{para}</p>
              ))}
            </div>
          )}

          {tab === 1 && topics && (
            <div className="space-y-3">
              {topics.map(topic => (
                <TopicCard
                  key={topic.topic}
                  topic={topic}
                  isRead={domainProgress?.topicsRead.includes(topic.topic) ?? false}
                  onRead={() => markTopicRead(domain, topic.topic)}
                />
              ))}
            </div>
          )}

          {tab === 2 && flashcards && (
            <FlashcardDeck
              flashcards={flashcards}
              knownIndices={domainProgress?.flashcardsKnown ?? []}
              onMarkKnown={i => markFlashcardKnown(domain, i)}
            />
          )}

          {tab === 3 && quiz && (
            <QuickQuiz
              questions={quiz}
              onComplete={score => setQuizScore(domain, score)}
            />
          )}

          {tab === 4 && (
            <KeyFrameworks domain={domain} />
          )}
        </>
      )}
    </div>
  )
}
