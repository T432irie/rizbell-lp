'use client'
import React from 'react';
import { FileText, Palette, Puzzle, Settings } from 'lucide-react';
import '@/styles/Sidebar.css';

function Sidebar({ activeMenu, setActiveMenu }) {
  const menus = [
    { id: 'slides', Icon: FileText, label: '構成', description: 'スライド一覧' },
    { id: 'design', Icon: Palette, label: 'デザイン', description: '背景・フォント' },
    { id: 'parts', Icon: Puzzle, label: 'パーツ', description: 'ボタン・画像' },
    { id: 'settings', Icon: Settings, label: '設定', description: 'SEO・ドメイン' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">リズベルLP</div>
      </div>

      <nav className="sidebar-nav">
        {menus.map((menu) => {
          const Icon = menu.Icon;
          return (
            <button
              key={menu.id}
              className={`sidebar-menu-item ${activeMenu === menu.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(menu.id)}
            >
              <Icon size={20} className="menu-icon" />
              <div className="menu-content">
                <span className="menu-label">{menu.label}</span>
                <span className="menu-description">{menu.description}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
