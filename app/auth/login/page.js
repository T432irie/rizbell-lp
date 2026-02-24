'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import Login from '@/components/Login'

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (!auth.authLoading && auth.user) {
      router.replace('/')
    }
  }, [auth.authLoading, auth.user, router])

  if (auth.authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}>
        <div style={{ color: '#64748b' }}>読み込み中...</div>
      </div>
    )
  }

  if (auth.user) {
    return null
  }

  return (
    <Login
      loginEmail={auth.loginEmail}
      setLoginEmail={auth.setLoginEmail}
      loginPassword={auth.loginPassword}
      setLoginPassword={auth.setLoginPassword}
      isSignUp={auth.isSignUp}
      setIsSignUp={auth.setIsSignUp}
      authError={auth.authError}
      setAuthError={auth.setAuthError}
      handleLogin={auth.handleLogin}
      handleSignUp={auth.handleSignUp}
    />
  )
}
