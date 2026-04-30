import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser } from '../../store/authStore'
import { useHistoryStore } from '../../store/historyStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS, getCert } from '../../data/certifications'

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.login} className="w-7 h-7 rounded-full" />
  }
  if (user.provider === 'google') {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-xs font-bold" style={{ color: '#4285F4' }}>
        G
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gold text-navy text-xs font-bold">
      {(user.name || user.login).charAt(0).toUpperCase()}
    </div>
  )
}

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ certId?: string }>()
  const attemptCount = useHistoryStore(s => s.attempts.length)

  // Detect certId from URL params or path
  const certIdFromPath = params.certId ?? location.pathname.split('/').find(seg =>
    AVAILABLE_CERTS.some(c => c.id === seg) || COMING_SOON_CERTS.some(c => c.id === seg)
  ) ?? null

  const currentCert = certIdFromPath ? getCert(certIdFromPath) : null

  const isLearn = location.pathname.includes('/learn')
  const isExam = location.pathname.includes('/exam') || location.pathname.includes('/results')
  const isHistory = location.pathname.includes('/history')
  const isCertPage = !!(currentCert && (isLearn || isExam || isHistory))

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    if (switcherOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [switcherOpen])

  function switchToCert(id: string) {
    setSwitcherOpen(false)
    if (isLearn) navigate(`/${id}/learn`)
    else if (isExam) navigate(`/${id}/exam`)
    else if (isHistory) navigate(`/${id}/history`)
    else navigate(`/${id}/learn`)
  }

  return (
    <nav className="bg-ink border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gold font-serif text-xl whitespace-nowrap">CertPath AI</Link>

          {/* Cert switcher badge */}
          {isCertPage && currentCert && (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium"
                style={{ color: currentCert.color }}
              >
                <span>{currentCert.icon}</span>
                <span>{currentCert.name}</span>
                <span className="text-mist/60 text-xs ml-0.5">▾</span>
              </button>

              {switcherOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-ink border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-3 py-2 text-xs text-mist/60 font-semibold border-b border-white/10">
                    Switch Certification
                  </div>
                  {AVAILABLE_CERTS.map(cert => (
                    <button
                      key={cert.id}
                      onClick={() => switchToCert(cert.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base flex-shrink-0">{cert.icon}</span>
                        <span className="text-sm text-cream truncate">{cert.name}</span>
                      </div>
                      {cert.id === currentCert.id && (
                        <span className="text-[10px] text-gold flex-shrink-0">Active</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-white/10 px-3 py-2 text-xs text-mist/40">
                    + More coming soon
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Sub-nav (on cert pages) */}
        {isCertPage && currentCert && (
          <div className="flex gap-1">
            <Link
              to={`/${currentCert.id}/learn`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isLearn ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📚 Learn
            </Link>
            <Link
              to={`/${currentCert.id}/exam`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isExam ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📝 Exam
            </Link>
            <Link
              to={`/${currentCert.id}/history`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isHistory ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📊 History
              {attemptCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isHistory ? 'bg-navy/30 text-navy' : 'bg-white/10 text-mist'
                }`}>
                  {attemptCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Right: User */}
        {user && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <UserAvatar user={user} />
            <span className="text-mist text-sm hidden sm:block">{user.login}</span>
            <button
              onClick={logout}
              className="text-mist/60 hover:text-mist text-xs transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
