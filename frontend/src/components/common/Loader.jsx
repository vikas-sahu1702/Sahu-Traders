import React from 'react';

const Loader = ({ fullPage = false, size = 'md' }) => {
  const spinnerSizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`${spinnerSizes[size] || spinnerSizes.md} animate-spin rounded-full border-primary-500 border-t-transparent`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {fullPage && (
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
          Loading Sahu Traders ERP...
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{loaderContent}</div>;
};

export default Loader;
