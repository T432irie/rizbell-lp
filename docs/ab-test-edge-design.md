# A/Bテスト Edge割当 設計案

## 概要

Vercel Edge Middleware でA/Bテストのバリアント割当を行い、
LCP への影響を最小化しつつ、正確な出し分けを実現する。

---

## アーキテクチャ

```
[ブラウザ] → [Vercel Edge Middleware] → [Next.js Page]
                    │
                    ├─ Cookie確認（rz_visitor_id）
                    ├─ なければ UUID v4 発行 + Set-Cookie（30日）
                    ├─ 実験取得（experiments テーブル cache）
                    ├─ hash(visitor_id + experiment_id) % 100
                    ├─ 配分JSONと照合 → variant決定
                    ├─ RequestHeader に x-variant: A|B|C を付与
                    └─ そのまま Next.js Page へ forward

[Next.js Page]
    ├─ headers() から x-variant 取得
    ├─ variant に応じたブロックを Server Component でレンダリング
    └─ クライアントには完成HTMLが届く（LCPに影響なし）
```

---

## 1. visitor_id 管理

### Cookie 仕様
| 項目 | 値 |
|------|-----|
| 名前 | `rz_visitor_id` |
| 値 | UUID v4 |
| Max-Age | 2592000（30日） |
| Path | `/` |
| SameSite | `Lax` |
| Secure | `true`（本番） |
| HttpOnly | `false`（クライアントJSからも読みたい場合。要件次第で true に） |

### 発行ロジック（Edge Middleware内）
```typescript
function getOrCreateVisitorId(request: NextRequest): string {
  const existing = request.cookies.get('rz_visitor_id')?.value
  if (existing) return existing
  return crypto.randomUUID()
}
```

---

## 2. バリアント割当アルゴリズム

### 要件
- visitor_id + experiment_id を hash
- mod 100 で配分決定
- cookie 固定 30日（同一 visitor は常に同じ variant）

### ハッシュ関数
```typescript
async function hashAssignment(
  visitorId: string,
  experimentId: string
): Promise<number> {
  const input = `${visitorId}:${experimentId}`
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  // 先頭4バイトを32bit整数として取得
  const value = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]
  return Math.abs(value) % 100
}
```

### 配分決定
```typescript
// allocation例: { "A": 50, "B": 50 } or { "A": 34, "B": 33, "C": 33 }
function determineVariant(
  bucket: number,        // 0-99
  allocation: Record<string, number>
): string {
  let cumulative = 0
  for (const [variant, percentage] of Object.entries(allocation)) {
    cumulative += percentage
    if (bucket < cumulative) return variant
  }
  // フォールバック: 最初のvariant
  return Object.keys(allocation)[0]
}
```

### 例
```
visitor_id = "abc-123"
experiment_id = "exp-001"
hash("abc-123:exp-001") % 100 = 37

allocation = { "A": 50, "B": 50 }
→ 37 < 50 → variant "A"

allocation = { "A": 34, "B": 33, "C": 33 }
→ 37 >= 34 → 37 < 67 → variant "B"
```

---

## 3. Edge Middleware 実装

### middleware.ts（Phase 3 で実装）

```typescript
import { NextRequest, NextResponse } from 'next/server'

// マッチするパス: 公開LPのみ
export const config = {
  matcher: '/p/:path*',
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 1. visitor_id 取得 or 発行
  let visitorId = request.cookies.get('rz_visitor_id')?.value
  const isNewVisitor = !visitorId
  if (!visitorId) {
    visitorId = crypto.randomUUID()
  }

  // 2. Cookie 設定（新規の場合）
  if (isNewVisitor) {
    response.cookies.set('rz_visitor_id', visitorId, {
      maxAge: 60 * 60 * 24 * 30, // 30日
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  // 3. アクティブな実験を取得
  //    注意: Edge では Supabase 直接呼出しは遅延の原因になるため、
  //    KV Store / Edge Config からキャッシュを読む（後述）
  const experiment = await getActiveExperiment(request)

  if (experiment) {
    // 4. バリアント割当
    const bucket = await hashAssignment(visitorId, experiment.id)
    const variant = determineVariant(bucket, experiment.allocation)

    // 5. Request Header に付与（Server Component で読む）
    response.headers.set('x-ab-variant', variant)
    response.headers.set('x-ab-experiment-id', experiment.id)
    response.headers.set('x-ab-visitor-id', visitorId)
  }

  return response
}
```

---

## 4. 実験データのキャッシュ戦略

### 問題
Edge Middleware は高速に実行される必要がある（< 50ms）。
毎回 Supabase に問い合わせるのは遅すぎる。

### 解決策: Vercel Edge Config

```
[日次バッチ or 実験更新時]
    ↓
Supabase experiments テーブル読取
    ↓
Vercel Edge Config に書込み
    ↓
{
  "experiments": {
    "lp-slug-1": {
      "id": "exp-001",
      "block_id": "block-hero",
      "allocation": { "A": 50, "B": 50 },
      "status": "running",
      "variants": {
        "A": { "content": {...} },
        "B": { "content": {...} }
      }
    }
  }
}
```

