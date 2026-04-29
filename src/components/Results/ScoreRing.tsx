interface Props {
  score: number
  total: number
}

export default function ScoreRing({ score, total }: Props) {
  const pct = Math.round((score / total) * 100)
  const passed = pct >= 70
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = passed ? '#2E7D5A' : '#A63228'

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="180" height="180" className="-rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#1A2B3C" strokeWidth="12" />
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color }}>{pct}%</div>
          <div className="text-mist text-sm">{score}/{total}</div>
        </div>
      </div>
      <div
        className="mt-3 px-6 py-2 rounded-full font-bold text-lg"
        style={{ backgroundColor: color + '22', color }}
      >
        {passed ? '✓ PASS' : '✗ FAIL'}
      </div>
      {passed
        ? <p className="text-mist text-sm mt-2 text-center">Congratulations! You passed the CCXP threshold.</p>
        : <p className="text-mist text-sm mt-2 text-center">70% required to pass. Keep studying!</p>
      }
    </div>
  )
}
