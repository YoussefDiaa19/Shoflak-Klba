
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pet, PetType, Owner } from '../types';
import { DOG_BREEDS, CAT_BREEDS, BIRD_BREEDS, PERSONALITIES, CITIES_DATA } from '../data';
import { translations } from '../translations';
import { compressImage, compressImageToFile } from '../imageUtils';
import { uploadToR2 } from '../r2Utils';
import { openExternalLink } from '../navUtils';
import { Settings, Plus, Camera, LogOut, ChevronRight, ChevronLeft, User, Moon, Sun, X, Save, Edit2, MapPin, CheckCircle2, Menu, ShieldAlert, Globe2, MessageSquareText, Check, Clock, AlertCircle, CheckCircle, Image as ImageIcon, Info, Eye, Trash2, AlertTriangle, LogIn, Heart, Loader2, ShieldCheck, FileText } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { SearchableDropdown } from './SearchableDropdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileViewProps {
  pets: Pet[];
  owner: Owner | null;
  onAddPet: (pet: Pet) => void;
  onUpdatePet: (pet: Pet) => Promise<boolean>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onGoToAccount: () => void;
  onGoToBlocked: () => void;
  onGoToContactUs: () => void;
  onUpdateOwner: (o: Owner) => void;
  initialShowMenu?: boolean;
  onPetClick: (pet: Pet) => void;
  onDeletePet?: (id: string) => Promise<void>;
  isLoading?: boolean;
  onLogin: () => void;
  onMenuClose?: () => void;
  onRetry?: () => void;
  isActive?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  pets, owner, onAddPet, onUpdatePet, isDarkMode, onToggleDarkMode, onLogout, 
  onGoToAccount, onGoToBlocked, onGoToContactUs, onUpdateOwner, initialShowMenu, onPetClick, onDeletePet, isLoading = false, onLogin, onMenuClose, onRetry, isActive = true
}) => {
  const lang = owner?.language || 'en';
  const t = translations[lang];

  const [showAddPet, setShowAddPet] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [showMenu, setShowMenu] = useState(initialShowMenu || false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [petToDeleteId, setPetToDeleteId] = useState<string | null>(null);
  const [compressingIndices, setCompressingIndices] = useState<Set<number>>(new Set());
  
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
      // Don't pull to refresh while modals are open to avoid glitching
      if (showAddPet || editPet || showMenu || showLanguageModal || petToDeleteId) return;
      
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
        if (window.navigator.vibrate) window.navigator.vibrate(10);
      }
      
      setIsPulling(false);
      setPullProgress(0);
      currentPull.current = 0;
      touchStartY.current = 0;
    };

    const mainElement = document.getElementById('app-main');
    if (!mainElement) {
      const wait = setTimeout(() => {
        const m = document.getElementById('app-main');
        if (m) {
          m.addEventListener('touchstart', handleTouchStart, { passive: true });
          m.addEventListener('touchmove', handleTouchMove, { passive: false });
          m.addEventListener('touchend', handleTouchEnd);
        }
      }, 500);
      return () => clearTimeout(wait);
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
  }, [onRetry, showAddPet, editPet, showMenu, showLanguageModal, petToDeleteId, isActive]);
  
  useEffect(() => {
    const handleHardwareBack = (e: Event) => {
      if (showAddPet) {
        if (!isSaving) setShowAddPet(false);
        e.preventDefault();
      } else if (editPet) {
        if (!isSaving) setEditPet(null);
        e.preventDefault();
      } else if (showLanguageModal) {
        setShowLanguageModal(false);
        e.preventDefault();
      } else if (showMenu) {
        setShowMenu(false);
        e.preventDefault();
      }
    };
    window.addEventListener('hardwareBack', handleHardwareBack);
    return () => window.removeEventListener('hardwareBack', handleHardwareBack);
  }, [showAddPet, editPet, showLanguageModal, showMenu, isSaving]);

  const [newPet, setNewPet] = useState<Partial<Pet>>({
    name: '', age: 1, breed: '', type: 'Dog', gender: 'Male', location: owner ? `${owner.area}, ${owner.city}` : '',
    description: '', personality: [], isVaccinated: true,
    images: []
  });

  const fileInputs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (initialShowMenu) setShowMenu(true);
  }, [initialShowMenu]);

  const handleCloseMenu = () => {
    setShowMenu(false);
    onMenuClose?.();
  };

  const displayOwner = owner || {
    id: 'guest', name: 'Guest User', city: 'Cairo', area: 'New Cairo', avatar: '', isAdmin: false, language: 'en'
  } as Owner;

  const myPets = useMemo(() => {
    if (!owner) return pets.slice(0, 2);
    return pets
      .filter(p => p.ownerId === owner.id && p.status !== 'deleted')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [pets, owner]);

  const petScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (petScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = petScrollRef.current;
      const isRtl = lang === 'ar';
      
      // If no overflow, hide both
      if (scrollWidth <= clientWidth + 2) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      if (isRtl) {
        // In Arabic, 0 is the right edge. Scrolling "forward" means scrolling left (negative values).
        const absScrollLeft = Math.abs(scrollLeft);
        const maxScroll = scrollWidth - clientWidth;
        // Left arrow (scrolling forward to left)
        setCanScrollLeft(absScrollLeft < maxScroll - 5);
        // Right arrow (scrolling back to right edge)
        setCanScrollRight(absScrollLeft > 5);
      } else {
        // LTR logic
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
      }
    }
  };

  useEffect(() => {
    const el = petScrollRef.current;
    if (!el) return;

    // Initial check
    checkScroll();
    
    // Multiple attempts to capture layout shifts as images load
    const timers = [100, 300, 600, 1000].map(ms => setTimeout(checkScroll, ms));
    
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    
    resizeObserver.observe(el);
    // Also observe the first child if possible to catch content changes
    if (el.firstChild) {
      resizeObserver.observe(el.firstChild as Element);
    }

    window.addEventListener('resize', checkScroll);
    return () => {
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [myPets, isLoading]);

  const getBreedListForType = (type: PetType) => {
    switch (type) {
      case 'Dog': return DOG_BREEDS;
      case 'Cat': return CAT_BREEDS;
      case 'Bird': return BIRD_BREEDS;
      default: return [];
    }
  };

  const handleImageSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressingIndices(prev => new Set(prev).add(index));
      try {
        const compressedFile = await compressImageToFile(file);
        const publicUrl = await uploadToR2(compressedFile);
        
        if (isEdit && editPet) {
          const newImages = [...editPet.images];
          newImages[index] = publicUrl;
          setEditPet({ ...editPet, images: newImages });
        } else {
          const newImages = [...(newPet.images || [])];
          newImages[index] = publicUrl;
          setNewPet({ ...newPet, images: newImages });
        }
      } catch (err: any) {
        console.error("Upload failed:", err);
        // Fallback to local base64 if R2 fails AND it's a dev/small file?
        // Actually best to just alert the user or log it.
        alert(err.message || "Upload failed. Please check your Cloudflare R2 configuration.");
      } finally {
        setCompressingIndices(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    }
  };

  const handlePersonalityToggle = (pet: Partial<Pet>, trait: string, isEdit: boolean) => {
    const current = pet.personality || [];
    let updated: string[];
    
    if (current.includes(trait)) {
      updated = current.filter(t => t !== trait);
    } else {
      if (current.length >= 2) return;
      updated = [...current, trait];
    }

    if (isEdit && editPet) {
      setEditPet({ ...editPet, personality: updated });
    } else {
      setNewPet({ ...newPet, personality: updated });
    }
  };

  const handleLanguageChange = (l: 'en' | 'ar') => {
    if (owner) onUpdateOwner({ ...owner, language: l });
    setShowLanguageModal(false);
  };

  const ImageUploadSlot: React.FC<{ index: number, currentImage?: string, isEdit: boolean }> = ({ index, currentImage, isEdit }) => {
    const isCompressing = compressingIndices.has(index);
    return (
      <div 
        onClick={() => !isCompressing && fileInputs[index].current?.click()}
        className={`relative pt-[100%] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
          currentImage ? 'border-transparent' : 'border-gray-200 dark:border-zinc-700 hover:border-[#e2a05e] bg-gray-50 dark:bg-zinc-800'
        } ${isCompressing ? 'opacity-50 cursor-wait' : ''}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isCompressing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-[#e2a05e] animate-spin" />
            </div>
          ) : currentImage ? (
            <img src={currentImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <>
              <Camera size={20} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 mt-1">{index + 1}</span>
            </>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputs[index]} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleImageSelect(index, e, isEdit)} 
        />
      </div>
    );
  };

  const PersonalitySelector: React.FC<{ pet: Partial<Pet>, isEdit: boolean }> = ({ pet, isEdit }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center ml-1">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.personality} ({t.personalityNote})</label>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pet.personality?.length === 2 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
          {pet.personality?.length}/2
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-1">
        {PERSONALITIES.map(trait => {
          const isSelected = pet.personality?.includes(trait);
          return (
            <button
              key={trait}
              type="button"
              onClick={() => handlePersonalityToggle(pet, trait, isEdit)}
              className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border-2 ${
                isSelected 
                  ? 'bg-[#e2a05e] border-[#e2a05e] text-white shadow-md' 
                  : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {t[trait as keyof typeof t] || trait}
            </button>
          );
        })}
      </div>
    </div>
  );

  const GenderSelector: React.FC<{ pet: Partial<Pet>, isEdit: boolean }> = ({ pet, isEdit }) => (
    <div>
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.gender}</label>
      <div className="flex gap-2 mt-1">
        {[
          { id: 'Male', label: t.male },
          { id: 'Female', label: t.female }
        ].map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              if (isEdit && editPet) setEditPet({ ...editPet, gender: g.id as 'Male' | 'Female' });
              else setNewPet({ ...newPet, gender: g.id as 'Male' | 'Female' });
            }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
              pet.gender === g.id 
                ? 'bg-[#e2a05e]/10 border-[#e2a05e] text-[#e2a05e]' 
                : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 text-gray-400'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );

  const getStatusBadge = (status: Pet['status']) => {
    switch(status) {
      case 'approved': return <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase"><CheckCircle size={10} /> {t.statusApproved}</span>;
      case 'rejected': return <span className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase"><AlertCircle size={10} /> {t.statusRejected}</span>;
      case 'pending': default: return <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase"><Clock size={10} /> {t.statusPending}</span>;
    }
  };

  const handleUpdateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPet || isSaving) return;
    setIsSaving(true);
    try {
      const success = await onUpdatePet(editPet);
      if (success) setEditPet(null);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || isSaving || !newPet.name || newPet.images?.length !== 3 || newPet.personality?.length !== 2) return;
    setIsSaving(true);
    try {
      await onAddPet({
        ...newPet,
        ownerId: owner.id,
        status: 'pending'
      } as Pet);
      setShowAddPet(false);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!petToDeleteId || !onDeletePet) return;
    try {
      await onDeletePet(petToDeleteId);
      setPetToDeleteId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const formatLocation = (area: string, city: string) => {
    const cityData = CITIES_DATA.find(c => c.en === city);
    const areaData = cityData?.areas.find(a => a.en === area);
    
    if (lang === 'ar') {
      const cityAr = cityData?.ar || city;
      const areaAr = areaData?.ar || area;
      if (!area) return cityAr;
      if (!city) return areaAr;
      return `${areaAr}, ${cityAr}`;
    }
    
    if (!area) return city;
    if (!city) return area;
    return `${area}, ${city}`;
  };

  const approvedPetsCount = owner ? myPets.filter(p => p.status === 'approved').length : 0;

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top,4rem),4rem)] pb-32 animate-in fade-in duration-500 bg-white dark:bg-[#1a1a1a] min-h-screen relative overflow-hidden">
      
      {isActive && pullProgress > 0 && (
        <div 
          className="fixed top-[env(safe-area-inset-top)] left-1/2 z-[100] pointer-events-none"
          style={{ transform: `translate(-50%, ${Math.min(pullProgress, 100)}px)`, transition: isPulling ? 'none' : 'transform 0.3s ease-out' }}
        >
          <div className={`mt-16 bg-white dark:bg-zinc-800 shadow-2xl rounded-full p-2 border border-gray-100 dark:border-zinc-700 transition-opacity ${pullProgress > 5 ? 'opacity-100' : 'opacity-0'}`}>
             <span className={`w-8 h-8 flex items-center justify-center rounded-full bg-[#e2a05e] text-white transition-transform ${pullProgress >= 80 ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 3}deg)` }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
             </span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.myProfile}</h1>
        <button onClick={() => setShowMenu(true)} className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 active:scale-90 transition-transform">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center space-y-4 mb-10">
        <div className="relative">
          {isLoading ? (
            <Skeleton className="w-32 h-32 rounded-[48px]" />
          ) : (
            <div className="w-32 h-32 rounded-[48px] border-4 border-[#fdf2e9] dark:border-zinc-800 shadow-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              {displayOwner.avatar ? (
                <img src={displayOwner.avatar} className="w-full h-full object-cover" alt="User" referrerPolicy="no-referrer" />
              ) : (
                <User size={64} className="text-gray-300" />
              )}
            </div>
          )}
        </div>
        <div className="text-center w-full space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-1/2 mx-auto" />
              <Skeleton className="h-4 w-1/3 mx-auto" />
              <Skeleton className="h-4 w-1/4 mx-auto" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayOwner.name}</h2>
              <div className="flex items-center justify-center gap-1.5 text-gray-400 text-sm mt-1">
                <MapPin size={14} />
                <span>{formatLocation(displayOwner.area, displayOwner.city)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-[32px] p-6 mb-10 flex items-center justify-center border border-gray-100 dark:border-zinc-800">
        <div className="text-center w-full">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{approvedPetsCount}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mt-1 tracking-widest">{t.marriageReady}</p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.myPets}</h3>
            {!isLoading && (
              <button onClick={() => {
                if (!owner) return;
                setNewPet({
                  name: '', age: 1, breed: DOG_BREEDS[0].en, type: 'Dog', gender: 'Male', location: `${owner.area}, ${owner.city}`,
                  description: '', personality: [], isVaccinated: true,
                  images: []
                });
                setShowAddPet(true);
              }} className="bg-transparent text-[#e2a05e] font-bold text-sm flex items-center gap-1 transition-transform active:scale-95"><Plus size={16} /> {t.addPet}</button>
            )}
          </div>
          <div className="relative group/scroll px-1">
            {/* Left Indicator */}
            {!isLoading && myPets.length > 2 && canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-20 w-10 flex items-center justify-start pointer-events-none">
                <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-r-2xl shadow-md border-y border-r border-gray-100 dark:border-zinc-800">
                  <ChevronLeft size={24} className="text-[#e2a05e] drop-shadow-sm" />
                </div>
              </div>
            )}
            
            {/* Right Indicator */}
            {!isLoading && myPets.length > 2 && canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-20 w-10 flex items-center justify-end pointer-events-none">
                <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-l-2xl shadow-md border-y border-l border-gray-100 dark:border-zinc-800">
                  <ChevronRight size={24} className="text-[#e2a05e] drop-shadow-sm" />
                </div>
              </div>
            )}

            <div 
              ref={petScrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth pb-2"
            >
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="min-w-[170px] aspect-[4/5] rounded-[28px]" />
                ))
              ) : (
                myPets.map(pet => (
                  <div key={pet.id} className="min-w-[170px] relative rounded-[28px] overflow-hidden group shadow-sm bg-gray-50 dark:bg-zinc-800/20" onClick={() => onPetClick(pet)}>
                    <img src={pet.images[0]} className="w-full aspect-[4/5] object-cover" alt={pet.name} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                    <div className="absolute top-2 left-2 z-10">
                       {getStatusBadge(pet.status)}
                    </div>
                    
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); owner && setEditPet(pet); }}
                        className="p-2.5 bg-zinc-900 border border-white/20 rounded-xl text-white hover:bg-black transition-all active:scale-90 shadow-lg flex items-center justify-center"
                      >
                        <Edit2 size={16} />
                      </button>

                      {onDeletePet && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            owner && setPetToDeleteId(pet.id);
                          }}
                          className="p-2.5 bg-red-600 border border-red-700/30 rounded-xl text-white hover:bg-red-700 transition-all active:scale-90 shadow-lg flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-base leading-tight truncate shadow-black drop-shadow-md">{pet.name}</p>
                        <p className="text-gray-300 text-[10px] font-bold uppercase truncate">
                          {lang === 'ar' 
                            ? ([...DOG_BREEDS, ...CAT_BREEDS, ...BIRD_BREEDS].find(b => b.en === pet.breed)?.ar || pet.breed)
                            : pet.breed
                          }
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPetClick(pet); }} 
                        className="p-2 bg-zinc-900/80 backdrop-blur-md rounded-full text-white hover:bg-black transition-colors shrink-0 border border-white/10"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {petToDeleteId && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t.confirmDelete || "Are you sure?"}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {t.deletePetWarning || "This pet profile will be permanently removed. This action cannot be undone."}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              >
                {t.delete || "Delete Pet"}
              </button>
              <button 
                onClick={() => setPetToDeleteId(null)}
                className="w-full py-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold active:scale-95 transition-all"
              >
                {t.cancel || "Keep it"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showMenu && owner && (
          <div className="fixed inset-0 z-[150] flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-black/40 backdrop-blur-sm" 
              onClick={handleCloseMenu} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-[80%] max-w-sm bg-white dark:bg-zinc-900 h-full p-8 shadow-2xl overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-10 pt-[env(safe-area-inset-top)]">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings}</h2>
                <button onClick={handleCloseMenu} className="p-2 text-gray-400 bg-transparent outline-none border-none active:scale-90 transition-transform"><X size={24} /></button>
              </div>
              <div className="space-y-2">
                <button onClick={() => { handleCloseMenu(); onGoToAccount(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-white transition-colors">
                  <User size={20} className="text-black dark:text-white" /> <span className="font-bold">{t.editProfile}</span>
                </button>
                <button onClick={() => { handleCloseMenu(); onGoToBlocked(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-white transition-colors">
                  <ShieldAlert size={20} className="text-black dark:text-white" /> <span className="font-bold">{t.blockedAccounts}</span>
                </button>
                <button onClick={() => setShowLanguageModal(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-white transition-colors">
                  <Globe2 size={20} className="text-black dark:text-white" /> <span className="font-bold">{t.language} ({owner.language === 'ar' ? t.arabic : t.english})</span>
                </button>
                <button onClick={() => { handleCloseMenu(); onGoToContactUs(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-white transition-colors">
                  <MessageSquareText size={20} className="text-black dark:text-white" /> <span className="font-bold">{t.contactUs}</span>
                </button>
                
                <div className="pt-2">
                  <button onClick={() => openExternalLink('https://www.shoflakklba.app/privacy')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-white transition-colors group">
                    <div className="flex items-center gap-4">
                      <ShieldCheck size={20} className="text-black dark:text-white" />
                      <span className="font-bold">{t.privacyPolicy}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => openExternalLink('https://www.shoflakklba.app/terms')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-white transition-colors group">
                    <div className="flex items-center gap-4">
                      <FileText size={20} className="text-black dark:text-white" />
                      <span className="font-bold">{t.termsAndConditions}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between bg-transparent">
                  <div className="flex items-center gap-4 text-gray-700 dark:text-white">
                    {isDarkMode ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-black" />} <span className="font-bold">{t.darkMode}</span>
                  </div>
                  <button onClick={onToggleDarkMode} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#e2a05e]' : 'bg-gray-200 dark:bg-zinc-700'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
                <div className="pt-8 mt-8 border-t dark:border-zinc-800">
                  <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 font-bold transition-all active:scale-95 border-none">
                    <LogOut size={20} className="text-black dark:text-white" /> {t.logout}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showLanguageModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.selectLanguage}</h2>
              <button onClick={() => setShowLanguageModal(false)} className="p-2 text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleLanguageChange('en')} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${owner?.language !== 'ar' ? 'border-[#e2a05e] bg-[#e2a05e]/5' : 'border-gray-100 dark:border-zinc-800'}`}>
                <span className={`font-bold ${owner?.language !== 'ar' ? 'text-[#e2a05e]' : 'text-gray-700 dark:text-white'}`}>{t.english}</span>
                {owner?.language !== 'ar' && <Check size={20} className="text-[#e2a05e]" />}
              </button>
              <button onClick={() => handleLanguageChange('ar')} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${owner?.language === 'ar' ? 'border-[#e2a05e] bg-[#e2a05e]/5' : 'border-gray-100 dark:border-zinc-800'}`}>
                <span className={`font-bold ${owner?.language === 'ar' ? 'text-[#e2a05e]' : 'text-gray-700 dark:text-white'}`}>{t.arabic}</span>
                {owner?.language === 'ar' && <Check size={20} className="text-[#e2a05e]" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {editPet && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => !isSaving && setEditPet(null)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.editPet}</h2>
              <button onClick={() => !isSaving && setEditPet(null)} disabled={isSaving} className="bg-transparent"><X size={24} className="text-gray-900 dark:text-white" /></button>
            </div>
            
            <form onSubmit={handleUpdateSave} className="space-y-4 pb-4">
              {editPet.status === 'approved' && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-900/20 flex gap-3 animate-in fade-in slide-in-from-top-2">
                  <Info size={20} className="text-[#e2a05e] shrink-0" />
                  <p className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase leading-relaxed tracking-tight">{t.editStatusWarning}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{t.selectImages}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(i => <ImageUploadSlot key={i} index={i} isEdit={true} currentImage={editPet.images[i]} />)}
                </div>
              </div>

              <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.petName}</label><input required className="w-full mt-1 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" value={editPet.name} onChange={e => setEditPet({...editPet, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.age}</label><input required type="number" min="1" max="30" className="w-full mt-1 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" value={editPet.age || ''} onChange={e => setEditPet({...editPet, age: e.target.value === '' ? ('' as any) : Math.min(30, Math.max(1, parseInt(e.target.value) || 1))})} placeholder="1" /></div>
                <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.breed}</label>
                  <SearchableDropdown 
                    options={getBreedListForType(editPet.type)}
                    value={editPet.breed}
                    onChange={(value) => setEditPet({...editPet, breed: value})}
                    placeholder={t.breed}
                    lang={lang as 'en' | 'ar'}
                  />
                </div>
              </div>
              
              <GenderSelector pet={editPet} isEdit={true} />
              <PersonalitySelector pet={editPet} isEdit={true} />

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                <div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${editPet.isVaccinated ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400'}`}><CheckCircle2 size={18} /></div><span className="font-bold text-gray-700 dark:text-white text-sm">{t.vaccinated}</span></div>
                <button type="button" onClick={() => setEditPet({...editPet, isVaccinated: !editPet.isVaccinated})} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${editPet.isVaccinated ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${editPet.isVaccinated ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
              <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.description}</label><textarea required className="w-full mt-1 p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl h-24 text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" value={editPet.description} onChange={e => setEditPet({...editPet, description: e.target.value})} /></div>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={!editPet.name || !editPet.description || editPet.images?.length !== 3 || editPet.personality?.length !== 2 || isSaving} 
                  className={`w-full py-5 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    editPet.name && editPet.description && editPet.images?.length === 3 && editPet.personality?.length === 2 && !isSaving
                      ? 'bg-[#e2a05e] text-white' 
                      : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSaving && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  {isSaving ? "Saving..." : t.updatePet}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPet && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => !isSaving && setShowAddPet(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.newPet}</h2><button className="bg-transparent" onClick={() => !isSaving && setShowAddPet(false)} disabled={isSaving}><X size={24} className="text-gray-900 dark:text-white" /></button></div>
            <form onSubmit={handleAddSubmit} className="space-y-4 pb-4">
              
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{t.selectImages}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(i => <ImageUploadSlot key={i} index={i} isEdit={false} currentImage={newPet.images?.[i]} />)}
                </div>
                {newPet.images?.length !== 3 && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">{t.imagesRequired}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 mb-2 block">NAME</label>
                <input required className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" placeholder={t.petName} value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 mb-2 block">AGE</label>
                  <input required type="number" min="1" max="30" className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" placeholder={t.age} value={newPet.age || ''} onChange={e => setNewPet({...newPet, age: e.target.value === '' ? ('' as any) : Math.min(30, Math.max(1, parseInt(e.target.value) || 1))})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 mb-2 block">TYPE</label>
                  <select className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" value={newPet.type} onChange={e => setNewPet({...newPet, type: e.target.value as any, breed: getBreedListForType(e.target.value as any)[0].en})}>
                    <option value="Dog">{t.dog}</option><option value="Cat">{t.cat}</option><option value="Bird">{t.bird}</option>
                  </select>
                </div>
              </div>
              <div className="w-full">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{t.breed}</label>
                <SearchableDropdown 
                  options={getBreedListForType(newPet.type as any)}
                  value={newPet.breed || ''}
                  onChange={(value) => setNewPet({...newPet, breed: value})}
                  placeholder={t.breed}
                  lang={lang as 'en' | 'ar'}
                />
              </div>
              
              <GenderSelector pet={newPet} isEdit={false} />
              <PersonalitySelector pet={newPet} isEdit={false} />

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                <div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${newPet.isVaccinated ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400'}`}><CheckCircle2 size={18} /></div><span className="font-bold text-gray-700 dark:text-white text-sm">{t.vaccinated}</span></div>
                <button type="button" onClick={() => setNewPet({...newPet, isVaccinated: !newPet.isVaccinated})} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${newPet.isVaccinated ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${newPet.isVaccinated ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
              <textarea required className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl h-24 text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" placeholder={t.description} value={newPet.description} onChange={e => setNewPet({...newPet, description: e.target.value})} />
              <button disabled={isSaving || !newPet.name || newPet.images?.length !== 3 || newPet.personality?.length !== 2} type="submit" className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl shadow-[#e2a05e]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isSaving || !newPet.name || newPet.images?.length !== 3 || newPet.personality?.length !== 2 ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400' : 'bg-[#e2a05e] text-white'}`}>
                {isSaving && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                {isSaving ? "Creating..." : t.createProfile}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
