import React, { useMemo } from 'react';
import './PropertyPanel.css';

function PropertyPanel({ 
  activeMenu,
  setActiveMenu,
  slides, 
  activeIndex,
  setActiveIndex, 
  siteConfig, 
  setSiteConfig,
  formConfig,
  setFormConfig,
  updateSlide,
  addSlide,
  deleteSlide,
  fileInputRef,
  handleMediaUpload,
  prompt,
  setPrompt,
  handleGenerateImage,
  isGenerating,
  restoreFromHistory,
  PLAN_LIMITS,
  currentPlan,
  showFloatingButton,
  setShowFloatingButton,
  floatingCta,
  setFloatingCta,
  clarityProjectId,
  setClarityProjectId,
  gtmId,
  setGtmId,
  customDomain,
  setCustomDomain,
  IS_PRO_PLAN,
  swiperRef
}) {
  // activeIndexに基づいて現在のスライドを取得（確実に同期）
  const currentSlide = useMemo(() => {
    if (slides.length === 0) return null;
    const index = activeIndex >= 0 && activeIndex < slides.length ? activeIndex : 0;
    const slide = slides[index];
    console.log('📋 PropertyPanel: currentSlide更新 ->', index, slide?.overlay?.title);
    return slide;
  }, [slides, activeIndex]);

  const renderContent = () => {
    switch (activeMenu) {
      case 'slides':
        return (
          <div className="property-content">
            <div className="property-section">
              <div className="property-section-header">
                <h3>スライド管理</h3>
                <div className="property-actions">
                  <button onClick={deleteSlide} className="btn-xs-danger">削除</button>
                  <button onClick={addSlide} className="btn-xs-primary">追加</button>
                </div>
              </div>
              <div className="slide-list">
                {slides.map((s, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <div 
                      key={s.id} 
                      className={`slide-thumb ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        console.log('🖱️ PropertyPanel: スライド選択 ->', i, '現在のactiveIndex:', activeIndex);
                        // 親コンポーネント（App.js）の状態を更新
                        // Canvas側のuseEffectが自動的にSwiperを同期する
                        setActiveIndex(i);
                      }}
                    >
                      {s.type === 'video' ? (
                        <div className="video-thumb">VIDEO</div>
                      ) : (
                        <div style={{backgroundImage: `url(${s.src})`}} className="img-thumb"/>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="property-content">
            <div className="property-section">
              <h3>背景メディア</h3>
              <input 
                type="file" 
                accept="image/*,video/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleMediaUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn-outline full-width"
              >
                📁 アップロード
              </button>
              <div className="ai-gen-box">
                <input 
                  type="text" 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="例: luxury spa" 
                />
                <button 
                  onClick={handleGenerateImage} 
                  disabled={isGenerating} 
                  className="btn-gradient"
                >
                  {isGenerating ? "..." : "AI生成"}
                </button>
              </div>
              {currentSlide && currentSlide.history && currentSlide.history.length > 0 && (
                <div className="history-box">
                  <h4>🕒 履歴 (直近{PLAN_LIMITS[currentPlan]})</h4>
                  <div className="history-list">
                    {currentSlide.history.map((h, i) => (
                      <div key={i} className="history-item" onClick={() => restoreFromHistory(h)}>
                        <div 
                          className="history-thumb" 
                          style={h.type === 'image' ? {backgroundImage: `url(${h.src})`} : {background: '#000'}}
                        >
                          {h.type === 'video' && '▶'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="property-section">
              <h3>テキスト設定</h3>
              {currentSlide ? (
                <>
                  <label>タイトル</label>
                  <textarea 
                    value={currentSlide.overlay?.title || currentSlide.headline || ''} 
                    onChange={e => {
                      // 既存構造とテンプレート構造の両方を更新
                      updateSlide('overlay.title', e.target.value);
                      updateSlide('headline', e.target.value);
                    }} 
                  />
                  <label>サブタイトル</label>
                  <textarea 
                    value={currentSlide.overlay?.subtitle || currentSlide.subheadline || ''} 
                    onChange={e => {
                      updateSlide('overlay.subtitle', e.target.value);
                      updateSlide('subheadline', e.target.value);
                    }} 
                  />
                  <label>ボタンテキスト</label>
                  <input 
                    type="text" 
                    value={currentSlide.overlay?.buttonText || currentSlide.ctaText || ''} 
                    onChange={e => {
                      updateSlide('overlay.buttonText', e.target.value);
                      updateSlide('ctaText', e.target.value);
                    }} 
                  />
                  <label>テキスト色</label>
                  <input 
                    type="color" 
                    value={currentSlide.overlay?.color || currentSlide.bgColor || '#ffffff'} 
                    onChange={e => {
                      updateSlide('overlay.color', e.target.value);
                      updateSlide('bgColor', e.target.value);
                    }} 
                  />
                  <label>配置</label>
                  <select 
                    value={currentSlide.overlay?.align || 'center'} 
                    onChange={e => updateSlide('overlay.align', e.target.value)}
                  >
                    <option value="left">左</option>
                    <option value="center">中央</option>
                    <option value="right">右</option>
                  </select>
                </>
              ) : (
                <p className="property-empty">スライドがありません</p>
              )}
            </div>
          </div>
        );

      case 'parts':
        return (
          <div className="property-content">
            <div className="property-section">
              <h3>追従ボタン設定</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={floatingCta.enabled} 
                  onChange={(e) => setFloatingCta({...floatingCta, enabled: e.target.checked})}
                  style={{ width: 'auto' }}
                />
                <span>追従ボタンを表示する</span>
              </label>
              {floatingCta.enabled && (
                <>
                  <label>ボタン文言</label>
                  <input 
                    type="text" 
                    value={floatingCta.text || ''} 
                    onChange={(e) => setFloatingCta({...floatingCta, text: e.target.value})}
                    placeholder="例: 今すぐ問い合わせる"
                  />
                  <label>リンク先URL</label>
                  <input 
                    type="url" 
                    value={floatingCta.url || ''} 
                    onChange={(e) => setFloatingCta({...floatingCta, url: e.target.value})}
                    placeholder="https://example.com"
                  />
                </>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="property-content">
            <div className="property-section">
              <h3>分析連携</h3>
              <label>Microsoft Clarity Project ID</label>
              <input 
                type="text" 
                value={clarityProjectId || ''} 
                onChange={e => setClarityProjectId(e.target.value)}
                placeholder="例: abc123xyz"
              />
              <div className="hint">
                Clarity Project IDを入力すると、公開LP閲覧時に自動的にスクリプトが埋め込まれます
              </div>
              
              <label style={{ marginTop: '16px' }}>Google Tag Manager ID</label>
              <input 
                type="text" 
                value={gtmId || ''} 
                onChange={e => setGtmId(e.target.value)}
                placeholder="例: GTM-XXXXXXX"
              />
              <div className="hint">
                GTM IDを入力すると、公開LP閲覧時に自動的にスクリプトが埋め込まれます
              </div>
            </div>
            
            <div className="property-section">
              <h3>SEO設定</h3>
              <label>ページタイトル</label>
              <input 
                type="text" 
                value={siteConfig.seo.title} 
                onChange={e => setSiteConfig({...siteConfig, seo: {...siteConfig.seo, title: e.target.value}})} 
                placeholder="例: 美容サロン｜初回限定50%OFF"
              />
              <div className="hint">
                検索結果に表示されるページタイトルです（推奨: 30文字以内）
              </div>
              
              <label style={{ marginTop: '16px' }}>meta description</label>
              <textarea 
                value={siteConfig.seo.description} 
                onChange={e => setSiteConfig({...siteConfig, seo: {...siteConfig.seo, description: e.target.value}})} 
                placeholder="例: 東京・渋谷の美容サロン。初回限定50%OFFキャンペーン実施中。"
                rows="3"
              />
              <div className="hint">
                検索結果に表示される説明文です（推奨: 120文字以内）
              </div>
              
              <label style={{ marginTop: '16px' }}>OGP画像URL（任意）</label>
              <input 
                type="text" 
                value={siteConfig.seo.ogpImage || ''} 
                onChange={e => setSiteConfig({...siteConfig, seo: {...siteConfig.seo, ogpImage: e.target.value}})} 
                placeholder="https://example.com/image.jpg"
              />
              <div className="hint">
                SNSでシェアされた時に表示される画像URLです（推奨: 1200×630px）
              </div>
            </div>
            <div className="property-section">
              <h3>公開設定</h3>
              <label>独自ドメイン</label>
              <div className="domain-input-wrapper">
                <input 
                  type="text" 
                  value={customDomain || ''} 
                  onChange={e => setCustomDomain(e.target.value)}
                  placeholder="example.com"
                  disabled={!IS_PRO_PLAN}
                  className={!IS_PRO_PLAN ? 'disabled' : ''}
                />
                {!IS_PRO_PLAN && (
                  <div className="pro-plan-badge">
                    Proプラン限定機能です
                  </div>
                )}
              </div>
            </div>
            <div className="property-section">
              <h3>フローティング予約ボタン</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showFloatingButton} 
                  onChange={(e) => setShowFloatingButton(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>フローティング予約ボタンを表示する</span>
              </label>
              <div className="hint">プレビュー画面の右下に常に予約ボタンが表示されます</div>
            </div>
            <div className="property-section">
              <h3>SNS連携</h3>
              <label>LINE</label>
              <input 
                type="text" 
                value={siteConfig.sns.line} 
                onChange={e => setSiteConfig({...siteConfig, sns: {...siteConfig.sns, line: e.target.value}})} 
              />
              <label>Instagram</label>
              <input 
                type="text" 
                value={siteConfig.sns.instagram} 
                onChange={e => setSiteConfig({...siteConfig, sns: {...siteConfig.sns, instagram: e.target.value}})} 
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="property-content">
            <div className="property-section">
              <p className="property-empty">メニューを選択してください</p>
            </div>
          </div>
        );
    }
  };

  const menus = [
    { id: 'slides', icon: '📄', label: '構成' },
    { id: 'design', icon: '🎨', label: 'デザイン' },
    { id: 'parts', icon: '🧩', label: 'パーツ' },
    { id: 'settings', icon: '⚙️', label: '設定' },
  ];

  return (
    <div className="property-panel">
      <div className="property-header">
        <h2>プロパティ</h2>
        {/* モバイル用メニュータブ */}
        <div className="property-mobile-tabs">
          {menus.map((menu) => (
            <button
              key={menu.id}
              className={`property-mobile-tab ${activeMenu === menu.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(menu.id)}
            >
              <span>{menu.icon}</span>
              <span>{menu.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="property-body">
        {renderContent()}
      </div>
    </div>
  );
}

export default PropertyPanel;

