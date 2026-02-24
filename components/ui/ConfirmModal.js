'use client'

import { useEffect } from 'react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = '確認', cancelText = 'キャンセル', confirmColor = '#3B82F6' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

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
        maxWidth: '450px', width: '100%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '22px', fontWeight: 600, color: '#1F2937' }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#6B7280', fontSize: '15px', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px', background: confirmColor, color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
