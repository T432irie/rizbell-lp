'use client'
import React, { useState } from 'react';
import { X, Sparkles, Building2, Scissors, Utensils, ShoppingBag, Dumbbell } from 'lucide-react';
import '@/styles/TemplateSelector.css';

// 6種類の業種テンプレート
const templates = [
  {
    id: 'esthetic',
    name: 'エステ・美容サロン',
    description: 'エステサロンや美容院向けの洗練されたデザイン',
    icon: Sparkles,
    thumbnail: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=400&auto=format&fit=crop',
    slides: [
      { id: 1, type: "image", src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "本来の美しさを、\n取り戻す。", subtitle: "Winter Campaign 2025", color: "#ffffff", align: "center" } },
      { id: 2, type: "image", src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db48e?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "肌のハリ不足、\n気になりませんか？", subtitle: "原因は「深層乾燥」かも。", color: "#ffffff", align: "left" } },
      { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回限定体験\n¥3,980", subtitle: "", color: "#ffffff", align: "center", buttonText: "今すぐ予約する" } }
    ]
  },
  {
    id: 'clinic',
    name: '治療院・整体院',
    description: '整体院や治療院向けの信頼感のあるデザイン',
    icon: Building2,
    thumbnail: 'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=400&auto=format&fit=crop',
    slides: [
      { id: 1, type: "image", src: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "長年の腰痛、\nあきらめていませんか？", subtitle: "根本改善専門の整体院", color: "#ffffff", align: "center" } },
      { id: 2, type: "image", src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "マッサージに行っても\nすぐ戻ってしまう...", subtitle: "それは「骨盤の歪み」が原因です。", color: "#ffffff", align: "left" } },
      { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回カウンセリング\n無料", subtitle: "1日3名様限定", color: "#ffffff", align: "center", buttonText: "空き状況を確認" } }
    ]
  },
  {
    id: 'salon',
    name: '美容室・ヘアサロン',
    description: '美容室やヘアサロン向けのスタイリッシュなデザイン',
    icon: Scissors,
    thumbnail: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop',
    slides: [
      { id: 1, type: "image", src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "新しい自分に、\n出会う。", subtitle: "あなただけのスタイルを", color: "#ffffff", align: "center" } },
      { id: 2, type: "image", src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "プロの技術で\n理想の髪型へ", subtitle: "カウンセリングから丁寧に", color: "#ffffff", align: "left" } },
      { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回カット\n20%OFF", subtitle: "今すぐ予約", color: "#ffffff", align: "center", buttonText: "予約する" } }
    ]
  },
  {
    id: 'restaurant',
    name: '飲食店・レストラン',
    description: 'レストランやカフェ向けの食欲をそそるデザイン',
    icon: Utensils,
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop',
    slides: [
      { id: 1, type: "image", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "本格的な味を\nお楽しみください", subtitle: "厳選素材で作る特別な料理", color: "#ffffff", align: "center" } },
      { id: 2, type: "image", src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "シェフ自慢の\nこだわりメニュー", subtitle: "季節の食材を活かした料理", color: "#ffffff", align: "left" } },
      { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "ご予約は\nお電話で", subtitle: "03-XXXX-XXXX", color: "#ffffff", align: "center", buttonText: "電話する" } }
    ]
  },
  {
    id: 'retail',
    name: '小売店・ショップ',
    description: '小売店やショップ向けの商品を魅力的に見せるデザイン',
    icon: ShoppingBag,
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop',
    slides: [
      { id: 1, type: "image", src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "あなたのライフスタイルに\nぴったりの商品", subtitle: "厳選されたアイテム", color: "#ffffff", align: "center" } },
      { id: 2, type: "image", src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "品質とデザインに\nこだわった商品", subtitle: "毎日使いたくなるアイテム", color: "#ffffff", align: "left" } },
      { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "今すぐ\nお買い物", subtitle: "送料無料", color: "#ffffff", align: "center", buttonText: "商品を見る" } }
    ]
  },
  {
    id: 'fitness',
    name: 'フィットネス・ジム',
    description: 'ジムやフィットネススタジオ向けのエネルギッシュなデザイン',
    icon: Dumbbell,
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop',
    slides: [
      { id: 1, type: "image", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "理想の体を\n手に入れる", subtitle: "プロトレーナーがサポート", color: "#ffffff", align: "center" } },
      { id: 2, type: "image", src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "あなたに合わせた\nトレーニングプログラム", subtitle: "無理なく続けられる", color: "#ffffff", align: "left" } },
      { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初月無料\n体験レッスン", subtitle: "まずはお試しください", color: "#ffffff", align: "center", buttonText: "体験予約" } }
    ]
  }
];

function TemplateSelector({ isOpen, onClose, onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  if (!isOpen) return null;

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div className="template-selector-overlay" onClick={onClose}>
      <div className="template-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-selector-header">
          <h2>テンプレートを選択</h2>
          <button className="template-selector-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="template-selector-content">
          <div className="template-grid-container">
            <div className="template-grid">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-card-icon">
                      <Icon size={24} />
                    </div>
                    <div className="template-card-thumbnail">
                      <img src={template.thumbnail} alt={template.name} />
                    </div>
                    <div className="template-card-info">
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="template-preview-container">
            {selectedTemplate ? (
              <>
                <div className="phone-preview-frame">
                  <div className="phone-preview-notch"></div>
                  <div className="phone-preview-screen">
                    <div className="phone-preview-swiper">
                      {selectedTemplate.slides.map((slide, index) => (
                        <div key={slide.id || index} className="phone-preview-slide">
                          <img src={slide.src} alt={`Slide ${index + 1}`} className="phone-preview-image" />
                          <div className="phone-preview-overlay">
                            <div className="phone-preview-content" style={{ color: slide.overlay?.color || '#ffffff', textAlign: slide.overlay?.align || 'center' }}>
                              <h3 className="phone-preview-title">
                                {slide.overlay?.title?.split('\n').map((line, i) => (
                                  <React.Fragment key={i}>{line}<br /></React.Fragment>
                                ))}
                              </h3>
                              {slide.overlay?.subtitle && (
                                <p className="phone-preview-subtitle">{slide.overlay.subtitle}</p>
                              )}
                              {slide.overlay?.buttonText && (
                                <button className="phone-preview-button">{slide.overlay.buttonText}</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="select-template-button" onClick={handleSelectTemplate}>
                  このテンプレートで作成
                </button>
              </>
            ) : (
              <div className="preview-placeholder">
                <p>テンプレートを選択してプレビューを表示</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;
