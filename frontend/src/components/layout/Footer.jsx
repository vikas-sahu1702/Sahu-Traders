import React from 'react';

const Footer = () => {
  return (
    <footer className="h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 text-xs font-medium text-slate-400 dark:text-slate-500 no-print transition-colors">
      <div>
        &copy; {new Date().getFullYear()} Sahu Traders. All rights reserved.
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
        <span>ERP Server Connected</span>
      </div>
    </footer>
  );
};

export default Footer;
