'use client'
import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { useParams } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import '@/styles/PublicLP.css';
import { supabase, trackEvent } from '@/lib/supabase/client';

function PublicLP() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      // プロジェクトデータを取得
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('status', 'published')
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('LP not found');
        setLoading(false);
        return;
      }

      setProject(data);

      // 閲覧イベントを記録
      if (data.id) {
        await trackEvent(data.id, 'view');
      }
    } catch (err) {
      console.error('プロジェクト読み込みエラー:', err);
      setError('LP not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCtaClick = async () => {
    if (project?.id) {
      await trackEvent(project.id, 'cta_click');
    }
    // CTAクリック時の処理（フォーム表示など）
  };

  // 早期リターン（すべてのHooksの後）
  if (loading) {
    return (
      <div className="public-lp-container">
        <div className="public-lp-loading">
          <div className="loading-spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="public-lp-container">
        <div className="public-lp-error">
          <h1>404</h1>
          <p>LPが見つかりません</p>
          <p className="error-message">{error || 'このLPは存在しないか、公開されていません。'}</p>
        </div>
      </div>
    );
  }

  const slides = project.content?.slides || [];
  const siteConfig = project.content?.siteConfig || {
    seo: { title: '', description: '' },
    sns: { instagram: '', line: '' },
    globalNav: []
  };
  const formConfig = project.content?.formConfig || { title: '', fields: [] };
  const floatingCta = project.content?.floatingCta || { enabled: false, text: '', url: '' };
  const showFloatingButton = project.content?.showFloatingButton || false;

  const clarityId = project.content?.clarityProjectId;
  const gtmId = project.content?.gtmId;

  return (
    <div className="public-lp-container">
      {clarityId && clarityId.trim() && (
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`
          }}
        />
      )}
      {gtmId && gtmId.trim() && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
          }}
        />
      )}
      <div className="public-lp-wrapper">
        <div className="global-nav">
          <div className="nav-logo">◇</div>
          <div className="nav-menu">
            {siteConfig.globalNav.map((n, i) => (
              <span key={i} className="nav-item">≡</span>
            ))}
          </div>
        </div>

        <Swiper
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
          className="public-swiper"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          touchEventsTarget="container"
          allowTouchMove={true}
          speed={600}
          effect="slide"
          cssMode={false}
          touchRatio={1.5}
          resistance={true}
          resistanceRatio={0.85}
          freeMode={false}
          followFinger={true}
          longSwipesRatio={0.3}
          shortSwipes={true}
          style={{ touchAction: 'pan-y', height: '100%', width: '100%' }}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id || index}>
              <div className="slide-content">
                {slide.type === 'video' ? (
                  <video src={slide.src} className="bg-media" autoPlay loop muted playsInline />
                ) : (
                  <img src={slide.src} alt="bg" className="bg-media" />
                )}
                <div className="bg-overlay"></div>
                <div
                  className="content-layer"
                  style={{ color: slide.overlay?.color || '#ffffff', textAlign: slide.overlay?.align || 'center' }}
                >
                  <h2 className="slide-title">
                    {(slide.overlay?.title || '').split('\n').map((t, i) => (
                      <span key={i}>{t}<br/></span>
                    ))}
                  </h2>
                  {slide.overlay?.subtitle && (
                    <p className="slide-subtitle">{slide.overlay.subtitle}</p>
                  )}
                  {slide.overlay?.buttonText && (
                    <button
                      className="cta-button"
                      onClick={handleCtaClick}
                    >
                      {slide.overlay.buttonText}
                    </button>
                  )}
                  <div className="sns-icons">
                    {siteConfig.sns?.line && <span className="sns-icon line">L</span>}
                    {siteConfig.sns?.instagram && <span className="sns-icon insta">I</span>}
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

        {/* フローティング予約ボタン */}
        {showFloatingButton && formConfig.title && (
          <button
            className="floating-reserve-btn"
            onClick={handleCtaClick}
          >
            {formConfig.title}
          </button>
        )}
      </div>
    </div>
  );
}

export default PublicLP;
