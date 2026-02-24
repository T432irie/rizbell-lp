# CRA → Next.js 移行ステップ（Phase 0 詳細）

## 前提
- Next.js 15 (App Router) を使用
- React 19 互換（既存コードと同じ）
- Vercel Pro にデプロイ
- 既存UIの動作を維持したまま移行

---

## ディレクトリ構造（移行後）

```
/Users/ti/swipe-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト（html/body）
│   ├── page.tsx                  # / → ダッシュボード or ログイン
│   ├── editor/
│   │   └── [projectId]/
│   │       └── page.tsx          # エディタ画面
│   ├── admin/
│   │   └── page.tsx              # 管理者ダッシュボード
│   ├── p/                        # 公開LP（将来: /p/{slug}/{lp}）
│   │   └── [projectId]/
│   │       └── page.tsx          # 公開LP表示
│   ├── api/
│   │   └── cron/
│   │       └── daily-metrics/
│   │           └── route.ts      # 日次バッチ（Phase 3）
│   └── globals.css               # グローバルCSS
├── components/                   # 移植元: src/components/
│   ├── Canvas.tsx
│   ├── PropertyPanel.tsx
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── EditorHeader.tsx
│   ├── Login.tsx
│   ├── PublicLP.tsx
│   ├── AIChat.tsx
│   ├── AnalyticsChart.tsx
│   ├── BottomSheet.tsx
│   ├── TemplateSelector.tsx
│   └── ui/                       # 共通UIコンポーネント
│       └── ConfirmModal.tsx      # window.confirm 置換
├── lib/                          # ビジネスロジック
│   ├── supabase/
│   │   ├── client.ts             # ブラウザ用 Supabase クライアント
│   │   └── server.ts             # サーバー用 Supabase クライアント
│   ├── repositories/             # Phase 1 で追加
│   ├── services/                 # Phase 1 で追加
│   └── tracking/                 # Phase 1 で追加
├── services/
│   └── aiService.ts              # AI連携（移植）
├── styles/                       # コンポーネントCSS
│   ├── Canvas.css
│   ├── Dashboard.css
│   └── ...
├── public/                       # 静的ファイル
├── next.config.js
├── package.json
├── tsconfig.json
├── .env.local                    # 環境変数
└── docs/                         # 設計ドキュメント（既存維持）
```

---

## 移行ステップ（順序厳守）

### Step 0-1: Next.js プロジェクト初期化

**作業:**
1. 現在の `package.json` をバックアップ
2. Next.js 依存追加（next, @types/react, typescript）
3. `next.config.js` 作成
4. `tsconfig.json` 作成（strict: false で開始。.js も許容）
5. CRA の `react-scripts` を削除
6. `public/index.html` の内容を `app/layout.tsx` に移行

**影響:** package.json, ビルドスクリプト
**リスク:** 低。ビルド系のみの変更

