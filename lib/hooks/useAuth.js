'use client'

import { useState, useEffect } from 'react'
import { supabase, getAllProjects } from '@/lib/supabase/client'
import { ADMIN_EMAIL } from '@/lib/constants'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isAdminMode, setIsAdminMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsAdminMode(true)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsAdminMode(true)
      } else {
        setIsAdminMode(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError("")
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
    } catch (error) {
      setAuthError(error.message || "ログインに失敗しました")
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setAuthError("")
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      setAuthError("確認メールを送信しました。メールを確認してログインしてください。")
    } catch (error) {
      setAuthError(error.message || "登録に失敗しました")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = user?.email === ADMIN_EMAIL

  return {
    user, session, authLoading,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    isSignUp, setIsSignUp,
    authError, setAuthError,
    isAdminMode, setIsAdminMode,
    isAdmin,
    handleLogin, handleSignUp, handleLogout,
  }
}
