import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Code, Database, Users, ChartBar, Robot, GameController, Globe, BookOpen, 
  Chat, MusicNotes, Microphone, Lightning, Camera, Palette, TrendUp, 
  Leaf, Briefcase, Heart, Brain, Heartbeat, InstagramLogo, LinkedinLogo, 
  GlobeSimple, FacebookLogo, TelegramLogo, EnvelopeSimple, MagnifyingGlass,
  ArrowLeft, Buildings, Trophy, X, Sliders, Funnel
} from '@phosphor-icons/react';
import M3ScreenHeader from './M3ScreenHeader';
import { clubsData } from '../config/clubsData';

const iconMap = {
  Cpu, Code, Database, Users, ChartBar, Robot, GameController, Globe, BookOpen, 
  Chat, MusicNotes, Microphone, Lightning, Camera, Palette, TrendUp, 
  Leaf, Briefcase, Heart, Brain, Heartbeat
};

export default function InfoView({ currentUser, setActiveTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCampus, setSelectedCampus] = useState('All');
  const [selectedClub, setSelectedClub] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };

  const categories = [
    'All',
    'Technical',
    'Literary',
    'Performing Arts',
    'Visual Arts',
    'Social',
    'Health & Wellness'
  ];

  const filteredClubs = useMemo(() => {
    return clubsData.filter(club => {
      // Search filter
      const matchesSearch = 
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (club.fullDescription && club.fullDescription.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;

      // Campus filter
      const clubCampus = club.campus || '62';
      const matchesCampus = selectedCampus === 'All' || clubCampus === selectedCampus;

      return matchesSearch && matchesCategory && matchesCampus;
    });
  }, [searchQuery, selectedCategory, selectedCampus]);

  return (
    <div className="m3-screen info-dashboard">
      <M3ScreenHeader
        title="JIIT Hubs & Clubs"
        subtitle="Explore Campus Communities"
        isScrolled={isScrolled}
        onBack={() => setActiveTab('home')}
      />

      {/* Main Content Area */}
      <div 
        onScroll={handleScroll}
        className="m3-screen__scroll"
      >
        {/* Search Bar */}
        <div className="relative w-full">
          <MagnifyingGlass 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant/60" 
            size={18} 
          />
          <input
            type="text"
            placeholder="Search clubs, hubs, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-full bg-m3-surfaceContainerHigh border border-m3-outlineVariant/20 text-white placeholder-m3-onSurfaceVariant/50 text-sm focus:outline-none focus:border-m3-primary transition-colors shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant/80 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>



        {/* Campus Filter Segmented Controls */}
        <div className="flex items-center justify-between bg-m3-surfaceContainerHigh/40 p-1.5 rounded-full border border-m3-outlineVariant/15 max-w-xs mx-auto w-full">
          {[
            { id: 'All', label: 'All' },
            { id: '62', label: 'Sec 62' },
            { id: '128', label: 'Sec 128' }
          ].map((camp) => {
            const isActive = selectedCampus === camp.id;
            return (
              <button
                key={camp.id}
                onClick={() => setSelectedCampus(camp.id)}
                className={`flex-1 h-8 text-xs font-extrabold rounded-full relative transition-all duration-300 flex items-center justify-center overflow-visible ${
                  isActive ? 'text-m3-onPrimary' : 'text-m3-onSurfaceVariant/80 hover:text-white'
                }`}
                type="button"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-info-campus"
                    className="absolute inset-0 bg-m3-primary rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <span className="relative z-10 leading-none">{camp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grid of Cards */}
        {filteredClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-sm font-bold text-m3-onSurfaceVariant tracking-wide uppercase mt-2">
              No matching clubs found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredClubs.map((club) => {
              const IconComponent = iconMap[club.icon] || Code;
              const hasInstagram = club.socials && club.socials.instagram;
              
              return (
                <motion.div
                  layoutId={`club-card-${club.id}`}
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-[28px] bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 p-5 flex flex-col gap-4 text-left shadow-lg cursor-pointer group"
                >
                  {/* Card Background Overlay / Header Image representation */}
                  {club.image && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none">
                      <img 
                        src={club.image} 
                        alt="" 
                        className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-500" 
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start w-full relative z-10">
                    <div className="flex flex-col text-left">
                      <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                        {club.name}
                      </h3>
                      <p className="text-[10px] font-black text-m3-onSurfaceVariant/50 tracking-wider uppercase">
                        {club.fullName}
                      </p>
                    </div>

                    <span 
                      className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 whitespace-nowrap ${club.iconColor}`}
                    >
                      {club.category}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-m3-onSurfaceVariant leading-relaxed line-clamp-3 relative z-10">
                    {club.description}
                  </p>

                  <div className="flex justify-between items-center w-full pt-3 border-t border-m3-outlineVariant/10 relative z-10">
                    <span className="text-xs font-black text-m3-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                      Explore <span className="font-sans">&gt;</span>
                    </span>

                    {hasInstagram && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(club.socials.instagram, '_blank');
                        }}
                        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-m3-onSurfaceVariant hover:text-white hover:bg-m3-primaryContainer/30 hover:border-m3-primary/30 transition-all active:scale-90"
                        title="Instagram profile"
                        type="button"
                      >
                        <InstagramLogo size={18} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Immersive Detail Overlay Modal */}
      <AnimatePresence>
        {selectedClub && (() => {
          const IconComponent = iconMap[selectedClub.icon] || Code;
          const clubCampus = selectedClub.campus || '62';
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md z-[99999] flex flex-col justify-end"
              onClick={() => setSelectedClub(null)}
            >
              <motion.div
                initial={{ y: '80%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="w-full bg-m3-surface rounded-t-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-t border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Hero Header Area */}
                <div className="relative h-44 shrink-0 w-full bg-gradient-to-b from-black/40 to-transparent">
                  {selectedClub.image ? (
                    <img 
                      src={selectedClub.image} 
                      alt={selectedClub.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${selectedClub.color} opacity-40`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-m3-surface to-transparent" />
                  
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/35 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/55 transition-colors cursor-pointer"
                    type="button"
                  >
                    <X size={20} />
                  </button>

                  <div className="absolute bottom-4 left-6 text-left">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                      {selectedClub.name}
                      <span className="text-[9px] font-black tracking-widest bg-white/10 border border-white/10 px-2 py-0.5 rounded-full uppercase whitespace-nowrap">
                        {selectedClub.category}
                      </span>
                    </h2>
                    <p className="text-xs font-bold text-m3-onSurfaceVariant/70 leading-none mt-1">
                      Campus: Sector {clubCampus}
                    </p>
                  </div>
                </div>

                {/* Scrollable Information Body */}
                <div className="flex-1 overflow-y-auto scrollbar-none p-6 text-left space-y-6">
                  {/* Full Name & Short Pitch */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-m3-primary tracking-widest uppercase">
                      Official Society Title
                    </h4>
                    <p className="text-lg font-bold text-white tracking-tight">
                      {selectedClub.fullName}
                    </p>
                  </div>

                  {/* Deep-dive Full Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-m3-primary tracking-widest uppercase">
                      About the Hub
                    </h4>
                    <p className="text-sm font-medium text-m3-onSurfaceVariant leading-relaxed select-text">
                      {selectedClub.fullDescription || selectedClub.description}
                    </p>
                  </div>

                  {/* Social links */}
                  {selectedClub.socials && Object.keys(selectedClub.socials).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-m3-primary tracking-widest uppercase">
                        Connect & Social Media
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedClub.socials.website && (
                          <a 
                            href={selectedClub.socials.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <GlobeSimple size={16} className="text-blue-400" />
                            <span>Website</span>
                          </a>
                        )}
                        {selectedClub.socials.instagram && (
                          <a 
                            href={selectedClub.socials.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <InstagramLogo size={16} className="text-pink-400" />
                            <span>Instagram</span>
                          </a>
                        )}
                        {selectedClub.socials.linkedin && (
                          <a 
                            href={selectedClub.socials.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <LinkedinLogo size={16} className="text-sky-400" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {selectedClub.socials.facebook && (
                          <a 
                            href={selectedClub.socials.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <FacebookLogo size={16} className="text-blue-500" />
                            <span>Facebook</span>
                          </a>
                        )}
                        {selectedClub.socials.telegram && (
                          <a 
                            href={selectedClub.socials.telegram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <TelegramLogo size={16} className="text-cyan-400" />
                            <span>Telegram</span>
                          </a>
                        )}
                        {selectedClub.socials.email && (
                          <a 
                            href={`mailto:${selectedClub.socials.email}`}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <EnvelopeSimple size={16} className="text-yellow-400" />
                            <span>Email</span>
                          </a>
                        )}
                        {selectedClub.socials.unstop && (
                          <a 
                            href={selectedClub.socials.unstop} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-m3-surfaceContainerHigh border border-m3-outlineVariant/15 text-xs font-bold text-white hover:bg-m3-surfaceContainerHighest transition-colors"
                          >
                            <Trophy size={16} className="text-amber-500" />
                            <span>Unstop</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photo Gallery Grid */}
                  {selectedClub.gallery && selectedClub.gallery.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-m3-primary tracking-widest uppercase">
                        Activity Gallery
                      </h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        {selectedClub.gallery.map((imgUrl, i) => (
                          <div 
                            key={i} 
                            className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-md bg-white/5 hover:scale-[1.03] transition-transform duration-300"
                          >
                            <img 
                              src={imgUrl} 
                              alt="Activity snapshot" 
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Official JIIT website reference */}
                  {selectedClub.jiitUrl && (
                    <div className="pt-2 text-center">
                      <a 
                        href={selectedClub.jiitUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-m3-onSurfaceVariant/55 tracking-wider uppercase hover:text-m3-primary transition-colors inline-flex items-center gap-1"
                      >
                        <Buildings size={12} />
                        <span>View Official Portal Profile</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Bottom Close Bar */}
                <div className="p-4 border-t border-m3-outlineVariant/10 bg-m3-surfaceContainerHigh shrink-0 flex gap-4">
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="flex-1 py-3 bg-m3-primary text-m3-onPrimary font-bold rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-xs uppercase tracking-widest cursor-pointer text-center"
                    type="button"
                  >
                    Close Directory
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Floating Funnel FAB */}
      {categories.length > 1 && (
        <button
          onClick={() => setShowFilterModal(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[998] bg-[#1c1b1f]/95 hover:bg-[#2b2930] text-[#eaddff] rounded-full px-5 py-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer border border-[#483c5e]/30"
          type="button"
        >
          <Sliders size={14} />
          <span>Filters {selectedCategory !== 'All' && `• ${selectedCategory}`}</span>
        </button>
      )}

      {/* Bottom Sheet Categories Funnel Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <div 
            className="absolute inset-0 bg-black/60 z-[9999] flex items-end justify-center" 
            onClick={() => setShowFilterModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md p-6 rounded-t-[28px] flex flex-col gap-4 max-h-[85vh] overflow-y-auto m3-frosted-dialog bg-m3-surface text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3 border-m3-outlineVariant/30">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Funnel size={18} className="text-m3-primary" /> Filter Categories
                </h3>
                <button
                  className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold border border-transparent"
                  onClick={() => setShowFilterModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count = cat === 'All' 
                    ? clubsData.length 
                    : clubsData.filter(club => club.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowFilterModal(false);
                      }}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                        isActive
                          ? 'bg-m3-primaryContainer border-m3-primary text-m3-onPrimaryContainer font-bold'
                          : 'bg-m3-surfaceContainerHigh border-m3-outlineVariant/20 text-white hover:bg-m3-surfaceContainerHighest'
                      }`}
                    >
                      <span className="text-sm font-semibold">{cat}</span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-m3-onSurfaceVariant">
                        {count} {count === 1 ? 'club' : 'clubs'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
