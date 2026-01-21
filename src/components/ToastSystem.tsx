import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastSystemProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastSystem: React.FC<ToastSystemProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000); // Auto close after 4s
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: 'bg-white border-l-4 border-green-500 text-gray-800',
    error: 'bg-white border-l-4 border-castor-red text-gray-800',
    warning: 'bg-white border-l-4 border-yellow-500 text-gray-800',
    info: 'bg-white border-l-4 border-blue-500 text-gray-800',
  };

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-castor-red" size={20} />,
    warning: <AlertTriangle className="text-yellow-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  return (
    <div 
        className={`pointer-events-auto shadow-lg rounded-r flex items-center gap-3 p-4 min-w-[300px] max-w-md transform transition-all duration-300 animate-in slide-in-from-right-full ${styles[toast.type]}`}
        role="alert"
    >
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      <button 
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastSystem;