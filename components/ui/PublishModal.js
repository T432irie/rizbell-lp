'use client'

import { useState } from 'react'

export default function PublishModal({ isOpen, onClose, publicUrl }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !publicUrl) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.querySelector('#public-url-input')
      if (input) { input.select(); document.execCommand('copy') }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
        zIndex: 10000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '12px', padding: '32px',
        maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 600, color: '#1F2937' }}>
          公開完了
        </h2>
        <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '14px' }}>
          公開URL:
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            id="public-url-input"
            type="text"
            value={publicUrl}
            readOnly
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid #E5E7EB',
              borderRadius: '8px', fontSize: '14px', background: '#F9FAFB', color: '#1F2937'
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: '12px 24px',
              background: copied ? '#10B981' : '#3B82F6',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: 600, cursor: 'pointer', fontSize: '14px'
            }}
          >
            {copied ? 'コピーしました！' : 'コピー'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.open(publicUrl, '_blank')}
            style={{
              padding: '12px 24px', background: '#10B981', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            新しいタブで開く
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
