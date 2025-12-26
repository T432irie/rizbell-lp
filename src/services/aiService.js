/**
 * AI編集サービス
 * Claude APIまたはデモモードでLPの編集を支援
 */

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const DEMO_MODE = !API_KEY;

/**
 * システムプロンプトを生成
 */
const generateSystemPrompt = (currentData) => {
  return `あなたはLP編集アシスタントです。
ユーザーの指示に従って、LPの内容を編集してください。

現在のLPデータ:
${JSON.stringify(currentData, null, 2)}

ユーザーの指示を理解し、以下のJSON形式で編集内容を返してください:
{
  "action": "update",
  "target": "businessInfo.name" または "slides[0].content.headline" など,
  "newValue": "新しい値"
}

複数の変更がある場合は配列で返してください。`;
};

/**
 * デモモード: パターンマッチングで編集指示を生成
 */
const processDemoMode = (userMessage, currentData) => {
  console.log('🤖 AIService: デモモードで処理', userMessage);
  
  const message = userMessage.toLowerCase();
  const edits = [];
  
  // 店名・施設名の変更
  if (message.includes('店名') || message.includes('施設名') || message.includes('名前')) {
    const match = userMessage.match(/[「『](.+?)[」』]/);
    if (match) {
      edits.push({
        action: 'update',
        target: 'businessInfo.name',
        newValue: match[1],
        description: `店名を「${match[1]}」に変更しました`
      });
    }
  }
  
  // 電話番号の変更
  if (message.includes('電話') || message.includes('tel')) {
    const match = userMessage.match(/(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4})/);
    if (match) {
      edits.push({
        action: 'update',
        target: 'businessInfo.phone',
        newValue: match[1],
        description: `電話番号を「${match[1]}」に変更しました`
      });
    }
  }
  
  // 住所の変更
  if (message.includes('住所')) {
    const match = userMessage.match(/[「『](.+?)[」』]/);
    if (match) {
      edits.push({
        action: 'update',
        target: 'businessInfo.address',
        newValue: match[1],
        description: `住所を「${match[1]}」に変更しました`
      });
    }
  }
  
  // キャッチコピー・タイトルの変更
  if (message.includes('キャッチコピー') || message.includes('タイトル') || message.includes('見出し')) {
    const match = userMessage.match(/[「『](.+?)[」』]/);
    if (match && currentData.slides && currentData.slides[0]) {
      edits.push({
        action: 'update',
        target: 'slides[0].headline',
        newValue: match[1],
        description: `ファーストビューのタイトルを「${match[1]}」に変更しました`
      });
      
      // templateContent.headlineも更新
      edits.push({
        action: 'update',
        target: 'slides[0].templateContent.headline',
        newValue: match[1],
        description: ''
      });
    }
  }
  
  // サブタイトルの変更
  if (message.includes('サブタイトル') || message.includes('副題')) {
    const match = userMessage.match(/[「『](.+?)[」』]/);
    if (match && currentData.slides && currentData.slides[0]) {
      edits.push({
        action: 'update',
        target: 'slides[0].subheadline',
        newValue: match[1],
        description: `サブタイトルを「${match[1]}」に変更しました`
      });
      
      edits.push({
        action: 'update',
        target: 'slides[0].templateContent.subheadline',
        newValue: match[1],
        description: ''
      });
    }
  }
  
  // 営業時間の変更
  if (message.includes('営業時間')) {
    const match = userMessage.match(/[「『](.+?)[」』]/);
    if (match) {
      edits.push({
        action: 'update',
        target: 'businessInfo.businessHours',
        newValue: match[1],
        description: `営業時間を「${match[1]}」に変更しました`
      });
    }
  }
  
  // 定休日の変更
  if (message.includes('定休日')) {
    const match = userMessage.match(/[「『](.+?)[」』]/);
    if (match) {
      edits.push({
        action: 'update',
        target: 'businessInfo.closedDays',
        newValue: match[1],
        description: `定休日を「${match[1]}」に変更しました`
      });
    }
  }
  
  // 色の変更
  if (message.includes('色') || message.includes('カラー')) {
    const colorMatch = userMessage.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
    if (colorMatch && currentData.slides && currentData.slides[0]) {
      edits.push({
        action: 'update',
        target: 'slides[0].bgColor',
        newValue: colorMatch[0],
        description: `背景色を「${colorMatch[0]}」に変更しました`
      });
    }
  }
  
  if (edits.length === 0) {
    return {
      success: false,
      message: '申し訳ございません。その指示を理解できませんでした。\n\n以下のような形式でお試しください：\n- 店名を「○○整体院」に変更\n- 電話番号を「03-1234-5678」に変更\n- キャッチコピーを「痛みのない生活へ」に変更',
      edits: []
    };
  }
  
  return {
    success: true,
    message: edits.filter(e => e.description).map(e => e.description).join('\n'),
    edits
  };
};

/**
 * Claude APIを呼び出す（実装予定）
 */
const callClaudeAPI = async (userMessage, currentData) => {
  const systemPrompt = generateSystemPrompt(currentData);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('API呼び出しに失敗しました');
    }
    
    const data = await response.json();
    const content = data.content[0].text;
    
    // JSONをパース
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const edits = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        message: '編集内容を適用しました',
        edits: Array.isArray(edits) ? edits : [edits]
      };
    }
    
    return {
      success: false,
      message: content,
      edits: []
    };
  } catch (error) {
    console.error('Claude API エラー:', error);
    return {
      success: false,
      message: 'AIの呼び出しに失敗しました。デモモードで処理します。',
      edits: []
    };
  }
};

/**
 * AIに編集指示を送信
 */
export const sendAIMessage = async (userMessage, currentData) => {
  console.log('🤖 AIService: メッセージ送信', { userMessage, demoMode: DEMO_MODE });
  
  if (DEMO_MODE) {
    // デモモードで処理
    return processDemoMode(userMessage, currentData);
  } else {
    // Claude APIで処理
    return await callClaudeAPI(userMessage, currentData);
  }
};

/**
 * 編集指示を適用
 */
export const applyEdits = (currentData, edits) => {
  const newData = JSON.parse(JSON.stringify(currentData)); // Deep copy
  
  edits.forEach(edit => {
    if (edit.action === 'update') {
      const path = edit.target.split('.');
      let obj = newData;
      
      // 配列インデックスの処理
      const processedPath = [];
      path.forEach(key => {
        const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          processedPath.push(arrayMatch[1]);
          processedPath.push(parseInt(arrayMatch[2]));
        } else {
          processedPath.push(key);
        }
      });
      
      // 値を設定
      for (let i = 0; i < processedPath.length - 1; i++) {
        const key = processedPath[i];
        if (!obj[key]) {
          obj[key] = typeof processedPath[i + 1] === 'number' ? [] : {};
        }
        obj = obj[key];
      }
      
      const lastKey = processedPath[processedPath.length - 1];
      obj[lastKey] = edit.newValue;
    }
  });
  
  return newData;
};

export const isDemoMode = () => DEMO_MODE;

