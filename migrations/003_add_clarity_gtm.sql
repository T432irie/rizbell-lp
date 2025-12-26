-- Clarity と GTM 連携機能のためのカラム追加
-- Microsoft Clarity Project ID と Google Tag Manager ID を保存

-- projects テーブルに clarity_id と gtm_id カラムを追加
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS clarity_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS gtm_id VARCHAR(20);

-- カラムにコメントを追加
COMMENT ON COLUMN projects.clarity_id IS 'Microsoft Clarity Project ID';
COMMENT ON COLUMN projects.gtm_id IS 'Google Tag Manager ID (GTM-XXXXXXX)';

