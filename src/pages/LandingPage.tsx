import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS } from '../data/certifications'
import type { Certification } from '../data/certifications'

function DifficultyBar({ level }: { level: Certification['difficulty'] }) {
  const bars = level === 'Beginner' ? 1 : level === 'Intermediate' ? 2 : 3
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-4 h-1.5 rounded-full"
            style={{ backgroundColor: i <= bars ? '#C9A84C' : '#1A2B3C' }}
          />
        ))}
      </div>
      <span className="text-mist text-xs">{level}</span>
    </div>
  )
}

function CertCard({ cert, onStart }: { cert: Certification; onStart: (id: string) => void }) {
  return (
    <div
      className="bg-ink border border-white/10 hover:border-white/30 rounded-2xl p-6 flex flex-col gap-4 transition-all group cursor-pointer"
      style={{ borderTopColor: cert.color + '60' }}
      onClick={() => onStart(cert.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{cert.icon}</span>
            <span className="font-bold text-cream text-lg group-hover:text-gold transition-colors" style={{ color: cert.color }}>{cert.name}</span>
          </div>
          <div className="text-mist text-sm leading-snug">{cert.fullName}</div>
          <div className="text-mist/50 text-xs mt-0.5">Issued by {cert.issuer}</div>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: cert.color }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-mist">
        <span>{cert.examQuestions}Q</span>
        <span className="text-white/20">·</span>
        <span>{cert.examDuration}min</span>
        <span className="text-white/20">·</span>
        <span>Pass: {cert.passingScore}%</span>
      </div>

      <DifficultyBar level={cert.difficulty} />

      <button
        className="mt-auto w-full py-2.5 rounded-xl font-bold text-sm transition-all"
        style={{ backgroundColor: cert.color, color: '#0D1B2A' }}
      >
        Start Studying →
      </button>
    </div>
  )
}

function ComingSoonCard({ cert }: { cert: Certification }) {
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      const key = 'certpath_waitlist'
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as { cert: string; email: string; date: string }[]
      existing.push({ cert: cert.id, email, date: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(existing))
    } catch { /* silent */ }
    setSaved(true)
  }

  return (
    <div className="bg-ink/60 border border-white/5 rounded-2xl p-6 flex flex-col gap-3 opacity-70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl grayscale opacity-70">{cert.icon}</span>
            <span className="font-bold text-mist text-lg">{cert.name}</span>
          </div>
          <div className="text-mist/60 text-sm leading-snug">{cert.fullName}</div>
          <div className="text-mist/40 text-xs mt-0.5">Issued by {cert.issuer}</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-mist/60 flex-shrink-0 whitespace-nowrap">
          Coming Soon
        </span>
      </div>

      {saved ? (
        <div className="text-pass text-xs">✓ We'll notify you when {cert.name} launches!</div>
      ) : (
        <form onSubmit={handleNotify} className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 bg-navy border border-white/10 rounded-lg px-3 py-1.5 text-cream text-xs focus:outline-none focus:border-gold/40 placeholder-mist/40"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-mist text-xs rounded-lg transition-colors whitespace-nowrap"
          >
            Notify Me
          </button>
        </form>
      )}
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  function handleStart(certId: string) {
    if (user) {
      navigate(`/${certId}/learn`)
    } else {
      navigate('/login')
    }
  }

  function handleCTA() {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-navy text-cream">
      {/* Nav */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-navy/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-gold font-serif text-xl">CertPath AI</span>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.avatar && <img src={user.avatar} alt={user.login} className="w-7 h-7 rounded-full" />}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gold text-navy font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-amber-400 transition-colors"
                >
                  Dashboard →
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-gold text-navy font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-amber-400 transition-colors"
              >
                Sign in →
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="font-serif text-5xl sm:text-6xl mb-6 leading-tight">
          Ace Your Next<br />
          <span className="text-gold">Certification</span>
        </h1>
        <p className="text-mist text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-generated questions, smart study plans, and an exam coach — for the certifications that advance your career
        </p>
        <button
          onClick={handleCTA}
          className="bg-gold text-navy font-bold px-8 py-4 rounded-xl text-lg hover:bg-amber-400 transition-colors shadow-lg"
        >
          Start Studying Free →
        </button>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/10 py-4 bg-ink/40">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center">
          {[
            { n: '5', label: 'Certifications' },
            { n: '500+', label: 'AI Questions' },
            { n: 'Free', label: 'Forever' },
            { n: 'No', label: 'Credit Card' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-gold font-bold text-xl">{s.n}</div>
              <div className="text-mist text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cert grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-center mb-2">Available Now</h2>
        <p className="text-mist text-center mb-10">Choose your certification and start studying today</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} onStart={handleStart} />
          ))}
        </div>

        {/* Coming soon */}
        <h2 className="font-serif text-2xl text-center mb-2 text-mist">Coming Soon</h2>
        <p className="text-mist/60 text-center text-sm mb-8">Join the waitlist to be notified when these launch</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonCard key={cert.id} cert={cert} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink/40 border-y border-white/10 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Your Cert', desc: 'Pick from 5 available certifications across CX, PM, Cloud, Agile, and ITSM.' },
              { step: '2', title: 'Study with AI', desc: 'Get AI-generated summaries, key concepts, and practice questions tailored to your exam.' },
              { step: '3', title: 'Pass the Exam', desc: 'Track your progress, identify weak domains, and build confidence before exam day.' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gold text-navy font-bold text-xl flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-cream mb-2">{s.title}</h3>
                <p className="text-mist text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-gold font-serif text-lg mb-3">CertPath AI</div>
          <p className="text-mist text-sm mb-4">
            AI-powered prep for the certifications that advance your career
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-mist/60 mb-4">
            <a href="mailto:muftiammar52@gmail.com" className="hover:text-mist transition-colors">muftiammar52@gmail.com</a>
            <span>·</span>
            <a href="https://linkedin.com/in/ammarmufti" target="_blank" rel="noopener noreferrer" className="hover:text-mist transition-colors">linkedin.com/in/ammarmufti</a>
          </div>
          <p className="text-mist/40 text-xs">Built with Claude · Deployed on GitHub Pages</p>
        </div>
      </footer>
    </div>
  )
}
