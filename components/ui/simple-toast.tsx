'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface SimpleToast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<SimpleToast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastCounter = 0;

export function SimpleToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<SimpleToast[]>([]);

  const showToast = useCallback((toast: Omit<SimpleToast, 'id'>) => {
    const id = `toast-${++toastCounter}`;
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // 3秒后自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast 容器 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "min-w-[300px] max-w-[400px] p-4 rounded-lg shadow-lg border",
              "animate-in slide-in-from-right-full duration-300",
              "flex items-start space-x-3",
              {
                "bg-green-50 border-green-200 text-green-800": toast.type === 'success',
                "bg-red-50 border-red-200 text-red-800": toast.type === 'error',
                "bg-blue-50 border-blue-200 text-blue-800": toast.type === 'info',
                "bg-yellow-50 border-yellow-200 text-yellow-800": toast.type === 'warning',
              }
            )}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {toast.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">{toast.title}</h4>
              {toast.description && (
                <p className="text-sm mt-1 opacity-90">{toast.description}</p>
              )}
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useSimpleToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useSimpleToast must be used within a SimpleToastProvider');
  }
  return context;
}