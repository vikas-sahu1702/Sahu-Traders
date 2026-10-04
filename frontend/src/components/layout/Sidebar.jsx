import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileSpreadsheet,
  CreditCard,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Customers', path: '/customers', icon: <Users className="h-5 w-5" /> },
    { name: 'Products', path: '/products', icon: <Package className="h-5 w-5" /> },
    { name: 'Invoices', path: '/invoices', icon: <FileSpreadsheet className="h-5 w-5" /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard className="h-5 w-5" /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Backdrop overlay on mobile sizes */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden no-print"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print flex flex-col`}
      >
        {/* Header Branding Panel */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <span className="font-extrabold text-white text-lg tracking-wider">
            SAHU <span className="text-primary-500 font-medium">TRADERS</span>
          </span>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 md:hidden focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
              end={item.path === '/'}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Brand Indicator */}
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 font-medium">
          Sahu Traders ERP v1.0.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
