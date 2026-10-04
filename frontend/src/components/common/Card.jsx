import React from 'react';

const Card = ({ title, value, subtext, icon, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel p-6 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/30 flex items-center justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
      } ${className}`}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-850 dark:text-slate-100 tracking-tight truncate">
          {value}
        </h3>
        {subtext && (
          <p className="mt-1.5 text-xs text-slate-450 dark:text-slate-500 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-3.5 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-lg flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
};

export default Card;
