# RizBell LP マイルストーン計画（Phase1〜3）

## 全体方針

- **B方針（クリーン再構築）** を採用しつつ、UIは最大限再利用する
- CRA → Next.js 移行を Phase0 として最初に実施
- データモデルは段階的移行（dual-write → 切替 → 旧撤去）
- AI連携（OpenAI/Claude）は維持・移植する

---

## Phase 0: 基盤移行（CRA → Next.js + Supabase再接続）

### 目的
Next.js上で現行UIがそのまま動く状態を作る。機能追加はしない。

### 作業内容

| # | タスク | 影響ファイル | リスク |
|---|--------|-------------|--------|
| 0-1 | Next.js プロジェクト初期化（App Router） | 新規: next.config.js, app/layout.tsx, app/page.tsx | 低 |
| 0-2 | 既存コンポーネント移植（src/components/ → components/） | 全15コンポーネント + 10 CSS | 中: DOM API要修正 |
| 0-3 | document.createElement モーダル → React Portal化 | App.js (L398-643) | 中 |
| 0-4 | Clarity/GTM script注入 → next/script | Canvas.js (L34-50), PublicLP.js (L69-118) | 低 |
| 0-5 | window.confirm → カスタムモーダル | Dashboard.js (L104), AdminDashboard.js (L79) | 低 |
| 0-6 | ルーティング移行（react-router-dom → App Router） | App.js, PublicLP.js (useParams) | 中 |
| 0-7 | Supabase dev プロジェクト作成 + .env差替 | .env, supabaseClient.js | 低（ブロッカー解消） |
| 0-8 | AI サービス移植（aiService.js そのまま） | services/aiService.js | 低 |
| 0-9 | Vercel デプロイ設定 | vercel.json, 環境変数 | 低 |

### 完了条件
- `npm run dev` で現行UIが全画面表示される
- Supabase認証（ログイン/サインアップ）が動作する
- 既存プロジェクトCRUD（作成/読込/保存/削除）が動作する
- AI Chat（OpenAI/Claude/デモモード）が動作する
- Vercel にデプロイして swip.rizbell.com でアクセスできる

---

## Phase 1: 正規化DBスキーマ並行追加 + Repository層

### 目的
正規化テーブルを追加し、UIとDB形状を分離するRepository層を挟む。既存JSONB運用は維持。

### 作業内容

| # | タスク | 影響ファイル | リスク |
|---|--------|-------------|--------|
| 1-1 | Supabase に正規化テーブル作成（projects拡張, lps, lp_versions, blocks, experiments, events, daily_metrics） | Supabase SQL | 低: 既存テーブルに影響なし |
| 1-2 | RLS ポリシー設定（全テーブル project_id 分離） | Supabase SQL | 中: 設定ミスでデータ漏洩 |
| 1-3 | Repository層 作成（ProjectRepository, LPRepository, BlockRepository, ExperimentRepository, EventRepository） | 新規: lib/repositories/ | 低 |
| 1-4 | Service層 作成（ProjectService, LPService, ABTestService, AnalyticsService） | 新規: lib/services/ | 低 |
| 1-5 | 既存 supabaseClient.js の関数を Repository経由に段階置換 | supabaseClient.js → lib/repositories/ | 中: 全コンポーネントに波及 |
| 1-6 | projects テーブル拡張（name, slug, custom_domain, domain_status カラム追加） | Supabase SQL | 低 |
| 1-7 | URL設計対応（/p/{project_slug}/{lp_slug}） | app/p/[projectSlug]/[lpSlug]/page.tsx | 低 |
| 1-8 | events テーブル拡張（visitor_id, block_id, experiment_id, variant 追加） | events テーブル, EventRepository | 低 |
| 1-9 | visitor_id Cookie 管理（rz_visitor_id, UUID v4, 30日） | 新規: lib/tracking/visitor.ts | 低 |

### 完了条件
- 正規化テーブルが全て作成されRLS有効
- Repository/Service層経由でCRUDが動作
- 既存UIはRepository層を通じて引き続き動作（見た目変化なし）
- visitor_id が Cookie に正しく発行される

---

## Phase 2: ブロックモデル導入 + LPエディタ刷新

### 目的
「スライド」を「ブロック」に置換。エディタ/キャンバス/プロパティパネルをブロックベースに。

### 作業内容

