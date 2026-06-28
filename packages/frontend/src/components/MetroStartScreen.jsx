import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Coffee, ForkKnife, QrCode, Ticket, Clock, Calendar, Handshake, Books, CaretRight, CaretLeft, Layout, WifiSlash, Palette, X, Check, Sun, Moon, SunDim, ClipboardText, Users, User, DotsThreeVertical, Key, SignOut, Eye, EyeSlash, Lock, Sliders, Gear, Trash, Sparkle } from '@phosphor-icons/react';
import { applyTheme, applyThemeMode, initGeolocation } from '../utils/theme';
import { clearPortalCache } from '../utils/cache';
import { API_BASE } from '../config/api';

function PillLabel({ icon: Icon, children, badge }) {
  return (
    <span className="home-pill__label">
      {Icon && (
        <span className="relative inline-flex">
          <Icon className="home-pill__icon" strokeWidth={2.25} aria-hidden />
          {badge && <span className="home-pill__unread-dot" />}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}

function VerticalPill({ icon: Icon, children, stacked, badge }) {
  return (
    <span className="home-pill__vertical">
      {Icon && (
        <span className="relative inline-flex">
          <Icon className="home-pill__icon" strokeWidth={2.25} aria-hidden />
          {badge && <span className="home-pill__unread-dot" />}
        </span>
      )}
      {stacked ? (
        <span className="home-pill__vertical-text home-pill__vertical-text--stacked">
          <span>{stacked[0]}</span>
          <span>{stacked[1]}</span>
        </span>
      ) : (
        <span className="home-pill__vertical-text">{children}</span>
      )}
    </span>
  );
}

/** Canteen row only — one unified button spanning full width */
function CanteenPillRow({ onClick, title, disabled, variants }) {
  return (
    <motion.button 
      variants={variants}
      whileTap={{ scale: 0.96 }}
        data-haptic="medium"
      whileHover={{ y: -2, scale: 1.01 }}
      type="button" 
      className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center relative ${disabled ? 'opacity-25 grayscale' : ''}`} 
      onClick={onClick} 
      title={title}
    >
      <PillLabel icon={Coffee}>Canteen</PillLabel>
    </motion.button>
  );
}

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.02
    }
  }
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 15 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 26
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.35, 
      ease: [0.16, 1, 0.3, 1] 
    }
  }
};

const chipVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export default function MetroStartScreen({ currentUser, stats, onTileClick, onLogout, hasUnreadNotices, hasReportedChats, onUpdateCurrentUser, tabControls }) {
  const isTabDisabled = (tabId) => {
    if (currentUser?.role === 'super_admin') return false;
    if (currentUser?.role === 'canteen_admin' && tabId === 'canteen') return false;
    return tabControls && tabControls[tabId] && !tabControls[tabId].enabled;
  };
  const [activePass, setActivePass] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [activeOrder, setActiveOrder] = useState(null);

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('campos-theme') || 'lavender';
  });
  const [currentMode, setCurrentMode] = useState(() => {
    return localStorage.getItem('campos-mode') || 'dark';
  });
  const [amoled, setAmoled] = useState(() => {
    return localStorage.getItem('campos-amoled') === 'true';
  });
  const [customHue, setCustomHue] = useState(() => {
    return parseInt(localStorage.getItem('campos-custom-hue')) || 270;
  });

  const handleApplyTheme = (themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  const handleHueChange = (hue) => {
    setCustomHue(hue);
    localStorage.setItem('campos-custom-hue', hue);
    setCurrentTheme('custom');
    applyTheme('custom');
  };

  const applyMode = (modeId) => {
    setCurrentMode(modeId);
    applyThemeMode(modeId, amoled);
    if (modeId === 'auto') {
      initGeolocation(() => {
        applyThemeMode('auto', amoled);
      });
    }
  };

  const toggleAmoled = (enabled) => {
    setAmoled(enabled);
    applyThemeMode(currentMode, enabled);
  };

  const [initialThemeState, setInitialThemeState] = useState(null);

  useEffect(() => {
    if (showThemeSelector) {
      setInitialThemeState({
        theme: currentTheme,
        hue: customHue,
        mode: currentMode,
        amoled: amoled
      });
    }
  }, [showThemeSelector]);

  const handleCancel = () => {
    if (initialThemeState) {
      setCurrentTheme(initialThemeState.theme);
      setCustomHue(initialThemeState.hue);
      setCurrentMode(initialThemeState.mode);
      setAmoled(initialThemeState.amoled);
      localStorage.setItem('campos-theme', initialThemeState.theme);
      localStorage.setItem('campos-custom-hue', initialThemeState.hue);
      localStorage.setItem('campos-mode', initialThemeState.mode);
      localStorage.setItem('campos-amoled', initialThemeState.amoled ? 'true' : 'false');
      applyTheme(initialThemeState.theme);
      applyThemeMode(initialThemeState.mode, initialThemeState.amoled);
    }
    setShowThemeSelector(false);
  };

  const handleConfirm = () => {
    setShowThemeSelector(false);
  };

  useEffect(() => {
    applyTheme(currentTheme);
    applyThemeMode(currentMode, amoled);
  }, [currentTheme, currentMode, amoled]);

  // 3-Dot Menu & Reset Password States
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);
  const [hasDismissedResetPrompt, setHasDismissedResetPrompt] = useState(false);

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetSuccess(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Confirm new password does not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setResetError('New password must be different from current password.');
      return;
    }

    try {
      setResetSubmitting(true);
      setResetError(null);
      setResetSuccess(null);

      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setResetSuccess('Password changed successfully! Logging out...');
      
      setTimeout(() => {
        setShowResetPasswordModal(false);
        resetPasswordForm();
        onLogout();
      }, 2000);

    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleCloseMenu = () => setShowMoreMenu(false);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, [showMoreMenu]);

  // Local state and effect handle theme/mode changes

  useEffect(() => {
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';

    const loadLocalStorage = () => {
      const passStr = localStorage.getItem(`cp_token_${username}`);
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass?.ExpiryTime) {
            const diffMs = new Date(pass.ExpiryTime) - new Date();
            const mins = Math.max(0, Math.ceil(diffMs / 60000));
            if (mins > 0) {
              setActivePass(pass);
              setRemainingMinutes(mins);
            } else {
              localStorage.removeItem(`cp_token_${username}`);
              setActivePass(null);
              setRemainingMinutes(0);
            }
          } else {
            setActivePass(null);
            setRemainingMinutes(0);
          }
        } catch {
          setActivePass(null);
          setRemainingMinutes(0);
        }
      } else {
        setActivePass(null);
        setRemainingMinutes(0);
      }

      const orderStr = localStorage.getItem(`cp_order_${username}`);
      if (orderStr) {
        try {
          setActiveOrder(JSON.parse(orderStr));
        } catch {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
    };

    loadLocalStorage();
    const interval = setInterval(loadLocalStorage, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const isStudent = currentUser?.role === 'student';
  const isAdmin = currentUser?.role === 'admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isCanteenAdmin = currentUser?.role === 'canteen_admin';

  const username = currentUser?.email ? currentUser.email.split('@')[0] : '';
  const isTargetUser = currentUser?.canSwitchRoles || username === '2501200031';

  const handleSwitchRole = async (targetRole) => {
    try {
      setShowMoreMenu(false);
      const res = await fetch(`${API_BASE}/api/auth/switch-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser(data.user);
        }
      } else {
        alert(data.message || 'Failed to switch role');
      }
    } catch (err) {
      alert('An error occurred: ' + err.message);
    }
  };

  const displayName = useMemo(() => {
    try {
      const cached = localStorage.getItem('profileData');
      if (cached) {
        const parsed = JSON.parse(cached);
        const profile = parsed?.data || parsed;
        const fullName = profile?.name || profile?.generalinformation?.name;
        if (fullName) {
          const first = fullName.trim().split(/\s+/)[0];
          return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        }
      }
    } catch {
      // ignore
    }
    if (currentUser?.firstName) return currentUser.firstName;
    return 'Guest';
  }, [currentUser]);

  const avatarUrl = useMemo(() => {
    const username = currentUser?.email ? currentUser.email.split('@')[0] : 'user';
    const permanentKey = `cp_user_avatar_${username}`;

    try {
      const cached = localStorage.getItem('profileData');
      if (cached) {
        const parsed = JSON.parse(cached);
        const profile = parsed?.data || parsed;
        if (profile?.avatar) {
          localStorage.setItem(permanentKey, profile.avatar);
          return profile.avatar;
        }
      }
    } catch {
      // ignore
    }

    try {
      const permanentAvatar = localStorage.getItem(permanentKey);
      if (permanentAvatar) {
        return permanentAvatar;
      }
    } catch {
      // ignore
    }
    return null;
  }, [currentUser]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const openCanteen = () => onTileClick('canteen');
  const openCanteenOrders = () => onTileClick('canteen_orders');
  const openCanteenMenu = () => onTileClick('canteen_menu');

  const isSquished = !!(activePass || activeOrder);

  const studentGrid = (
    <motion.div 
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
      className="home-screen__grid home-screen__grid--rows-6"
    >
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center relative ${hasUnreadNotices ? 'home-pill--notices-unread' : ''} ${isTabDisabled('notices') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone} badge={hasUnreadNotices}>Notices</PillLabel>
      </motion.button>

      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c3 home-pill--shape-round home-pill--align-center relative ${isTabDisabled('student_dashboard') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('student_dashboard')}
        title="Student Dashboard"
      >
        <PillLabel icon={Layout}>Dashboard</PillLabel>
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c1 home-pill--shape-squircle home-pill--icon-only relative ${isTabDisabled('timetable') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('timetable')}
        title="Timetable"
      >
        <Clock className="home-pill__icon" strokeWidth={2.35} aria-hidden />
      </motion.button>

      <CanteenPillRow onClick={openCanteen} title="Canteen" disabled={isTabDisabled('canteen')} variants={gridItemVariants} />

      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-oval relative ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'} ${isTabDisabled('mess') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('mess')}
        title="Mess Menu"
      >
        {isSquished ? (
          <PillLabel icon={ForkKnife}>Mess Menu</PillLabel>
        ) : (
          <VerticalPill icon={ForkKnife} stacked={['Mess', 'Menu']} />
        )}
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-oval relative ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'} ${isTabDisabled('skillgigs') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('skillgigs')}
        title="Skill Swap"
      >
        {isSquished ? (
          <PillLabel icon={Handshake}>Skill Swap</PillLabel>
        ) : (
          <VerticalPill icon={Handshake} stacked={['Skill', 'Swap']} />
        )}
      </motion.button>

      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-soft relative ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'} ${isTabDisabled('materials') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('materials')}
        title="Shelf"
      >
        {isSquished ? (
          <PillLabel icon={Books}>Shelf</PillLabel>
        ) : (
          <VerticalPill icon={Books}>Shelf</VerticalPill>
        )}
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-soft relative ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'} ${isTabDisabled('calendar') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('calendar')}
        title="Calendar"
      >
        {isSquished ? (
          <PillLabel icon={Calendar}>Calendar</PillLabel>
        ) : (
          <VerticalPill icon={Calendar}>Calendar</VerticalPill>
        )}
      </motion.button>

      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center relative ${isTabDisabled('info') ? 'opacity-25 grayscale' : ''}`}
        onClick={() => onTileClick('info')}
        title="Info Hub"
      >
        <PillLabel icon={Users}>Info Hub</PillLabel>
      </motion.button>
    </motion.div>
  );

  const adminGrid = (
    <motion.div 
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
      className="home-screen__grid home-screen__grid--rows-3"
    >
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center ${hasUnreadNotices ? 'home-pill--notices-unread' : ''}`}
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone} badge={hasUnreadNotices}>Notices</PillLabel>
      </motion.button>

      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('mess')}
        title="Mess Menu"
      >
        <VerticalPill icon={ForkKnife} stacked={['Mess', 'Menu']} />
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('skillgigs')}
        title="Skill Swap"
      >
        <VerticalPill icon={Handshake} stacked={['Skill', 'Swap']} />
      </motion.button>

      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('materials')}
        title="Shelf"
      >
        <VerticalPill icon={Books}>Shelf</VerticalPill>
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('calendar')}
        title="Calendar"
      >
        <VerticalPill icon={Calendar}>Calendar</VerticalPill>
      </motion.button>
    </motion.div>
  );

  const superAdminGrid = (
    <motion.div 
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
      className="home-screen__grid home-screen__grid--rows-5"
    >
      {/* Notices: full width (4 cols) */}
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center ${hasUnreadNotices ? 'home-pill--notices-unread' : ''}`}
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone} badge={hasUnreadNotices}>Notices Board</PillLabel>
      </motion.button>

      {/* Row 2: Mess Menu (span 2), Skill Swap (span 2) */}
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('mess')}
        title="Mess Menu"
      >
        <VerticalPill icon={ForkKnife} stacked={['Mess', 'Menu']} />
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical ${hasReportedChats ? 'home-pill--notices-unread' : ''}`}
        onClick={() => onTileClick('skillgigs')}
        title="Skill Swap"
      >
        <VerticalPill icon={Handshake} stacked={['Skill', 'Swap']} badge={hasReportedChats} />
      </motion.button>

      {/* Row 3: Study Shelf (span 2), Calendar (span 2) */}
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('materials')}
        title="Shelf"
      >
        <VerticalPill icon={Books}>Shelf</VerticalPill>
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('calendar')}
        title="Calendar"
      >
        <VerticalPill icon={Calendar}>Calendar</VerticalPill>
      </motion.button>

      {/* Row 4: Edit Menu (span 4) */}
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
        onClick={openCanteenMenu}
        title="Edit Menu"
      >
        <PillLabel icon={Coffee}>Edit Canteen Menu</PillLabel>
      </motion.button>

      {/* Row 5: Manage Users (span 2), App Controls (span 2) */}
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('users')}
        title="User Management"
      >
        <VerticalPill icon={Users}>Manage Users</VerticalPill>
      </motion.button>
      <motion.button
        variants={gridItemVariants}
        whileTap={{ scale: 0.96 }}
        data-haptic="medium"
        whileHover={{ y: -2, scale: 1.01 }}
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('appcontrols')}
        title="App Controls"
      >
        <VerticalPill icon={Sliders}>App Controls</VerticalPill>
      </motion.button>

    </motion.div>
  );

  return (
    <div className="home-screen text-m3-onSurface font-sans select-none relative z-10">
      <motion.header 
        variants={headerVariants}
        initial="hidden"
        animate="show"
        className="home-screen__header"
      >
        <div className="home-screen__titles">
          <p className="home-screen__welcome">{greeting}</p>
          <h1 className="home-screen__name">{displayName}</h1>
        </div>

        <div className="flex items-center gap-3.5 shrink-0">
          {/* CampAi Copilot Icon (circular button with stars logo) */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            data-haptic="light"
            type="button"
            className="home-screen__ai-btn"
            onClick={(e) => onTileClick('campai', e)}
            title="CampAi Copilot"
          >
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="var(--m3-primary)" />
                  <stop offset="50%"  stopColor="var(--m3-secondary)" />
                  <stop offset="100%" stopColor="var(--m3-tertiary)" />
                </linearGradient>
              </defs>
              <path fill="url(#sparkle-grad)" d="M50,2 C52,28 72,48 98,50 C72,52 52,72 50,98 C48,72 28,52 2,50 C28,48 48,28 50,2Z"/>
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-haptic="light"
            type="button"
            className="home-screen__profile-pill"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(!showMoreMenu);
            }}
            title="Profile and settings"
          >
            <Gear size={18} className="home-screen__profile-pill-settings-icon" weight="bold" />
            <div className="home-screen__avatar-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="home-screen__avatar-image" />
              ) : (
                <User className="home-screen__avatar-placeholder" strokeWidth={2.25} />
              )}
            </div>
          </motion.button>
        </div>

        {/* 3-Dot Dropdown Menu */}
        {showMoreMenu && (
          <div
            className="home-screen__menu-dropdown animate-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="home-screen__menu-item"
              onClick={() => {
                setShowMoreMenu(false);
                setShowThemeSelector(true);
              }}
            >
              <Palette className="home-screen__menu-item-icon" />
              <span>Theme Options</span>
            </button>
            <button
              type="button"
              className="home-screen__menu-item"
              onClick={() => {
                setShowMoreMenu(false);
                setShowResetPasswordModal(true);
              }}
            >
              <Key className="home-screen__menu-item-icon" />
              <span>Reset Password</span>
            </button>
            {isTargetUser && (
              isSuperAdmin ? (
                <button
                  type="button"
                  className="home-screen__menu-item text-m3-primary"
                  onClick={() => handleSwitchRole('student')}
                >
                  <User className="home-screen__menu-item-icon !text-m3-primary" />
                  <span>Switch to Student</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="home-screen__menu-item text-m3-primary"
                  onClick={() => handleSwitchRole('super_admin')}
                >
                  <Users className="home-screen__menu-item-icon !text-m3-primary" />
                  <span>Switch to Super Admin</span>
                </button>
              )
            )}
            <button
              type="button"
              className="home-screen__menu-item"
              onClick={() => {
                setShowMoreMenu(false);
                clearPortalCache();
                alert("Cache cleared successfully! Reloading to sync data...");
                window.location.reload();
              }}
            >
              <Trash className="home-screen__menu-item-icon" />
              <span>Clear Cache</span>
            </button>
            <button
              type="button"
              className="home-screen__menu-item text-m3-error"
              onClick={() => {
                setShowMoreMenu(false);
                onLogout();
              }}
            >
              <SignOut className="home-screen__menu-item-icon !text-m3-error" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </motion.header>

      {(activePass || activeOrder) && (
        <motion.div 
          variants={chipVariants}
          initial="hidden"
          animate="show"
          className="home-screen__chips flex flex-col gap-3"
        >
          {activePass && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01, y: -1 }}
              type="button"
              onClick={() => onTileClick('MESS_QR_FULL')}
              className="w-full rounded-[28px] bg-m3-surfaceContainerHigh border-none px-6 py-5 flex items-center justify-between text-left shadow-xl cursor-pointer transition-[background-color] duration-300"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-m3-onSurface tracking-tight">Mess Access</h4>
                <p className="text-sm font-bold text-m3-onSurface leading-tight">
                  Ticket active • {remainingMinutes} min left {activePass?.Quantity > 1 && `(${activePass.Quantity} tickets)`}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-m3-onSurfaceVariant/85 mt-1 font-medium select-none">
                  <WifiSlash size={14} className="opacity-80" />
                  <span>Tap for QR</span>
                </div>
              </div>
              <div 
                className="w-12 h-12 rounded-full text-m3-onPrimaryContainer flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: 'color-mix(in srgb, var(--m3-primary-container) 30%, transparent)' }}
              >
                <QrCode size={20} />
              </div>
            </motion.button>
          )}
          {activeOrder && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01, y: -1 }}
              type="button"
              onClick={() => onTileClick('SUCCESS')}
              className="w-full rounded-[28px] bg-m3-surfaceContainerHigh border-none px-6 py-5 flex items-center justify-between text-left shadow-xl cursor-pointer transition-[background-color] duration-300"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-m3-onSurface tracking-tight">Canteen Order</h4>
                <p className="text-sm font-semibold text-m3-onSurface">
                  Pickup PIN • <span className="text-m3-tertiary font-black">{activeOrder.PickupPIN}</span>
                </p>
                <div className="flex items-center gap-1.5 text-xs text-m3-onSurfaceVariant/85 mt-1 font-medium select-none">
                  <Clock size={14} className="opacity-80" />
                  <span>Tap for Receipt</span>
                </div>
              </div>
              <div 
                className="w-12 h-12 rounded-full text-m3-tertiary flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: 'color-mix(in srgb, var(--m3-tertiary) 15%, transparent)' }}
              >
                <Ticket size={20} />
              </div>
            </motion.button>
          )}
        </motion.div>
      )}

      {isStudent && studentGrid}

      {isCanteenAdmin && (
        <motion.div 
          variants={gridContainerVariants}
          initial="hidden"
          animate="show"
          className="home-screen__grid home-screen__grid--rows-2"
        >
          <motion.button
            variants={gridItemVariants}
            whileTap={{ scale: 0.96 }}
        data-haptic="medium"
            whileHover={{ y: -2, scale: 1.01 }}
            type="button"
            className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
            onClick={openCanteenOrders}
            title="Student Orders"
          >
            <PillLabel icon={ClipboardText}>Student Orders</PillLabel>
          </motion.button>
          <motion.button
            variants={gridItemVariants}
            whileTap={{ scale: 0.96 }}
        data-haptic="medium"
            whileHover={{ y: -2, scale: 1.01 }}
            type="button"
            className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
            onClick={openCanteenMenu}
            title="Edit Menu"
          >
            <PillLabel icon={Coffee}>Edit Menu</PillLabel>
          </motion.button>
        </motion.div>
      )}

      {isAdmin && adminGrid}

      {isSuperAdmin && superAdminGrid}

      {/* 🎨 Theme Selector Popup Overlay */}
      <AnimatePresence>
        {showThemeSelector && (() => {
          const getThemeHue = () => {
            if (currentTheme === 'lavender') return 270;
            if (currentTheme === 'blue') return 220;
            if (currentTheme === 'green') return 140;
            if (currentTheme === 'orange') return 30;
            if (currentTheme === 'yellow') return 50;
            return customHue;
          };

          const activeHue = getThemeHue();
          const isLight = currentMode === 'light';
          
          // Sheet background
          const sheetBg = amoled && currentMode !== 'light' 
            ? '#050505' 
            : (isLight ? `hsl(${activeHue}, 60%, 93%)` : `hsl(${activeHue}, 20%, 12%)`);
            
          // Text color
          const sheetTextColor = isLight ? `hsl(${activeHue}, 60%, 20%)` : `hsl(${activeHue}, 20%, 90%)`;
          
          // Cancel button background
          const cancelBg = isLight ? `hsl(${activeHue}, 50%, 85%)` : `hsl(${activeHue}, 25%, 22%)`;
          // Cancel button icon color
          const cancelColor = isLight ? `hsl(${activeHue}, 60%, 30%)` : `hsl(${activeHue}, 20%, 85%)`;
          
          // Confirm button background
          const confirmBg = isLight ? `hsl(${activeHue}, 60%, 45%)` : `hsl(${activeHue}, 70%, 75%)`;
          // Confirm button icon color
          const confirmColor = isLight ? '#ffffff' : `hsl(${activeHue}, 70%, 15%)`;

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-end justify-center" 
              onClick={() => setShowThemeSelector(false)}
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                style={{ backgroundColor: sheetBg, color: sheetTextColor, transition: "background-color 0.3s ease, color 0.3s ease" }}
                className="rounded-t-[32px] rounded-b-none p-6 w-full shadow-2xl flex flex-col gap-5 text-left border-t border-m3-outlineVariant/10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mode Segmented Chips at the top */}
                <div className="flex flex-col gap-2 w-full px-2">
                  <div 
                    style={{ borderColor: isLight ? `rgba(0,0,0,0.1)` : `rgba(255,255,255,0.1)` }}
                    className="m3-segmented-chips w-full max-w-xs mx-auto justify-between bg-black/5 p-1 rounded-full border"
                  >
                    <button
                      type="button"
                      data-haptic="light"
                      onClick={() => applyMode('light')}
                      className={`flex-grow m3-segmented-chip flex items-center justify-center gap-1 py-1.5 text-xs font-bold transition-all duration-300 !rounded-full relative ${
                        currentMode === 'light'
                          ? 'text-white !bg-transparent'
                          : 'opacity-70 hover:opacity-100 !bg-transparent !border-none !shadow-none'
                      }`}
                    >
                      {currentMode === 'light' && (
                        <motion.div
                          layoutId="active-metro-mode-chip"
                          className="absolute inset-0 bg-m3-primary rounded-full z-0"
                          style={{ borderRadius: 9999 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        <Sun size={14} /> Light
                      </span>
                    </button>
                    <button
                      type="button"
                      data-haptic="light"
                      onClick={() => applyMode('dark')}
                      className={`flex-grow m3-segmented-chip flex items-center justify-center gap-1 py-1.5 text-xs font-bold transition-all duration-300 !rounded-full relative ${
                        currentMode === 'dark'
                          ? 'text-white !bg-transparent'
                          : 'opacity-70 hover:opacity-100 !bg-transparent !border-none !shadow-none'
                      }`}
                    >
                      {currentMode === 'dark' && (
                        <motion.div
                          layoutId="active-metro-mode-chip"
                          className="absolute inset-0 bg-m3-primary rounded-full z-0"
                          style={{ borderRadius: 9999 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        <Moon size={14} /> Dark
                      </span>
                    </button>
                    <button
                      type="button"
                      data-haptic="light"
                      onClick={() => applyMode('auto')}
                      className={`flex-grow m3-segmented-chip flex items-center justify-center gap-1 py-1.5 text-xs font-bold transition-all duration-300 !rounded-full relative ${
                        currentMode === 'auto'
                          ? 'text-white !bg-transparent'
                          : 'opacity-70 hover:opacity-100 !bg-transparent !border-none !shadow-none'
                      }`}
                    >
                      {currentMode === 'auto' && (
                        <motion.div
                          layoutId="active-metro-mode-chip"
                          className="absolute inset-0 bg-m3-primary rounded-full z-0"
                          style={{ borderRadius: 9999 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1">
                        <SunDim size={14} /> Auto
                      </span>
                    </button>
                  </div>

                  {currentMode !== 'light' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between w-full max-w-xs mx-auto mt-1 px-3"
                    >
                      <span className="text-xs font-bold opacity-80">AMOLED Mode</span>
                      <button
                        type="button"
                        data-haptic="light"
                        onClick={() => toggleAmoled(!amoled)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none relative flex items-center ${
                          amoled ? 'bg-m3-primary' : 'bg-black/10 border border-m3-outlineVariant/30'
                        }`}
                      >
                        <motion.div 
                          layout 
                          className="w-4 h-4 rounded-full bg-white shadow-md"
                          animate={{ x: amoled ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div 
                  style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }} 
                  className="h-[1px] w-full my-1" 
                />

                {/* Preset circles list */}
                <div className="flex items-center justify-center gap-3.5 w-full flex-wrap">
                  {[
                    { id: 'lavender', hex: '#d0bcff', name: 'Lavender' },
                    { id: 'blue', hex: '#a8c7ff', name: 'Sapphire Blue' },
                    { id: 'green', hex: '#85d996', name: 'Emerald Green' },
                    { id: 'orange', hex: '#ffb77c', name: 'Sunset Orange' },
                    { id: 'yellow', hex: '#e6c449', name: 'Amber Yellow' },
                  ].map((theme) => {
                    const isActive = currentTheme === theme.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.15 }}
                        key={theme.id}
                        onClick={() => handleApplyTheme(theme.id)}
                        className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-300 relative focus:outline-none shrink-0 border border-m3-outlineVariant/50 ${
                          isActive 
                            ? 'ring-4 ring-m3-primary ring-offset-4 ring-offset-m3-surfaceContainer'
                            : 'hover:ring-2 hover:ring-m3-outlineVariant/50'
                        }`}
                        style={{ backgroundColor: theme.hex }}
                        title={`${theme.name} Theme`}
                      />
                    );
                  })}
                </div>

                {/* Slider (mockup design) */}
                <div className="flex flex-col gap-2.5 w-full max-w-xs mx-auto mt-1">
                  <div className="relative flex items-center h-8 w-full">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={customHue}
                      onChange={(e) => handleHueChange(parseInt(e.target.value))}
                      className="theme-hue-slider"
                    />
                  </div>
                </div>

                {/* Cancel & Apply Action Buttons (mockup design) */}
                <div className="flex items-center justify-center gap-6 w-full mt-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    type="button"
                    onClick={handleCancel}
                    style={{ backgroundColor: cancelBg, color: cancelColor }}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border-none cursor-pointer"
                  >
                    <X size={22} weight="bold" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    type="button"
                    onClick={handleConfirm}
                    style={{ backgroundColor: confirmBg, color: confirmColor }}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border-none cursor-pointer"
                  >
                    <Check size={22} weight="bold" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 🔐 Reset Password Modal Overlay */}
      <AnimatePresence>
        {showResetPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 z-[99999] flex items-center justify-center p-6"
            onClick={() => {
              if (!resetSubmitting) {
                setShowResetPasswordModal(false);
                resetPasswordForm();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
              style={{
                background: 'var(--m3-surface-container)',
                border: '1px solid color-mix(in srgb, var(--m3-outline-variant) 40%, transparent)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 55%, transparent)' }}>
                <h3 className="m3-title-medium flex items-center gap-2">
                  <Lock size={18} className="text-m3-primary" /> Reset Password
                </h3>
                <button
                  disabled={resetSubmitting}
                  className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold border-none bg-transparent"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    resetPasswordForm();
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-left">
                {/* Current Password */}
                <div className="flex flex-col gap-1 relative">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Current Password</span>
                  <div className="relative w-full">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={resetSubmitting}
                      className="m3-filled-field !h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer border-none bg-transparent"
                    >
                      {showCurrentPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1 relative">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">New Password</span>
                  <div className="relative w-full">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={resetSubmitting}
                      className="m3-filled-field !h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer border-none bg-transparent"
                    >
                      {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1 relative">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Confirm New Password</span>
                  <div className="relative w-full">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={resetSubmitting}
                      className="m3-filled-field !h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer border-none bg-transparent"
                    >
                      {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Success/Error Banners */}
                {resetError && (
                  <div className="text-xs font-semibold text-m3-onError bg-m3-errorContainer/20 border border-m3-error/30 p-2.5 rounded-xl text-center">
                    ⚠️ {resetError}
                  </div>
                )}
                {resetSuccess && (
                  <div className="text-xs font-semibold text-m3-primary bg-m3-primaryContainer/30 border border-m3-primary/30 p-2.5 rounded-xl text-center">
                    ✅ {resetSuccess}
                  </div>
                )}

                <div className="flex gap-3 pt-2 select-none">
                  <button
                    type="button"
                    disabled={resetSubmitting}
                    className="flex-1 h-[48px] rounded-full border-none bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      resetPasswordForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="m3-filled-button flex-1"
                    style={{ minHeight: 48 }}
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opaque Password Reset Modal Overlay */}
      {currentUser?.mustChangePassword && !hasDismissedResetPrompt && (
        <div
          className="absolute inset-0 bg-black/35 z-[99998] flex items-center justify-center p-6 animate-fade-in"
        >
          <div
            className="w-full max-w-sm rounded-[var(--m3-shape-2xl)] p-6 shadow-2xl flex flex-col gap-5 text-center animate-dropdown"
            style={{
              background: 'var(--m3-surface-container)',
              border: '1px solid color-mix(in srgb, var(--m3-outline-variant) 40%, transparent)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Icon */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-m3-primary shadow-inner"
                style={{ backgroundColor: 'color-mix(in srgb, var(--m3-primary-container) 20%, transparent)' }}
              >
                <Lock size={22} />
              </div>
              <h3 className="m3-title-medium text-m3-onSurface font-extrabold tracking-wide">
                Password Reset Required
              </h3>
            </div>

            {/* Message */}
            <p className="text-sm text-m3-onSurfaceVariant leading-relaxed font-sans">
              For security reasons, you must change your temporary password before you can fully access your profile.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2 select-none w-full">
              <button
                type="button"
                onClick={() => {
                  setHasDismissedResetPrompt(true);
                  setShowResetPasswordModal(true);
                }}
                className="m3-filled-button w-full !min-h-[48px] !text-sm cursor-pointer font-bold"
              >
                Reset Password Now
              </button>
              <button
                type="button"
                onClick={() => setHasDismissedResetPrompt(true)}
                className={`w-full h-12 rounded-full border-none bg-transparent text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all ${
                  currentMode === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/5'
                }`}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
