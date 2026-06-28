import React, { useState, useEffect } from 'react';
import { Plus, MagnifyingGlass, Trash, UserMinus, UserCheck, ArrowsCounterClockwise, ShieldWarning, Medal, Key, Pencil } from '@phosphor-icons/react';
import M3ScreenHeader from './M3ScreenHeader';
import { API_BASE } from '../config/api';

export default function UserManagement({ currentUser, setActiveTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);



  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Edit User Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEnrollmentNo, setEditEnrollmentNo] = useState('');
  const [editRole, setEditRole] = useState('student');

  // Change Role Inline State
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingSwitchPowerId, setUpdatingSwitchPowerId] = useState(null);

  // Reset Password Inline State
  const [resettingUserId, setResettingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Global settings registration toggle
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [togglingRegistration, setTogglingRegistration] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/users?search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch users list');
      }

      const responseData = await res.json();
      setUsers(responseData.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/settings/registration`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setRegistrationEnabled(data.registrationEnabled);
        }
      } catch (err) {
        console.error('Failed to fetch registration status:', err);
      }
    };
    fetchRegistrationStatus();
  }, []);



  const handleToggleRegistration = async () => {
    const nextVal = !registrationEnabled;
    try {
      setTogglingRegistration(true);
      const res = await fetch(`${API_BASE}/api/users/settings/registration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextVal }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update registration status');
      }

      setRegistrationEnabled(nextVal);
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingRegistration(false);
    }
  };

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 12);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !enrollmentNo || !password || !role) return;

    const constructedEmail = `${enrollmentNo.trim().toLowerCase()}@campos.local`;

    try {
      setSubmittingUser(true);
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: constructedEmail,
          password,
          role,
          studentProfile: role === 'student' ? { enrollmentId: enrollmentNo.trim() } : undefined,
          educatorProfile: role === 'educator' ? { employeeId: enrollmentNo.trim() } : undefined,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user account');
      }

      // Reset fields & close modal
      setFirstName('');
      setLastName('');
      setEnrollmentNo('');
      setPassword('');
      setRole('student');
      setShowAddModal(false);

      // Refresh list
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser || !editFirstName || !editLastName || !editEnrollmentNo || !editRole) return;

    const constructedEmail = `${editEnrollmentNo.trim().toLowerCase()}@campos.local`;

    try {
      setSubmittingUser(true);

      // 1. If role has changed, update the role first
      if (editRole !== editingUser.role) {
        if (editingUser._id === currentUser._id) {
          throw new Error('You cannot change your own role.');
        }

        const roleRes = await fetch(`${API_BASE}/api/users/${editingUser._id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: editRole }),
          credentials: 'include',
        });

        if (!roleRes.ok) {
          const errorData = await roleRes.json();
          throw new Error(errorData.message || 'Failed to update user role');
        }
      }

      // 2. Update profile details
      const updateRes = await fetch(`${API_BASE}/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          email: constructedEmail,
          studentProfile: editRole === 'student' ? { enrollmentId: editEnrollmentNo.trim() } : undefined,
          educatorProfile: editRole === 'educator' ? { employeeId: editEnrollmentNo.trim() } : undefined,
        }),
        credentials: 'include',
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.message || 'Failed to update user details');
      }

      // Reset & close
      setShowEditModal(false);
      setEditingUser(null);
      setEditFirstName('');
      setEditLastName('');
      setEditEnrollmentNo('');
      setEditRole('student');

      // Refresh list
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleSuspend = async (userId, currentlySuspended) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/suspend`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to toggle suspension status');
      }

      // Update state
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === userId) {
            return { ...u, isSuspended: !currentlySuspended };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleSwitchPower = async (userId, currentVal) => {
    try {
      setUpdatingSwitchPowerId(userId);
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canSwitchRoles: !currentVal }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user privileges');
      }

      // Update state
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === userId) {
            return { ...u, canSwitchRoles: !currentVal };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingSwitchPowerId(null);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.trim().length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await fetch(`${API_BASE}/api/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      alert('Password reset successfully. The user will be forced to change it on their next login.');
      setResettingUserId(null);
      setNewPassword('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleChangeRole = async (userId) => {
    if (!selectedRole) return;
    try {
      setUpdatingRole(true);
      const res = await fetch(`${API_BASE}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change user role');
      }

      // Update state
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === userId) {
            return { ...u, role: selectedRole };
          }
          return u;
        })
      );
      setEditingUserId(null);
      setSelectedRole('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser?._id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete the user account for "${userEmail}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      // Remove from state
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'super_admin':
        return {
          background: 'color-mix(in srgb, var(--m3-primary) 18%, transparent)',
          color: 'var(--m3-primary)',
        };
      case 'admin':
        return {
          background: 'color-mix(in srgb, var(--m3-tertiary) 18%, transparent)',
          color: 'var(--m3-tertiary)',
        };
      case 'canteen_admin':
        return {
          background: 'color-mix(in srgb, #ffb77c 18%, transparent)',
          color: '#ffb77c',
        };
      case 'educator':
        return {
          background: 'color-mix(in srgb, #a8c7ff 18%, transparent)',
          color: '#a8c7ff',
        };
      default:
        return {
          background: 'var(--m3-surface-container-highest)',
          color: 'var(--m3-on-surface-variant)',
        };
    }
  };

  const formatRoleName = (roleName) => {
    if (!roleName) return '';
    return roleName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="m3-screen user-management-dashboard">
      <M3ScreenHeader
        title="User Accounts"
        subtitle={`${users.length} registered accounts`}
        isScrolled={isScrolled}
        onBack={() => setActiveTab('home')}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll">

            {/* Global Settings & Add User Action Bar */}
        <div className="flex flex-col gap-3.5 mb-3 w-full shrink-0">
          {/* Public Signups Toggle */}
          <div className="m3-surface-card p-4 flex justify-between items-center text-left shadow-sm">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-xs font-extrabold text-m3-onSurface uppercase tracking-wider">Public Registration</span>
              <span className="text-[11px] text-m3-onSurfaceVariant/85 font-medium leading-normal">
                Allow new students to sign up from the lockscreen
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={registrationEnabled}
                onChange={handleToggleRegistration}
                disabled={togglingRegistration}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-m3-surfaceContainerHighest rounded-full peer peer-checked:after:translate-x-[16px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-m3-onSurfaceVariant peer-checked:after:bg-m3-onPrimary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-m3-primary relative"></div>
            </label>
          </div>

          {/* Add User Floating Action Bar Button */}
          <div className="flex justify-end items-center w-full px-1">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm cursor-pointer bg-m3-primary text-m3-onPrimary hover:brightness-110 active:scale-95" data-haptic="medium"
              type="button"
            >
              <Plus size={14} />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* MagnifyingGlass Field */}
        <div className="relative w-full shrink-0 mb-3">
          <span className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-m3-outline z-10">
            <MagnifyingGlass size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="m3-filled-field !pl-12 !pr-4 !rounded-full !h-[48px] text-sm"
          />
        </div>

        {/* Loading State */}
        {loading && users.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
            <ArrowsCounterClockwise className="animate-spin text-m3-primary" size={28} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading user directory...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-m3-onSurface">⚠️ {error}</p>
            <button className="m3-filled-button" style={{ maxWidth: 160 }} onClick={fetchUsers}>Retry</button>
          </div>
        )}

        {/* Users List Grid */}
        {!loading && !error && (
          <div className="w-full flex flex-col gap-4">
            {users.length === 0 ? (
              <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-3 text-center select-none">
                <div className="w-12 h-12 rounded-2xl bg-m3-primaryContainer/30 flex items-center justify-center text-m3-primary shadow-md">
                  <MagnifyingGlass size={22} />
                </div>
                <h4 className="text-sm text-m3-onSurface font-extrabold uppercase tracking-widest">No users found</h4>
                <span className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                  No accounts matched your search keyword.
                </span>
              </div>
            ) : (
              users.map((user) => {
                const isSelf = user._id === currentUser?._id;
                const roleBadge = getRoleBadgeStyle(user.role);

                return (
                  <div
                    key={user._id}
                    className={`m3-surface-card p-5 flex flex-col gap-3.5 text-left transition-all relative ${
                      user.isSuspended ? 'opacity-60 border border-transparent' : ''
                    }`}
                    style={user.isSuspended ? { borderColor: 'color-mix(in srgb, var(--m3-error) 20%, transparent)' } : {}}
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-3">
                      {/* Initials Avatar */}
                      <div 
                        className="w-10 h-10 rounded-full text-m3-primary flex items-center justify-center font-bold text-sm shrink-0 select-none uppercase"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--m3-primary-container) 30%, transparent)' }}
                      >
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>

                      {/* Name and Email */}
                      <div className="flex-1 min-w-0 pr-24">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-m3-onSurface tracking-wide truncate">
                            {user.firstName} {user.lastName} {isSelf && <span className="text-[10px] text-m3-outline ml-1 font-semibold">(You)</span>}
                          </h4>
                        </div>
                        <span className="text-xs text-m3-onSurfaceVariant truncate block mt-0.5">{user.email}</span>
                      </div>

                      {/* Absolute Positioned Role Badge */}
                      <span
                        className="absolute top-5 right-5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase shrink-0"
                        style={roleBadge}
                      >
                        {formatRoleName(user.role)}
                      </span>
                    </div>

                    {/* Meta info & details */}
                    <div className="flex flex-col gap-2 text-xs text-m3-onSurfaceVariant pb-3 border-b" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 50%, transparent)' }}>
                      {user.phone && (
                        <div className="flex justify-between items-center">
                          <span className="opacity-80">Phone Number:</span>
                          <span className="font-semibold text-m3-onSurface">{user.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="opacity-80">Account Status:</span>
                        <span 
                          className={`font-extrabold uppercase tracking-wider text-[9px] px-2.5 py-0.5 rounded-full ${
                            user.isSuspended ? 'text-m3-error' : 'text-m3-primary'
                          }`}
                          style={{
                            backgroundColor: user.isSuspended
                              ? 'color-mix(in srgb, var(--m3-error-container) 20%, transparent)'
                              : 'color-mix(in srgb, var(--m3-primary-container) 20%, transparent)'
                          }}
                        >
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-80">Allow Role Switching:</span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={user.canSwitchRoles || (user.email ? user.email.split('@')[0] === '2501200031' : false)}
                            onChange={() => handleToggleSwitchPower(user._id, user.canSwitchRoles)}
                            disabled={updatingSwitchPowerId === user._id || isSelf}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-m3-surfaceContainerHighest rounded-full peer peer-checked:after:translate-x-[16px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-m3-onSurfaceVariant peer-checked:after:bg-m3-onPrimary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-m3-primary relative"></div>
                        </label>
                      </div>
                    </div>

                    {/* Inline Actions (Role Edit or Password Reset) */}
                    {resettingUserId === user._id ? (
                      <div className="flex items-center gap-2 w-full pt-1.5 animate-fade-in">
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 8 chars)"
                          className="m3-filled-field !h-9 !py-1 !text-xs !rounded-xl flex-1 !px-3"
                          style={{ border: 'none' }}
                        />
                        <button
                          className="px-3 h-9 rounded-xl bg-m3-primaryContainer hover:brightness-110 text-m3-onPrimaryContainer flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer" data-haptic="medium"
                          onClick={() => handleResetPassword(user._id)}
                          disabled={updatingPassword}
                        >
                          Save
                        </button>
                        <button
                          className="px-3 h-9 rounded-xl bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer" data-haptic="medium"
                          onClick={() => { setResettingUserId(null); setNewPassword(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : editingUserId === user._id ? (
                      <div className="flex items-center gap-2 w-full pt-1.5 animate-fade-in">
                        <div className="m3-select-wrap flex-1">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="m3-select !h-9 !py-1 !text-xs !rounded-xl"
                          >
                            <option value="student">Student</option>
                            <option value="educator">Educator</option>
                            <option value="admin">Admin</option>
                            <option value="canteen_admin">Canteen Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3 top-1/2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>
                        <button
                          className="px-3 h-9 rounded-xl bg-m3-primaryContainer hover:brightness-110 text-m3-onPrimaryContainer flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer" data-haptic="medium"
                          onClick={() => handleChangeRole(user._id)}
                          disabled={updatingRole}
                        >
                          Save
                        </button>
                        <button
                          className="px-3 h-9 rounded-xl bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer" data-haptic="medium"
                          onClick={() => { setEditingUserId(null); setSelectedRole(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Symmetric Actions Grid */
                      isSelf ? (
                        <div className="w-full pt-1">
                          <button
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-m3-onTertiaryContainer bg-m3-tertiaryContainer hover:brightness-110 transition cursor-pointer uppercase tracking-wider py-2.5 rounded-xl"
                            onClick={() => { setResettingUserId(user._id); setNewPassword(''); }}
                          >
                            <Key size={14} /> Reset Password
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                          <button
                            className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-m3-onPrimaryContainer bg-m3-primaryContainer hover:brightness-110 transition cursor-pointer uppercase tracking-wider py-2.5 rounded-xl"
                            onClick={() => {
                              setEditingUser(user);
                              setEditFirstName(user.firstName || '');
                              setEditLastName(user.lastName || '');
                              setEditEnrollmentNo(user.email ? user.email.split('@')[0] : '');
                              setEditRole(user.role);
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil size={14} /> Edit Details
                          </button>
                          
                          <button
                            className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-m3-onTertiaryContainer bg-m3-tertiaryContainer hover:brightness-110 transition cursor-pointer uppercase tracking-wider py-2.5 rounded-xl"
                            onClick={() => { setResettingUserId(user._id); setNewPassword(''); }}
                          >
                            <Key size={14} /> Reset Pass
                          </button>

                          <button
                            className={`flex items-center justify-center gap-1.5 text-[10px] font-bold transition cursor-pointer uppercase tracking-wider py-2.5 rounded-xl ${
                              user.isSuspended
                                ? 'text-m3-onPrimaryContainer hover:brightness-110'
                                : 'text-m3-onErrorContainer hover:brightness-110'
                            }`}
                            style={{
                              backgroundColor: user.isSuspended
                                ? 'color-mix(in srgb, var(--m3-primary-container) 70%, transparent)'
                                : 'color-mix(in srgb, var(--m3-error-container) 45%, transparent)'
                            }}
                            onClick={() => handleToggleSuspend(user._id, user.isSuspended)}
                          >
                            {user.isSuspended ? <UserCheck size={14} /> : <UserMinus size={14} />}
                            <span>{user.isSuspended ? 'Reactivate' : 'Suspend'}</span>
                          </button>

                          <button
                            className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-m3-onErrorContainer bg-m3-errorContainer hover:brightness-110 transition cursor-pointer uppercase tracking-wider py-2.5 rounded-xl"
                            onClick={() => handleDeleteUser(user._id, user.email)}
                          >
                            <Trash size={14} /> Delete
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
  </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] bg-m3-surfaceContainer border border-transparent p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 55%, transparent)' }}>
              <h3 className="m3-title-medium flex items-center gap-2">
                <ShieldWarning size={18} className="text-m3-primary" /> Create Account
              </h3>
              <button className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 text-left">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">First Name</span>
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Last Name</span>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Enrollment Number</span>
                <input
                  type="text"
                  placeholder="e.g. 4722 or 2501200031"
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                  required
                  className="m3-filled-field !h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Password</span>
                <input
                  type="text"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="m3-filled-field !h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">User Role</span>
                <div className="m3-select-wrap">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="m3-select !h-11"
                  >
                    <option value="student">Student</option>
                    <option value="educator">Educator</option>
                    <option value="admin">Admin</option>
                    <option value="canteen_admin">Canteen Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-4 top-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 select-none">
                <button
                  type="button"
                  className="flex-1 h-[48px] rounded-full border-none bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="m3-filled-button flex-1"
                  style={{ minHeight: 48 }}
                  disabled={submittingUser}
                >
                  {submittingUser ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-6" onClick={() => setShowEditModal(false)}>
          <div
            className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] bg-m3-surfaceContainer border border-transparent p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 55%, transparent)' }}>
              <h3 className="m3-title-medium flex items-center gap-2">
                <Pencil size={18} className="text-m3-primary" /> Edit Details
              </h3>
              <button 
                className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold border-none bg-transparent" 
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUser} className="flex flex-col gap-4 text-left">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">First Name</span>
                  <input
                    type="text"
                    placeholder="John"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Last Name</span>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Enrollment Number</span>
                <input
                  type="text"
                  placeholder="e.g. 4722 or 2501200031"
                  value={editEnrollmentNo}
                  onChange={(e) => setEditEnrollmentNo(e.target.value)}
                  required
                  className="m3-filled-field !h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">User Role</span>
                <div className="m3-select-wrap">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    required
                    disabled={editingUser._id === currentUser._id}
                    className="m3-select !h-11"
                  >
                    <option value="student">Student</option>
                    <option value="educator">Educator</option>
                    <option value="admin">Admin</option>
                    <option value="canteen_admin">Canteen Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-4 top-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 select-none">
                <button
                  type="button"
                  className="flex-1 h-[48px] rounded-full border-none bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="m3-filled-button flex-1"
                  style={{ minHeight: 48 }}
                  disabled={submittingUser}
                >
                  {submittingUser ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
