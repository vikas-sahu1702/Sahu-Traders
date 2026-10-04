import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/80',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/80',
      border: 'border-rose-200 dark:border-rose-900/50',
      text: 'text-rose-800 dark:text-rose-200',
      icon: <AlertCircle className="h-5 w-5 text-rose-500" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/80',
      border: 'border-amber-200 dark:border-amber-900/50',
      text: 'text-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/80',
      border: 'border-blue-200 dark:border-blue-900/50',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="h-5 w-5 text-blue-500" />,
    },
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up no-print">
      <div className={`flex items-center space-x-3 rounded-lg border p-4 shadow-lg ${config.bg} ${config.border} ${config.text}`}>
        <div>{config.icon}</div>
        <div className="text-sm font-medium pr-6">{message}</div>
        <button
          onClick={onClose}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
