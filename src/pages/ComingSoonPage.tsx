import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCert } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'

export default function ComingSoonPage() {
  const { certId } = useParams<{ certId: string }>()
  const navigate = useNavigate()
  const cert = getCert(certId ?? '')

  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  if (!cert) {
    navigate('/dashboard', { replace: true })
    return null
  }

  function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      const key = 'certpath_waitlist'
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as { cert: string; email: string; date: string }[]
      const already = existing.some(item => item.cert === cert!.id && item.email === email)
      if (!already) {
        existing.push({ cert: cert!.id, email, date: new Date().toISOString() })
        localStorage.setItem(key, JSON.stringify(existing))
      }
    } catch { /* silent */ }
    setSaved(true)
  }

  return (
    <div className="min-h-screen bg-navy">
      <TopNav />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6 grayscale opacity-60">{cert.icon}</div>
        <h1 className="font-serif text-3xl text-cream mb-2">{cert.name}</h1>
        <p className="text-mist mb-1">{cert.fullName}</p>
        <p className="text-mist/50 text-sm mb-10">Issued by {cert.issuer}</p>

        <div className="bg-ink border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-cream font-semibold text-lg mb-3">This certification is coming soon to CertPath AI</h2>
          <p className="text-mist text-sm mb-6 leading-relaxed">
            We're building comprehensive study content for {cert.name}.
            Join the waitlist to be notified when it launches.
          </p>

          {saved ? (
            <div className="flex items-center justify-center gap-2 text-pass">
              <span>✓</span>
              <span className="font-semibold">You're on the list! We'll notify you when {cert.name} launches.</span>
            </div>
          ) : (
            <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 bg-navy border border-white/20 rounded-xl px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/60 placeholder-mist/50"
              />
              <button
                type="submit"
                className="bg-gold text-navy font-bold px-6 py-2.5 rounded-xl hover:bg-amber-400 transition-colors text-sm"
              >
                Notify Me →
              </button>
            </form>
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-mist hover:text-cream text-sm transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
