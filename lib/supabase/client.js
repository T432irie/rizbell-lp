import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。.env.localファイルを確認してください。')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

/**
 * 管理者用：全プロジェクト取得
 */
export const getAllProjects = async () => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, user:user_id ( email )`)
      .order("created_at", { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("全プロジェクト取得エラー:", error)
    return { data: null, error }
  }
}

/**
 * 管理者用：特定ユーザーのプロジェクト取得
 */
export const getUserProjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("ユーザープロジェクト取得エラー:", error)
    return { data: null, error }
  }
}

/**
 * 分析イベントを記録
 */
export const trackEvent = async (projectId, eventType) => {
  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .insert({
        project_id: projectId,
        event_type: eventType,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("イベント記録エラー:", error)
    return { data: null, error }
  }
}

/**
 * 分析データ取得
 */
export const getAnalyticsData = async (projectId, days = 30) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("project_id", projectId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error("分析データ取得エラー:", error)
    return { data: null, error }
  }
}

/**
 * 管理者用：全プロジェクト取得（所有者情報付き）
 */
export const fetchAllProjectsForAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    const projectsWithUserInfo = (data || []).map((project) => ({
      ...project,
      user: {
        email: project.user_id ? `user_${project.user_id.substring(0, 8)}` : '不明'
      }
    }))
    return { data: projectsWithUserInfo, error: null }
  } catch (error) {
    console.error("管理者プロジェクト取得エラー:", error)
    return { data: null, error }
  }
}

/**
 * 管理者用：全リード取得
 */
export const fetchAllLeadsForAdmin = async () => {
  try {
    const { data: projects, error: projectsError } = await fetchAllProjectsForAdmin()
    if (projectsError) throw projectsError
    const allLeads = []
    ;(projects || []).forEach(project => {
      const leads = project.content?.leads || []
      leads.forEach(lead => {
        allLeads.push({
          ...lead,
          projectId: project.id,
          projectTitle: project.content?.siteConfig?.seo?.title || '無題のプロジェクト',
          ownerEmail: project.user?.email || '不明',
          projectCreatedAt: project.created_at
        })
      })
    })
    allLeads.sort((a, b) => new Date(b.date || b.projectCreatedAt) - new Date(a.date || a.projectCreatedAt))
    return { data: allLeads, error: null }
  } catch (error) {
    console.error("管理者リード取得エラー:", error)
    return { data: null, error }
  }
}
