interface Props { domain: string }

function MaturityModel() {
  const stages = ['Ad Hoc', 'Aware', 'Defined', 'Managed', 'Embedded']
  const colors = ['#8DA4B8', '#4A9EDB', '#E8C94A', '#E8904A', '#7BC67A']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">CX Maturity Model</h4>
      <div className="flex gap-1">
        {stages.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div className="h-8 rounded flex items-center justify-center text-xs font-bold text-navy" style={{ backgroundColor: colors[i] }}>
              {i + 1}
            </div>
            <div className="text-mist text-xs mt-1 leading-tight">{s}</div>
          </div>
        ))}
      </div>
      <div className="flex mt-1 gap-1">
        <div className="flex-1" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-mist text-center" style={{ flex: 1 }}>→</div>
        ))}
      </div>
    </div>
  )
}

function GovernanceModel() {
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">CX Governance Model</h4>
      <div className="relative flex items-center justify-center h-40">
        <svg viewBox="0 0 200 160" className="w-full max-w-xs">
          <circle cx="100" cy="80" r="70" fill="none" stroke="#4A9EDB" strokeWidth="2" opacity="0.3" />
          <circle cx="100" cy="80" r="48" fill="none" stroke="#E8C94A" strokeWidth="2" opacity="0.4" />
          <circle cx="100" cy="80" r="26" fill="#C9A84C" opacity="0.2" />
          <text x="100" y="84" textAnchor="middle" fill="#C9A84C" fontSize="10" fontWeight="bold">Executive</text>
          <text x="100" y="116" textAnchor="middle" fill="#E8C94A" fontSize="9">Operational</text>
          <text x="100" y="155" textAnchor="middle" fill="#4A9EDB" fontSize="9">Frontline</text>
        </svg>
      </div>
    </div>
  )
}

function VoCClosedLoop() {
  const steps = ['Collect', 'Analyze', 'Act', 'Communicate']
  const colors = ['#7BC67A', '#E8C94A', '#E8904A', '#4A9EDB']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">VoC Closed Loop</h4>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-20 h-12 rounded-lg flex items-center justify-center text-xs font-bold text-navy" style={{ backgroundColor: colors[i] }}>
              {s}
            </div>
            {i < steps.length - 1 && <span className="text-mist">→</span>}
          </div>
        ))}
        <div className="text-mist text-xs w-full text-center mt-1">↩ loop back to Collect</div>
      </div>
    </div>
  )
}

