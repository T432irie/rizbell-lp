import React, { useState } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import { templates, categories, getTemplatesByCategory } from '../data/templates';
import './TemplateSelector.css';

function TemplateSelector({ onSelectTemplate, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showBusinessInfoForm, setShowBusinessInfoForm] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    businessHours: '9:00〜20:00',
    closedDays: '日曜・祝日',
    access: '',
    lineUrl: '',
  });

  const filteredTemplates = getTemplatesByCategory(selectedCategory);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    setShowBusinessInfoForm(true);
  };

  const handleBusinessInfoChange = (field, value) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitBusinessInfo = () => {
    // ビジネス情報をテンプレートに適用
    const templateWithBusinessInfo = {
      ...selectedTemplate,
      businessInfo: businessInfo,
    };

    // テンプレートの{{変数}}を実際の値に置き換え
    const processedSlides = selectedTemplate.slides.map(slide => {
      const processedSlide = JSON.parse(JSON.stringify(slide)); // Deep copy
      
      // スライドコンテンツ内の変数を置き換え
      const replaceVariables = (obj) => {
        if (typeof obj === 'string') {
          return obj
            .replace(/\{\{phone\}\}/g, businessInfo.phone)
            .replace(/\{\{lineUrl\}\}/g, businessInfo.lineUrl)
            .replace(/\{\{businessInfo\.name\}\}/g, businessInfo.name)
            .replace(/\{\{businessInfo\.address\}\}/g, businessInfo.address)
            .replace(/\{\{businessInfo\.access\}\}/g, businessInfo.access)
            .replace(/\{\{businessInfo\.businessHours\}\}/g, businessInfo.businessHours)
            .replace(/\{\{businessInfo\.closedDays\}\}/g, businessInfo.closedDays)
            .replace(/\{\{businessInfo\.phone\}\}/g, businessInfo.phone);
        }
        if (typeof obj === 'object' && obj !== null) {
          for (let key in obj) {
            obj[key] = replaceVariables(obj[key]);
          }
        }
        return obj;
      };

      return replaceVariables(processedSlide);
    });

    templateWithBusinessInfo.slides = processedSlides;
    onSelectTemplate(templateWithBusinessInfo);
  };

  const isBusinessInfoValid = () => {
    return businessInfo.name && businessInfo.phone && businessInfo.address;
  };

  if (showBusinessInfoForm) {
    return (
      <div className="template-selector-overlay">
        <div className="template-selector-modal business-info-modal">
          <div className="modal-header">
            <h2>基本情報の入力</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <p className="form-description">
              テンプレートに表示される情報を入力してください。後から編集することもできます。
            </p>

            <div className="business-info-form">
              <div className="form-group">
                <label className="required">店舗・施設名</label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => handleBusinessInfoChange('name', e.target.value)}
                  placeholder="例: ○○整体院"
                />
              </div>

              <div className="form-group">
                <label className="required">電話番号</label>
                <input
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => handleBusinessInfoChange('phone', e.target.value)}
                  placeholder="例: 03-1234-5678"
                />
              </div>

              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => handleBusinessInfoChange('email', e.target.value)}
                  placeholder="例: info@example.com"
                />
              </div>

              <div className="form-group">
                <label className="required">住所</label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => handleBusinessInfoChange('address', e.target.value)}
                  placeholder="例: 東京都渋谷区○○1-2-3"
                />
              </div>

              <div className="form-group">
                <label>アクセス</label>
                <input
                  type="text"
                  value={businessInfo.access}
                  onChange={(e) => handleBusinessInfoChange('access', e.target.value)}
                  placeholder="例: 渋谷駅から徒歩5分"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>営業時間</label>
                  <input
                    type="text"
                    value={businessInfo.businessHours}
                    onChange={(e) => handleBusinessInfoChange('businessHours', e.target.value)}
                    placeholder="例: 9:00〜20:00"
                  />
                </div>

                <div className="form-group">
                  <label>定休日</label>
                  <input
                    type="text"
                    value={businessInfo.closedDays}
                    onChange={(e) => handleBusinessInfoChange('closedDays', e.target.value)}
                    placeholder="例: 日曜・祝日"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>LINE予約URL</label>
                <input
                  type="url"
                  value={businessInfo.lineUrl}
                  onChange={(e) => handleBusinessInfoChange('lineUrl', e.target.value)}
                  placeholder="例: https://line.me/R/ti/p/@xxx"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="btn-secondary" 
              onClick={() => setShowBusinessInfoForm(false)}
            >
              戻る
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSubmitBusinessInfo}
              disabled={!isBusinessInfoValid()}
            >
              テンプレートを適用
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="template-selector-overlay">
      <div className="template-selector-modal">
        <div className="modal-header">
          <h2>テンプレートを選択</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* カテゴリーフィルター */}
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* テンプレート一覧 */}
          <div className="templates-grid">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateClick(template)}
              >
                <div className="template-thumbnail">
                  <div className="template-preview">
                    <div 
                      className="preview-color" 
                      style={{ backgroundColor: template.style.primaryColor }}
                    />
                    <div className="preview-info">
                      <span className="slide-count">{template.slides.length}スライド</span>
                    </div>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <div className="selected-badge">
                      <Check size={20} />
                    </div>
                  )}
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* テンプレート詳細（選択時） */}
          {selectedTemplate && (
            <div className="template-detail">
              <h3>テンプレート詳細</h3>
              <div className="detail-content">
                <div className="detail-section">
                  <h4>スライド構成</h4>
                  <ul className="slide-list">
                    {selectedTemplate.slides.map((slide, index) => (
                      <li key={slide.id}>
                        <span className="slide-number">{index + 1}</span>
                        <span className="slide-name">{slide.name}</span>
                        <ChevronRight size={16} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="detail-section">
                  <h4>カラー設定</h4>
                  <div className="color-palette">
                    <div className="color-item">
                      <div 
                        className="color-box" 
                        style={{ backgroundColor: selectedTemplate.style.primaryColor }}
                      />
                      <span>メイン</span>
                    </div>
                    <div className="color-item">
                      <div 
                        className="color-box" 
                        style={{ backgroundColor: selectedTemplate.style.secondaryColor }}
                      />
                      <span>サブ</span>
                    </div>
                    <div className="color-item">
                      <div 
                        className="color-box" 
                        style={{ backgroundColor: selectedTemplate.style.accentColor }}
                      />
                      <span>アクセント</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button 
            className="btn-primary" 
            onClick={handleUseTemplate}
            disabled={!selectedTemplate}
          >
            このテンプレートを使う
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;

