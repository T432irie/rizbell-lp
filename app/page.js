'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProject } from '@/lib/hooks/useProject'
import { ADMIN_EMAIL } from '@/lib/constants'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'

export default function HomePage() {
  const router = useRouter()
  const auth = useAuth()

  // Supabase Auth 経由のユーザーを使用
  const effectiveUser = auth.user

  const project = useProject(effectiveUser)

  // ローディング中
  if (auth.authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>読み込み中...</div>
      </div>
    )
  }

  if (!effectiveUser) {
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

  // プロジェクト選択 → エディタへ遷移
  const handleSelectProject = (proj, previewOnly = false) => {
    if (previewOnly) return
    project.loadProject(proj)
    router.push(`/editor/${proj.id}`)
  }

  // 新規プロジェクト作成
  const handleCreateProject = async (templateSlides, templateName) => {
    const newProj = await project.createProject(templateSlides, templateName)
    if (newProj) {
      router.push(`/editor/${newProj.id}`)
    }
  }

  const isAdminUser = effectiveUser?.email === ADMIN_EMAIL

  return (
    <Dashboard
      user={effectiveUser}
      onLogout={auth.handleLogout}
      onSelectProject={handleSelectProject}
      onCreateProject={handleCreateProject}
      activeSidebarMenu="home"
      setActiveSidebarMenu={() => {}}
      isAdmin={isAdminUser}
      onSwitchToAdminView={isAdminUser ? () => router.push('/admin') : undefined}
    />
  )
}
