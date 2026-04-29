import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore, DOMAINS } from '../../store/examStore'
import { questionBank } from '../../services/questionBank'
import type { SavedQuestionSet } from '../../services/questionBank'

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const DOMAIN_COLORS: Record<string, string> = {
  'CX Strategy': '#4A9EDB',
  'Customer-Centric Culture': '#E8904A',
  'Voice of Customer': '#7BC67A',
  'Experience Design': '#C97AC9',
  'Metrics & Measurement': '#E8C94A',
  'Organizational Adoption': '#7AC9C9',
}

// ── Retake Panel ─────────────────────────────────────────────────────────────

function RetakePanel() {
  const { setMode, setQuestions, setCurrentSetId, setLoading } = useExamStore()
  const navigate = useNavigate()
  const [sets, setSets] = useState<SavedQuestionSet[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const all = questionBank.getAll()
    setSets(all)

    // Check if we came from History page with a pre-selected set
    const retakeId = sessionStorage.getItem('ccxp_retake_set_id')
    if (retakeId) {
      sessionStorage.removeItem('ccxp_retake_set_id')
      setSelectedId(retakeId)
    } else if (all.length > 0) {
      setSelectedId(all[0].id)
    }
  }, [])

  if (sets.length === 0) return null

  const selected = sets.find(s => s.id === selectedId) ?? sets[0]

  function startRetake() {
    if (!selected) return
    const shuffled = fisherYates(selected.questions)
    questionBank.markUsed(selected.id)
    const domainArg = selected.mode === 'domain' ? (selected.domains[0] ?? undefined) : undefined
    setMode(selected.mode, domainArg)
    setCurrentSetId(selected.id)
    setQuestions(shuffled)
    setLoading(false)
    navigate('/exam/question')
  }

  return (
    <div className="bg-ink border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <div>
          <div className="text-cream font-bold text-sm">Retake Saved Questions</div>
          <div className="text-mist text-xs">No API calls — starts instantly</div>
        </div>
      </div>

      {/* Set selector */}
      <div className="space-y-1.5">
        {sets.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
              selectedId === s.id
                ? 'border-gold/60 bg-gold/10 text-cream'
                : 'border-white/10 text-mist hover:border-white/30 hover:text-cream'
            }`}
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{s.label}</div>
              <div className="text-[10px] text-mist/60 mt-0.5">
                {s.totalCount}Q · Used {s.timesUsed}×{s.lastUsed ? ` · Last: ${formatDate(s.lastUsed)}` : ''}
              </div>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
              selectedId === s.id ? 'border-gold bg-gold' : 'border-white/30'
            }`} />
          </button>
        ))}
      </div>

      {selected && (
        <button
          onClick={startRetake}
          className="w-full py-2.5 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-amber-400 transition-colors"
        >
          Start Retake · {selected.totalCount}Q →
        </button>
      )}
    </div>
  )
}

// ── Generate Panel ────────────────────────────────────────────────────────────

function GeneratePanel() {
  const { setMode } = useExamStore()
  const navigate = useNavigate()
  const [genMode, setGenMode] = useState<'full' | 'mini'>('full')

  function startGenerate() {
    setMode(genMode)
    navigate('/exam/loading')
  }

  function startDomainDrill(domain: string) {
    setMode('domain', domain)
    navigate('/exam/loading')
  }

  return (
    <div className="bg-ink border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <div>
          <div className="text-cream font-bold text-sm">Generate New Questions</div>
          <div className="text-mist text-xs">Fresh AI-generated set · saved automatically</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['full', 'mini'] as const).map(m => (
          <button
            key={m}
            onClick={() => setGenMode(m)}
            className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
              genMode === m
                ? 'border-gold bg-gold/20 text-gold'
                : 'border-white/10 text-mist hover:border-white/30 hover:text-cream'
            }`}
          >
            {m === 'full' ? 'Full Exam · 100Q' : 'Mini Drill · 20Q'}
          </button>
        ))}
      </div>

      <button
        onClick={startGenerate}
        className="w-full py-2.5 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-amber-400 transition-colors"
      >
        Generate & Start {genMode === 'full' ? '100' : '20'} Questions →
      </button>

      {/* Domain drills */}
      <div className="pt-1 border-t border-white/10">
        <div className="text-xs text-mist mb-2 font-semibold">Domain Drill · 10Q each</div>
        <div className="grid grid-cols-2 gap-2">
          {DOMAINS.map(domain => (
            <button
              key={domain}
              onClick={() => startDomainDrill(domain)}
              className="bg-navy/60 border border-white/10 hover:border-white/30 rounded-lg p-2.5 text-left transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DOMAIN_COLORS[domain] }} />
              <span className="text-cream text-xs font-medium leading-tight">{domain}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ConfigScreen() {
  const hasSaved = questionBank.hasAny()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-6">
        <h1 className="text-cream font-serif text-2xl mb-1">CCXP Practice</h1>
        <p className="text-mist text-sm">
          {hasSaved ? 'Retake saved questions or generate a fresh set.' : 'Generate AI-powered practice questions.'}
        </p>
      </div>

      {hasSaved && <RetakePanel />}

      {hasSaved && (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-mist/40 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      )}

      <GeneratePanel />
    </div>
  )
}
