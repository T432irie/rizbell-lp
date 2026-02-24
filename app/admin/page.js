'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const router = useRouter()
  const auth = useAuth()

  if (auth.authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <AdminDashboard
      user={auth.user}
      onLogout={auth.handleLogout}
      onSwitchToUserView={() => router.push('/')}
    />
  )
}
