import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/common/Toast';
import Loader from '../components/common/Loader';
import { Settings as SettingsIcon, ShieldCheck, User, Store, UserPlus } from 'lucide-react';

const Settings = () => {
  const { user, syncProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // profile, security, company, users
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Tab 1: Profile states
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });

  // Tab 2: Security states
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Tab 3: Company Settings states (Admin only)
  const [companyForm, setCompanyForm] = useState({
    companyName: 'SAHU TRADERS',
    address: '',
    mobile: '',
    email: '',
    gstin: '',
    invoicePrefix: 'ST-',
    defaultTaxRate: 18,
  });

  // Tab 4: System Users List (Admin only)
  const [systemUsers, setSystemUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'Staff' });
  const [newUserErrors, setNewUserErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email });
    }

    if (activeTab === 'company' && user?.role === 'Admin') {
      loadCompanySettings();
    }

    if (activeTab === 'users' && user?.role === 'Admin') {
      loadSystemUsers();
    }
  }, [activeTab, user]);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/settings');
      if (res.data.success && res.data.settings) {
        const s = res.data.settings;
        setCompanyForm({
          companyName: s.companyName,
          address: s.address || '',
          mobile: s.mobile || '',
          email: s.email || '',
          gstin: s.gstin || '',
          invoicePrefix: s.invoicePrefix || 'ST-',
          defaultTaxRate: s.defaultTaxRate || 18,
        });
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to retrieve company variables', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/users');
      if (res.data.success) {
        setSystemUsers(res.data.users);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to retrieve system users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) return;

    try {
      const res = await api.put('/api/auth/profile', profileForm);
      if (res.data.success) {
        setToastMsg({ text: 'Profile updated successfully', type: 'success' });
        syncProfile(res.data.user);
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Profile save failed', type: 'error' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToastMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    try {
      const res = await api.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.success) {
        setToastMsg({ text: 'Password rotated successfully', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Password update failed', type: 'error' });
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/settings', companyForm);
      if (res.data.success) {
        setToastMsg({ text: 'Company profile configurations updated', type: 'success' });
      }
    } catch (error) {
      setToastMsg({ text: 'Settings update failed', type: 'error' });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newUserForm.name) errors.name = 'Name is required';
    if (!newUserForm.email) errors.email = 'Email is required';
    if (!newUserForm.password || newUserForm.password.length < 6) errors.password = 'Password must be 6+ chars';

    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      return;
    }

    try {
      const res = await api.post('/api/auth/users', newUserForm);
      if (res.data.success) {
        setToastMsg({ text: `Created account for ${newUserForm.email}`, type: 'success' });
        setNewUserForm({ name: '', email: '', password: '', role: 'Staff' });
        setNewUserErrors({});
        loadSystemUsers();
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Creation failed', type: 'error' });
    }
  };

  const handleToggleUserStatus = async (userId, targetStatus) => {
    try {
      const res = await api.put(`/api/auth/users/${userId}`, { status: targetStatus });
      if (res.data.success) {
        setToastMsg({ text: 'User status updated successfully', type: 'success' });
        loadSystemUsers();
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Status toggle failed', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6 text-primary-500 animate-spin-slow" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            ERP Settings
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-0.5">
            Configure system parameters, modify details, and manage roles
          </p>
        </div>
      </div>

      {/* Tabs panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs list */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/30 flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span>User Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors ${
              activeTab === 'security'
                ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>Password Security</span>
          </button>

          {user?.role === 'Admin' && (
            <>
              <button
                onClick={() => setActiveTab('company')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                  activeTab === 'company'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Store className="h-4.5 w-4.5" />
                <span>Company profile</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                  activeTab === 'users'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <UserPlus className="h-4.5 w-4.5" />
                <span>Manage Users</span>
              </button>
            </>
          )}
        </div>

        {/* Action Form panel */}
        <div className="md:col-span-3 glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30">
          {loading && <Loader size="sm" />}

          {/* TAB 1: USER PROFILE FORM */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b pb-2">
                User profile details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Your Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg text-xs"
              >
                Save Details
              </button>
            </form>
          )}

          {/* TAB 2: PASSWORD ROTATION */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b pb-2">
                Change account password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Current password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">New password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Verify new password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg text-xs"
              >
                Rotate Password
              </button>
            </form>
          )}

          {/* TAB 3: COMPANY GENERAL CONFIG (Admin only) */}
          {activeTab === 'company' && user?.role === 'Admin' && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b pb-2">
                Enterprise variables (Invoicing metadata)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Company Name</label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Mobile Number</label>
                  <input
                    type="text"
                    value={companyForm.mobile}
                    onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={companyForm.gstin}
                    onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm uppercase font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={companyForm.invoicePrefix}
                    onChange={(e) => setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm font-mono font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Default tax rate (%)</label>
                  <input
                    type="number"
                    value={companyForm.defaultTaxRate}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultTaxRate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Postal Address</label>
                <textarea
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg text-xs"
              >
                Save configurations
              </button>
            </form>
          )}

          {/* TAB 4: SYSTEM USERS LIST & CREATOR (Admin only) */}
          {activeTab === 'users' && user?.role === 'Admin' && (
            <div className="space-y-6">
              {/* Creator form */}
              <form onSubmit={handleAddUser} className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Register system operator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Name</span>
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-850 border border-slate-250 rounded-lg text-xs"
                      placeholder="Operator Name"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-850 border border-slate-250 rounded-lg text-xs"
                      placeholder="operator@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Password</span>
                    <input
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-850 border border-slate-250 rounded-lg text-xs"
                      placeholder="min 6 chars"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Role</span>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-850 border border-slate-250 rounded-lg text-xs font-semibold"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs active:scale-95 transition-all shadow-sm"
                >
                  Create User Account
                </button>
              </form>

              {/* Users table */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  System accounts register
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-155 dark:border-slate-800">
                  <table className="w-full text-left text-xs font-semibold text-slate-500 dark:text-slate-450">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b">
                      <tr>
                        <th className="p-3">Operator Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {systemUsers.map((u) => (
                        <tr key={u._id}>
                          <td className="p-3 text-slate-850 dark:text-white font-bold">{u.name}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 font-semibold text-slate-700">{u.role}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {u._id !== user._id ? (
                              <button
                                onClick={() => handleToggleUserStatus(u._id, u.status === 'Active' ? 'Inactive' : 'Active')}
                                className={`text-[10px] font-bold px-2 py-1 border rounded-lg transition-colors ${
                                  u.status === 'Active'
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Self</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notifications */}
      {toastMsg && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
};

export default Settings;
