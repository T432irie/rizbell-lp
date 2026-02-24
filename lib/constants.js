/* --- 管理者設定 --- */
export const ADMIN_EMAIL = "t-irie@gakushiki.jp"

/* --- プラン制限定数 --- */
export const IS_PRO_PLAN = false
export const PLAN_LIMITS = { ume: 2, take: 5, matsu: 99 }

/* --- 初期データ定義 --- */
export const templateEsthetic = [
  { id: 1, type: "image", src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "本来の美しさを、\n取り戻す。", subtitle: "Winter Campaign 2025", color: "#ffffff", align: "center" } },
  { id: 2, type: "image", src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db48e?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "肌のハリ不足、\n気になりませんか？", subtitle: "原因は「深層乾燥」かも。", color: "#ffffff", align: "left" } },
  { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回限定体験\n¥3,980", subtitle: "", color: "#ffffff", align: "center", buttonText: "今すぐ予約する" } }
]

export const templateClinic = [
  { id: 1, type: "image", src: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "長年の腰痛、\nあきらめていませんか？", subtitle: "根本改善専門の整体院", color: "#ffffff", align: "center" } },
  { id: 2, type: "image", src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "マッサージに行っても\nすぐ戻ってしまう...", subtitle: "それは「骨盤の歪み」が原因です。", color: "#ffffff", align: "left" } },
  { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回カウンセリング\n無料", subtitle: "1日3名様限定", color: "#ffffff", align: "center", buttonText: "空き状況を確認" } }
]

export const initialFormConfig = {
  title: "無料カウンセリング予約",
  fields: [
    { id: 'name', type: 'text', label: 'お名前', required: true },
    { id: 'tel', type: 'tel', label: '電話番号', required: true },
    { id: 'date', type: 'datetime-local', label: '希望日時', required: true },
    { id: 'memo', type: 'textarea', label: '備考', required: false }
  ]
}

export const initialSiteConfig = {
  seo: { title: "My Swipe LP", description: "スマホで快適なスワイプ体験を。", keywords: "" },
  sns: { instagram: "", line: "" },
  tags: { gtm: "" },
  globalNav: [{ label: "Top", url: "#" }, { label: "Contact", url: "#form" }]
}
