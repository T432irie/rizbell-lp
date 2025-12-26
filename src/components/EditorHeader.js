import React from 'react';
import { ArrowLeft, Save, Globe, CheckCircle2 } from 'lucide-react';
import './EditorHeader.css';

function EditorHeader({ 
  onBack, 
  isSaving, 
  onPublish,
  projectTitle 
}) {
  return (
    <header className="editor-header">
      <div className="editor-header-left">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          ダッシュボードへ戻る
        </button>
      </div>
      <div className="editor-header-center">
        <h1 className="editor-title">
          {projectTitle || '無題のプロジェクト'}
        </h1>
      </div>
      <div className="editor-header-right">
        <div className="save-status">
          {isSaving ? (
            <>
              <div className="save-spinner"></div>
              <span>保存中...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} color="#10B981" />
              <span>保存済み</span>
            </>
          )}
        </div>
        <button className="publish-btn" onClick={onPublish}>
          <Globe size={18} />
          公開
        </button>
      </div>
    </header>
  );
}

export default EditorHeader;

