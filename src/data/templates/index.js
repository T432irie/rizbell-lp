/**
 * テンプレート一覧
 * 新しいテンプレートを追加する場合は、ここにインポートして配列に追加してください
 */

import clinicTemplate from './clinic';

// テンプレート一覧
export const templates = [
  clinicTemplate,
  // 今後追加予定:
  // - beautyTemplate (美容サロン)
  // - restaurantTemplate (飲食店)
  // - gymTemplate (フィットネス)
  // - consultingTemplate (コンサルティング)
];

// カテゴリー一覧
export const categories = [
  { id: 'all', name: 'すべて' },
  { id: 'clinic', name: '治療院・整体院' },
  { id: 'beauty', name: '美容サロン' },
  { id: 'restaurant', name: '飲食店' },
  { id: 'gym', name: 'フィットネス' },
  { id: 'consulting', name: 'コンサルティング' },
];

// テンプレートIDで取得
export const getTemplateById = (id) => {
  return templates.find(template => template.id === id);
};

// カテゴリーでフィルター
export const getTemplatesByCategory = (categoryId) => {
  if (categoryId === 'all') return templates;
  return templates.filter(template => template.category === categoryId);
};

export default templates;