**npm scripts 変更:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 既存CSSをそのまま使うため
  transpilePackages: ['swiper'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
}
module.exports = nextConfig
```

### Step 0-2: ルーティング移行

**現状の画面遷移（App.js state ベース）:**
```
!user          → Login
isAdminMode    → AdminDashboard
dashboard      → Dashboard
editor         → Editor (Canvas + Sidebar + PropertyPanel)
/lp/:id        → PublicLP (react-router-dom)
```

**移行後（App Router）:**
```
/              → Dashboard or Login（認証状態で分岐）
/editor/[id]   → Editor
/admin          → AdminDashboard
/p/[id]         → PublicLP（将来: /p/[slug]/[lp]）
```

**作業:**
1. `app/layout.tsx` にSupabase Auth Provider を設置
2. `app/page.tsx` にダッシュボード/ログイン分岐
3. `app/editor/[projectId]/page.tsx` にエディタ
4. `app/admin/page.tsx` に管理者ダッシュボード
5. `app/p/[projectId]/page.tsx` に公開LP
6. `react-router-dom` を削除

**影響:** App.js の全ルーティングロジック、PublicLP の useParams
**リスク:** 中。App.js の巨大な条件分岐を分割する必要あり

### Step 0-3: App.js の分割

現在の App.js（1,294行）を以下に分割:

| 移行先 | 内容 | 行数目安 |
|--------|------|---------|
| `app/page.tsx` | 認証チェック + Dashboard表示 | ~50 |
| `app/editor/[projectId]/page.tsx` | エディタ状態管理 + レンダリング | ~400 |
| `app/admin/page.tsx` | 管理者モード | ~50 |
| `lib/supabase/client.ts` | Supabase初期化 | ~30 |
| `lib/hooks/useProject.ts` | プロジェクト CRUD hooks | ~150 |
| `lib/hooks/useAuth.ts` | 認証 hooks | ~80 |
| `lib/hooks/useAutoSave.ts` | 自動保存 hook | ~50 |
| `components/ui/PublishModal.tsx` | 公開モーダル（DOM API脱却） | ~100 |
| `components/ui/ConfirmModal.tsx` | 確認モーダル（DOM API脱却） | ~50 |

### Step 0-4: DOM API 修正（Next.js 互換化）

| 現在のパターン | 修正方法 | 影響箇所 |
|---|---|---|
| `document.createElement('div')` でモーダル | React state + Portal | App.js L398-643 |
| `document.createElement('script')` でClarity | `next/script` | Canvas.js L34-50, PublicLP.js L69-118 |
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | App.js L617 |
| `window.confirm()` | `<ConfirmModal>` コンポーネント | Dashboard.js, AdminDashboard.js |
| `window.innerWidth` | `useMediaQuery` hook | App.js L86 |
| `document.createElement('a').click()` (CSV) | Blob + URL.createObjectURL | App.js L875-879 |

### Step 0-5: Supabase クライアント分離

**ブラウザ用 (`lib/supabase/client.ts`):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**サーバー用 (`lib/supabase/server.ts`):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  )
}
```

**環境変数の変更:**
```
REACT_APP_SUPABASE_URL      → NEXT_PUBLIC_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_ANON_KEY
REACT_APP_OPENAI_API_KEY    → NEXT_PUBLIC_OPENAI_API_KEY
REACT_APP_CLAUDE_API_KEY    → NEXT_PUBLIC_CLAUDE_API_KEY
```

### Step 0-6: AI サービス移植

`services/aiService.js` → `services/aiService.ts`

**変更点:**
- `process.env.REACT_APP_*` → `process.env.NEXT_PUBLIC_*`
- 型定義の追加（必要最低限）
- ロジックは変更なし

**将来（Phase 2）:**
- API Route 経由にしてAPIキーをサーバーサイドに隠蔽
- ブロック形式の入出力に対応

### Step 0-7: CSS 移行

**方針:** 既存CSSファイルはそのまま維持（CSS Modules への移行は後回し）

**作業:**
1. `src/index.css` → `app/globals.css`
2. `src/App.css` → `app/globals.css` に統合 or `styles/App.css`
3. 各コンポーネントCSS → `styles/` ディレクトリに配置
4. コンポーネント側の `import './Foo.css'` → `import '@/styles/Foo.css'`

### Step 0-8: Supabase dev プロジェクト作成

**作業:**
1. https://supabase.com で新規プロジェクト作成（dev用）
2. projects テーブル作成（現行スキーマ）
3. analytics_events テーブル作成
4. RLS ポリシー設定
5. `.env.local` に新しいURL/Key を設定
6. 動作確認

### Step 0-9: Vercel デプロイ

**作業:**
1. GitHub リポジトリ接続
2. Vercel Pro プラン確認
3. 環境変数設定
4. カスタムドメイン設定（swip.rizbell.com）
5. デプロイ確認

---

## 移行チェックリスト

- [ ] Next.js初期化 + ビルド通る
- [ ] app/layout.tsx でグローバルCSS読込
- [ ] ログイン画面表示
- [ ] Supabase認証動作
- [ ] ダッシュボード表示（プロジェクト一覧）
- [ ] プロジェクト作成
- [ ] エディタ画面遷移 + 表示
- [ ] スライド編集 + 自動保存
- [ ] AI Chat 動作（デモモード）
- [ ] 管理者ダッシュボード
- [ ] 公開LP表示（/p/[id]）
- [ ] モバイル表示
- [ ] Vercelデプロイ成功
- [ ] react-router-dom 完全削除
- [ ] react-scripts 完全削除
