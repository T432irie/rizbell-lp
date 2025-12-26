import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader } from 'lucide-react';
import { sendAIMessage, isDemoMode } from '../services/aiService';
import './AIChat.css';

function AIChat({ isOpen, onClose, onApplyEdit, currentData }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isDemoMode() 
        ? 'こんにちは！AI編集アシスタントです（デモモード）。\n\nLPの内容を自然な日本語で指示してください。\n\n例：\n- 店名を「さくら整体院」に変更\n- 電話番号を「03-1234-5678」に変更\n- キャッチコピーを「痛みのない生活へ」に変更' 
        : 'こんにちは！AI編集アシスタントです。LPの内容を自然な日本語で指示してください。',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // チャットが開いたら入力欄にフォーカス
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // ユーザーメッセージを追加
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      // AIに送信
      const result = await sendAIMessage(userMessage, currentData);

      // AIの返信を追加
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      }]);

      // 編集内容を適用
      if (result.success && result.edits.length > 0) {
        onApplyEdit(result.edits);
      }
    } catch (error) {
      console.error('AI送信エラー:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-container" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <Sparkles size={20} />
            <span>AI編集アシスタント</span>
            {isDemoMode() && <span className="demo-badge">デモモード</span>}
          </div>
          <button className="ai-chat-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* メッセージリスト */}
        <div className="ai-chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`ai-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="ai-message assistant-message">
              <div className="message-content">
                <Loader className="loading-spinner" size={16} />
                <span>考え中...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="ai-chat-input-area">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            placeholder="例: 店名を「○○整体院」に変更"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isLoading}
          />
          <button 
            className="ai-chat-send" 
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={20} />
          </button>
        </div>

        {/* ヒント */}
        <div className="ai-chat-hint">
          Enterで送信、Shift+Enterで改行
        </div>
      </div>
    </div>
  );
}

export default AIChat;

