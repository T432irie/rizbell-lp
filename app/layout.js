import '@/app/globals.css'

export const metadata = {
  title: 'RizBell LP Studio',
  description: 'LP作成・A/Bテスト・分析プラットフォーム',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
