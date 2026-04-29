import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const isLearn = location.pathname.startsWith('/learn')
  const isExam = location.pathname.startsWith('/exam') || location.pathname.startsWith('/results')

  return (
    <nav className="bg-ink border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/learn" className="text-gold font-serif text-xl">CCXP</Link>
          <div className="flex gap-1">
            <Link
              to="/learn"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isLearn ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📚 Learn
            </Link>
            <Link
              to="/exam"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isExam ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
              }`}
            >
              📝 Exam
            </Link>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.login} className="w-7 h-7 rounded-full" />
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
