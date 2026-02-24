'use client'
import React, { useRef, useEffect } from 'react';
import Script from 'next/script';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import '@/styles/Canvas.css';
import { trackEvent } from '@/lib/supabase/client';

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

  // activeIndexが変更されたときにSwiperを同期
  useEffect(() => {
    const swiper = internalSwiperRef.current;
    if (!swiper) return;

    if (activeIndex >= 0 && activeIndex < slides.length && swiper.activeIndex !== activeIndex) {
      swiper.slideTo(activeIndex, 600);
    }
  }, [activeIndex, slides.length]);

  // プレビュー表示時のトラッキング（初回のみ）
  useEffect(() => {
    if (projectId) {
      trackEvent(projectId, 'view');
    }
  }, [projectId]); // 初回マウント時のみ実行

  // CTAクリックハンドラー
  const handleCtaClick = async () => {
    if (projectId) {
      await trackEvent(projectId, 'cta_click');
    }
    setIsFormOpen(true);
    setFormStep('input');
  };

  return (
    <div className="canvas-area">
      {clarityProjectId && clarityProjectId.trim() && (
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityProjectId}");`
          }}
        />
      )}
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
                  internalSwiperRef.current = swiper;
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
                  const newIndex = swiper.activeIndex;
                  if (newIndex !== activeIndex) {
                    setActiveIndex(newIndex);
                  }
                }}
                touchEventsTarget="container"
                allowTouchMove={true}
                followFinger={true}
                resistanceRatio={0.5}
                speed={600}
                longSwipesRatio={0.3}
                shortSwipes={true}
                threshold={10}
                touchRatio={1.2}
                style={{
                  touchAction: 'pan-y',
                  height: '100%',
                  width: '100%'
                }}
                initialSlide={activeIndex}
              >
                {slides.map((slide) => (
                  <SwiperSlide key={slide.id}>
                    <div className="slide-content">
                      {slide.type === 'video' ? (
                        <video src={slide.src} className="bg-media" autoPlay loop muted playsInline />
                      ) : (
                        <img src={slide.src} alt="bg" className="bg-media" />
                      )}
                      <div className="bg-overlay"></div>
                      <div
                        className="content-layer"
                        style={{ color: slide.overlay.color, textAlign: slide.overlay.align }}
                      >
                        <h2 className="slide-title">
                          {slide.overlay.title.split('\n').map((t, i) => (
                            <span key={i}>{t}<br/></span>
                          ))}
                        </h2>
                        <p className="slide-subtitle">{slide.overlay.subtitle}</p>
                        {slide.overlay.buttonText && (
                          <button
                            className="cta-button"
                            onClick={handleCtaClick}
                          >
                            {slide.overlay.buttonText}
                          </button>
                        )}
                        <div className="sns-icons">
                          {siteConfig.sns.line && <span className="sns-icon line">L</span>}
                          {siteConfig.sns.instagram && <span className="sns-icon insta">I</span>}
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
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
                    if (projectId) {
                      await trackEvent(projectId, 'cta_click');
                    }
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
