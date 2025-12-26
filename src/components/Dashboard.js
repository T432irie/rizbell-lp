import React, { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Search, 
  User, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  LogOut,
  ChevronRight,
  BarChart3,
  X,
  Shield,
  CheckCircle2
} from 'lucide-react';
import './Dashboard.css';
import { supabase, getAnalyticsData } from '../supabaseClient';
import AnalyticsChart from './AnalyticsChart';
import TemplateSelector from './TemplateSelector';

function Dashboard({ 
  user, 
  onLogout, 
  onSelectProject, 
  onCreateProject,
  activeSidebarMenu,
  setActiveSidebarMenu,
  isAdmin,
  onSwitchToAdminView
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailTab, setProjectDetailTab] = useState('analytics'); // 'analytics' | 'info'
  const [kpiStats, setKpiStats] = useState({
    totalProjects: 0,
    totalViews: 0,
    monthlyLeads: 0
  });
  
  // 設定画面用のstate
  const [userSettings, setUserSettings] = useState({
    clarityId: '',
    gtmId: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // テンプレート選択用のstate
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // プロジェクト一覧の取得
  useEffect(() => {
    if (user) {
      loadProjects();
      loadUserSettings();
    }
  }, [user]);

  // ユーザー設定の読み込み
  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      // usersテーブルから設定を取得（user_metadataに保存する想定）
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser?.user_metadata?.clarityId || currentUser?.user_metadata?.gtmId) {
        setUserSettings({
          clarityId: currentUser.user_metadata.clarityId || '',
          gtmId: currentUser.user_metadata.gtmId || ''
        });
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  // ユーザー設定の保存
  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSettingsLoading(true);
    setSettingsSaved(false);
    
    try {
      // Supabase Authのuser_metadataを更新
      const { error } = await supabase.auth.updateUser({
        data: {
          clarityId: userSettings.clarityId,
          gtmId: userSettings.gtmId
        }
      });

      if (error) throw error;

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (error) {
      console.error('設定保存エラー:', error);
      alert('設定の保存に失敗しました: ' + (error.message || '不明なエラー'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      
      // KPI統計を計算
      const totalProjects = data?.length || 0;
      let totalViews = 0;
      let monthlyLeads = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // 各プロジェクトの分析データを取得してKPIを計算
      // TODO: Phase 2 - 独自分析機能を実装する際に有効化
      for (const project of data || []) {
        /* analytics_eventsテーブルを使用した分析（一時的に無効化）
        try {
          const { data: analyticsData } = await getAnalyticsData(project.id, 30);
          const views = analyticsData?.filter(e => e.event_type === 'view').length || 0;
          totalViews += views;
        } catch (error) {
          console.error(`プロジェクト ${project.id} の分析データ取得エラー:`, error);
        }
        */
        
        // 今月のリード数を計算
        const leads = project.content?.leads || [];
        monthlyLeads += leads.filter(lead => {
          const leadDate = new Date(lead.date);
          return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
        }).length;
      }

      setKpiStats({
        totalProjects,
        totalViews,
        monthlyLeads
      });
    } catch (error) {
      console.error("プロジェクト読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("このプロジェクトを削除しますか？")) return;
    
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;
      loadProjects();
    } catch (error) {
      console.error("プロジェクト削除エラー:", error);
      alert("削除に失敗しました");
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const title = project.content?.siteConfig?.seo?.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sidebarMenus = [
    { id: 'home', icon: Home, label: 'ホーム' },
    { id: 'projects', icon: FileText, label: 'プロジェクト一覧' },
    { id: 'analytics', icon: BarChart3, label: '分析' },
    { id: 'leads', icon: Users, label: 'リード' },
    { id: 'settings', icon: Settings, label: '設定' }
  ];

  // プロジェクト選択時のサブメニュー
  const projectSubMenus = selectedProject ? [
    { id: 'edit', icon: Edit, label: '編集', action: () => onSelectProject(selectedProject) },
    { id: 'analytics', icon: BarChart3, label: '分析', action: () => {
      setActiveSidebarMenu('analytics');
      handleProjectClick(selectedProject);
    }},
    { id: 'leads', icon: Users, label: 'リード一覧', action: () => {
      setActiveSidebarMenu('leads');
    }}
  ] : [];

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setProjectDetailTab('analytics');
    // プロジェクト選択時にサイドバーにサブメニューを表示するため、selectedProjectを設定
  };

  const handleTemplateSelect = (template) => {
    setShowTemplateSelector(false);
    onCreateProject(template);
  };

  return (
    <div className="dashboard-container">
      {/* テンプレート選択モーダル */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
      {/* ヘッダー */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">リズベルLP</div>
        </div>
        <div className="header-center">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="プロジェクトを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="header-right">
          {isAdmin && onSwitchToAdminView && (
            <button 
              className="switch-to-admin-btn" 
              onClick={onSwitchToAdminView}
              title="管理者画面へ戻る"
            >
              <Shield size={18} />
              <span>管理者管理へ戻る</span>
            </button>
          )}
          <div className="user-menu">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
            </div>
            <button className="logout-btn" onClick={onLogout} title="ログアウト">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content-wrapper">
        {/* 左サイドバー */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            {sidebarMenus.map((menu) => {
              const Icon = menu.icon;
              return (
                <button
                  key={menu.id}
                  className={`sidebar-menu-item ${activeSidebarMenu === menu.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSidebarMenu(menu.id);
                    setSelectedProject(null);
                  }}
                >
                  <Icon size={20} />
                  <span>{menu.label}</span>
                  {activeSidebarMenu === menu.id && <ChevronRight size={16} className="active-indicator" />}
                </button>
              );
            })}
            
            {/* プロジェクト選択時のサブメニュー */}
            {selectedProject && projectSubMenus.length > 0 && (
              <div className="sidebar-submenu">
                <div className="sidebar-submenu-header">
                  <span className="sidebar-submenu-title">
                    {selectedProject.content?.siteConfig?.seo?.title || '無題のプロジェクト'}
                  </span>
                  <button 
                    className="sidebar-submenu-close"
                    onClick={() => setSelectedProject(null)}
                    title="閉じる"
                  >
                    <X size={16} />
                  </button>
                </div>
                {projectSubMenus.map((subMenu) => {
                  const Icon = subMenu.icon;
                  return (
                    <button
                      key={subMenu.id}
                      className={`sidebar-menu-item sidebar-submenu-item ${activeSidebarMenu === subMenu.id ? 'active' : ''}`}
                      onClick={subMenu.action}
                    >
                      <Icon size={18} />
                      <span>{subMenu.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        </aside>

        {/* メインエリア */}
        <main className="dashboard-main">
          {activeSidebarMenu === 'home' && (
            <>
              {/* KPIカード */}
              <div className="kpi-cards">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#EFF6FF' }}>
                    <FileText size={24} color="#3B82F6" />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-value">{kpiStats.totalProjects}</div>
                    <div className="kpi-label">合計LP数</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#F0FDF4' }}>
                    <Eye size={24} color="#10B981" />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-value">{kpiStats.totalViews.toLocaleString()}</div>
                    <div className="kpi-label">総閲覧数</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#FEF3C7' }}>
                    <Users size={24} color="#F59E0B" />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-value">{kpiStats.monthlyLeads}</div>
                    <div className="kpi-label">今月のリード獲得数</div>
                  </div>
                </div>
              </div>

              {/* プロジェクトリスト */}
              <div className="projects-section">
                <div className="section-header">
                  <h2>プロジェクト一覧</h2>
                  <button className="create-project-btn" onClick={() => setShowTemplateSelector(true)}>
                    <Plus size={18} />
                    新規作成
                  </button>
                </div>

                {loading ? (
                  <div className="loading-state">読み込み中...</div>
                ) : filteredProjects.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={48} color="#9CA3AF" />
                    <p>プロジェクトがありません</p>
                    <button className="create-project-btn" onClick={onCreateProject}>
                      <Plus size={18} />
                      最初のプロジェクトを作成
                    </button>
                  </div>
                ) : (
                  <div className="projects-grid">
                    {filteredProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="project-card"
                        onClick={() => onSelectProject(project)}
                      >
                        <div className="project-thumbnail">
                          {project.content?.slides?.[0]?.src ? (
                            <img 
                              src={project.content.slides[0].src} 
                              alt="thumbnail" 
                            />
                          ) : (
                            <div className="project-placeholder">
                              <FileText size={32} color="#9CA3AF" />
                            </div>
                          )}
                        </div>
                        <div className="project-info">
                          <h3 className="project-title">
                            {project.content?.siteConfig?.seo?.title || '無題のプロジェクト'}
                          </h3>
                          <p className="project-meta">
                            {project.content?.slides?.length || 0} スライド
                            {' • '}
                            {new Date(project.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <div className="project-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => onSelectProject(project)}
                            title="編集"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn analytics-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSidebarMenu('analytics');
                              handleProjectClick(project);
                            }}
                            title="分析"
                          >
                            <BarChart3 size={16} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            title="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSidebarMenu === 'projects' && (
            <div className="projects-section">
              <div className="section-header">
                <h2>プロジェクト一覧</h2>
                <button className="create-project-btn" onClick={onCreateProject}>
                  <Plus size={18} />
                  新規作成
                </button>
              </div>
              {loading ? (
                <div className="loading-state">読み込み中...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} color="#9CA3AF" />
                  <p>プロジェクトがありません</p>
                  <button className="create-project-btn" onClick={onCreateProject}>
                    <Plus size={18} />
                    最初のプロジェクトを作成
                  </button>
                </div>
              ) : (
                <div className="projects-grid">
                  {filteredProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="project-card"
                      onClick={() => onSelectProject(project)}
                    >
                      <div className="project-thumbnail">
                        {project.content?.slides?.[0]?.src ? (
                          <img 
                            src={project.content.slides[0].src} 
                            alt="thumbnail" 
                          />
                        ) : (
                          <div className="project-placeholder">
                            <FileText size={32} color="#9CA3AF" />
                          </div>
                        )}
                      </div>
                      <div className="project-info">
                        <h3 className="project-title">
                          {project.content?.siteConfig?.seo?.title || '無題のプロジェクト'}
                        </h3>
                        <p className="project-meta">
                          {project.content?.slides?.length || 0} スライド
                          {' • '}
                          {new Date(project.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <div className="project-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => onSelectProject(project)}
                          title="編集"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn analytics-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSidebarMenu('analytics');
                            handleProjectClick(project);
                          }}
                          title="分析"
                        >
                          <BarChart3 size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSidebarMenu === 'leads' && (
            <div className="leads-section">
              <h2>リード一覧</h2>
              <div className="leads-table">
                {projects.map((project) => {
                  const leads = project.content?.leads || [];
                  if (leads.length === 0) return null;
                  
                  return (
                    <div key={project.id} className="leads-project-group">
                      <h3>{project.content?.siteConfig?.seo?.title || '無題のプロジェクト'}</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>日時</th>
                            <th>データ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead) => (
                            <tr key={lead.id}>
                              <td>{lead.date}</td>
                              <td>
                                {lead.data && Object.entries(lead.data).map(([key, value]) => (
                                  <div key={key}>
                                    <strong>{key}:</strong> {value}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSidebarMenu === 'analytics' && (
            <div className="analytics-section">
              <div className="section-header">
                <h2>分析ダッシュボード</h2>
              </div>
              
              {/* Clarityへの案内 */}
              <div className="analytics-info-banner">
                <div className="analytics-info-icon">📊</div>
                <div className="analytics-info-content">
                  <h3 className="analytics-info-title">Microsoft Clarity で詳細な分析が可能です</h3>
                  <p className="analytics-info-description">
                    各LP編集画面の「設定」タブでClarity IDを設定すると、ヒートマップ、セッション録画、ユーザー行動分析など、詳細なデータを確認できます。
                  </p>
                  <a 
                    href="https://clarity.microsoft.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="analytics-info-link"
                  >
                    Clarityを開く →
                  </a>
                </div>
              </div>

              {/* TODO: Phase 2 - 独自分析機能を実装する際に有効化 */}
              {/*
              {selectedProject ? (
                <div className="project-analytics-detail">
                  <div className="project-analytics-header">
                    <div>
                      <h3>{selectedProject.content?.siteConfig?.seo?.title || '無題のプロジェクト'}</h3>
                      <p className="project-analytics-meta">
                        作成日: {new Date(selectedProject.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <button 
                      className="close-detail-btn"
                      onClick={() => setSelectedProject(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="analytics-tabs">
                    <button
                      className={`analytics-tab ${projectDetailTab === 'analytics' ? 'active' : ''}`}
                      onClick={() => setProjectDetailTab('analytics')}
                    >
                      <BarChart3 size={18} />
                      アクセス推移
                    </button>
                    <button
                      className={`analytics-tab ${projectDetailTab === 'info' ? 'active' : ''}`}
                      onClick={() => setProjectDetailTab('info')}
                    >
                      <FileText size={18} />
                      プロジェクト情報
                    </button>
                  </div>

                  {projectDetailTab === 'analytics' && (
                    <AnalyticsChart projectId={selectedProject.id} />
                  )}

                  {projectDetailTab === 'info' && (
                    <div className="project-info-section">
                      <div className="info-card">
                        <h4>基本情報</h4>
                        <div className="info-row">
                          <span className="info-label">タイトル:</span>
                          <span className="info-value">
                            {selectedProject.content?.siteConfig?.seo?.title || '未設定'}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">スライド数:</span>
                          <span className="info-value">
                            {selectedProject.content?.slides?.length || 0}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">作成日:</span>
                          <span className="info-value">
                            {new Date(selectedProject.created_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">更新日:</span>
                          <span className="info-value">
                            {new Date(selectedProject.updated_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                      </div>
                      <div className="info-actions">
                        <button
                          className="action-primary-btn"
                          onClick={() => onSelectProject(selectedProject)}
                        >
                          <Edit size={18} />
                          編集する
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="analytics-project-list">
                  <p className="analytics-instruction">
                    分析を表示するプロジェクトを選択してください
                  </p>
                  <div className="projects-grid">
                    {projects.map((project) => (
                      <div 
                        key={project.id} 
                        className="project-card analytics-card"
                        onClick={() => handleProjectClick(project)}
                      >
                        <div className="project-thumbnail">
                          {project.content?.slides?.[0]?.src ? (
                            <img 
                              src={project.content.slides[0].src} 
                              alt="thumbnail" 
                            />
                          ) : (
                            <div className="project-placeholder">
                              <FileText size={32} color="#9CA3AF" />
                            </div>
                          )}
                        </div>
                        <div className="project-info">
                          <h3 className="project-title">
                            {project.content?.siteConfig?.seo?.title || '無題のプロジェクト'}
                          </h3>
                          <p className="project-meta">
                            {project.content?.slides?.length || 0} スライド
                            {' • '}
                            {new Date(project.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <div className="project-actions">
                          <button
                            className="action-btn analytics-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                            title="分析を見る"
                          >
                            <BarChart3 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              */}
            </div>
          )}

          {activeSidebarMenu === 'settings' && (
            <div className="settings-section">
              <h2>設定</h2>
              
              {/* アカウント設定セクション */}
              <div className="settings-card">
                <h3 className="settings-card-title">アカウント設定</h3>
                <div className="settings-card-content">
                  <div className="settings-field">
                    <label className="settings-label">ユーザー名</label>
                    <div className="settings-value">
                      {user?.user_metadata?.name || user?.email?.split('@')[0] || '未設定'}
                    </div>
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">メールアドレス</label>
                    <div className="settings-value">
                      {user?.email || '未設定'}
                    </div>
                  </div>
                </div>
              </div>

              {/* LP個別設定の案内 */}
              <div className="settings-card">
                <h3 className="settings-card-title">LP個別設定</h3>
                <div className="settings-card-content">
                  <div className="settings-info-message">
                    <div className="settings-info-icon">ℹ️</div>
                    <div className="settings-info-text">
                      <p className="settings-info-title">Clarity/GTM連携、SEO設定について</p>
                      <p className="settings-info-description">
                        LP個別の設定は、各LP編集画面のサイドバー「設定」タブから行えます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

