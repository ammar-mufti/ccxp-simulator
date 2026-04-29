import type { Stage3DeepDive } from '../../types/content'

interface Props {
  data: Stage3DeepDive
  topic: string
}

export default function Stage3DeepDive({ data, topic }: Props) {
  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-5 space-y-5">
      <div className="text-xs font-bold uppercase tracking-widest text-gold mb-1">
        🔍 Deep Dive: {topic}
      </div>

      {/* Overview */}
      <p className="text-cream text-sm leading-relaxed">{data.overview}</p>

      {/* How it works */}
      <div>
        <div className="text-xs font-semibold text-mist uppercase tracking-wider mb-2">How It Works</div>
        <ol className="space-y-1.5">
          {data.howItWorks.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-mist leading-relaxed">
              <span className="text-gold font-bold flex-shrink-0 w-5">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Real world example */}
      <div className="bg-navy/60 rounded-xl p-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-mist mb-1">🏢 Real World Example</div>
        <div>
          <span className="text-xs text-gold font-semibold">Scenario: </span>
          <span className="text-sm text-mist">{data.realWorldExample.scenario}</span>
        </div>
        <div>
          <span className="text-xs text-gold font-semibold">Application: </span>
          <span className="text-sm text-mist">{data.realWorldExample.application}</span>
        </div>
        <div>
          <span className="text-xs text-gold font-semibold">Outcome: </span>
          <span className="text-sm text-mist">{data.realWorldExample.outcome}</span>
        </div>
      </div>

      {/* Exam scenario */}
      <div className="bg-navy/60 rounded-xl p-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-mist mb-1">📝 Exam Scenario</div>
        <p className="text-sm text-cream font-medium">{data.examScenario.question}</p>
        <div className="flex gap-2 text-sm">
          <span className="text-fail flex-shrink-0">❌</span>
          <div><span className="text-fail font-semibold">Wrong: </span><span className="text-mist">{data.examScenario.wrongAnswer}</span></div>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-pass flex-shrink-0">✅</span>
          <div><span className="text-pass font-semibold">Correct: </span><span className="text-mist">{data.examScenario.correctAnswer}</span></div>
        </div>
      </div>

      {/* Frameworks */}
      {data.frameworks && data.frameworks.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-mist uppercase tracking-wider mb-2">🔧 Frameworks</div>
          <div className="flex flex-wrap gap-2">
            {data.frameworks.map((fw, i) => (
              <div key={i} className="bg-navy border border-white/10 rounded-lg px-3 py-2 text-xs">
                <div className="text-gold font-semibold mb-0.5">{fw.name}</div>
                <div className="text-mist">{fw.description}</div>
                {fw.stages.length > 0 && (
                  <div className="text-mist/60 mt-1">{fw.stages.join(' → ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory aid */}
      {data.memoryAid && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3">
          <span className="text-gold text-xs font-bold">💡 Memory Aid: </span>
          <span className="text-cream text-sm">{data.memoryAid}</span>
        </div>
      )}
    </div>
  )
}
