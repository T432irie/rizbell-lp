'use client'
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Search,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  UserCircle
} from 'lucide-react';
import '@/styles/AdminDashboard.css';
import { supabase, fetchAllProjectsForAdmin, fetchAllLeadsForAdmin } from '@/lib/supabase/client';

function AdminDashboard({
  user,
  onLogout,
  onSwitchToUserView
}) {
  const [activeSidebarMenu, setActiveSidebarMenu] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeSidebarMenu === 'projects') {
      loadProjects();
    } else if (activeSidebarMenu === 'leads') {
      loadLeads();
    }
  }, [activeSidebarMenu]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await fetchAllProjectsForAdmin();
      if (error) {
        console.error("プロジェクト読み込みエラー:", error);
        setError(error.message || 'データの取得に失敗しました');
        setProjects([]);
        return;
      }
      setProjects(data || []);
      if (!data || data.length === 0) {
        setError(null); // 0件の場合はエラーではなく、ヒントを表示
      }
    } catch (error) {
      console.error("プロジェクト読み込みエラー:", error);
      setError(error.message || 'データの取得に失敗しました');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const { data, error } = await fetchAllLeadsForAdmin();
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("リード読み込みエラー:", error);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("このプロジェクトを削除しますか？")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

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
    const email = project.user?.email || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const projectTitle = lead.projectTitle || '';
    const ownerEmail = lead.ownerEmail || '';
    const leadData = lead.data ? Object.values(lead.data).join(' ') : '';
    return projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
           ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
           leadData.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sidebarMenus = [
    { id: 'projects', icon: FileText, label: '全プロジェクト' },
    { id: 'leads', icon: Users, label: '全リード' }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* ヘッダー */}
      <header className="admin-dashboard-header">
        <div className="header-left">
          <div className="admin-logo">
            <Shield size={24} />
            <span>Admin Dashboard</span>
          </div>
        </div>
        <div className="header-center">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="header-right">
          <button
            className="switch-view-btn"
            onClick={onSwitchToUserView}
            title="ユーザー画面へ切り替え"
          >
            <UserCircle size={18} />
            <span>ユーザービューへ</span>
          </button>
          <div className="user-menu">
            <div className="user-avatar admin-avatar">
              <Shield size={20} />
            </div>
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              <span className="admin-badge">管理者</span>
            </div>
            <button className="logout-btn" onClick={onLogout} title="ログアウト">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="admin-dashboard-content-wrapper">
        {/* 左サイドバー */}
        <aside className="admin-dashboard-sidebar">
          <nav className="sidebar-nav">
            {sidebarMenus.map((menu) => {
              const Icon = menu.icon;
              return (
                <button
                  key={menu.id}
                  className={`sidebar-menu-item ${activeSidebarMenu === menu.id ? 'active' : ''}`}
                  onClick={() => setActiveSidebarMenu(menu.id)}
                >
                  <Icon size={20} />
                  <span>{menu.label}</span>
                  {activeSidebarMenu === menu.id && <ChevronRight size={16} className="active-indicator" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* メインエリア */}
        <main className="admin-dashboard-main">
          {activeSidebarMenu === 'projects' && (
            <div className="admin-projects-section">
              <div className="section-header">
                <h2>全プロジェクト一覧</h2>
                <div className="section-stats">
                  <span className="stat-badge">合計: {projects.length}件</span>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">読み込み中...</div>
              ) : error ? (
                <div className="error-state">
                  <Shield size={48} color="#EF4444" />
                  <p className="error-message">{error}</p>
                  <p className="error-hint">
                    データが見つかりません。SQLのRLSポリシー設定を確認してください。
                  </p>
                  <button className="retry-btn" onClick={loadProjects}>
                    再読み込み
                  </button>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} color="#9CA3AF" />
                  <p>プロジェクトがありません</p>
                  <p className="empty-hint">
                    データが見つかりません（SQLのポリシー設定を確認してください）
                  </p>
                </div>
              ) : (
                <div className="admin-projects-grid">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="admin-project-card">
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
                        <div className="project-meta-admin">
                          <div className="meta-item">
                            <Mail size={14} />
                            <span>{project.user?.email || '不明'}</span>
                          </div>
                          <div className="meta-item">
                            <FileText size={14} />
                            <span>{project.content?.slides?.length || 0} スライド</span>
                          </div>
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>{new Date(project.created_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                        </div>
                        <div className="project-stats">
                          <span className="stat-item">
                            リード: {project.content?.leads?.length || 0}件
                          </span>
                        </div>
                      </div>
                      <div className="project-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => {
                            // プロジェクト編集は今後実装
                            alert("プロジェクト編集機能は今後実装予定です");
                          }}
                          title="編集"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn preview-btn"
                          onClick={() => {
                            // プロジェクトプレビューは今後実装
                            alert("プロジェクトプレビュー機能は今後実装予定です");
                          }}
                          title="プレビュー"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteProject(project.id)}
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
            <div className="admin-leads-section">
              <div className="section-header">
                <h2>全リード一覧</h2>
                <div className="section-stats">
                  <span className="stat-badge">合計: {leads.length}件</span>
                </div>
              </div>

              {leadsLoading ? (
                <div className="loading-state">読み込み中...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} color="#9CA3AF" />
                  <p>リードがありません</p>
                </div>
              ) : (
                <div className="admin-leads-table-container">
                  <table className="admin-leads-table">
                    <thead>
                      <tr>
                        <th>日時</th>
                        <th>プロジェクト</th>
                        <th>所有者</th>
                        <th>顧客情報</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, index) => (
                        <tr key={lead.id || index}>
                          <td className="lead-date">
                            {lead.date || new Date(lead.projectCreatedAt).toLocaleString('ja-JP')}
                          </td>
                          <td className="lead-project">
                            <div className="project-name">{lead.projectTitle}</div>
                            <div className="project-id">ID: {lead.projectId}</div>
                          </td>
                          <td className="lead-owner">
                            <Mail size={14} />
                            {lead.ownerEmail}
                          </td>
                          <td className="lead-data">
                            {lead.data && Object.entries(lead.data).map(([key, value]) => (
                              <div key={key} className="lead-data-item">
                                <strong>{key}:</strong> {value}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
