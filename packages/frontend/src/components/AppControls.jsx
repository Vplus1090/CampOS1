import React, { useState, useEffect } from 'react';
import { ForkKnife, Handshake, Books, Coffee, ShieldCheck, ArrowCounterClockwise, Megaphone, Layout, Clock, Calendar, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import M3ScreenHeader from './M3ScreenHeader';
import { API_BASE } from '../config/api';

export default function AppControls({ currentUser, onClose }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };
  const [tabControls, setTabControls] = useState({
    notices: { enabled: true, message: '' },
    student_dashboard: { enabled: true, message: '' },
    timetable: { enabled: true, message: '' },
    calendar: { enabled: true, message: '' },
    canteen: { enabled: true, message: '' },
    mess: { enabled: true, message: '' },
    materials: { enabled: true, message: '' },
    skillgigs: { enabled: true, message: '' }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [originalControls, setOriginalControls] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/settings/tabs`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      if (data.success && data.tabControls) {
        setTabControls(data.tabControls);
        setOriginalControls(JSON.parse(JSON.stringify(data.tabControls)));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (tabKey) => {
    setTabControls(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        enabled: !prev[tabKey].enabled
      }
    }));
  };

  const handleMessageChange = (tabKey, value) => {
    setTabControls(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        message: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const res = await fetch(`${API_BASE}/api/settings/tabs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabControls }),
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      setSuccessMsg('App controls updated successfully!');
      setOriginalControls(JSON.parse(JSON.stringify(tabControls)));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getTabLabel = (key) => {
    switch (key) {
      case 'notices': return 'Notices Board';
      case 'student_dashboard': return 'Student Dashboard';
      case 'timetable': return 'Timetable';
      case 'calendar': return 'Academic Calendar';
      case 'canteen': return 'Canteen Menu';
      case 'mess': return 'Mess Menu';
      case 'materials': return 'Study Shelf';
      case 'skillgigs': return 'Skill Swap';
      default: return key;
    }
  };

  const getTabIcon = (key) => {
    switch (key) {
      case 'notices': return <Megaphone size={18} className="text-m3-primary" />;
      case 'student_dashboard': return <Layout size={18} className="text-m3-secondary" />;
      case 'timetable': return <Clock size={18} className="text-m3-tertiary" />;
      case 'calendar': return <Calendar size={18} className="text-m3-primary" />;
      case 'canteen': return <Coffee size={18} className="text-m3-primary" />;
      case 'mess': return <ForkKnife size={18} className="text-m3-secondary" />;
      case 'materials': return <Books size={18} className="text-m3-tertiary" />;
      case 'skillgigs': return <Handshake size={18} className="text-m3-primary" />;
      default: return null;
    }
  };

  const hasChanges = originalControls && JSON.stringify(tabControls) !== JSON.stringify(originalControls);

  return (
    <div className="m3-screen app-controls-module">
      <M3ScreenHeader 
        title="App Controls" 
        subtitle="Enable or disable campus applications" 
        isScrolled={isScrolled} 
        onBack={onClose} 
      />

      <div onScroll={handleScroll} className="m3-screen__scroll gap-4">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
            <ArrowCounterClockwise className="animate-spin text-m3-primary" size={28} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading settings...</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="text-xs font-semibold text-m3-onError bg-m3-errorContainer/20 border border-m3-error/30 p-3 rounded-2xl text-center">
                ⚠️ {error}
              </div>
            )}
            
            {successMsg && (
              <div className="text-xs font-semibold text-m3-primary bg-m3-primaryContainer/30 border border-m3-primary/30 p-3 rounded-2xl text-center flex items-center justify-center gap-1.5">
                <ShieldCheck size={16} /> {successMsg}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {Object.keys(tabControls).map((key) => {
                const item = tabControls[key];
                return (
                  <div key={key} className="m3-surface-card p-5 flex flex-col gap-4 text-left shadow-sm">
                    {/* Header: Label & Toggle */}
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-m3-surfaceContainerHighest flex items-center justify-center shadow-sm">
                          {getTabIcon(key)}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-m3-onSurface tracking-wide">
                            {getTabLabel(key)}
                          </h4>
                          <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest block mt-0.5">
                            Key: {key}
                          </span>
                        </div>
                      </div>

                      {/* M3 Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => handleToggle(key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-m3-surfaceContainerHighest rounded-full peer peer-checked:after:translate-x-[16px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-m3-onSurfaceVariant peer-checked:after:bg-m3-onPrimary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-m3-primary relative"></div>
                      </label>
                    </div>

                    {/* Custom disabled message input */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <label className="text-[9px] font-black uppercase text-m3-onSurfaceVariant/70 tracking-widest pl-1">
                        Disability Explanation Message
                      </label>
                      <textarea
                        rows="2"
                        placeholder={`e.g., ${getTabLabel(key)} is temporarily offline for maintenance.`}
                        value={item.message || ''}
                        onChange={(e) => handleMessageChange(key, e.target.value)}
                        className="m3-filled-field !h-auto !py-2.5 text-xs resize-none"
                        disabled={item.enabled}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </>
        )}
      </div>

      {/* Floating Save Settings Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="pointer-events-auto w-full max-w-[280px] min-h-[52px] rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-m3-2 bg-m3-primary text-m3-onPrimary hover:brightness-105 active:scale-95 transition-all"
            >
              {saving ? (
                <>
                  <ArrowCounterClockwise className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  Save Settings
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