| # | タスク | 影響ファイル | リスク |
|---|--------|-------------|--------|
| 2-1 | ブロックタイプ定義（hero, text, image, cta, form, testimonial, faq） | 新規: lib/blocks/types.ts | 低 |
| 2-2 | ブロック content JSON スキーマ定義（タイプ別） | 新規: lib/blocks/schemas.ts | 低 |
| 2-3 | Legacy Slide → Block アダプタ作成 | 新規: lib/blocks/adapter.ts | 中 |
| 2-4 | Canvas コンポーネントをブロックレンダラーに改修 | Canvas.js → BlockCanvas.tsx | 高: UI中核 |
| 2-5 | PropertyPanel をブロックエディタに改修 | PropertyPanel.js → BlockEditor.tsx | 高: UI中核 |
| 2-6 | ブロック追加/削除/並替 UI | BlockCanvas.tsx, BlockEditor.tsx | 中 |
| 2-7 | ブロック保存: blocks テーブルへの dual-write | BlockRepository | 中 |
| 2-8 | lp_versions 作成ロジック（公開時にスナップショット） | LPService | 中 |
| 2-9 | PublicLP をブロックレンダラーで再実装 | PublicLP.js → app/p/[]/[]/page.tsx | 高 |
| 2-10 | フォームブロック（自社フォーム標準） | 新規: blocks/FormBlock.tsx | 中 |
| 2-11 | AI Chat をブロック編集に対応 | AIChat.js, aiService.js | 中 |

### 完了条件
- エディタがブロック単位で操作できる
- 既存スライドデータがアダプタ経由で表示される
- 新規作成はブロックモデルで保存される
- PublicLP がブロックレンダラーで正しく表示される
- AI Chat がブロック単位の編集提案を返す

---

## Phase 3: A/Bテスト + 計測 + 日次バッチ

### 目的
A/Bテスト機能、計測パイプライン、日次集計バッチを実装。要件定義の中核機能。

### 作業内容

| # | タスク | 影響ファイル | リスク |
|---|--------|-------------|--------|
| 3-1 | A/B設定画面 UI | 新規: app/projects/[id]/experiments/page.tsx | 中 |
| 3-2 | Edge Middleware: visitor割当（hash + mod100） | 新規: middleware.ts | 高: 本番影響 |
| 3-3 | ブロック出し分けレンダリング（variant A/B/C） | BlockCanvas.tsx, PublicLP | 高 |
| 3-4 | イベント記録拡張（block_impression, conversion） | EventRepository, tracking SDK | 中 |
| 3-5 | /thanks 設定画面 + CV検知ロジック | 新規: app/projects/[id]/thanks/page.tsx | 中 |
| 3-6 | 日次バッチ API Route（Vercel Cron） | 新規: app/api/cron/daily-metrics/route.ts | 高: データ整合性 |
| 3-7 | score 算出ロジック（CV×5 + CTA×2 + 到達率×1） | 新規: lib/services/scoring.ts | 中 |
| 3-8 | 分析画面 刷新（daily_metrics ベース） | AnalyticsChart → AnalyticsDashboard | 中 |
| 3-9 | 判定ステータス表示（保留/参考/有効） | AnalyticsDashboard | 低 |
| 3-10 | 独自ドメイン設定UI（入力 + DNS手順 + 状態表示） | 新規: app/projects/[id]/domain/page.tsx | 低 |
| 3-11 | セキュリティ監査（RLS, service_role分離, 入力検証） | 全テーブル, API Routes | 高 |

### 完了条件
- A/B実験の作成・配分設定・開始/停止ができる
- Edge Middleware でバリアント割当が正しく動作する
- 4種イベント（page_view, block_impression, cta_click, conversion）が記録される
- 日次バッチで daily_metrics が正しく集計される
- 分析画面でスコア・判定ステータスが表示される
- /thanks 設定でCV検知が動作する

---

## フェーズ間依存関係

```
Phase 0 (基盤)
  ↓ 必須
Phase 1 (DB + Repository)
  ↓ 必須
Phase 2 (ブロックモデル)
  ↓ 必須（experiments, events テーブルが必要）
Phase 3 (A/B + 計測)
```

---

## UI再利用マッピング

| 既存コンポーネント | Phase 0 (移植) | Phase 2 (改修) | 再利用度 |
|---|---|---|---|
| Login.js | そのまま | そのまま | 100% |
| Dashboard.js | そのまま | Repository経由に | 80% |
| AdminDashboard.js | そのまま | Repository経由に | 80% |
| Sidebar.js | そのまま | メニュー項目追加 | 90% |
| EditorHeader.js | そのまま | そのまま | 95% |
| Canvas.js | DOM API修正 | BlockCanvas に改修 | 40% |
| PropertyPanel.js | DOM API修正 | BlockEditor に改修 | 40% |
| PublicLP.js | next/script化 | ブロックレンダラー化 | 30% |
| AnalyticsChart.js | そのまま | daily_metrics対応 | 60% |
| AIChat.js | そのまま | ブロック対応 | 70% |
| BottomSheet.js | そのまま | そのまま | 100% |
| TemplateSelector.js | そのまま | ブロックテンプレート化 | 50% |

### AI連携の維持
- `aiService.js` は Phase 0 でそのまま移植
- Phase 2 で `callAI()` の入出力をブロック形式に拡張
- OpenAI / Claude / デモモード の3系統構成は維持
