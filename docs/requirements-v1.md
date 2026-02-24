# RizBell LP 要件定義書 v1.0（α設計確定版）

## 0. プロジェクト概要

### 0.1 目的
外注依存のLP制作構造を脱却し、
- 月5本以上のLP制作
- 週2回以上のブロック単位A/B検証
- 勝ちブロックの蓄積

を可能にする「検証回転最大化インフラ」を構築する。

### 0.2 成功条件（KPI）
- 月5本以上のLP作成
- 週2回以上のA/B実行
- 判定ロジックに基づく差分検出
- ブロックランキングが機能している

### 0.3 失敗条件
- A/Bが安定して回らない
- 計測データが信用できない
- 検証速度が上がらない

## 1. 技術構成

| 項目 | 技術 |
|------|------|
| Hosting | Vercel Pro |
| DB / Auth | Supabase |
| 日次バッチ | Vercel Cron |
| LP出し分け | クライアントJS |
| Cookie保持 | 30日 |
| フォーム | WPCF7（外部埋込） |
| CV検知 | /thanks 到達 |

## 2. URL設計

### 2.1 管理画面
https://swip.rizbell.com

### 2.2 LPデフォルトURL
https://lp.rizbell.com/p/{project_slug}/{lp_slug}

### 2.3 独自ドメイン（α）
UI上で：
- custom_domain入力
- DNS手順表示（CNAME）
- 状態表示（pending / active / error）

実際のVercel紐付けは手動。

## 3. 認証・権限

### α
- メール+パスワード
- 1ユーザー運用

### β
- Googleログイン追加
- 同一メールアドレスでアカウント連携

## 4. データモデル（概念設計）

### 4.1 テーブル構成

**projects**
- id
- name
- slug
- custom_domain
- domain_status

**lps**
- id
- project_id
- name
- slug
- status（draft / published）

**lp_versions**
- id
- lp_id
- created_at

**blocks**
- id
- lp_version_id
- type
- order
- content(JSON)
- tracking_id

**experiments**
- id
- lp_id
- block_id
- allocation(JSON)
- status

**events**
- id
- project_id
- lp_id
- block_id
- experiment_id
- variant
- visitor_id
- event_type
- created_at

**daily_metrics**
- project_id
- lp_id
- block_id
- experiment_id
- variant
- uu
- cta
- cv
- score

## 5. A/Bテスト仕様（α）

### 5.1 制約
- 1LPにつき同時実験1つ
- 最大ABC
- 配分変更は翌日反映

### 5.2 割当方式
- visitor_id + experiment_id をhash
- mod 100で配分決定
- cookie固定30日

### 5.3 判定基準

| 各variant 条件 | 判定 |
|----------------|------|
| UU < 100 | 判定保留 |
| 100〜300 | 参考値 |
| 300以上 | 有効 |
| CV < 10 | 強い判定なし |

### 5.4 スコア算出
```
score = CV×5 + CTA×2 + 到達率×1
```
※将来動的重み付け対応

## 6. 計測仕様

### 6.1 visitor_id
- cookie名：rz_visitor_id
- UUID v4
- 30日保持
- 削除時は新規扱い

### 6.2 イベント種別
- page_view
- block_impression
- cta_click
- conversion

### 6.3 CTAクリック
block_id単位で必須記録。

### 6.4 CV計測
- WPCF7送信
- 強制リダイレクト
- /thanks
- 同一visitor + lp + 日付で1回のみ記録

## 7. 日次バッチ（Vercel Cron）

処理内容：
1. events集計
2. UU計算（distinct visitor_id）
3. score算出
4. ranking更新
5. ステータス判定（保留/参考/有効）

## 8. セキュリティ要件（必須）
- 全テーブルRLS有効
- project_idで完全分離
- service_roleはサーバー側のみ
- anon keyはRLSで保護

## 9. UI要件

### 9.1 トンマナ
添付UI（Ptengine風）を参考：
- ネイビーベース
- カードUI
- KPIサマリ上部表示
- 左ナビ or 上部タブ構成
- 余白広め
- SaaS的シンプルUI

### 9.2 必須画面（α）
- ログイン
- プロジェクト一覧
- LP一覧
- LPエディタ
- A/B設定
- 分析画面
- 独自ドメイン設定
- /thanks設定

## 10. 非機能要件
- LP表示はほぼ静的
- クライアントJS出し分け
- LCP配慮
- 99.9%稼働目標
- 生ログ90日保持
- 集計無期限

## 11. αでやらないこと
- リアルタイムランキング
- 自動配分変更
- ブロック横断ランキング
- 他社横断DB
- AI構成提案
- AIデザイン生成
- 自動独自ドメイン検証

## 12. 将来拡張（β以降）
- Googleログイン
- 独自ドメイン自動化
- 重み付け動的化
- ブロック横断ランキング
- AI構成提案
- AIデザイン生成
- ブロックDB高度化
