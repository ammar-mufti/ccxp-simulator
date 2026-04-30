import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLearnStore } from '../store/learnStore'
import { useHistoryStore } from '../store/historyStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS } from '../data/certifications'
import type { Certification } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 18
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference
  return (
    <svg width="44" height="44" className="-rotate-90 flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#1A2B3C" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  )
}

function CertCard({ cert }: { cert: Certification }) {
  const navigate = useNavigate()
  const { getDomainProgress } = useLearnStore()

  const totalProgress = cert.domains.length > 0
    ? Math.round(cert.domains.reduce((sum, d) => sum + getDomainProgress(cert.id, d.name), 0) / cert.domains.length)
    : 0

  const hasProgress = totalProgress > 0

  return (
    <button
      onClick={() => navigate(`/${cert.id}/learn`)}
      className="bg-ink border border-white/10 hover:border-white/30 rounded-2xl p-5 text-left transition-all group w-full"
      style={{ borderTopColor: cert.color + '60' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">{cert.icon}</span>
            <span className="font-bold text-sm group-hover:text-gold transition-colors" style={{ color: cert.color }}>{cert.name}</span>
          </div>
          <div className="text-mist text-xs truncate">{cert.fullName}</div>
          <div className="text-mist/40 text-[10px]">{cert.issuer}</div>
        </div>
        <ProgressRing pct={totalProgress} color={cert.color} />
      </div>

      <div className="h-1 bg-white/10 rounded-full">
        <div className="h-1 rounded-full transition-all" style={{ width: `${totalProgress}%`, backgroundColor: cert.color }} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-mist text-xs">{totalProgress}% ready</span>
        {!hasProgress && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold">Start →</span>
        )}
      </div>
    </button>
  )
}

function ComingSoonDashCard({ cert }: { cert: Certification }) {
  return (
    <div className="bg-ink/40 border border-white/5 rounded-2xl p-5 opacity-50 cursor-not-allowed">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl grayscale">{cert.icon}</span>
        <span className="font-bold text-mist text-sm">{cert.name}</span>
      </div>
      <div className="text-mist/60 text-xs">{cert.fullName}</div>
      <div className="mt-3 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-mist/50 inline-block">Coming Soon</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { attempts } = useHistoryStore()

  const recentAttempts = attempts.slice(0, 3)

  return (
    <div className="min-h-screen bg-navy">
      <TopNav />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl text-cream mb-1">
            Welcome back, {user?.name ?? user?.login ?? 'there'}
          </h1>
          <p className="text-mist">Which certification are you preparing for today?</p>
        </div>

        {/* Cert cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} />
          ))}
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonDashCard key={cert.id} cert={cert} />
          ))}
        </div>

        {/* Recent activity */}
        {recentAttempts.length > 0 && (
          <div className="bg-ink border border-white/10 rounded-2xl p-5">
            <h2 className="text-cream font-semibold text-sm mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentAttempts.map(a => {
                const passed = a.pct >= 70
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: passed ? '#2E7D5A' : '#A63228' }} />
                      <div className="min-w-0">
                        <div className="text-cream text-xs font-medium">
                          {a.certName} — {a.mode === 'full' ? 'Full Exam' : a.mode === 'mini' ? 'Mini Drill' : `Domain: ${a.selectedDomain ?? ''}`}
                        </div>
                        <div className="text-mist text-[10px]">{formatRelative(a.date)}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${passed ? 'text-pass' : 'text-fail'}`}>{a.pct}%</span>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/history')}
              className="mt-4 text-gold text-xs hover:underline transition-colors"
            >
              View full history →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
