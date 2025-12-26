/**
 * Supabaseクライアント初期化
 * 
 * 【SQLセットアップ手順】
 * 
 * 1. Supabaseダッシュボード（https://app.supabase.com）にログイン
 * 2. プロジェクトを作成（または既存のプロジェクトを選択）
 * 3. 左メニューから「SQL Editor」を開く
 * 4. 以下のSQLを実行してテーブルを作成：
 * 
 * ```sql
 * -- projectsテーブルを作成
 * CREATE TABLE projects (
 *   id BIGSERIAL PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   content JSONB NOT NULL DEFAULT '{}'::jsonb,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * -- RLS（Row Level Security）を有効化
 * ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
 * 
 * -- ポリシー：ユーザーは自分のプロジェクトのみ閲覧・編集可能
 * CREATE POLICY "Users can view own projects"
 *   ON projects FOR SELECT
 *   USING (auth.uid() = user_id);
 * 
 * CREATE POLICY "Users can insert own projects"
 *   ON projects FOR INSERT
 *   WITH CHECK (auth.uid() = user_id);
 * 
 * CREATE POLICY "Users can update own projects"
 *   ON projects FOR UPDATE
 *   USING (auth.uid() = user_id)
 *   WITH CHECK (auth.uid() = user_id);
 * 
 * CREATE POLICY "Users can delete own projects"
 *   ON projects FOR DELETE
 *   USING (auth.uid() = user_id);
 * 
 * -- updated_atを自動更新するトリガー関数
 * CREATE OR REPLACE FUNCTION update_updated_at_column()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   NEW.updated_at = NOW();
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * -- トリガーを設定
 * CREATE TRIGGER update_projects_updated_at
 *   BEFORE UPDATE ON projects
 *   FOR EACH ROW
 *   EXECUTE FUNCTION update_updated_at_column();
 * ```
 * 
 * 5. Settings > API から以下を取得：
 *    - Project URL → REACT_APP_SUPABASE_URL
 *    - anon/public key → REACT_APP_SUPABASE_ANON_KEY
 * 6. .envファイルに上記の値を設定
 * 7. アプリを再起動
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。.envファイルを確認してください。');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * 管理者用関数：全ユーザーのプロジェクトを取得
 * 注意：RLSポリシーにより、通常のユーザーは自分のデータのみアクセス可能です。
 * 管理者が全データにアクセスするには、SupabaseのRLSポリシーを調整するか、
 * Service Role Keyを使用する必要があります。
 */
export const getAllProjects = async () => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("全プロジェクト取得エラー:", error);
    return { data: null, error };
  }
};

/**
 * 管理者用関数：特定ユーザーのプロジェクトを取得
 */
export const getUserProjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("ユーザープロジェクト取得エラー:", error);
    return { data: null, error };
  }
};

/**
 * 管理者用関数：全ユーザー一覧を取得
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    // admin APIは通常のanon keyでは使えないため、代替手段として
    // projectsテーブルからユニークなuser_idを取得
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("user_id, created_at")
      .order("created_at", { ascending: false });
    
    if (projectsError) {
      return { data: null, error: projectsError };
    }
    
    // ユニークなuser_idを抽出
    const uniqueUserIds = [...new Set(projects.map(p => p.user_id))];
    return { data: uniqueUserIds, error: null };
  }
};

/**
 * 分析イベントを記録する関数
 * @param {number} projectId - プロジェクトID
 * @param {string} eventType - イベントタイプ ('view' | 'cta_click')
 * @returns {Promise<{data: any, error: any}>}
 * 
 * TODO: Phase 2 - 独自分析機能を実装する際に有効化
 * 現在はClarityとGTMで分析を行うため、この機能は無効化しています
 */
export const trackEvent = async (projectId, eventType) => {
  // 一時的に無効化: analytics_eventsテーブルが未作成のため
  console.log('[Analytics] trackEvent called (disabled):', { projectId, eventType });
  return { data: null, error: null };
  
  /* 
  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .insert({
        project_id: projectId,
        event_type: eventType,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("イベント記録エラー:", error);
    return { data: null, error };
  }
  */
};

/**
 * プロジェクトの分析データを取得する関数
 * @param {number} projectId - プロジェクトID
 * @param {number} days - 取得する日数（デフォルト: 30日）
 * @returns {Promise<{data: any, error: any}>}
 * 
 * TODO: Phase 2 - 独自分析機能を実装する際に有効化
 * 現在はClarityとGTMで分析を行うため、この機能は無効化しています
 */
export const getAnalyticsData = async (projectId, days = 30) => {
  // 一時的に無効化: analytics_eventsテーブルが未作成のため
  // エラーを出さずに空の配列を返す
  return { data: [], error: null };
  
  /*
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("project_id", projectId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("分析データ取得エラー:", error);
    return { data: null, error };
  }
  */
};

/**
 * 管理者用関数：全プロジェクトを取得（所有者情報付き）
 * 注意：RLSポリシーにより、通常のユーザーは自分のデータのみアクセス可能です。
 * 管理者が全データにアクセスするには、SupabaseのRLSポリシーを調整するか、
 * Service Role Keyを使用する必要があります。
 * @returns {Promise<{data: any, error: any}>}
 */
export const fetchAllProjectsForAdmin = async () => {
  try {
    // まずシンプルなクエリで試す
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // ユーザー情報を取得するために、各プロジェクトのuser_idからemailを取得
    const projectsWithUserInfo = await Promise.all(
      (data || []).map(async (project) => {
        try {
          // auth.usersテーブルには直接アクセスできないため、
          // プロジェクトデータにuser_idを含めて返す
          // 実際のemail取得は、SupabaseのRLSポリシー設定に依存します
          return {
            ...project,
            user: {
              email: project.user_id ? `user_${project.user_id.substring(0, 8)}` : '不明'
            }
          };
        } catch (err) {
          return {
            ...project,
            user: {
              email: '不明'
            }
          };
        }
      })
    );
    
    return { data: projectsWithUserInfo, error: null };
  } catch (error) {
    console.error("管理者プロジェクト取得エラー:", error);
    return { data: null, error };
  }
};

/**
 * 管理者用関数：全リードを取得
 * 各プロジェクトのcontentフィールド内のleads配列から全リードを抽出します
 * @returns {Promise<{data: any, error: any}>}
 */
export const fetchAllLeadsForAdmin = async () => {
  try {
    // 全プロジェクトを取得
    const { data: projects, error: projectsError } = await fetchAllProjectsForAdmin();
    
    if (projectsError) throw projectsError;
    
    // 各プロジェクトのリードを抽出してフラット化
    const allLeads = [];
    (projects || []).forEach(project => {
      const leads = project.content?.leads || [];
      leads.forEach(lead => {
        allLeads.push({
          ...lead,
          projectId: project.id,
          projectTitle: project.content?.siteConfig?.seo?.title || '無題のプロジェクト',
          ownerEmail: project.user?.email || '不明',
          projectCreatedAt: project.created_at
        });
      });
    });
    
    // 日時でソート（新しい順）
    allLeads.sort((a, b) => {
      const dateA = new Date(a.date || a.projectCreatedAt);
      const dateB = new Date(b.date || b.projectCreatedAt);
      return dateB - dateA;
    });
    
    return { data: allLeads, error: null };
  } catch (error) {
    console.error("管理者リード取得エラー:", error);
    return { data: null, error };
  }
};

