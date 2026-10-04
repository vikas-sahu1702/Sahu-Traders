import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import Loader from '../common/Loader';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // If session is loading, show page spinner
  if (loading) {
    return <Loader fullPage size="lg" />;
  }

  // Redirect to login if user session is not found
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area (offset by sidebar width on large displays) */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-200">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto animate-fade-in print-container">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
