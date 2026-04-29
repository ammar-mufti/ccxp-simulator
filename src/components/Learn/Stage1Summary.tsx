import type { Stage1Summary } from '../../types/content'

interface Props {
  data: Stage1Summary
}

export default function Stage1Summary({ data }: Props) {
  return (
    <div className="bg-ink rounded-2xl border border-white/10 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-mist mb-1">Domain Snapshot</div>
          <p className="text-cream text-base leading-relaxed">{data.tagline}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gold/20 text-gold font-medium whitespace-nowrap flex-shrink-0">
          {data.examWeight}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gold mb-2">⚡ Must Know</div>
          <ul className="space-y-1.5">
            {data.mustKnow.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-mist leading-relaxed">
                <span className="text-gold flex-shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-warn mb-2">⚠️ Common Mistakes</div>
          <ul className="space-y-1.5">
            {data.commonMistakes.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-mist leading-relaxed">
                <span className="text-warn flex-shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.connectedDomains && data.connectedDomains.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-mist mb-2">🔗 Connected To</div>
          <ul className="space-y-1">
            {data.connectedDomains.map((item, i) => (
              <li key={i} className="text-sm text-mist leading-relaxed flex gap-2">
                <span className="text-mist/40 flex-shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
