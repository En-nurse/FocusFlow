import { useState, useCallback, useEffect } from 'react';
import { ToastContext } from './toastContextDef';
import './Toast.css';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3200) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback(({
    title = 'ยืนยันการทำรายการ',
    message = 'คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?',
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    type = 'danger',
    onConfirm,
  }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (confirmState?.onConfirm) {
      confirmState.onConfirm();
    }
    closeConfirm();
  }, [confirmState, closeConfirm]);

  // Support ESC to close confirm modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && confirmState?.isOpen) {
        closeConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState, closeConfirm]);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Global Toast Notification Portal */}
      <div className="toast-portal-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-icon-box">
              {toast.type === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {toast.type === 'celebrate' && (
                <span className="toast-emoji-icon">🎉</span>
              )}
              {toast.type === 'error' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {(toast.type === 'info' || !toast.type) && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>

            <div className="toast-message-text">{toast.message}</div>

            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              title="ปิดการแจ้งเตือน"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Global Modern Confirmation Modal */}
      {confirmState?.isOpen && (
        <div className="confirm-modal-backdrop" onClick={closeConfirm}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon-wrapper ${confirmState.type}`}>
              {confirmState.type === 'danger' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <h3 className="confirm-title">{confirmState.title}</h3>
            <p className="confirm-message">{confirmState.message}</p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={closeConfirm}
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-btn-action ${confirmState.type}`}
                onClick={handleConfirmAction}
                autoFocus
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
