import { useCallback } from 'react'
import { callLLM } from '../services/llm'
import type { Question, ExamMode } from '../store/examStore'
import { DOMAIN_WEIGHTS, useExamStore } from '../store/examStore'
import { useAuthStore } from '../store/authStore'
import { DOMAIN_TOPICS, toTopicSlug } from '../utils/domainUtils'
import { questionBank } from '../services/questionBank'

const CHUNK_SIZE = 5
const CHUNK_RETRIES = 3
const RETRY_DELAY_MS = 2000

// Domain-specific content to force unique, knowledge-requiring questions
const getDomainContext = (domain: string): string => {
  const contexts: Record<string, string> = {
    'CX Strategy': `
      Topics: CX vision statements, business case ROI, Forrester CX Index,
      Temkin Group maturity model (5 stages: Ignore/Explore/Mobilize/Operationalize/Align),
      CX governance structures, executive sponsorship models, CX roadmap prioritization,
      outside-in vs inside-out thinking, CX as competitive differentiator,
      aligning CX to brand promise, CX investment justification,
      linking CX metrics to revenue growth and churn reduction
    `,
    'Customer-Centric Culture': `
      Topics: Kotter 8-step change model, culture vs climate distinction,
      employee experience (EX) link to CX, CX champion networks,
      frontline empowerment, hiring for customer-centricity,
      recognition and reward systems for CX behaviors,
      leadership role modeling, overcoming CX cynicism,
      middle management as culture barrier, onboarding for CX mindset,
      measuring cultural change, psychological safety in CX teams
    `,
    'Voice of Customer': `
      Topics: VoC program architecture, solicited vs unsolicited feedback,
      relationship vs transactional surveys, survey design best practices,
      sample size and statistical significance, text analytics and NLP,
      social listening tools, complaint management systems,
      customer advisory boards, ethnographic research, diary studies,
      co-creation sessions, insight prioritization frameworks,
      closed-loop feedback process (inner loop vs outer loop),
      linkage analysis connecting VoC to operational data
    `,
    'Experience Design': `
      Topics: Journey mapping methodology (current state vs future state),
      service blueprinting, swimlane diagrams, moments of truth (Carlzon),
      peak-end rule (Kahneman), JTBD (Jobs to Be Done) theory,
      design thinking phases (Empathize/Define/Ideate/Prototype/Test),
      Kano model (basic/performance/delight), co-creation workshops,
      prototyping fidelity levels, usability testing, accessibility in CX,
      omnichannel experience design, touchpoint optimization,
      emotional journey mapping, pain point prioritization matrix
    `,
    'Metrics & Measurement': `
      Topics: Net Promoter Score calculation and limitations,
      Customer Satisfaction Score (CSAT) timing and scale,
      Customer Effort Score (CES) and the Effortless Experience,
      First Contact Resolution (FCR), Customer Lifetime Value (CLV),
      churn rate and retention metrics, wallet share,
      economic linkage modeling, return on CX investment,
      leading vs lagging indicators, balanced scorecard for CX,
      dashboard design principles, benchmarking vs internal trending,
      statistical correlation vs causation in CX data,
      predictive analytics for churn, driver analysis
    `,
    'Organizational Adoption': `
      Topics: RACI matrix for CX roles, CX governance council structure,
      Prosci ADKAR change model, resistance to change management,
      CX P&L ownership debate, cross-functional CX working groups,
      CX budget allocation models, reporting lines for CX teams,
      CX capability building and training programs,
      measuring CX organizational maturity, embedding CX in performance reviews,
      CX technology adoption (CRM, journey analytics platforms),
      breaking down silos between marketing/ops/IT/CX,
      sustaining CX momentum after initial launch
    `,
  }
  return contexts[domain] ?? 'General CX professional knowledge and best practices'
}

