/**
 * AI編集サービス
 * Claude API / OpenAI API を使用してLPの編集をサポート
 */

const systemPrompt = `あなたはLP（ランディングページ）の編集アシスタントです。
ユーザーの要望に基づいて、LPのコンテンツを適切に編集してください。

【編集可能な項目】
1. businessInfo: 事業所情報（名前、電話番号、住所、営業時間など）
2. slides: スライドのコンテンツ（タイトル、サブタイトル、ボタンテキストなど）
3. siteConfig: サイト設定（SEOタイトル、説明文など）

【出力形式】
編集内容をJSON形式で返してください：
{
  "businessInfo": { "name": "...", "phone": "...", ... },
  "slides": [{ "id": 1, "overlay": { "title": "...", ... } }, ...],
  "siteConfig": { "seo": { "title": "...", ... }, ... }
}

変更がない項目は省略してください。`

/**
 * AI APIを呼び出す
 */
export async function callAI(userPrompt, currentData) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY

  if (!apiKey) {
    console.log('⚠️ AI APIキーが設定されていません。デモモードで動作します。')
    return callAIDemo(userPrompt, currentData)
  }

  try {
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return await callOpenAI(userPrompt, currentData)
    }
    if (process.env.NEXT_PUBLIC_CLAUDE_API_KEY) {
      return await callClaude(userPrompt, currentData)
    }
  } catch (error) {
    console.error('AI API呼び出しエラー:', error)
    return callAIDemo(userPrompt, currentData)
  }
}

async function callOpenAI(userPrompt, currentData) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `現在のデータ:\n${JSON.stringify(currentData, null, 2)}\n\n編集要望:\n${userPrompt}` }
      ],
      temperature: 0.7
    })
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`)
  const data = await response.json()
  const content = data.choices[0].message.content
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('AIレスポンスからJSONを抽出できませんでした')
}

async function callClaude(userPrompt, currentData) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: `現在のデータ:\n${JSON.stringify(currentData, null, 2)}\n\n編集要望:\n${userPrompt}` }
      ],
      system: systemPrompt
    })
  })

  if (!response.ok) throw new Error(`Claude API error: ${response.statusText}`)
  const data = await response.json()
  const content = data.content[0].text
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  throw new Error('AIレスポンスからJSONを抽出できませんでした')
}

function callAIDemo(userPrompt, currentData) {
  console.log('🎭 デモモード: パターンマッチングで編集を実行')
  const edits = {}
  const lowerPrompt = userPrompt.toLowerCase()

  if (lowerPrompt.includes('タイトル') || lowerPrompt.includes('タイトルを')) {
    const titleMatch = userPrompt.match(/タイトル[をは]?[「"]?([^「」""\n]+)[」"]?/)
    if (titleMatch && currentData.siteConfig) {
      edits.siteConfig = {
        ...currentData.siteConfig,
        seo: { ...currentData.siteConfig.seo, title: titleMatch[1].trim() }
      }
    }
  }

  if (lowerPrompt.includes('事業所名') || lowerPrompt.includes('店舗名') || lowerPrompt.includes('名前を')) {
    const nameMatch = userPrompt.match(/(?:事業所名|店舗名|名前)[をは]?[「"]?([^「」""\n]+)[」"]?/)
    if (nameMatch && currentData.businessInfo) {
      edits.businessInfo = { ...currentData.businessInfo, name: nameMatch[1].trim() }
    }
  }

  if (lowerPrompt.includes('電話') || lowerPrompt.includes('tel')) {
    const phoneMatch = userPrompt.match(/(?:電話|tel)[番号]?[をは]?[「"]?([0-9\-\(\)]+)[」"]?/)
    if (phoneMatch && currentData.businessInfo) {
      edits.businessInfo = { ...currentData.businessInfo, phone: phoneMatch[1].trim() }
    }
  }

  if (lowerPrompt.includes('スライド') && (lowerPrompt.includes('タイトル') || lowerPrompt.includes('1') || lowerPrompt.includes('2') || lowerPrompt.includes('3'))) {
    const slideMatch = userPrompt.match(/(?:スライド)?([123])[の]?タイトル[をは]?[「"]?([^「」""\n]+)[」"]?/)
    if (slideMatch && currentData.slides) {
      const slideIndex = parseInt(slideMatch[1]) - 1
      if (currentData.slides[slideIndex]) {
        edits.slides = [...currentData.slides]
        edits.slides[slideIndex] = {
          ...edits.slides[slideIndex],
          overlay: { ...edits.slides[slideIndex].overlay, title: slideMatch[2].trim() }
        }
      }
    }
  }

  if (lowerPrompt.includes('色') || lowerPrompt.includes('カラー')) {
    const colorMatch = userPrompt.match(/(?:色|カラー)[をは]?[「"]?(#[0-9a-fA-F]{6}|[^「」""\n]+)[」"]?/)
    if (colorMatch && currentData.slides && currentData.slides.length > 0) {
      const color = colorMatch[1].trim()
      edits.slides = currentData.slides.map(slide => ({
        ...slide,
        overlay: { ...slide.overlay, color: color.startsWith('#') ? color : '#ffffff' }
      }))
    }
  }

  return edits
}

/**
 * AIが生成した編集内容をプロジェクトデータに適用
 */
export function applyEdits(currentData, edits) {
  const updatedData = {
    businessInfo: { ...currentData.businessInfo },
    slides: [...currentData.slides],
    siteConfig: { ...currentData.siteConfig }
  }

  if (edits.businessInfo) {
    updatedData.businessInfo = { ...updatedData.businessInfo, ...edits.businessInfo }
  }

  if (edits.slides) {
    updatedData.slides = edits.slides.map((editedSlide, index) => {
      const currentSlide = updatedData.slides[index] || {}
      return {
        ...currentSlide,
        ...editedSlide,
        overlay: { ...currentSlide.overlay, ...editedSlide.overlay }
      }
    })
  }

  if (edits.siteConfig) {
    updatedData.siteConfig = {
      ...updatedData.siteConfig,
      ...edits.siteConfig,
      seo: { ...updatedData.siteConfig.seo, ...edits.siteConfig.seo }
    }
  }

  return updatedData
}
