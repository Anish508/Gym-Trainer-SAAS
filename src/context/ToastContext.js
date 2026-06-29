'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '350px', width: 'calc(100% - 48px)' }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`toast toast-${t.type}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px', 
              background: t.type === 'success' ? '#10B981' : t.type === 'error' ? '#EF4444' : '#3B82F6', 
              color: '#fff', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', 
              animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              position: 'relative'
            }}
          >
            {t.type === 'success' && <CheckCircle2 size={20} />}
            {t.type === 'error' && <AlertTriangle size={20} />}
            {t.type === 'info' && <Info size={20} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
