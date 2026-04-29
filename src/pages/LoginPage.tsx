import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoginScreen from '../components/Auth/LoginScreen'

export default function LoginPage() {
  const [params] = useSearchParams()
  const { setToken, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      setToken(token)
      navigate('/learn', { replace: true })
    }
  }, [params, setToken, navigate])

  useEffect(() => {
    if (user) navigate('/learn', { replace: true })
  }, [user, navigate])

  return <LoginScreen />
}
