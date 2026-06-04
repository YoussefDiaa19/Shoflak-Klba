
import React, { useState, useEffect, useRef } from 'react';
import { Pet, PetType, Filters, Owner } from '../types';
import { DOG_BREEDS, CAT_BREEDS, BIRD_BREEDS, CITIES_DATA } from '../data';
import { translations } from '../translations';
import { List, LayoutGrid, SlidersHorizontal, Heart, PawPrint, X, Search, Sparkles, MapPin, Globe } from 'lucide-react';
import { PetCardSkeleton } from './Skeleton';
import { PawIllustration } from './PawIllustration';

interface HomeFeedProps {
  pets: Pet[];
  activeCategory: PetType;
  onCategoryChange: (cat: PetType) => void;
  onPetClick: (pet: Pet) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  filters: Filters;
  onFilterChange: (f: Filters) => void;
  currentUser: Owner | null;
  isLoading?: boolean;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isActive?: boolean;
}

const PetCard: React.FC<{ pet: Pet; mode: 'list' | 'grid'; onClick: () => void; isFavorite: boolean; onToggleFavorite: () => void; t: any; lang: string }> = ({ pet, mode, onClick, isFavorite, onToggleFavorite, t, lang }) => {
  if (mode === 'grid') {
    return (
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm active:opacity-70 transition-opacity" onClick={onClick}>
        <div className="relative pb-[100%]">
          <div className="absolute inset-0">
            <img src={pet.images[0]} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={pet.name} referrerPolicy="no-referrer" />
            {pet.status === 'approved' && (
              <div className={`absolute top-2 ${lang === 'ar' ? 'right-2' : 'left-2'} p-1 px-2 rounded-lg bg-[#e2a05e] text-white text-[8px] font-black uppercase flex items-center gap-1 shadow-md z-10`}>
                <Sparkles size={8} fill="white" /> {t.marriageReady}
              </div>
            )}
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`absolute top-2 ${lang === 'ar' ? 'left-2' : 'right-2'} p-2 rounded-xl bg-black/40 backdrop-blur-md active:scale-125 transition-transform z-10 ${isFavorite ? 'text-red-500' : 'text-white'}`}>
              <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} />
            </button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-900 dark:text-white truncate">{pet.name}, {pet.age}</h3>
          <p className="text-[10px] text-gray-400 truncate font-bold uppercase tracking-tighter">
            {lang === 'ar' 
              ? ([...DOG_BREEDS, ...CAT_BREEDS, ...BIRD_BREEDS].find(b => b.en === pet.breed)?.ar || pet.breed)
              : pet.breed
            }
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative rounded-[32px] overflow-hidden shadow-lg bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 cursor-pointer active:opacity-80 transition-opacity transform-gpu will-change-transform" style={{ WebkitTransform: 'translate3d(0,0,0)' }} onClick={onClick}>
      <div className="relative pb-[125%] pointer-events-none">
        <div className="absolute inset-0 pointer-events-auto">
          <img src={pet.images[0]} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={pet.name} referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
          
          {pet.status === 'approved' && (
            <div className={`absolute top-5 ${lang === 'ar' ? 'right-5' : 'left-5'} p-2 px-4 rounded-2xl bg-[#e2a05e] text-white text-[10px] font-black uppercase flex items-center gap-2 shadow-2xl border border-white/20 z-10`}>
              <Sparkles size={12} fill="white" /> {t.marriageReady}
            </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/30 active:scale-110 transition-transform z-10 bg-transparent ${isFavorite ? 'text-red-500' : 'text-white'}`}>
            <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} />
          </button>
          <div className="absolute bottom-8 left-6 right-6">
            <h3 className="text-3xl font-bold text-white">{pet.name}, {pet.age}</h3>
            <p className="text-white/80 text-sm mt-1">{pet.location} • {lang === 'ar' 
              ? ([...DOG_BREEDS, ...CAT_BREEDS, ...BIRD_BREEDS].find(b => b.en === pet.breed)?.ar || pet.breed)
              : pet.breed
            }</p>
            
            <div className="flex mt-4 -mx-1">
              {(Array.isArray(pet.personality) ? pet.personality : []).slice(0, 2).map((tag, idx) => (
                <span key={tag} className="mx-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HomeFeed: React.FC<HomeFeedProps> = ({ 
  pets, activeCategory, onCategoryChange, onPetClick, favorites, onToggleFavorite, 
  filters, onFilterChange, currentUser, isLoading = false, viewMode, onViewModeChange,
  onLoadMore, hasMore = false, isFetchingMore = false, error, onRetry, isActive = true
}) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const CATEGORIES: {id: PetType, label: string}[] = [
    {id: 'All', label: t.all},
    {id: 'Dog', label: t.dog},
    {id: 'Cat', label: t.cat},
    {id: 'Bird', label: t.bird}
  ];

  const [showFilters, setShowFilters] = useState(false);
  const [breedSearch, setBreedSearch] = useState('');
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showFilters) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    
    const handleHardwareBack = (e: Event) => {
      if (showFilters) {
        setShowFilters(false);
        e.preventDefault();
      }
    };
    window.addEventListener('hardwareBack', handleHardwareBack);
    return () => {
      window.removeEventListener('hardwareBack', handleHardwareBack);
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const currentPull = useRef(0);
  
  useEffect(() => {
    if (!isActive) {
      setPullProgress(0);
      currentPull.current = 0;
      setIsPulling(false);
      return;
    }
    const PTR_THRESHOLD = 80;

    const handleTouchStart = (e: TouchEvent) => {
      // Re-query in case DOM changed
      const main = document.getElementById('app-main');
      if (main && main.scrollTop <= 5) {
        touchStartY.current = e.touches[0].clientY;
        currentPull.current = 0;
      } else {
        touchStartY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const main = document.getElementById('app-main');
      if (touchStartY.current > 0 && main && main.scrollTop <= 5) {
        const y = e.touches[0].clientY;
        const diff = (y - touchStartY.current) * 0.5; // Resistance
        if (diff > 0) {
          setIsPulling(true);
          currentPull.current = Math.min(diff, PTR_THRESHOLD + 40);
          setPullProgress(currentPull.current);
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (currentPull.current >= PTR_THRESHOLD && onRetry) {
        onRetry();
        // Give feedback haptics if possible
        if (window.navigator.vibrate) window.navigator.vibrate(10);
      }
      
      setIsPulling(false);
      setPullProgress(0);
      currentPull.current = 0;
      touchStartY.current = 0;
    };

    const mainElement = document.getElementById('app-main');
    if (!mainElement) {
      // Retry in 500ms if not found yet (race condition)
      const t = setTimeout(() => {
        const m = document.getElementById('app-main');
        if (m) {
          m.addEventListener('touchstart', handleTouchStart, { passive: true });
          m.addEventListener('touchmove', handleTouchMove, { passive: false });
          m.addEventListener('touchend', handleTouchEnd);
        }
      }, 500);
      return () => clearTimeout(t);
    }

    mainElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    mainElement.addEventListener('touchend', handleTouchEnd);
    mainElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      mainElement.removeEventListener('touchstart', handleTouchStart);
      mainElement.removeEventListener('touchmove', handleTouchMove);
      mainElement.removeEventListener('touchend', handleTouchEnd);
      mainElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onRetry, isActive]);

  useEffect(() => {
    const mainElement = document.getElementById('app-main');
    if (!mainElement || !headerRef.current) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = mainElement.scrollTop;
          
          if (!headerRef.current) {
            ticking = false;
            return;
          }

          if (currentScrollY < 10) {
            headerRef.current.style.transform = 'translateY(0)';
          } else if (currentScrollY > lastScrollY.current + 10) {
            headerRef.current.style.transform = 'translateY(-100%)';
          } else if (currentScrollY < lastScrollY.current - 10) {
            headerRef.current.style.transform = 'translateY(0)';
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isLoading || isFetchingMore || !hasMore || !onLoadMore) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        onLoadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isLoading, isFetchingMore, hasMore, onLoadMore, pets.length]);

  const getBreedList = () => {
    switch (filters.type) {
      case 'Dog': return DOG_BREEDS;
      case 'Cat': return CAT_BREEDS;
      case 'Bird': return BIRD_BREEDS;
      default: return [];
    }
  };

  const filteredBreeds = getBreedList().filter(b => (lang === 'ar' ? b.ar : b.en).toLowerCase().includes(breedSearch.toLowerCase()));

  const clearFilters = () => {
    setBreedSearch('');
    onFilterChange({ 
      type: 'All', 
      breed: '', 
      minAge: 1, 
      maxAge: 30, 
      gender: 'Any', 
      city: '', 
      area: '' 
    });
    onCategoryChange('All');
  };

  const hasActiveFilters = filters.breed !== '' || filters.minAge > 1 || filters.maxAge < 30 || filters.gender !== 'Any' || activeCategory !== 'All' || filters.city !== '' || filters.area !== '';

  return (
    <div className="bg-white dark:bg-[#1a1a1a] min-h-full">
      
      {isActive && pullProgress > 0 && (
        <div 
          className="fixed top-[env(safe-area-inset-top)] left-1/2 z-[40] pointer-events-none"
          style={{ transform: `translate(-50%, ${Math.min(pullProgress, 100)}px)`, transition: isPulling ? 'none' : 'transform 0.3s ease-out' }}
        >
          <div className={`mt-16 bg-white dark:bg-zinc-800 shadow-2xl rounded-full p-2 border border-gray-100 dark:border-zinc-700 transition-opacity ${pullProgress > 5 ? 'opacity-100' : 'opacity-0'}`}>
             <span className={`w-8 h-8 flex items-center justify-center rounded-full bg-[#e2a05e] text-white transition-transform ${pullProgress >= 80 ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 3}deg)` }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
             </span>
          </div>
        </div>
      )}

      <div 
        ref={headerRef}
        className={`fixed top-0 pt-[calc(env(safe-area-inset-top)+16px)] left-0 right-0 z-30 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-gray-100/50 dark:border-zinc-800/50 transition-transform duration-300 ease-in-out will-change-transform`}
      >
        <div className="px-5 pb-2 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-[#e2a05e] p-2 rounded-xl text-white shadow-lg shadow-[#e2a05e]/20 ml-2">
                <PawPrint size={20} fill="white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight ml-1">Shoflak Klba</h1>
            </div>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
               <button 
                 onClick={() => onViewModeChange('list')} 
                 className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'bg-transparent text-gray-400'}`}
               >
                 <List size={18} />
               </button>
               <button 
                 onClick={() => onViewModeChange('grid')} 
                 className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'bg-transparent text-gray-400'}`}
               >
                 <LayoutGrid size={18} />
               </button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex-1 flex space-x-2 rtl:space-x-reverse overflow-x-auto hide-scrollbar pt-1 pb-2 items-center">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryChange(cat.id);
                    onFilterChange({...filters, type: cat.id});
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-sm flex-shrink-0 ${
                    activeCategory === cat.id ? 'bg-[#e2a05e] text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative shrink-0 ml-2 rtl:mr-2 rtl:ml-0">
              <button 
                onClick={() => setShowFilters(true)}
                className={`p-2.5 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-2 transition-colors ${hasActiveFilters ? 'border-[#e2a05e]' : 'border-transparent'}`}
              >
                <SlidersHorizontal size={18} />
              </button>
              {hasActiveFilters && (
                <button 
                  onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                  className={`absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg z-10 hover:scale-110 active:scale-90 transition-transform flex items-center justify-center border-2 border-white dark:border-zinc-900`}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`px-5 pt-[calc(env(safe-area-inset-top)+145px)] pb-[calc(110px+env(safe-area-inset-bottom))] ${viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-2 gap-4'}`}>
        {isLoading && pets.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <PetCardSkeleton key={i} mode={viewMode} />
          ))
        ) : error && pets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-[32px] border border-red-100 dark:border-red-900/20 max-w-xs mx-auto">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                <X size={24} />
              </div>
              <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-6 leading-relaxed">{error}</p>
              <button 
                onClick={onRetry}
                className="w-full py-4 bg-[#e2a05e] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#e2a05e]/20 active:scale-95 transition-transform"
              >
                {t.retry}
              </button>
            </div>
          </div>
        ) : (
          <>
            {pets.map(pet => (
              <PetCard 
                key={pet.id} 
                pet={pet} 
                mode={viewMode}
                onClick={() => onPetClick(pet)}
                isFavorite={favorites.includes(pet.id)}
                onToggleFavorite={() => onToggleFavorite(pet.id)}
                t={t}
                lang={lang}
              />
            ))}
            
            {(hasMore || isFetchingMore) && (
              <div 
                ref={loadMoreRef} 
                className={`col-span-full py-6 flex items-center justify-center ${pets.length === 0 ? 'hidden' : ''}`}
              >
                 <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce" />
                   <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce [animation-delay:-0.3s]" />
                 </div>
              </div>
            )}

            {pets.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                <PawIllustration />
                <div className="space-y-2">
                  <p className="text-gray-400 font-bold text-lg">{t.noPetsFound}</p>
                  <button 
                    onClick={clearFilters}
                    className="text-[#e2a05e] font-bold text-sm underline underline-offset-4 bg-transparent outline-none border-none py-2 px-4"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showFilters && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-none touch-none" 
          onClick={(e) => { e.preventDefault(); setShowFilters(false); }}
        >
          <div 
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl overscroll-contain" 
            onClick={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t.filters}</h2>
                <button onClick={clearFilters} className="text-xs font-bold text-[#e2a05e] bg-[#e2a05e]/10 px-3 py-1.5 rounded-full hover:bg-[#e2a05e]/20 transition-colors">{t.clearAll}</button>
              </div>
              <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-zinc-900 dark:text-white hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.petType}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map(t_cat => (
                    <button
                      key={t_cat.id}
                      onClick={() => { onFilterChange({...filters, type: t_cat.id, breed: ''}); onCategoryChange(t_cat.id); }}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filters.type === t_cat.id ? 'bg-[#e2a05e] text-white' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-white'}`}
                    >
                      {t_cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {filters.type !== 'All' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.breed}</label>
                  <div className="mt-2 space-y-3">
                    <div className="relative">
                      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400`} size={16} />
                      <input 
                        type="text"
                        placeholder={t.searchBreeds}
                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none border border-transparent focus:border-[#e2a05e]/30 transition-all`}
                        value={breedSearch}
                        onChange={(e) => setBreedSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 hide-scrollbar pr-1">
                      {filteredBreeds.map(b => (
                        <button
                          key={b.en}
                          onClick={() => onFilterChange({...filters, breed: b.en})}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${filters.breed === b.en ? 'bg-[#e2a05e]/10 text-[#e2a05e] border border-[#e2a05e]' : 'bg-gray-5 dark:bg-zinc-800/50 text-zinc-700 dark:text-white'}`}
                        >
                          <span className="font-bold">{lang === 'ar' ? b.ar : b.en}</span>
                          {filters.breed === b.en && <div className="w-2 h-2 rounded-full bg-[#e2a05e]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">{t.city} & {t.area}</label>
                <div className="grid grid-cols-2 gap-4">
                   <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      <select 
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-bold outline-none border border-transparent focus:border-[#e2a05e]/30 appearance-none"
                        value={filters.city}
                        onChange={(e) => onFilterChange({...filters, city: e.target.value, area: ''})}
                      >
                        <option value="">{t.all} {t.city}</option>
                        {CITIES_DATA.map(city => (
                          <option key={city.en} value={city.en}>{lang === 'ar' ? city.ar : city.en}</option>
                        ))}
                      </select>
                   </div>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      <select 
                        disabled={!filters.city}
                        className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white font-bold outline-none border border-transparent focus:border-[#e2a05e]/30 appearance-none ${!filters.city ? 'opacity-50 grayscale' : ''}`}
                        value={filters.area}
                        onChange={(e) => onFilterChange({...filters, area: e.target.value})}
                      >
                        <option value="">{t.all} {t.area}</option>
                        {filters.city && CITIES_DATA.find(c => c.en === filters.city)?.areas.map(area => (
                          <option key={area.en} value={area.en}>{lang === 'ar' ? area.ar : area.en}</option>
                        ))}
                      </select>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.minAge}</label>
                  <input 
                    type="number" min="1" max="30" 
                    className="w-full mt-2 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white outline-none border border-transparent focus:border-[#e2a05e]/30" 
                    value={filters.minAge || ''} 
                    onChange={(e) => {
                      let val = e.target.value === '' ? ('' as any) : parseInt(e.target.value);
                      if (val !== '') {
                        val = Math.max(1, Math.min(30, val));
                        if (typeof filters.maxAge === 'number' && val > filters.maxAge) val = filters.maxAge;
                      }
                      onFilterChange({...filters, minAge: val});
                    }} 
                    placeholder="1" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.maxAge}</label>
                  <input 
                    type="number" min="1" max="30" 
                    className="w-full mt-2 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white outline-none border border-transparent focus:border-[#e2a05e]/30" 
                    value={filters.maxAge || ''} 
                    onChange={(e) => {
                      let val = e.target.value === '' ? ('' as any) : parseInt(e.target.value);
                      if (val !== '') {
                        val = Math.max(1, Math.min(30, val));
                        if (typeof filters.minAge === 'number' && val < filters.minAge) val = filters.minAge;
                      }
                      onFilterChange({...filters, maxAge: val});
                    }} 
                    placeholder="30" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.gender}</label>
                <div className="flex gap-2 mt-2">
                  {[
                    {id: 'Any', label: t.any},
                    {id: 'Male', label: t.male},
                    {id: 'Female', label: t.female}
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => onFilterChange({...filters, gender: g.id as any})}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${filters.gender === g.id ? 'bg-[#e2a05e] text-white' : 'bg-gray-50 dark:bg-zinc-800 text-zinc-500 dark:text-gray-400'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setShowFilters(false)} className="w-full py-5 bg-[#e2a05e] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#e2a05e]/20 active:scale-[0.98] transition-all">{t.apply}</button>
          </div>
        </div>
      )}
    </div>
  );
};
