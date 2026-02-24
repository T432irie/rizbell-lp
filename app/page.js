'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProject } from '@/lib/hooks/useProject'
import { ADMIN_EMAIL } from '@/lib/constants'
import Dashboard from '@/components/Dashboard'

export default function HomePage() {
  const router = useRouter()
  const auth = useAuth()

  // Supabase Auth 経由のユーザーを使用
  const effectiveUser = auth.user

  const project = useProject(effectiveUser)

  // 未認証 → /auth/login へリダイレクト
  useEffect(() => {
    if (!auth.authLoading && !auth.user) {
      router.replace('/auth/login')
    }
  }, [auth.authLoading, auth.user, router])

  // ローディング中
  if (auth.authLoading || !effectiveUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>読み込み中...</div>
      </div>
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
