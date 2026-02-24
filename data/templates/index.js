/**
 * テンプレート一覧のエクスポート
 */
import estheticTemplate from './esthetic';
import clinicTemplate from './clinic';

// 全テンプレートの配列
export const templates = [
  estheticTemplate,
  clinicTemplate
];

// IDでテンプレートを取得
export const getTemplateById = (id) => {
  return templates.find(template => template.id === id);
};

// カテゴリでテンプレートを取得
export const getTemplatesByCategory = (category) => {
  if (category === 'all') {
    return templates;
  }
  return templates.filter(template => template.category === category);
};

// デフォルトエクスポート（後方互換性のため）
export default templates;
