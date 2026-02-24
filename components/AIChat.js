'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import '@/styles/AIChat.css';
import { callAI } from '@/services/aiService';

function AIChat({
  isOpen,
  onClose,
  onApplyEdits,
  currentData
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'こんにちは！LPの編集をお手伝いします。どのように変更したいですか？\n\n例：「タイトルを『○○エステサロン』に変更」「電話番号を03-1234-5678に変更」「スライド1のタイトルを変更」など'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // AI APIを呼び出す
      const edits = await callAI(userMessage, currentData);

      // AIレスポンスを追加
      if (Object.keys(edits).length > 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '編集内容を適用しました。プレビューで確認してください。\n\n変更内容:\n' +
            JSON.stringify(edits, null, 2).replace(/\n/g, '\n')
        }]);

        // 編集を適用
        if (onApplyEdits) {
          onApplyEdits(edits);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '申し訳ございません。編集内容を理解できませんでした。もう少し具体的に説明していただけますか？\n\n例：「タイトルを『○○エステサロン』に変更」'
        }]);
      }
    } catch (error) {
      console.error('AI編集エラー:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <Sparkles size={20} />
          <span>AI編集アシスタント</span>
        </div>
        <button className="ai-chat-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="ai-chat-message-content">
              {message.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-chat-message assistant">
            <div className="ai-chat-message-content">
              <div className="ai-chat-loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-container">
        <textarea
          className="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="編集内容を入力してください..."
          rows={2}
          disabled={isLoading}
        />
        <button
          className="ai-chat-send"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

export default AIChat;