const buildPrompt = (domain: string, count: number, seenQuestionStems: string[]): string => `
You are a strict CCXP exam question writer for the CXPA certification.

Generate exactly ${count} multiple-choice questions for domain: "${domain}".

STRICT RULES — violations will fail the exam:
- Every question must be DIFFERENT in structure — no two questions can start with the same phrase
- NEVER use generic stems like "Which best describes a core principle of..." or "Which of the following best describes..."
- NEVER reuse the same answer choices across questions
- Every answer option must be domain-specific and plausible — no obviously wrong answers like "Ignoring employee feedback" or "Focusing solely on cost reduction"
- All 4 options must look like they could be correct to someone who hasn't studied — this is what makes CCXP hard
- Mix these question types (use each at least once across the ${count} questions):
    TYPE 1 SCENARIO: "A CX leader at a retail bank notices... What should they do first?"
    TYPE 2 FRAMEWORK: "According to the CX Maturity Model, which stage is characterized by..."
    TYPE 3 BEST PRACTICE: "When designing a VoC program, the MOST important first step is..."
    TYPE 4 PRIORITY: "A company has limited budget. Which initiative will have the GREATEST impact on CX?"
    TYPE 5 DEFINITION: "Customer Effort Score (CES) differs from NPS primarily because..."
- Correct answers must require genuine CX knowledge — not common sense
- Wrong answers must be plausible CX concepts that are simply not the BEST answer
${seenQuestionStems.length > 0 ? `- Do NOT generate questions similar to these already seen: ${seenQuestionStems.slice(0, 10).join(' | ')}` : ''}

Domain-specific content to draw from for "${domain}":
${getDomainContext(domain)}

Respond ONLY with a raw JSON array. No markdown, no preamble, no explanation.
Format: [{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"max 25 words","sourceTopic":"topic name"}]
`

// Only reject batches with clearly duplicated question openings (first 8 words).
// Answer option dedup removed — LLMs legitimately reuse short phrases like "Conduct a survey"
// across unrelated questions, and rejecting on that was silently discarding good batches.
function validateBatch(batch: Question[]): boolean {
  const openings = batch.map(q => q.q.trim().toLowerCase().split(' ').slice(0, 8).join(' '))
  const seen = new Map<string, number>()
  for (const o of openings) {
    const count = (seen.get(o) ?? 0) + 1
    seen.set(o, count)
    if (count > 1) return false
  }
  return true
}

function parseQuestions(raw: unknown, domain: string): Question[] {
  try {
    let arr: unknown[] = []
    if (Array.isArray(raw)) {
      arr = raw
    } else if (typeof raw === 'string') {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) arr = JSON.parse(match[0])
    } else if (raw && typeof raw === 'object' && 'content' in raw) {
      return parseQuestions((raw as { content: unknown }).content, domain)
    }
    if (arr.length > 0) {
      const topicsForDomain = DOMAIN_TOPICS[domain] ?? []
      return arr.map(q => {
        const question = { ...(q as object), id: crypto.randomUUID(), domain } as Question
        if (!question.sourceTopic && topicsForDomain.length > 0) {
          question.sourceTopic = topicsForDomain[0]
          question.sourceTopicSlug = toTopicSlug(topicsForDomain[0])
        }
        return question
      })
    }
  } catch {
    // fall through
  }
  return []
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Diverse fallbacks per domain — used only as last resort
const FALLBACKS: Record<string, Question[]> = {
  'CX Strategy': [
    { id: '', domain: 'CX Strategy', q: 'A company in the "Mobilize" stage of the Temkin CX Maturity Model should prioritize:', a: 'Launching an NPS survey program', b: 'Building executive-level CX governance and cross-functional ownership', c: 'Redesigning the customer-facing website', d: 'Hiring a Chief Customer Officer', correct: 'b', explanation: 'Mobilize stage requires establishing governance structures and organizational commitment to CX.' },
    { id: '', domain: 'CX Strategy', q: 'When building the business case for CX investment, which metric most directly links CX to financial outcomes?', a: 'Number of customer complaints resolved', b: 'Employee Net Promoter Score', c: 'Revenue retention rate correlated with relationship NPS scores', d: 'Social media sentiment index', correct: 'c', explanation: 'Linking NPS to revenue retention provides the financial proof point executives require.' },
  ],
  'Customer-Centric Culture': [
    { id: '', domain: 'Customer-Centric Culture', q: "According to Kotter's 8-step model, what is the most critical failure point when leading culture change toward customer-centricity?", a: 'Not communicating the vision frequently enough', b: 'Declaring victory too early before change is embedded', c: 'Having too large a guiding coalition', d: 'Setting unrealistic short-term milestones', correct: 'b', explanation: "Kotter identifies premature victory declarations as the top reason change doesn't stick." },
  ],
  'Voice of Customer': [
    { id: '', domain: 'Voice of Customer', q: 'The "inner loop" in closed-loop feedback management refers to:', a: 'Aggregating survey results for executive dashboards', b: 'Contacting individual customers to resolve specific issues they reported', c: 'Analyzing text responses using NLP tools', d: 'Sharing VoC insights with product development teams', correct: 'b', explanation: 'Inner loop closes feedback at the individual customer level; outer loop drives systemic change.' },
  ],
  'Experience Design': [
    { id: '', domain: 'Experience Design', q: "Kahneman's peak-end rule is most directly applied in CX design to:", a: 'Reduce the total number of touchpoints in a journey', b: 'Ensure the highest-effort interactions are eliminated', c: 'Engineer memorable positive moments at peak intensity and at journey end', d: 'Map every touchpoint to a satisfaction score', correct: 'c', explanation: 'Customers judge experiences by their peak emotional moments and final impression.' },
  ],
  'Metrics & Measurement': [
    { id: '', domain: 'Metrics & Measurement', q: 'A CX analyst finds high NPS but increasing churn. The most likely explanation is:', a: 'The NPS survey sample is too small', b: 'Promoters are churning due to unresolved operational issues not captured in NPS', c: 'CSAT should replace NPS as the primary metric', d: 'The churn data contains measurement errors', correct: 'b', explanation: 'NPS captures sentiment but may miss operational drivers of churn in specific segments.' },
  ],
  'Organizational Adoption': [
    { id: '', domain: 'Organizational Adoption', q: 'In the Prosci ADKAR model, an employee who understands the need for CX change but lacks the skills to execute it is stuck at which stage?', a: 'Awareness', b: 'Desire', c: 'Knowledge', d: 'Ability', correct: 'd', explanation: 'ADKAR Ability stage is where understanding exists but capability to act is missing.' },
  ],
}

