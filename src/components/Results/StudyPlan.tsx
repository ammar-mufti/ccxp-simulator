import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { callLLM } from '../../services/llm'
import type { Question } from '../../store/examStore'
import { useLearnStore } from '../../store/learnStore'
import { useAuthStore } from '../../store/authStore'

interface Tip { domain: string; tips: string[] }

interface Props {
  questions: Question[]
  answers: Record<string, string>
}

export default function StudyPlan({ questions, answers }: Props) {
  const [plan, setPlan] = useState<Tip[] | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setActiveDomain } = useLearnStore()
  const token = useAuthStore(s => s.token) ?? ''

  const weakDomains = (() => {
    const domains = [...new Set(questions.map(q => q.domain))]
    return domains
      .map(d => {
        const qs = questions.filter(q => q.domain === d)
        const correct = qs.filter(q => answers[q.id] === q.correct).length
        return { domain: d, pct: correct / qs.length }
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map(d => d.domain)
  })()

  useEffect(() => {
    if (weakDomains.length === 0) return
    setLoading(true)
    callLLM({
      type: 'study-plan',
      domain: weakDomains.join(','),
    }, token).then(raw => {
      let result: Tip[] = []
      try {
        const data = Array.isArray(raw) ? raw
          : typeof raw === 'string'
          ? JSON.parse((raw.match(/\[[\s\S]*\]/) ?? ['[]'])[0])
          : (raw as { content?: unknown })?.content ?? []
        result = Array.isArray(data) ? data as Tip[] : []
      } catch { /* use fallback */ }

      setPlan(result.length > 0 ? result : weakDomains.map(d => ({
        domain: d,
        tips: [
          `Review core concepts and frameworks in ${d}`,
          'Practice scenario-based questions for this domain',
          'Study the CXPA body of knowledge for this area',
        ],
      })))
      setLoading(false)
    }).catch(() => {
      setPlan(weakDomains.map(d => ({
        domain: d,
        tips: [
          `Review core concepts and frameworks in ${d}`,
          'Practice scenario-based questions for this domain',
          'Study the CXPA body of knowledge for this area',
        ],
      })))
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function goStudy(domain: string) {
    setActiveDomain(domain)
    navigate('/learn/' + encodeURIComponent(domain))
  }

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="text-mist animate-pulse text-sm">Generating personalized study plan…</div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div>
      <h3 className="text-cream font-semibold mb-4">Personalized Study Plan</h3>
      <div className="space-y-4">
        {plan.map(({ domain, tips }) => (
          <div key={domain} className="bg-ink rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-cream font-medium">{domain}</h4>
              <button onClick={() => goStudy(domain)} className="text-gold text-xs hover:underline">
                Study this domain →
              </button>
            </div>
            <ul className="space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-mist text-sm flex gap-2">
                  <span className="text-gold">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
