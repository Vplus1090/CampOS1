import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForkKnife, Calendar, BookOpen, Key, X, Check, QrCode, DeviceMobile, Eye, EyeSlash, Lock, Palette, Sun, Moon, SunDim, ArrowLeft, ShieldWarning } from '@phosphor-icons/react';
import { applyTheme, applyThemeMode, initGeolocation } from '../utils/theme';
import { clearPortalCache } from '../utils/cache';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import MessMenu from './MessMenu';
import StudyMaterials from './StudyMaterials';
import AcademicCalendar from './AcademicCalendar';
import { API_BASE } from '../config/api';
import { parseJsonResponse } from '../utils/parseJsonResponse';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function LockScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEnrollmentNo, setRegEnrollmentNo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('campos-remember-me') === 'true';
  });

  // Global settings registration checks
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // Pre-fill credentials and auto sign-in if remember me was active
  useEffect(() => {
    if (localStorage.getItem('campos-remember-me') === 'true') {
      const savedEmail = localStorage.getItem('campos-remember-email') || '';
      const savedPassword = localStorage.getItem('campos-remember-password') || '';
      setEmail(savedEmail);
      setPassword(savedPassword);

      const preventAuto = sessionStorage.getItem('campos-prevent-autologin') === 'true';
      if (savedEmail && savedPassword && !preventAuto) {
        const autoLogin = async () => {
          try {
            setSubmitting(true);
            setLoginError(null);

            let loginEmail = savedEmail.trim();
            if (!loginEmail.includes('@')) {
              loginEmail = `${loginEmail}@campos.local`;
            }

            const res = await fetch(`${API_BASE}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: loginEmail, password: savedPassword }),
              credentials: 'include',
            });

            const data = await parseJsonResponse(res);
            if (!res.ok) throw new Error(data.message || 'Login failed');

            onLoginSuccess(data.user);
          } catch (err) {
            setLoginError("Auto sign-in failed: " + err.message);
          } finally {
            setSubmitting(false);
          }
        };
        autoLogin();
      }
    }
  }, []);

  // Portal online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/registration-status`);
        if (res.ok) {
          const data = await res.json();
          setRegistrationEnabled(data.registrationEnabled);
        }
      } catch (err) {
        console.error('Failed to check registration status:', err);
      }
    };
    checkRegistrationStatus();
  }, []);

  const handleToggleRegisterMode = async () => {
    if (!isRegistering) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/registration-status`);
        if (res.ok) {
          const data = await res.json();
          setRegistrationEnabled(data.registrationEnabled);
          if (!data.registrationEnabled) {
            setShowRestrictionModal(true);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check registration status:', err);
      }
      setIsRegistering(true);
    } else {
      setIsRegistering(false);
    }
    setLoginError(null);
  };

  // Guest overlay states
  const [showGuestMess, setShowGuestMess] = useState(false);
  const [showGuestCalendar, setShowGuestCalendar] = useState(false);
  const [showGuestShelf, setShowGuestShelf] = useState(false);
  const [showShelfSetup, setShowShelfSetup] = useState(false);
  const [setupBranch, setSetupBranch] = useState('Computer Science & Engineering');
  const [setupSemester, setSetupSemester] = useState('Semester 1');
  const [guestShelfBranch, setGuestShelfBranch] = useState('All Branches');
  const [guestShelfSemester, setGuestShelfSemester] = useState('All Semesters');

  // Theme states
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

  // Additional Guest State Hooks
  const [showGuestQr, setShowGuestQr] = useState(false);
  const [showGuestPayment, setShowGuestPayment] = useState(false);
  const [processingGuestPayment, setProcessingGuestPayment] = useState(false);
  const [guestPaymentData, setGuestPaymentData] = useState(null);
  const [activeGuestPass, setActiveGuestPass] = useState(null);
  const [remainingGuestMinutes, setRemainingGuestMinutes] = useState(0);

  // Live Mess Ticket checker effect
  useEffect(() => {
    const checkGuestPass = () => {
      const passStr = localStorage.getItem('cp_token_guest');
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass && pass.ExpiryTime) {
            const remainingMs = new Date(pass.ExpiryTime) - new Date();
            const mins = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
            if (mins > 0) {
              setActiveGuestPass(pass);
              setRemainingGuestMinutes(mins);
            } else {
              localStorage.removeItem('cp_token_guest');
              setActiveGuestPass(null);
              setRemainingGuestMinutes(0);
            }
          }
        } catch (e) {
          setActiveGuestPass(null);
        }
      } else {
        setActiveGuestPass(null);
        setRemainingGuestMinutes(0);
      }
    };

    checkGuestPass();
    const interval = setInterval(checkGuestPass, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveGuestTicket = () => {
    if (window.confirm("Are you sure you want to remove this active ticket? This cannot be undone.")) {
      localStorage.removeItem('cp_token_guest');
      setActiveGuestPass(null);
      setRemainingGuestMinutes(0);
      setShowGuestQr(false);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleLogin = async (e, customEmail = null, customPassword = null) => {
    if (e) e.preventDefault();
    const targetEmail = customEmail || email;
    const targetPassword = customPassword || password;
    if (!targetEmail || !targetPassword) return;

    if (targetEmail.trim().toLowerCase() === 'reset') {
      clearPortalCache();
      localStorage.clear();
      sessionStorage.clear();
      setEmail("");
      setPassword("");
      window.dispatchEvent(new Event('storage'));
      return;
    }

    try {
      setSubmitting(true);
      setLoginError(null);

      // Append default domain if not present to simplify login
      let loginEmail = targetEmail.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@campos.local`;
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: targetPassword }),
        credentials: 'include',
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Save credentials if rememberMe is enabled
      if (!customEmail && !customPassword) {
        if (rememberMe) {
          localStorage.setItem('campos-remember-me', 'true');
          localStorage.setItem('campos-remember-email', email.trim());
          localStorage.setItem('campos-remember-password', password);
        } else {
          localStorage.removeItem('campos-remember-me');
          localStorage.removeItem('campos-remember-email');
          localStorage.removeItem('campos-remember-password');
        }
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();

    // Check if registration is enabled
    try {
      const statusRes = await fetch(`${API_BASE}/api/auth/registration-status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (!statusData.registrationEnabled) {
          setShowRestrictionModal(true);
          setIsRegistering(false); // Switch back to login
          setLoginError(null);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    if (!regFirstName || !regLastName || !regEnrollmentNo || !regPassword || !regConfirmPassword) {
      setLoginError('First name, last name, enrollment number, and password are required.');
      return;
    }

    if (regPassword.length < 8) {
      setLoginError('Password must be at least 8 characters long.');
      return;
    }

    if (regConfirmPassword !== regPassword) {
      setLoginError('Passwords do not match.');
      return;
    }

    const constructedEmail = `${regEnrollmentNo.trim().toLowerCase()}@campos.local`;

    try {
      setSubmitting(true);
      setLoginError(null);

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          email: constructedEmail,
          enrollmentId: regEnrollmentNo.trim(),
          password: regPassword,
        }),
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Auto login
      await handleLogin(null, constructedEmail, regPassword);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Framer Motion M3 Physics Variants
  const springConfig = { type: 'spring', stiffness: 400, damping: 30, bounce: 0.5 };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: springConfig
    }
  };

  // Render Overlay Placeholders (Using original components inside simple full screen divs)
  if (showGuestPayment || showGuestQr || showGuestMess || showGuestCalendar || showGuestShelf) {
    return (
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="absolute inset-0 z-[99999] bg-m3-surface flex flex-col overflow-hidden text-m3-onSurface"
      >
        <div className={`flex-1 bg-m3-surface scrollbar-none ${
          (showGuestMess || showGuestCalendar || showGuestShelf)
            ? 'h-full max-h-full overflow-hidden'
            : 'overflow-y-auto p-4'
        }`}>
          {!showGuestPayment && !showGuestQr && showGuestMess && <MessMenu currentUser={null} setActiveTab={() => setShowGuestMess(false)} triggerPayment={(amt, src, payload) => { setGuestPaymentData({amount: amt, source: src, payload: payload}); setShowGuestPayment(true); }} />}
          {!showGuestPayment && !showGuestQr && showGuestCalendar && <AcademicCalendar setActiveTab={() => setShowGuestCalendar(false)} />}
          {!showGuestPayment && !showGuestQr && showGuestShelf && <StudyMaterials setActiveTab={() => setShowGuestShelf(false)} initialBranch={guestShelfBranch} initialSemester={guestShelfSemester} />}
          {showGuestPayment && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center relative p-6">
              <button 
                onClick={() => setShowGuestPayment(false)}
                className="absolute top-4 left-4 p-3 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-primary transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <span className="text-[10px] font-bold text-m3-onSurfaceVariant tracking-widest uppercase font-mono">
                Total Payable Amount
              </span>
              <h2 className="text-5xl font-black text-m3-primary font-sans my-1">₹{guestPaymentData?.amount || 60}</h2>
              <div className="text-[10px] text-m3-onSurfaceVariant/80 font-semibold tracking-wide uppercase font-mono mb-4">
                Secure Checkout by CampOS
              </div>

              <div className="flex flex-col w-full gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={async () => {
                    setProcessingGuestPayment(true);
                    await new Promise(r => setTimeout(r, 1500));
                    
                    const qty = guestPaymentData?.payload?.quantity || 1;
                    const fakeToken = {
                      id: "fake_" + Math.random().toString(36).substring(2, 9),
                      StudentName: "Guest Student",
                      PassType: "Guest",
                      IssuedAt: new Date().toISOString(),
                      ExpiryTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
                      Quantity: qty
                    };
                    
                    localStorage.setItem('cp_token_guest', JSON.stringify(fakeToken));
                    setProcessingGuestPayment(false);
                    setShowGuestPayment(false);
                    setShowGuestQr(true);
                    window.dispatchEvent(new Event('storage'));
                  }}
                  disabled={processingGuestPayment}
                  className="w-full py-4 bg-m3-primary text-m3-onPrimary rounded-[20px] font-bold text-sm shadow-sm transition-colors hover:bg-m3-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {processingGuestPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-m3-onPrimary border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Simulate Success (UPI/GPay)</span>
                  )}
                </button>
              </div>
            </div>
          )}
          {showGuestQr && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center relative p-6">
              <button 
                onClick={() => setShowGuestQr(false)}
                className="absolute top-6 left-6 p-3 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-primary transition-colors cursor-pointer border-none shadow-md"
                title="Back"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>

              {/* Massive white QR card with M3 style */}
              <div className="w-full max-w-sm bg-m3-surfaceContainerHigh p-8 rounded-[32px] border-none shadow-2xl mt-4 flex flex-col items-center justify-center transform hover:scale-[1.01] transition-transform duration-300">
                <div className="p-3 bg-white rounded-[24px] shadow-inner flex items-center justify-center">
                  <QrCode size={180} className="text-black" />
                </div>
                
                <div className="mt-6 text-center w-full flex flex-col gap-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-m3-onSurfaceVariant">Ticket Verification Code</p>
                  <div className="mt-1 text-base font-bold tracking-wide text-m3-onSurface bg-m3-surfaceContainerLow py-2.5 px-5 rounded-2xl inline-block mx-auto shadow-inner border-none">
                    {activeGuestPass ? `ID: #${String(activeGuestPass._id || activeGuestPass.id || '').substring(18).toUpperCase()}` : 'ACTIVE TICKET'}
                  </div>
                  {activeGuestPass && activeGuestPass.Quantity && (
                    <div className="mt-3 text-xs font-semibold text-m3-primary bg-m3-primaryContainer/30 py-1.5 px-4 rounded-full inline-flex items-center gap-1.5 justify-center self-center mx-auto">
                      <span>Quantity: {activeGuestPass.Quantity} Mess Ticket{activeGuestPass.Quantity > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove Ticket Option */}
              <button
                onClick={handleRemoveGuestTicket}
                className="mt-5 px-6 py-3 text-xs font-extrabold text-m3-error hover:bg-m3-error/10 rounded-full transition-all duration-300 border border-m3-error/20 bg-transparent cursor-pointer tracking-wider uppercase"
                type="button"
              >
                Remove Ticket
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="absolute inset-0 bg-m3-surface flex flex-col justify-between items-center p-6 z-[9999] overflow-hidden select-none font-sans text-m3-onSurface"
      style={{
        paddingTop: "calc(1.5rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 🎨 Theme Selector Trigger (Always Top Right) */}
      <motion.button
        type="button"
        onClick={() => setShowThemeSelector(true)}
        style={{ top: "calc(1.5rem + env(safe-area-inset-top, 0px))" }}
        className="absolute z-20 flex items-center justify-center p-3 rounded-full bg-m3-surfaceContainerHigh border border-m3-outlineVariant shadow-sm text-m3-primary hover:text-m3-primary/80 transition-colors cursor-pointer right-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
      >
        <Palette size={16} />
      </motion.button>

      {/* 🎫 Collapsed Title Header (Top Left when ticket active) */}
      {activeGuestPass && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ top: "calc(2rem + env(safe-area-inset-top, 0px))" }}
          className="absolute left-6 z-20 select-none pointer-events-none"
        >
          <h1 className="text-[28px] font-black text-m3-onSurface tracking-tight font-sans leading-none">
            CampOS
          </h1>
        </motion.div>
      )}

      <motion.div 
        className={cn(
          "w-full max-w-[320px] flex flex-col justify-start items-stretch h-full z-10 relative pb-6",
          activeGuestPass ? "gap-3 pt-20" : "gap-5 pt-10"
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Playful M3 Expressive Header */}
        {!activeGuestPass && (
          <motion.header variants={itemVariants} className="flex flex-col items-start text-left w-full mb-5 shrink-0">
            <h1 className="text-[36px] font-normal text-m3-onSurface tracking-tight font-sans leading-[1.1] shrink-0">
              {isRegistering ? "Create your" : "Log into your"}
            </h1>
            <h1 className="text-[44px] font-semibold text-m3-onSurface tracking-tight font-sans leading-[1.1] mt-0.5 shrink-0">
              CampOS
            </h1>
          </motion.header>
        )}

        {/* 🎫 Guest Pass Live Activity Card on Lockscreen (Quick Access) */}
        <AnimatePresence>
          {activeGuestPass && (
            <motion.div 
              variants={itemVariants}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, height: 0 }}
              transition={springConfig}
              onClick={() => setShowGuestQr(true)}
              className="w-full bg-m3-tertiaryContainer rounded-[24px] p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-transform" data-haptic="medium"
            >
              <div className="flex flex-col">
                <span className="font-bold text-m3-onTertiaryContainer">Mess Access Ticket</span>
                <span className="text-m3-onTertiaryContainer/80 font-medium text-xs flex items-center gap-1.5 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-m3-primary animate-pulse"></span>
                  Active • {remainingGuestMinutes} Mins Left {activeGuestPass.Quantity > 1 && `(${activeGuestPass.Quantity} tickets)`}
                </span>
              </div>
              <div className="w-10 h-10 bg-m3-onTertiaryContainer/10 rounded-full flex items-center justify-center">
                <QrCode size={20} className="text-m3-onTertiaryContainer" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📥 Form input panel */}
        <motion.form variants={itemVariants} onSubmit={isRegistering ? handleRegister : handleLogin} className={cn("flex flex-col w-full mt-2", isRegistering ? "gap-3" : "gap-4")}>
          {isRegistering ? (
            <>
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="regFirstName" className="text-xs font-semibold text-m3-onSurfaceVariant pl-1 font-sans">
                    first name
                  </label>
                  <input
                    type="text"
                    id="regFirstName"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required={isRegistering}
                    className="m3-filled-field !h-11 !text-sm !px-4"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="regLastName" className="text-xs font-semibold text-m3-onSurfaceVariant pl-1 font-sans">
                    last name
                  </label>
                  <input
                    type="text"
                    id="regLastName"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required={isRegistering}
                    className="m3-filled-field !h-11 !text-sm !px-4"
                  />
                </div>
              </div>

              {/* Enrollment Number */}
              <div className="flex flex-col gap-1 text-left">
                <label htmlFor="regEnrollmentNo" className="text-xs font-semibold text-m3-onSurfaceVariant pl-1 font-sans">
                  enrollment number
                </label>
                <input
                  type="text"
                  id="regEnrollmentNo"
                  value={regEnrollmentNo}
                  onChange={(e) => setRegEnrollmentNo(e.target.value)}
                  required={isRegistering}
                  className="m3-filled-field !h-11 !text-sm !px-4"
                  placeholder="e.g. 2501200031"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1 text-left relative">
                <label htmlFor="regPassword" className="text-xs font-semibold text-m3-onSurfaceVariant pl-1 font-sans">
                  password
                </label>
                <div className="relative w-full">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    id="regPassword"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required={isRegistering}
                    className="m3-filled-field !h-11 !text-sm !pl-4 !pr-10"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer"
                  >
                    {showRegPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1 text-left relative">
                <label htmlFor="regConfirmPassword" className="text-xs font-semibold text-m3-onSurfaceVariant pl-1 font-sans">
                  confirm password
                </label>
                <div className="relative w-full">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    id="regConfirmPassword"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required={isRegistering}
                    className="m3-filled-field !h-11 !text-sm !pl-4 !pr-10"
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* M3 Input - Username */}
              <div className="flex flex-col w-full gap-2 text-left">
                <label htmlFor="username" className="text-[16px] font-medium text-m3-onSurfaceVariant pl-1 font-sans">
                  enrollment no.
                </label>
                <input
                  type="text"
                  id="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!isRegistering}
                  className="m3-filled-field"
                />
              </div>

              {/* M3 Input - Password */}
              <div className="flex flex-col w-full gap-2 text-left relative">
                <label htmlFor="password" className="text-[16px] font-medium text-m3-onSurfaceVariant pl-1 font-sans">
                  password
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isRegistering}
                    className="m3-filled-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer"
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center gap-3 pl-1 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                  rememberMe 
                    ? 'bg-m3-primary border-m3-primary text-m3-onPrimary' 
                    : 'border-m3-outlineVariant hover:border-m3-primary bg-m3-surfaceContainerLow'
                }`}>
                  {rememberMe && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-m3-onSurfaceVariant">
                  Remember me
                </span>
              </div>
            </>
          )}

          <AnimatePresence>
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="px-4 py-3 text-sm font-medium text-m3-onError bg-m3-error rounded-xl text-center"
              >
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* M3 Filled Button for Login / Register */}
          <motion.button
            whileTap={{ scale: 0.96 }}
        data-haptic="medium"
            type="submit"
            disabled={submitting}
            className={cn(
              "m3-filled-button w-full mt-3 disabled:opacity-50 disabled:pointer-events-none",
              isRegistering ? "!min-h-[56px] !text-base" : "!min-h-[72px] !text-lg"
            )}
          >
            {submitting ? (
              <div className="flex items-center gap-3 justify-center">
                <div className="w-5 h-5 border-2 border-m3-onPrimary border-t-transparent rounded-full animate-spin" />
                <span>{isRegistering ? 'Registering...' : 'Signing in...'}</span>
              </div>
            ) : (
              isRegistering ? 'Create Account' : 'Login'
            )}
          </motion.button>

          {/* Toggle link */}
          <div className="flex justify-center mt-1">
            <button
              type="button"
              onClick={handleToggleRegisterMode}
              className="text-sm font-bold cursor-pointer"
            >
              {isRegistering ? (
                <>
                  <span className="text-m3-onSurfaceVariant/70 font-semibold">Already have an account? </span>
                  <span className="text-m3-primary hover:text-m3-primary/80 transition-colors">Sign In</span>
                </>
              ) : (
                <>
                  <span className="text-m3-onSurfaceVariant/70 font-semibold">Don't have an account? </span>
                  <span className="text-m3-primary hover:text-m3-primary/80 transition-colors">Create one</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* 🎛️ Bottom Public Access M3 Buttons */}
        {!isRegistering && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 mt-6 mb-8 w-full mx-auto">
            <motion.button
              whileTap={{ scale: 0.96 }}
        data-haptic="medium"
              type="button"
              onClick={() => {
                setSetupBranch('Computer Science & Engineering');
                setSetupSemester('Semester 1');
                setShowShelfSetup(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[18px] bg-m3-surfaceContainerHigh text-m3-primary hover:bg-m3-surfaceContainerHighest transition shadow-md border-none cursor-pointer w-full"
            >
              <span className="font-sans font-semibold text-xs tracking-wide">Shelf</span>
              <BookOpen size={16} />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.96 }}
        data-haptic="medium"
              type="button"
              onClick={() => setShowGuestCalendar(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[18px] bg-m3-surfaceContainerHigh text-m3-primary hover:bg-m3-surfaceContainerHighest transition shadow-md border-none cursor-pointer w-full"
            >
              <span className="font-sans font-semibold text-xs tracking-wide">Calendar</span>
              <Calendar size={16} />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.96 }}
        data-haptic="medium"
              type="button"
              onClick={() => setShowGuestMess(true)}
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[18px] bg-m3-surfaceContainerHigh text-m3-primary hover:bg-m3-surfaceContainerHighest transition shadow-md border-none cursor-pointer w-full"
            >
              <span className="font-sans font-semibold text-xs tracking-wide">Mess Menu</span>
              <ForkKnife size={16} />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* 📚 Shelf Setup Popup Overlay */}
      <AnimatePresence>
        {showShelfSetup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md z-[99999] flex items-end justify-center" 
            onClick={() => setShowShelfSetup(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="m3-frosted-dialog rounded-t-[32px] rounded-b-none p-6 w-full shadow-2xl flex flex-col gap-6 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-m3-onSurface">
                  <BookOpen size={22} className="text-m3-primary" /> Shelf Setup
                </h3>
                <button onClick={() => setShowShelfSetup(false)} className="p-2 -mr-2 text-m3-onSurfaceVariant hover:text-m3-primary rounded-full hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Branch Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-m3-onSurfaceVariant text-[11px] font-bold uppercase tracking-wider pl-1">Branch</span>
                <select
                  value={setupBranch}
                  onChange={(e) => setSetupBranch(e.target.value)}
                  className="w-full bg-m3-surfaceContainerHigh text-m3-onSurface rounded-[18px] px-4 py-4 text-sm font-bold outline-none border-none appearance-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics and Computing">Mathematics and Computing</option>
                  <option value="Robotics and Artificial Intelligence">Robotics and Artificial Intelligence</option>
                  <option value="Biotechnology">Biotechnology</option>
                </select>
              </div>

              {/* Semester Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-m3-onSurfaceVariant text-[11px] font-bold uppercase tracking-wider pl-1">Semester</span>
                <select
                  value={setupSemester}
                  onChange={(e) => setSetupSemester(e.target.value)}
                  className="w-full bg-m3-surfaceContainerHigh text-m3-onSurface rounded-[18px] px-4 py-4 text-sm font-bold outline-none border-none appearance-none"
                >
                  {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
        data-haptic="medium"
                onClick={() => {
                  setGuestShelfBranch(setupBranch);
                  setGuestShelfSemester(setupSemester);
                  setShowShelfSetup(false);
                  setShowGuestShelf(true);
                }}
                className="w-full mt-2 py-4 bg-m3-primary text-m3-onPrimary rounded-[20px] font-bold text-sm shadow-sm transition-colors hover:bg-m3-primary/90"
              >
                Access Shelf
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={handleCancel}
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
                          layoutId="active-lock-mode-chip"
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
                          layoutId="active-lock-mode-chip"
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
                          layoutId="active-lock-mode-chip"
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
                        data-haptic="light"
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

      {/* ⚠️ Registration Restriction Alert Modal */}
      <AnimatePresence>
        {showRestrictionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-[100000] flex items-center justify-center p-6" 
            onClick={() => setShowRestrictionModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-m3-surfaceContainer rounded-[28px] p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4 border border-m3-outlineVariant/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-m3-errorContainer/20 flex items-center justify-center text-m3-error">
                <ShieldWarning size={24} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-m3-onSurface">Registration Restricted</h3>
                <p className="text-xs text-m3-onSurfaceVariant leading-relaxed font-medium">
                  Public account creation has been disabled by the system administrator. Please contact <a href="mailto:vplus1090@gmail.com" className="text-m3-primary hover:underline font-bold">vplus1090@gmail.com</a> to request an account.
                </p>
              </div>
              <button 
                onClick={() => setShowRestrictionModal(false)}
                className="w-full mt-2 py-3 bg-m3-primary text-m3-onPrimary hover:brightness-110 font-bold rounded-full text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm border-none"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version number */}
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-wider text-m3-onSurfaceVariant/40 select-none">
        v3.2.7
      </span>

    </motion.div>
  );
}
