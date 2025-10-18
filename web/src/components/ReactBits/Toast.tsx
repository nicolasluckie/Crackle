import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

export type ToastType = 'success' | 'danger';
export type ToastPosition = 'top-left' | 'top-right';

interface ToastProps {
  open: boolean;
  message: string;
  type?: ToastType;
  duration?: number; // ms
  onClose: () => void;
  position?: ToastPosition;
}

export function Toast({ open, message, type = 'success', duration = 3000, onClose, position = 'top-right' }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => onClose(), duration);
    return () => clearTimeout(id);
  }, [open, duration, onClose]);

  if (!open) return null;

  const content = (
    <div className={`toast-root ${type} ${position === 'top-left' ? 'pos-top-left' : 'pos-top-right'}`} role="status" aria-live="polite">
      <div className="toast-inner">
        <span className="toast-message">{message}</span>
      </div>
    </div>
  );

  if (typeof document === 'undefined' || !document.body) return content;
  return createPortal(content, document.body);
}

export default Toast;
