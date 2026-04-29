interface Props {
  formatted: string
  timerColor: string
  timerPulse: string
}

export default function TimerDisplay({ formatted, timerColor, timerPulse }: Props) {
  return (
    <div className={`font-mono font-bold text-lg ${timerColor} ${timerPulse}`}>
      {formatted}
    </div>
  )
}
