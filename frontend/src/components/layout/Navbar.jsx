import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 no-print transition-colors">
      {/* Left side menu controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 focus:outline-none transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-tight hidden md:inline-block">
          SAHU <span className="text-primary-500 font-medium">TRADERS</span>
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4">
        {/* Dark Mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 focus:outline-none transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User Info & Quick Controls */}
        <div className="flex items-center space-x-3 border-l pl-4 border-slate-200 dark:border-slate-800">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
              {user?.name}
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {user?.role}
            </p>
          </div>
          
          {/* Avatar Icon */}
          <div className="relative group">
            <button className="h-9 w-9 bg-primary-50 dark:bg-primary-950/20 text-primary-500 font-bold rounded-full flex items-center justify-center border border-primary-200/50 focus:outline-none">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </button>

            {/* User Dropdown on Hover */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 hidden group-hover:block animate-fade-in z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-750 sm:hidden">
                <p className="text-sm font-bold text-slate-850 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-450 truncate">{user?.role}</p>
              </div>
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