**フォールバック（Edge Config が使えない場合）:**
- ISR (Incremental Static Regeneration) で実験設定を 60秒キャッシュ
- `fetch()` + `next: { revalidate: 60 }` で Supabase から取得

---

## 5. Server Component でのバリアント適用

```typescript
// app/p/[projectId]/page.tsx
import { headers } from 'next/headers'

export default async function PublicLPPage({ params }) {
  const headersList = await headers()
  const variant = headersList.get('x-ab-variant') || 'A'
  const experimentId = headersList.get('x-ab-experiment-id')
  const visitorId = headersList.get('x-ab-visitor-id')

  // ブロックデータ取得
  const blocks = await getBlocks(params.projectId)

  // variant に応じたブロックコンテンツを選択
  const resolvedBlocks = blocks.map(block => {
    if (experimentId && block.id === experimentBlock.block_id) {
      return resolveVariant(block, variant)
    }
    return block
  })

  return <BlockRenderer blocks={resolvedBlocks} />
}
```

---

## 6. クライアント側イベント記録

バリアント割当はサーバーで完了しているため、
クライアントはイベント記録のみ担当する。

```typescript
// components/tracking/EventTracker.tsx
'use client'

import { useEffect } from 'react'

export function EventTracker({
  projectId,
  lpId,
  blockId,
  experimentId,
  variant,
  visitorId,
}: TrackingProps) {

  // page_view（ページ表示時）
  useEffect(() => {
    recordEvent({
      project_id: projectId,
      lp_id: lpId,
      event_type: 'page_view',
      experiment_id: experimentId,
      variant,
      visitor_id: visitorId,
    })
  }, [])

  // block_impression（Intersection Observer）
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            recordEvent({
              project_id: projectId,
              lp_id: lpId,
              block_id: entry.target.dataset.blockId,
              event_type: 'block_impression',
              experiment_id: experimentId,
              variant,
              visitor_id: visitorId,
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 }
    )

    document.querySelectorAll('[data-block-id]').forEach(el => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return null
}
```

### CTA クリック記録
```typescript
// ブロック内のCTAボタンに onClick として埋め込む
function handleCtaClick(blockId: string) {
  recordEvent({
    project_id: projectId,
    lp_id: lpId,
    block_id: blockId,
    event_type: 'cta_click',
    experiment_id: experimentId,
    variant,
    visitor_id: visitorId,
  })
}
```

### CV 記録（/thanks 到達）
```typescript
// app/p/[projectId]/thanks/page.tsx
// 同一 visitor + lp + 日付 で1回のみ
export default async function ThanksPage({ params, searchParams }) {
  const visitorId = cookies().get('rz_visitor_id')?.value
  const today = new Date().toISOString().split('T')[0]

  // 重複チェック
  const existing = await checkConversionExists(visitorId, params.projectId, today)

  if (!existing && visitorId) {
    await recordEvent({
      project_id: params.projectId,
      lp_id: searchParams.lp,
      event_type: 'conversion',
      visitor_id: visitorId,
      // experiment_id, variant は visitor_id から逆引き可能
    })
  }

  return <ThanksContent />
}
```

---

## 7. 配分変更の翌日反映

### 要件
- 配分変更は翌日反映

### 実装
1. 管理画面で `experiments.allocation` を更新
2. `experiments.allocation_next` に新配分を保存
3. 日次バッチで:
   ```sql
   UPDATE experiments
   SET allocation = allocation_next,
       allocation_next = NULL
   WHERE allocation_next IS NOT NULL
     AND status = 'running';
   ```
4. Edge Config を更新

### 理由
- hash は visitor_id + experiment_id のみに依存
- allocation が変わると同一 visitor の bucket は同じだが variant が変わる可能性がある
- 翌日反映にすることで、日中のデータ整合性を保つ

---

## 8. 判定ロジック（日次バッチ内）

```typescript
// app/api/cron/daily-metrics/route.ts 内で実行

function evaluateExperiment(metrics: DailyMetrics[]): JudgmentStatus {
  for (const variant of metrics) {
    if (variant.uu < 100) return 'pending'    // 判定保留
    if (variant.uu < 300) return 'reference'  // 参考値
  }
  // 全variant UU >= 300
  return 'valid' // 有効
}

function calculateScore(metrics: VariantMetrics): number {
  const reachRate = metrics.uu > 0
    ? metrics.block_impressions / metrics.uu
    : 0
  return (metrics.cv * 5) + (metrics.cta * 2) + (reachRate * 1)
}
```

---

## 9. 制約事項

| 制約 | 詳細 |
|------|------|
| 同時実験数 | 1LP につき 1実験 |
| 最大バリアント | 3（A/B/C） |
| 配分変更 | 翌日反映 |
| Cookie | 30日固定。削除時は新規 visitor 扱い |
| Edge Middleware | `/p/*` パスのみ適用 |

---

## 10. フォールバック（Edge が使えない場合）

Edge Middleware が何らかの理由で失敗した場合:
1. x-ab-variant ヘッダーなし → デフォルト variant "A" を表示
2. クライアント側で Cookie を読み、遅延で variant を適用（CLS 発生の可能性あり）
3. エラーログを記録

```typescript
// Server Component 側
const variant = headersList.get('x-ab-variant') || 'A' // 常にフォールバック
```
