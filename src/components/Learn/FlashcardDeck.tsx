import { useState } from 'react'
import type { Flashcard } from '../../store/learnStore'

interface Props {
  flashcards: Flashcard[]
  knownIndices: number[]
  onMarkKnown: (index: number) => void
}

export default function FlashcardDeck({ flashcards, knownIndices, onMarkKnown }: Props) {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (flashcards.length === 0) return null

  const card = flashcards[current]
  const isKnown = knownIndices.includes(current)
  const known = knownIndices.length

  function next() { setFlipped(false); setTimeout(() => setCurrent(c => (c + 1) % flashcards.length), 150) }
  function prev() { setFlipped(false); setTimeout(() => setCurrent(c => (c - 1 + flashcards.length) % flashcards.length), 150) }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-lg mb-4">
        <span className="text-mist text-sm">{current + 1} / {flashcards.length}</span>
        <span className="text-pass text-sm">{known} known</span>
      </div>

      {/* Flip card */}
      <div className="flip-card w-full max-w-lg h-52 cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <div className={`flip-card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flip-card-front w-full h-full bg-ink border border-white/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-mist text-xs uppercase tracking-widest mb-3">Question</div>
            <p className="text-cream text-lg font-medium leading-relaxed">{card.front}</p>
            <p className="text-mist text-xs mt-4">Tap to reveal</p>
          </div>
          <div className="flip-card-back w-full h-full bg-gold/10 border border-gold/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-gold text-xs uppercase tracking-widest mb-3">Answer</div>
            <p className="text-cream text-base leading-relaxed">{card.back}</p>
            {card.why && <p className="text-mist text-xs mt-3 italic">{card.why}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={prev} className="px-4 py-2 rounded-lg bg-white/10 text-mist hover:bg-white/20 text-sm transition-colors">
          ← Prev
        </button>
        <button
          onClick={() => { onMarkKnown(current); next() }}
          disabled={isKnown}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            isKnown ? 'bg-pass/20 text-pass cursor-default' : 'bg-pass text-white hover:bg-green-600'
          }`}
        >
          {isKnown ? '✓ Known' : 'I know this'}
        </button>
        <button onClick={next} className="px-4 py-2 rounded-lg bg-white/10 text-mist hover:bg-white/20 text-sm transition-colors">
          Next →
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-4 flex-wrap justify-center max-w-sm">
        {flashcards.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? 'bg-gold' : knownIndices.includes(i) ? 'bg-pass' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