function ListeningPostTable() {
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">Listening Post Types</h4>
      <div className="grid grid-cols-2 gap-3">
        {[
          { type: 'Solicited', color: '#7BC67A', examples: 'Surveys, NPS, interviews, focus groups' },
          { type: 'Unsolicited', color: '#E8904A', examples: 'Social media, reviews, complaints, call logs' },
        ].map(({ type, color, examples }) => (
          <div key={type} className="bg-navy rounded-lg p-3 border-l-4" style={{ borderColor: color }}>
            <div className="font-bold text-sm mb-1" style={{ color }}>{type}</div>
            <div className="text-mist text-xs">{examples}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function JourneyMapAnatomy() {
  const lanes = ['Stages', 'Touchpoints', 'Actions', 'Emotions', 'Pain Points', 'Opportunities']
  const colors = ['#4A9EDB', '#7BC67A', '#E8C94A', '#C97AC9', '#E8904A', '#7AC9C9']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">Journey Map Anatomy</h4>
      <div className="space-y-1.5">
        {lanes.map((lane, i) => (
          <div key={lane} className="flex items-center gap-3">
            <div className="w-28 text-xs font-medium flex-shrink-0" style={{ color: colors[i] }}>{lane}</div>
            <div className="flex-1 h-5 rounded" style={{ backgroundColor: colors[i] + '33' }}>
              <div className="h-full rounded" style={{ width: '70%', backgroundColor: colors[i] + '55' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DesignThinking() {
  const stages = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test']
  const colors = ['#4A9EDB', '#7BC67A', '#E8C94A', '#E8904A', '#C97AC9']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">Design Thinking Process</h4>
      <div className="flex">
        {stages.map((s, i) => (
          <div key={s} className="flex-1 text-center relative">
            <div
              className="h-8 flex items-center justify-center text-xs font-bold text-navy relative z-10"
              style={{
                backgroundColor: colors[i],
                clipPath: i < stages.length - 1 ? 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' : undefined,
                marginRight: i < stages.length - 1 ? '-4px' : undefined,
              }}
            >
              {i + 1}
            </div>
            <div className="text-mist text-xs mt-1 leading-tight px-1">{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricsTable() {
  const metrics = [
    { name: 'NPS', question: 'Recommend?', scale: '0-10', focus: 'Loyalty' },
    { name: 'CSAT', question: 'Satisfied?', scale: '1-5', focus: 'Satisfaction' },
    { name: 'CES', question: 'Easy?', scale: '1-7', focus: 'Effort' },
  ]
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">NPS / CSAT / CES Comparison</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gold border-b border-white/10">
              <th className="text-left py-2 pr-4">Metric</th>
              <th className="text-left py-2 pr-4">Question</th>
              <th className="text-left py-2 pr-4">Scale</th>
              <th className="text-left py-2">Focus</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.name} className="border-b border-white/5 text-mist">
                <td className="py-2 pr-4 font-bold text-cream">{m.name}</td>
                <td className="py-2 pr-4">{m.question}</td>
                <td className="py-2 pr-4">{m.scale}</td>
                <td className="py-2">{m.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ROILinkage() {
  const steps = ['CX Improvement', 'Behavior Change', 'Financial Outcome']
  const colors = ['#4A9EDB', '#E8C94A', '#7BC67A']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">ROI Linkage Chain</h4>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex-1 rounded-lg p-2 text-center text-xs font-medium text-navy" style={{ backgroundColor: colors[i] }}>
              {s}
            </div>
            {i < steps.length - 1 && <span className="text-mist text-lg">→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function CultureLevers() {
  const items = [
    { label: 'Leadership', color: '#4A9EDB' },
    { label: 'Processes', color: '#E8C94A' },
    { label: 'People', color: '#7BC67A' },
    { label: 'Symbols & Stories', color: '#E8904A' },
  ]
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">Culture Change Levers</h4>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, color }) => (
          <div key={label} className="rounded-lg p-3 text-center text-sm font-medium text-navy" style={{ backgroundColor: color }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function EngagementPyramid() {
  const levels = [
    { label: 'Commitment', width: '40%', color: '#7BC67A' },
    { label: 'Understanding', width: '65%', color: '#E8C94A' },
    { label: 'Awareness', width: '100%', color: '#4A9EDB' },
  ]
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">Employee Engagement Pyramid</h4>
      <div className="flex flex-col items-center gap-1.5">
        {levels.map(({ label, width, color }) => (
          <div key={label} className="h-8 rounded flex items-center justify-center text-xs font-bold text-navy" style={{ width, backgroundColor: color }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function RACITable() {
  const roles = ['Responsible', 'Accountable', 'Consulted', 'Informed']
  const descriptions = ['Does the work', 'Owns the outcome', 'Provides input', 'Kept updated']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">RACI Template</h4>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((r, i) => (
          <div key={r} className="bg-navy rounded-lg p-3 border border-white/10">
            <div className="text-gold font-bold text-sm">{r[0]} — {r}</div>
            <div className="text-mist text-xs mt-1">{descriptions[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChangeCurve() {
  const points = ['Denial', 'Resistance', 'Exploration', 'Commitment']
  const colors = ['#A63228', '#E8904A', '#E8C94A', '#7BC67A']
  return (
    <div>
      <h4 className="text-cream font-semibold mb-3 text-sm">Change Curve</h4>
      <div className="relative h-24 flex items-end gap-1 px-2">
        {[20, 10, 40, 80].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${h}%`, backgroundColor: colors[i] }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {points.map((p, i) => (
          <div key={p} className="flex-1 text-center text-xs leading-tight" style={{ color: colors[i] }}>{p}</div>
        ))}
      </div>
    </div>
  )
}

const FRAMEWORKS: Record<string, React.FC[]> = {
  'CX Strategy': [MaturityModel, GovernanceModel],
  'Voice of Customer': [VoCClosedLoop, ListeningPostTable],
  'Experience Design': [JourneyMapAnatomy, DesignThinking],
  'Metrics & Measurement': [MetricsTable, ROILinkage],
  'Customer-Centric Culture': [CultureLevers, EngagementPyramid],
  'Organizational Adoption': [RACITable, ChangeCurve],
}

export default function KeyFrameworks({ domain }: Props) {
  const components = FRAMEWORKS[domain] ?? []
  if (components.length === 0) return <p className="text-mist text-sm">No frameworks for this domain.</p>
  return (
    <div className="space-y-6">
      {components.map((Framework, i) => (
        <div key={i} className="bg-ink rounded-xl border border-white/10 p-5">
          <Framework />
        </div>
      ))}
    </div>
  )
}