function getFallback(domain: string, seen: Set<string>): Question | null {
  const pool = FALLBACKS[domain] ?? []
  for (const q of pool) {
    const key = q.q.trim().toLowerCase().substring(0, 60)
    if (!seen.has(key)) {
      seen.add(key)
      return { ...q, id: crypto.randomUUID() }
    }
  }
  return null
}

export interface GenProgress {
  percent: number
  collected: number
  total: number
  currentDomain: string
  message: string
}

export function useQuestionGen() {
  const token = useAuthStore(s => s.token) ?? ''
  const setCurrentSetId = useExamStore(s => s.setCurrentSetId)

  const generateForMode = useCallback(async (
    mode: ExamMode,
    domain: string | null,
    onProgress: (p: GenProgress) => void
  ): Promise<Question[]> => {
    const weights = DOMAIN_WEIGHTS[mode]
    const domains = domain ? [domain] : Object.keys(weights)

    const totalNeeded = domains.reduce((sum, d) => {
      return sum + (domain ? (weights[d] ?? 10) : (weights[d] ?? 0))
    }, 0)

    console.log('[QuestionGen] mode:', mode, '| domain filter:', domain)
    console.log('[QuestionGen] weights:', weights)
    console.log('[QuestionGen] domains:', domains)
    console.log('[QuestionGen] totalNeeded:', totalNeeded)

    let questionsCollected = 0

    const report = (currentDomain: string) => {
      onProgress({
        percent: Math.min(Math.round((questionsCollected / totalNeeded) * 100), 99),
        collected: questionsCollected,
        total: totalNeeded,
        currentDomain,
        message: currentDomain
          ? `Generating ${currentDomain} questions (${questionsCollected}/${totalNeeded} ready)…`
          : 'Preparing questions…',
      })
    }

    // Use first 60 chars as dedup key — avoids over-deduplication from minor LLM phrasing variation
    const seenQuestions = new Set<string>()
    const allQuestions: Question[] = []

    report('')

    for (const d of domains) {
      const targetCount = domain ? (weights[d] ?? 10) : (weights[d] ?? 0)
      const domainQuestions: Question[] = []
      let outerAttempts = 0
      const maxOuterAttempts = Math.ceil(targetCount / CHUNK_SIZE) + 4

      console.log(`[QuestionGen] ${d}: targeting ${targetCount} questions`)

      while (domainQuestions.length < targetCount && outerAttempts < maxOuterAttempts) {
        const needed = targetCount - domainQuestions.length
        const chunkSize = Math.min(needed, CHUNK_SIZE)

        // Build seen stems for prompt context (short, not full text)
        const seenStems = [...seenQuestions].map(k => k.substring(0, 40)).slice(0, 10)
        const prompt = buildPrompt(d, chunkSize, seenStems)

        // Retry each chunk up to CHUNK_RETRIES times before skipping
        let chunkSuccess = false
        for (let attempt = 0; attempt < CHUNK_RETRIES; attempt++) {
          try {
            const raw = await callLLM(
              { type: 'generate-questions', domain: d, count: chunkSize, extra: prompt },
              token
            )
            const batch = parseQuestions(raw, d)

            console.log(`[QuestionGen] ${d} chunk attempt ${attempt + 1}: got ${batch.length} raw questions`)

            if (batch.length === 0) {
              console.warn(`[QuestionGen] ${d} chunk attempt ${attempt + 1}: empty batch`)
              if (attempt < CHUNK_RETRIES - 1) await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
              continue
            }

            // Validate — only checks for duplicate question openings now
            if (batch.length >= 2 && !validateBatch(batch)) {
              console.warn(`[QuestionGen] ${d} chunk attempt ${attempt + 1}: validation failed (duplicate openings) — retrying`)
              if (attempt < CHUNK_RETRIES - 1) await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
              continue
            }

            // Deduplicate using first 60 chars of question text
            const uniqueBatch = batch.filter(q => {
              const key = q.q.trim().toLowerCase().substring(0, 60)
              if (seenQuestions.has(key)) return false
              seenQuestions.add(key)
              return true
            })

            console.log(`[QuestionGen] ${d} chunk attempt ${attempt + 1}: ${uniqueBatch.length} unique after dedup`)

            domainQuestions.push(...uniqueBatch)
            questionsCollected += uniqueBatch.length
            chunkSuccess = true
            break
          } catch (err) {
            console.warn(`[QuestionGen] ${d} chunk attempt ${attempt + 1} threw:`, err)
            if (attempt < CHUNK_RETRIES - 1) {
              await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
            }
          }
        }

        if (!chunkSuccess) {
          console.error(`[QuestionGen] ${d}: chunk skipped after ${CHUNK_RETRIES} attempts`)
          const fallback = getFallback(d, seenQuestions)
          if (fallback) {
            domainQuestions.push(fallback)
            questionsCollected += 1
          }
        }

        outerAttempts++
        report(d)
      }

      // Pad with curated fallbacks if still short
      while (domainQuestions.length < targetCount) {
        const fallback = getFallback(d, seenQuestions)
        if (fallback) {
          domainQuestions.push(fallback)
          questionsCollected += 1
        } else {
          break
        }
      }

      console.log(`[QuestionGen] ${d}: collected ${domainQuestions.length} of ${targetCount}`)
      allQuestions.push(...domainQuestions.slice(0, targetCount))
    }

    console.log('[QuestionGen] Total before final dedup:', allQuestions.length)

    // Final dedup safety net (same 60-char key)
    const finalSeen = new Set<string>()
    const dedupedQuestions = allQuestions.filter(q => {
      const key = q.q.trim().toLowerCase().substring(0, 60)
      if (finalSeen.has(key)) return false
      finalSeen.add(key)
      return true
    })

    console.log('[QuestionGen] After final dedup:', dedupedQuestions.length)

    // Guard: refuse to start exam if we got less than 80% of what we needed
    const minimumRequired = Math.max(Math.floor(totalNeeded * 0.8), 1)
    if (dedupedQuestions.length < minimumRequired) {
      throw new Error(
        `Only generated ${dedupedQuestions.length} of ${totalNeeded} questions ` +
        `(minimum required: ${minimumRequired}). Please check your connection and try again.`
      )
    }

    const shuffled = fisherYates(dedupedQuestions)

    // Save to question bank for future retakes
    const savedSet = questionBank.save(shuffled, mode, domains)
    console.log('[QuestionGen] Saved to question bank:', savedSet.id)
    setCurrentSetId(savedSet.id)

    onProgress({
      percent: 100,
      collected: shuffled.length,
      total: totalNeeded,
      currentDomain: '',
      message: 'Questions ready — starting exam…',
    })

    return shuffled
  }, [token])

  return { generateForMode }
}
