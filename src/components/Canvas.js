import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import './Canvas.css';
import { trackEvent } from '../supabaseClient';

function Canvas({ 
  slides, 
  activeIndex, 
  setActiveIndex, 
  siteConfig, 
  formConfig,
  isFormOpen,
  setIsFormOpen,
  formStep,
  setFormStep,
  formData,
  setFormData,
  submitForm,
  showFloatingButton,
  floatingCta,
  clarityProjectId,
  swiperRef: externalSwiperRef,
  projectId
}) {
  // 内部でSwiperインスタンスを管理
  const internalSwiperRef = useRef(null);

  // Clarityスクリプトの埋め込み
  useEffect(() => {
    if (clarityProjectId && clarityProjectId.trim()) {
      // 既存のClarityスクリプトを削除
      const existingScript = document.getElementById('clarity-script');
      if (existingScript) {
        existingScript.remove();
      }

      // 新しいClarityスクリプトを追加
      const script = document.createElement('script');
      script.id = 'clarity-script';
      script.type = 'text/javascript';
      script.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityProjectId}");
      `;
      document.head.appendChild(script);
    }
  }, [clarityProjectId]);

  // activeIndexが変更されたときにSwiperを同期
  useEffect(() => {
    const swiper = internalSwiperRef.current;
    
    console.log('⚡ Canvas useEffect: activeIndex変更', {
      activeIndex,
      slidesLength: slides.length,
      hasSwiperInstance: !!swiper,
      currentSwiperIndex: swiper?.activeIndex
    });

    if (!swiper) {
      console.warn('⚠️ Canvas: Swiperインスタンスが存在しません');
      return;
    }
    
    const currentSwiperIndex = swiper.activeIndex;
    
    console.log('🔍 Canvas: Swiper状態確認', {
      activeIndex,
      currentSwiperIndex,
      slides: swiper.slides?.length,
      initialized: swiper.initialized
    });
    
    // インデックスが有効範囲内で、かつSwiperと異なる場合のみ移動
    if (activeIndex >= 0 && activeIndex < slides.length && currentSwiperIndex !== activeIndex) {
      console.log('🎯 Canvas: slideTo実行 ->', activeIndex);
      try {
        swiper.slideTo(activeIndex, 300);
        console.log('✅ Canvas: slideTo完了');
      } catch (error) {
        console.error('❌ Canvas: slideTo失敗', error);
      }
    } else {
      console.log('⏭️ Canvas: slideTo不要 (インデックスが同じ or 範囲外)', {
        activeIndex,
        currentSwiperIndex,
        isInRange: activeIndex >= 0 && activeIndex < slides.length
      });
    }
  }, [activeIndex, slides.length]);

  // プレビュー表示時のトラッキング（初回のみ）
  // TODO: Phase 2 - 独自分析機能を実装する際に有効化
  // 現在はClarityとGTMで分析を行うため、この機能は無効化しています
  /*
  useEffect(() => {
    if (projectId) {
      trackEvent(projectId, 'view');
    }
  }, [projectId]); // 初回マウント時のみ実行
  */

  // CTAクリックハンドラー
  const handleCtaClick = async () => {
    // TODO: Phase 2 - 独自分析機能を実装する際に有効化
    /*
    if (projectId) {
      await trackEvent(projectId, 'cta_click');
    }
    */
    setIsFormOpen(true);
    setFormStep('input');
  };

  return (
    <div className="canvas-area">
      <div className="canvas-container">
        <div className="canvas-preview-wrapper">
          <div className="canvas-preview-frame">
            <div className="lp-container">
              <div className="global-nav">
                <div className="nav-logo">◇</div>
                <div className="nav-menu">
                  {siteConfig.globalNav.map((n, i) => (
                    <span key={i} className="nav-item">≡</span>
                  ))}
                </div>
              </div>
              <Swiper
                onSwiper={(swiper) => {
                  console.log('🎬 Canvas: Swiperインスタンス取得', {
                    activeIndex: swiper.activeIndex,
                    slidesLength: swiper.slides?.length,
                    initialized: swiper.initialized,
                    height: swiper.height,
                    width: swiper.width
                  });
                  // 内部refに保存
                  internalSwiperRef.current = swiper;
                  // 外部refにも保存（互換性のため）
                  if (externalSwiperRef) {
                    externalSwiperRef.current = swiper;
                  }
                }}
                direction="vertical"
                slidesPerView={1}
                mousewheel={{
                  enabled: true,
                  forceToAxis: true
                }}
                keyboard={{
                  enabled: true,
                  onlyInViewport: true
                }}
                modules={[Mousewheel, Keyboard]}
                className="mySwiper"
                onSlideChange={(swiper) => {
                  // Swiperのスライド変更（スワイプ等）時にactiveIndexを更新
                  const newIndex = swiper.activeIndex;
                  console.log('👆 Canvas: Swiperスライド変更イベント', {
                    newIndex,
                    currentActiveIndex: activeIndex,
                    isDifferent: newIndex !== activeIndex
                  });
                  if (newIndex !== activeIndex) {
                    console.log('✏️ Canvas: setActiveIndex呼び出し ->', newIndex);
                    setActiveIndex(newIndex);
                  }
                }}
                onSlideChangeTransitionEnd={(swiper) => {
                  console.log('✨ Canvas: スライド遷移完了', swiper.activeIndex);
                }}
                touchEventsTarget="container"
                allowTouchMove={true}
                speed={800}
                effect="slide"
                cssMode={false}
                touchRatio={1.2}
                resistance={true}
                resistanceRatio={0.85}
                followFinger={true}
                longSwipesRatio={0.3}
                shortSwipes={true}
                threshold={10}
                touchAngle={45}
                style={{ 
                  touchAction: 'pan-y',
                  height: '100%',
                  width: '100%'
                }}
                initialSlide={activeIndex}
              >
                {slides.map((slide) => {
                  // テンプレートコンテンツの取得
                  const templateContent = slide?.templateContent || slide?.content || {};
                  const slideType = slide?.type || 'default';
                  
                  // 背景画像の取得（未設定の場合はUnsplashから）
                  const bgImage = slide?.src || slide?.backgroundImage || templateContent?.backgroundImage || 
                    (slideType !== 'default' ? `https://source.unsplash.com/800x600/?massage,therapy,wellness,${slideType}` : '');
                  
                  // 共通データの取得
                  const overlayColor = slide?.overlay?.color || slide?.bgColor || '#333333';
                  const overlayAlign = slide?.overlay?.align || 'center';
                  const slideTitle = slide?.overlay?.title || slide?.headline || templateContent?.headline || '';
                  const slideSubtitle = slide?.overlay?.subtitle || slide?.subheadline || templateContent?.subheadline || '';
                  const buttonText = slide?.overlay?.buttonText || slide?.ctaText || templateContent?.ctaButton?.text || '';
                  
                  return (
                    <SwiperSlide key={slide.id}>
                      <div 
                        className={`slide-content slide-type-${slideType}`}
                        style={{ backgroundColor: slide?.bgColor || '#FFFFFF' }}
                      >
                        {/* 背景画像またはビデオ */}
                        {slide.type === 'video' ? (
                          <video src={bgImage} className="bg-media" autoPlay loop muted playsInline />
                        ) : bgImage ? (
                          <img src={bgImage} alt="bg" className="bg-media" />
                        ) : null}
                        
                        {/* スライドタイプ別のレンダリング */}
                        {slideType === 'hero' && (
                          <div className="template-hero">
                            <div className="hero-content">
                              <h1 className="hero-title">{slideTitle}</h1>
                              <p className="hero-subtitle">{slideSubtitle}</p>
                              {templateContent?.description && (
                                <p className="hero-description">{templateContent.description}</p>
                              )}
                              {buttonText && (
                                <button className="hero-cta-button" onClick={handleCtaClick}>
                                  {buttonText}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {slideType === 'problems' && (
                          <div className="template-problems">
                            <h2 className="problems-title">{slideTitle}</h2>
                            <ul className="problems-list">
                              {templateContent?.items?.map((item, i) => (
                                <li key={i} className="problems-item">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {slideType === 'cause' && (
                          <div className="template-cause">
                            <h2 className="cause-title">{slideTitle}</h2>
                            <p className="cause-description">{templateContent?.description}</p>
                            <ul className="cause-points">
                              {templateContent?.points?.map((point, i) => (
                                <li key={i} className="cause-point">
                                  <span className="point-icon">✓</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {slideType === 'solution' && (
                          <div className="template-solution">
                            <h2 className="solution-title">{slideTitle}</h2>
                            <p className="solution-description">{templateContent?.description}</p>
                            <ul className="solution-features">
                              {templateContent?.features?.map((feature, i) => (
                                <li key={i} className="solution-feature">{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {slideType === 'features' && (
                          <div className="template-features">
                            <h2 className="features-title">{slideTitle}</h2>
                            <div className="features-grid">
                              {templateContent?.features?.map((feature, i) => (
                                <div key={i} className="feature-card">
                                  <div className="feature-number">{feature.number}</div>
                                  <h3 className="feature-card-title">{feature.title}</h3>
                                  <p className="feature-card-description">{feature.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {slideType === 'testimonials' && (
                          <div className="template-testimonials">
                            <h2 className="testimonials-title">{slideTitle}</h2>
                            <div className="testimonials-list">
                              {templateContent?.testimonials?.map((testimonial, i) => (
                                <div key={i} className="testimonial-card">
                                  <div className="testimonial-quote">"</div>
                                  <p className="testimonial-text">{testimonial.text}</p>
                                  <p className="testimonial-name">{testimonial.name}</p>
                                  <div className="testimonial-rating">
                                    {'★'.repeat(testimonial.rating || 5)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {slideType === 'pricing' && (
                          <div className="template-pricing">
                            <h2 className="pricing-title">{slideTitle}</h2>
                            <div className="pricing-table">
                              {templateContent?.prices?.map((price, i) => (
                                <div key={i} className={`price-card ${i === 0 ? 'price-featured' : ''}`}>
                                  <h3 className="price-name">{price.name}</h3>
                                  {price.originalPrice && (
                                    <p className="price-original">{price.originalPrice}</p>
                                  )}
                                  <p className="price-amount">{price.price}</p>
                                  <p className="price-note">{price.note}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {slideType === 'access' && (
                          <div className="template-access">
                            <h2 className="access-title">{slideTitle}</h2>
                            <div className="access-content">
                              <div className="access-info">
                                {templateContent?.info && Object.entries(templateContent.info).map(([key, value]) => (
                                  <div key={key} className="access-item">
                                    <strong>{key === 'name' ? '施設名' : key === 'address' ? '住所' : key === 'access' ? 'アクセス' : key === 'hours' ? '営業時間' : key === 'closed' ? '定休日' : key === 'phone' ? '電話' : key}:</strong>
                                    <span>{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {slideType === 'cta' && (
                          <div className="template-cta">
                            <h2 className="cta-title">{slideTitle}</h2>
                            <p className="cta-description">{templateContent?.description}</p>
                            <div className="cta-buttons">
                              {templateContent?.ctaButtons?.map((btn, i) => (
                                <a 
                                  key={i} 
                                  href={btn.link} 
                                  className={`cta-btn cta-btn-${btn.style}`}
                                  style={{ backgroundColor: btn.bgColor }}
                                >
                                  {btn.text}
                                </a>
                              ))}
                            </div>
                            {templateContent?.note && (
                              <p className="cta-note">{templateContent.note}</p>
                            )}
                          </div>
                        )}
                        
                        {/* デフォルトスライド（従来の形式） */}
                        {slideType === 'default' && (
                          <>
                            <div className="bg-overlay"></div>
                            <div 
                              className="content-layer" 
                              style={{ color: overlayColor, textAlign: overlayAlign }}
                            >
                              {slideTitle && (
                                <h2 className="slide-title">
                                  {slideTitle.split('\n').map((t, i) => (
                                    <span key={i}>{t}<br/></span>
                                  ))}
                                </h2>
                              )}
                              {slideSubtitle && (
                                <p className="slide-subtitle">{slideSubtitle}</p>
                              )}
                              {buttonText && (
                                <button 
                                  className="cta-button" 
                                  onClick={handleCtaClick}
                                >
                                  {buttonText}
                                </button>
                              )}
                              <div className="sns-icons">
                                {siteConfig.sns.line && <span className="sns-icon line">L</span>}
                                {siteConfig.sns.instagram && <span className="sns-icon insta">I</span>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              
              {/* フローティングCTA */}
              {floatingCta.enabled && floatingCta.url && floatingCta.text && (
                <a
                  href={floatingCta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="floating-cta-button"
                >
                  {floatingCta.text}
                </a>
              )}

              {/* フローティング予約ボタン（既存） */}
              {showFloatingButton && formConfig.title && (
                <button
                  className="floating-reserve-btn"
                  onClick={async () => {
                    // TODO: Phase 2 - 独自分析機能を実装する際に有効化
                    /*
                    if (projectId) {
                      await trackEvent(projectId, 'cta_click');
                    }
                    */
                    setIsFormOpen(true);
                    setFormStep('input');
                  }}
                >
                  {formConfig.title}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <button className="close-btn" onClick={() => setIsFormOpen(false)}>×</button>
            {formStep === 'input' ? (
              <form onSubmit={submitForm}>
                <h3>{formConfig.title}</h3>
                <div className="form-fields-scroll">
                  {formConfig.fields.map(f => (
                    <div key={f.id} className="form-group">
                      <label>
                        {f.label} {f.required && <span className="badge-required">必須</span>}
                      </label>
                      {['text','tel','date','datetime-local'].includes(f.type) && (
                        <input 
                          type={f.type} 
                          required={f.required} 
                          onChange={e => setFormData({...formData, [f.label]: e.target.value})} 
                        />
                      )}
                      {f.type === 'textarea' && (
                        <textarea 
                          required={f.required} 
                          onChange={e => setFormData({...formData, [f.label]: e.target.value})} 
                        />
                      )}
                      {f.type === 'radio' && (
                        <div className="radio-group">
                          {f.options.split(',').map(o => (
                            <label key={o} className="radio-label">
                              <input 
                                type="radio" 
                                name={f.id} 
                                value={o.trim()} 
                                onChange={e => setFormData({...formData, [f.label]: e.target.value})} 
                              />
                              {o.trim()}
                            </label>
                          ))}
                        </div>
                      )}
                      {f.type === 'checkbox' && (
                        <div className="checkbox-group">
                          {f.options.split(',').map(o => (
                            <label key={o} className="checkbox-label">
                              <input 
                                type="checkbox" 
                                value={o.trim()} 
                                onChange={e => { 
                                  const v = formData[f.label] || []; 
                                  setFormData({
                                    ...formData, 
                                    [f.label]: e.target.checked 
                                      ? [...v, o.trim()] 
                                      : v.filter(x => x !== o.trim())
                                  }); 
                                }} 
                              />
                              {o.trim()}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button type="submit" className="submit-btn">送信</button>
              </form>
            ) : (
              <div className="form-success">
                <h3>送信完了</h3>
                <button className="submit-btn" onClick={() => setIsFormOpen(false)}>閉じる</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Canvas;

