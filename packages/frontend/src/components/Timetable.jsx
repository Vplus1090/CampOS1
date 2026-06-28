import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, User, Users, Sliders, CaretDown, Sparkle, ArrowsCounterClockwise, Plus, Pencil, Trash } from '@phosphor-icons/react';
import M3ScreenHeader from './M3ScreenHeader';
import { API_BASE } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import useCachedFetch from '../hooks/useCachedFetch';
import OfflineBanner from './OfflineBanner';

// Weekdays
const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time converter to helper minutes
const getMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  return 0;
};

export default function Timetable({ currentUser, setActiveTab }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    // Default to Monday if Sunday is selected to show classes
    return currentDay === 'Sunday' ? 'Monday' : currentDay;
  });

  // DB States and caching using useCachedFetch
  const { data: dbMeta = null, isLoading: metaLoading, isRefreshing: metaRefreshing, error: metaError, isOffline: metaOffline, revalidate: revalidateMeta } =
    useCachedFetch('timetable-metadata', async () => {
      const res = await fetch(`${API_BASE}/api/timetable/metadata`);
      if (!res.ok) throw new Error("Metadata request failed");
      return res.json();
    }, { ttlHours: 24 });

  const { data: dbClasses = null, isLoading: classesLoading, isRefreshing: classesRefreshing, error: classesError, isOffline: classesOffline, revalidate: revalidateClasses } =
    useCachedFetch('timetable-classes', async () => {
      const res = await fetch(`${API_BASE}/api/timetable/classes`);
      if (!res.ok) throw new Error("Classes database request failed");
      return res.json();
    }, { ttlHours: 24 });

  const loadingDb = metaLoading || classesLoading;
  const isRefreshing = metaRefreshing || classesRefreshing;
  const dbError = metaError ? metaError.message : (classesError ? classesError.message : null);
  const isOffline = metaOffline || classesOffline;

  const revalidateAll = () => {
    revalidateMeta();
    revalidateClasses();
  };

  // Dynamic filter selections
  const [selectedCourse, setSelectedCourse] = useState('btech-62');
  const [selectedSemester, setSelectedSemester] = useState('sem2');
  const [selectedPhase, setSelectedPhase] = useState('phase1');
  const [selectedBatch, setSelectedBatch] = useState('g2');
  const [showFilters, setShowFilters] = useState(false);

  // Scroll detection state
  const [isScrolled, setIsScrolled] = useState(false);

  // Modal forms state
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null); // null means adding
  const [dayInput, setDayInput] = useState('Monday');
  const [subjectInput, setSubjectInput] = useState('');
  const [startInput, setStartInput] = useState('9:00 AM');
  const [endInput, setEndInput] = useState('9:50 AM');
  const [venueInput, setVenueInput] = useState('LT-2');
  const [teacherInput, setTeacherInput] = useState('');
  const [typeInput, setTypeInput] = useState('L');
  const [batchesInput, setBatchesInput] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  const isEditable = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };



  // Load saved selection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('timetable_selection');
    if (saved) {
      try {
        const { course, semester, phase, batch } = JSON.parse(saved);
        if (course) setSelectedCourse(course);
        if (semester) setSelectedSemester(semester);
        if (phase) setSelectedPhase(phase);
        if (batch) setSelectedBatch(batch);
      } catch (e) { /* ignore */ }
    }
  }, []);

  // Persist selection to localStorage whenever it changes so CampAi can read it
  useEffect(() => {
    localStorage.setItem('timetable_selection', JSON.stringify({
      course: selectedCourse,
      semester: selectedSemester,
      phase: selectedPhase,
      batch: selectedBatch,
    }));
  }, [selectedCourse, selectedSemester, selectedPhase, selectedBatch]);

  // Synchronize dynamic cascading selections when course/semester/phase changes
  useEffect(() => {
    if (!dbMeta) return;
    const sems = dbMeta.semesters[selectedCourse] || [];
    if (sems.length > 0) {
      const isValid = sems.some(s => s.id === selectedSemester);
      if (!isValid) setSelectedSemester(sems[0].id);
    }
  }, [selectedCourse, dbMeta]);

  useEffect(() => {
    if (!dbMeta) return;
    const semPhases = dbMeta.phases[selectedCourse]?.[selectedSemester] || [];
    if (semPhases.length > 0) {
      const isValid = semPhases.some(p => p.id === selectedPhase);
      if (!isValid) setSelectedPhase(semPhases[0].id);
    }
  }, [selectedSemester, selectedCourse, dbMeta]);

  useEffect(() => {
    if (!dbMeta) return;
    const phaseBatches = dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || [];
    if (phaseBatches.length > 0) {
      const isValid = phaseBatches.some(b => b.id === selectedBatch);
      if (!isValid) {
        const g2Batch = phaseBatches.find(b => b.id === 'g2' || b.name === 'G2');
        setSelectedBatch(g2Batch ? g2Batch.id : phaseBatches[0].id);
      }
    }
  }, [selectedPhase, selectedSemester, selectedCourse, dbMeta]);

  // Fetch current batch timeline classes
  const displayEvents = useMemo(() => {
    if (!dbClasses) return [];
    const classKey = `${selectedCourse}_${selectedSemester}_${selectedPhase}_${selectedBatch}`;
    const batchObj = dbClasses[classKey];
    if (!batchObj || !batchObj.classes) return [];
    
    const dayClasses = batchObj.classes[selectedDay] || [];
    return dayClasses.map((ev) => ({
      _id: ev._id,
      subject: ev.subject,
      time: `${ev.start} - ${ev.end}`,
      start: ev.start,
      end: ev.end,
      instructor: ev.teacher || 'Faculty',
      room: ev.venue || 'N/A',
      type: ev.type === 'P' ? 'lab' : ev.type === 'T' ? 'tutorial' : 'lecture',
      typeLabel: ev.type === 'P' ? 'Practical' : ev.type === 'T' ? 'Tutorial' : 'Lecture',
      rawType: ev.type,
      batches: ev.batches ? ev.batches.join(', ') : '',
    })).sort((a, b) => getMinutes(a.start) - getMinutes(b.start));
  }, [dbClasses, selectedCourse, selectedSemester, selectedPhase, selectedBatch, selectedDay]);

  // Dynamic Breaks in the Day Calculator
  const breaks = useMemo(() => {
    if (displayEvents.length < 2) return [];
    const calculatedBreaks = [];
    for (let i = 0; i < displayEvents.length - 1; i++) {
      const endMin = getMinutes(displayEvents[i].end);
      const startMin = getMinutes(displayEvents[i+1].start);
      const diff = startMin - endMin;
      
      if (diff >= 15) { // Any break >= 15 mins
        const formatTime = (min) => {
          let h = Math.floor(min / 60);
          const m = min % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          return `${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;
        };
        
        const hr = Math.floor(diff / 60);
        const mn = diff % 60;
        let durationStr = '';
        if (hr > 0) durationStr += `${hr} hr `;
        if (mn > 0) durationStr += `${mn} min`;
        
        calculatedBreaks.push({
          timeRange: `${formatTime(endMin)} - ${formatTime(startMin)}`,
          duration: durationStr,
        });
      }
    }
    return calculatedBreaks;
  }, [displayEvents]);

  const handleStartAddClass = () => {
    setEditingClass(null);
    setDayInput(selectedDay);
    setSubjectInput('');
    setStartInput('9:00 AM');
    setEndInput('9:50 AM');
    setVenueInput('LT-2');
    setTeacherInput('');
    setTypeInput('L');
    setBatchesInput(selectedBatch.toUpperCase());
    setShowClassModal(true);
  };

  const handleStartEditClass = (classItem) => {
    setEditingClass(classItem);
    setDayInput(selectedDay);
    setSubjectInput(classItem.subject);
    setStartInput(classItem.start);
    setEndInput(classItem.end);
    setVenueInput(classItem.room);
    setTeacherInput(classItem.instructor);
    setTypeInput(classItem.rawType || 'L');
    setBatchesInput(classItem.batches);
    setShowClassModal(true);
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to permanently delete this class slot?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/timetable/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete class slot');
      }

      revalidateAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!subjectInput || !startInput || !endInput) return;

    const classKey = `${selectedCourse}_${selectedSemester}_${selectedPhase}_${selectedBatch}`;
    const parsedBatches = batchesInput
      .split(',')
      .map((b) => b.trim().toUpperCase())
      .filter((b) => b.length > 0);

    const payload = {
      classKey,
      day: dayInput,
      subject: subjectInput,
      start: startInput,
      end: endInput,
      teacher: teacherInput,
      venue: venueInput,
      type: typeInput,
      batches: parsedBatches,
    };

    try {
      setSavingClass(true);
      const url = editingClass 
        ? `${API_BASE}/api/timetable/classes/${editingClass._id}`
        : `${API_BASE}/api/timetable/classes`;
      const method = editingClass ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save timetable slot');
      }

      setShowClassModal(false);
      revalidateAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingClass(false);
    }
  };

  const goBack = () => setActiveTab && setActiveTab('home');

  return (
    <div className="m3-screen timetable-dashboard">
      <M3ScreenHeader
        title="Class Schedule"
        subtitle="Batch & Lecture Planner"
        isScrolled={isScrolled}
        onBack={goBack}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll pb-24">
        <OfflineBanner
          isOffline={isOffline}
          isRefreshing={isRefreshing}
          error={metaError || classesError}
          isStale={!!dbMeta || !!dbClasses}
          onRetry={revalidateAll}
        />

        {/* Filters Header Switcher */}
        {dbMeta && (
          <div className="w-full shrink-0 flex flex-col gap-2.5 mb-2 px-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="m3-surface-card m3-surface-card--interactive flex items-center justify-between !py-2.5 !px-4 select-none shrink-0"
            >
              <div className="flex items-center gap-2 text-m3-primary">
                <Sliders size={14} />
                <span className="text-xs font-black uppercase tracking-wider">Class Settings</span>
              </div>
              <CaretDown size={16} className={`transition duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden w-full shrink-0 flex flex-col gap-3"
                >
                  <div className="m3-surface-card p-4 flex flex-col gap-3 shrink-0">
                    {/* Course Selection */}
                    <div className="flex flex-col gap-1 w-full text-left">
                      <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Course</span>
                      <div className="m3-select-wrap">
                        <select
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="m3-select"
                        >
                          {dbMeta.courses && dbMeta.courses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3 top-1/2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Semester & Phase Row */}
                    <div className="flex gap-3 w-full">
                      <div className="flex-1 flex flex-col gap-1 text-left">
                        <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Semester</span>
                        <div className="m3-select-wrap">
                          <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="m3-select"
                          >
                            {(dbMeta.semesters[selectedCourse] || []).map(s => (
                              <option key={s.id} value={s.id}>Semester {s.name}</option>
                            ))}
                          </select>
                          <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3 top-1/2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-1 text-left">
                        <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Phase</span>
                        <div className="m3-select-wrap">
                          <select
                            value={selectedPhase}
                            onChange={(e) => setSelectedPhase(e.target.value)}
                            className="m3-select"
                          >
                            {(dbMeta.phases[selectedCourse]?.[selectedSemester] || []).map(p => (
                              <option key={p.id} value={p.id}>Phase {p.name}</option>
                            ))}
                          </select>
                          <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3 top-1/2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Batch Selection */}
                    <div className="flex flex-col gap-1 w-full text-left">
                      <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Batch</span>
                      <div className="m3-select-wrap">
                        <select
                          value={selectedBatch}
                          onChange={(e) => setSelectedBatch(e.target.value)}
                          className="m3-select"
                        >
                          {(dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || []).map(b => (
                            <option key={b.id} value={b.id}>Batch {b.name}</option>
                          ))}
                        </select>
                        <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3 top-1/2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Day selection horizontal bar list */}
        <div className="flex flex-wrap gap-2 py-1.5 px-1 shrink-0 w-full select-none">
          {weekDays.filter(d => d !== 'Sunday').map((day) => (
            <button
              key={day}
              type="button"
              data-haptic="light"
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-xs font-extrabold cursor-pointer shrink-0 border relative transition-all duration-300 ${
                selectedDay === day
                  ? 'text-m3-onPrimary border-transparent !bg-transparent'
                  : 'bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant hover:bg-m3-surfaceContainerLow border-m3-outlineVariant/30'
              }`}
              style={{ borderRadius: selectedDay === day ? '24px' : '12px' }}
            >
              {selectedDay === day && (
                <motion.div
                  layoutId="active-timetable-day-chip"
                  className="absolute inset-0 bg-m3-primary rounded-full z-0"
                  style={{ borderRadius: '24px' }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{day}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loadingDb && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center select-none w-full">
            <ArrowsCounterClockwise className="animate-spin text-m3-primary" size={24} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading timetable database...</span>
          </div>
        )}

        {/* Error State */}
        {dbError && (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center shrink-0 w-full">
            <p className="text-sm font-semibold text-m3-onSurface">⚠️ {dbError}</p>
            <button className="m3-filled-button" style={{ maxWidth: 160 }} onClick={revalidateAll}>Retry</button>
          </div>
        )}

        {/* Timetable Lectures list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="w-full flex flex-col gap-4"
          >
            {!loadingDb && !dbError && (
              <div className="w-full flex flex-col gap-4">
                {displayEvents.length === 0 ? (
                  <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-3 text-center select-none w-full">
                    <div className="w-12 h-12 rounded-2xl bg-m3-primaryContainer/30 flex items-center justify-center text-m3-primary shadow-md">
                      <Sparkle size={22} />
                    </div>
                    <h4 className="text-sm text-m3-onSurface font-extrabold uppercase tracking-widest">Free Day!</h4>
                    <span className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                      No classes scheduled for today. Explore other days or batches!
                    </span>
                  </div>
                ) : (
                  displayEvents.map((item, idx) => (
                    <div key={item._id || idx} className="m3-surface-card p-5 flex flex-col gap-3.5 text-left shadow-sm relative overflow-hidden w-full">
                      {/* Card Header: time range badge + type + edit/delete */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="m3-badge text-[11px] font-bold">
                          {item.time}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-m3-primary shrink-0">
                            {item.typeLabel}
                          </span>
                          {isEditable && item._id && (
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <button
                                onClick={() => handleStartEditClass(item)}
                                className="w-7 h-7 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer"
                                title="Edit Slot"
                                type="button"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteClass(item._id)}
                                className="w-7 h-7 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant hover:text-m3-error flex items-center justify-center transition cursor-pointer"
                                title="Delete Slot"
                                type="button"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subject Name */}
                      <h4 className="text-base font-extrabold text-m3-onSurface tracking-wide leading-snug">
                        {item.subject}
                      </h4>

                      {/* Assist Chips Row */}
                      <div className="flex flex-wrap gap-2 pt-1 w-full">
                        {/* Venue Room */}
                        <span className="m3-assist-chip">
                          <MapPin size={11} className="mr-1 text-m3-primary shrink-0" />
                          {item.room}
                        </span>

                        {/* Instructor */}
                        {item.instructor && item.instructor.split(',').map((inst, idx) => {
                          const trimmed = inst.trim();
                          if (!trimmed) return null;
                          return (
                            <span key={idx} className="m3-assist-chip">
                              <User size={11} className="mr-1 text-m3-primary shrink-0" />
                              {trimmed}
                            </span>
                          );
                        })}

                        {/* Batches */}
                        {item.batches && (
                          <span className="m3-assist-chip">
                            <Users size={11} className="mr-1 text-m3-primary shrink-0" />
                            {Array.isArray(item.batches) ? item.batches.join(', ') : item.batches}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Breaks in the Day Section */}
            {!loadingDb && !dbError && breaks.length > 0 && (
              <div className="w-full mt-2 shrink-0">
                <div className="m3-surface-card p-5 flex flex-col gap-4 text-left border-dashed border bg-transparent" style={{ borderColor: 'color-mix(in srgb, var(--m3-outline-variant) 60%, transparent)' }}>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-m3-primary border-b border-white/5 pb-2 flex items-center gap-1.5 select-none">
                    <Sparkle size={12} className="text-m3-primary" /> Breaks in the Day
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {breaks.map((brk, bIdx) => (
                      <div key={bIdx} className="bg-m3-surfaceContainerHigh rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm text-left">
                        <span className="text-[10px] font-bold text-m3-onSurface leading-none">{brk.timeRange}</span>
                        <span className="text-[9px] font-black text-m3-primary uppercase tracking-widest mt-0.5 leading-none">{brk.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB button for edit */}
      {isEditable && !loadingDb && !dbError && (
        <button
          onClick={handleStartAddClass}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-m3-primary text-m3-onPrimary flex items-center justify-center shadow-lg transition hover:brightness-110 active:scale-95 cursor-pointer z-30" data-haptic="medium"
          type="button"
          title="Add Class Slot"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Floating Timetable Form Modal */}
      <AnimatePresence>
        {showClassModal && (
          <div className="absolute inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4" onClick={() => setShowClassModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-md m3-frosted-dialog p-6 rounded-[28px] flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 55%, transparent)' }}>
                <h3 className="m3-title-medium font-bold text-m3-onSurface">
                  {editingClass ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
                </h3>
                <button
                  className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold"
                  onClick={() => setShowClassModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="flex flex-col gap-4 text-left">
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Day of Week</span>
                    <div className="m3-select-wrap">
                      <select
                        value={dayInput}
                        onChange={(e) => setDayInput(e.target.value)}
                        className="m3-select !h-11"
                      >
                        {weekDays.filter(d => d !== 'Sunday').map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3.5 top-1/2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Class Type</span>
                    <div className="m3-select-wrap">
                      <select
                        value={typeInput}
                        onChange={(e) => setTypeInput(e.target.value)}
                        className="m3-select !h-11"
                      >
                        <option value="L">Lecture</option>
                        <option value="T">Tutorial</option>
                        <option value="P">Practical / Lab</option>
                      </select>
                      <div className="absolute -translate-y-1/2 pointer-events-none text-m3-onSurfaceVariant right-3.5 top-1/2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Subject Name / Code</span>
                  <input
                    type="text"
                    placeholder="e.g. CS-101 (Programming Fundamentals)"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Start Time</span>
                    <input
                      type="text"
                      placeholder="e.g. 9:00 AM"
                      value={startInput}
                      onChange={(e) => setStartInput(e.target.value)}
                      required
                      className="m3-filled-field !h-11"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">End Time</span>
                    <input
                      type="text"
                      placeholder="e.g. 9:50 AM"
                      value={endInput}
                      onChange={(e) => setEndInput(e.target.value)}
                      required
                      className="m3-filled-field !h-11"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Venue / Room</span>
                    <input
                      type="text"
                      placeholder="e.g. LT-2 or CL-1"
                      value={venueInput}
                      onChange={(e) => setVenueInput(e.target.value)}
                      className="m3-filled-field !h-11"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Faculty Teacher</span>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Amit"
                      value={teacherInput}
                      onChange={(e) => setTeacherInput(e.target.value)}
                      className="m3-filled-field !h-11"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Target Batches (Comma-separated)</span>
                  <input
                    type="text"
                    placeholder="e.g. G2, G1"
                    value={batchesInput}
                    onChange={(e) => setBatchesInput(e.target.value)}
                    className="m3-filled-field !h-11"
                  />
                </div>

                <div className="flex gap-3 pt-2 select-none">
                  <button
                    type="button"
                    className="flex-1 h-[48px] rounded-full border-none bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                    onClick={() => setShowClassModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="m3-filled-button flex-1"
                    style={{ minHeight: 48 }}
                    disabled={savingClass}
                  >
                    {savingClass ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
