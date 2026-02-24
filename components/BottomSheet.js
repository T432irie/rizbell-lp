'use client'
import React from 'react';
import '@/styles/BottomSheet.css';

function BottomSheet({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" onClick={onClose} />
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}

export default BottomSheet;
