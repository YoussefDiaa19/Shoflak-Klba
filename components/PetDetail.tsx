
import React, { useEffect, useState, useRef } from 'react';
import { Pet, Owner } from '../types';
import { translations } from '../translations';
import { CITIES_DATA, DOG_BREEDS, CAT_BREEDS, BIRD_BREEDS } from '../data';
import { ArrowLeft, MapPin, CheckCircle2, PawPrint, MessageCircle, ChevronRight, ChevronLeft, Calendar, MoreVertical, AlertTriangle } from 'lucide-react';
import { DetailSkeleton, Skeleton } from './Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface PetDetailProps {
  pet: Pet;
  onBack: () => void;
  onChat: () => void;
  onViewOwner: (id: string) => void;
  owners: Owner[];
  currentUser: Owner | null;
  isLoading?: boolean;
  onReport: (reason: string) => void;
}

const formatDate = (timestamp?: number, lang: string = 'en') => {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(timestamp));
  } catch (e) {
    return new Date(timestamp).toLocaleDateString();
  }
};

const formatLocation = (area: string, city: string, lang: string) => {
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

export const PetDetail: React.FC<PetDetailProps> = ({ pet, onBack, onChat, onViewOwner, owners, currentUser, isLoading = false, onReport }) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const owner = owners.find(o => o.id === pet.ownerId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = Math.abs(scrollRef.current.scrollLeft);
    const width = scrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveImageIndex(index);
  };

  const isOwnPet = currentUser?.id === pet.ownerId;

  const reportReasons = [
    { id: 'scamFraud', label: t.scamFraud },
    { id: 'animalCruelty', label: t.animalCruelty },
    { id: 'stolenPet', label: t.stolenPet },
    { id: 'inappropriateContent', label: t.inappropriateContent },
    { id: 'misleadingInfo', label: t.misleadingInfo },
    { id: 'notAPet', label: t.notAPet },
    { id: 'duplicatePost', label: t.duplicatePost },
    { id: 'petUnavailable', label: t.petUnavailable },
    { id: 'wrongCategory', label: t.wrongCategory }
  ];

  const handleReport = async (reason: string) => {
    setIsReporting(true);
    try {
      await onReport(reason);
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setIsReporting(false);
    }
  };

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pet.id]);

  const approvalDate = formatDate(pet.approvedAt, lang);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] h-screen flex flex-col overflow-hidden relative">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="relative h-[55vh] group overflow-hidden">
          <button onClick={onBack} className={`absolute top-[max(env(safe-area-inset-top,3.5rem),3.5rem)] ${lang === 'ar' ? 'right-5 rotate-180' : 'left-5'} p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 active:scale-90 shadow-xl transition-all z-[60]`}>
            <ArrowLeft size={24} />
          </button>

          <div className={`absolute top-[max(env(safe-area-inset-top,3.5rem),3.5rem)] ${lang === 'ar' ? 'left-5' : 'right-5'} z-[60]`}>
            {showMenu && (
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            )}
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white border-none outline-none shadow-xl transition-colors relative z-20"
            >
              <MoreVertical size={24} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className={`absolute top-full mt-2 ${lang === 'ar' ? 'left-0' : 'right-0'} w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 py-2 z-30 overflow-hidden`}
                >
                  {!isOwnPet ? (
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-500 bg-transparent active:bg-red-50 dark:active:bg-red-900/10 outline-none border-none transition-colors font-bold"
                    >
                      <AlertTriangle size={20} />
                      {t.report}
                    </button>
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-500 italic">
                      {t.myPet}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-x-auto flex snap-x snap-mandatory hide-scrollbar scroll-smooth"
          >
            {pet.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                loading={idx === 0 ? "eager" : "lazy"} 
                decoding="async" 
                alt={pet.name} 
                className="w-full h-full object-cover flex-shrink-0 snap-start snap-always" 
                referrerPolicy="no-referrer" 
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          {pet.images.length > 1 && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (scrollRef.current) {
                    const width = scrollRef.current.clientWidth;
                    const newIndex = Math.max(0, activeImageIndex - 1);
                    scrollRef.current.scrollTo({ left: newIndex * width, behavior: 'smooth' });
                  }
                }}
                className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-4' : 'left-4'} p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex z-30`}
              >
                <ChevronLeft size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (scrollRef.current) {
                    const width = scrollRef.current.clientWidth;
                    const newIndex = Math.min(pet.images.length - 1, activeImageIndex + 1);
                    scrollRef.current.scrollTo({ left: newIndex * width, behavior: 'smooth' });
                  }
                }}
                className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-4' : 'right-4'} p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex z-30`}
              >
                <ChevronRight size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
              </button>
            </>
          )}

          {pet.images.length > 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 z-40 pointer-events-none">
              {pet.images.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'w-6 bg-[#e2a05e]' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="relative -mt-6 bg-white dark:bg-[#1a1a1a] rounded-t-[40px] px-6 pt-8 pb-32 shadow-2xl space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{pet.name}, {pet.age}</h1>
              <div className="flex items-center gap-1.5 text-gray-400"><MapPin size={18} /> <span className="text-base font-medium">{formatLocation(pet.location.split(', ')[0] || '', pet.location.split(', ')[1] || '', lang)}</span></div>
            </div>
            <div className={`px-6 py-3 rounded-2xl ${pet.gender === 'Male' ? 'bg-[#e7f1ff] text-[#3483fa]' : 'bg-[#ffe7f1] text-[#fa3483]'} font-bold`}>{pet.gender === 'Male' ? t.male : t.female}</div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.about} {pet.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{pet.description}</p>
            <div className="flex flex-wrap -mx-1 mt-4">
              {pet.personality.map(trait => (
                <span key={trait} className="mx-1 mb-2 px-4 py-1.5 rounded-full bg-[#fdf2e9] dark:bg-zinc-800 text-[#e2a05e] text-xs font-bold uppercase tracking-widest">{t[trait as keyof typeof t] || trait}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-start">
               <div className={`p-2.5 rounded-2xl shrink-0 ${pet.isVaccinated ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400'}`}><CheckCircle2 size={20} /></div>
               <div className="flex-1 min-w-0 ml-3 rtl:mr-3 rtl:ml-0">
                 <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight mb-0.5">{t.health}</p>
                 <p className={`text-[13px] font-bold leading-tight ${pet.isVaccinated ? 'text-black dark:text-white' : 'text-red-500'}`}>{pet.isVaccinated ? t.vaccinated : t.notVaccinated}</p>
               </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-start">
               <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl shrink-0"><PawPrint size={20} /></div>
               <div className="flex-1 min-w-0 ml-3 rtl:mr-3 rtl:ml-0">
                 <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight mb-0.5">{t.breed}</p>
                 <p className="text-[13px] font-bold text-black dark:text-white leading-tight">
                   {lang === 'ar' 
                     ? ([...DOG_BREEDS, ...CAT_BREEDS, ...BIRD_BREEDS].find(b => b.en === pet.breed)?.ar || pet.breed)
                     : pet.breed
                   }
                 </p>
               </div>
            </div>
          </div>

          {/* Repositioned Owner Profile Card - Handled to prevent flicker */}
          <div className="min-h-[96px]">
            {owner ? (
              <div 
                onClick={() => onViewOwner(owner.id)}
                className="bg-[#fdf2e9]/50 dark:bg-zinc-800/30 rounded-[32px] p-5 flex items-center justify-between border border-[#e2a05e]/20 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center">
                  <img src={owner.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-md shrink-0 block" alt={owner.name} referrerPolicy="no-referrer" />
                  <div className="ml-4 rtl:mr-4 rtl:ml-0">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{owner.name}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{formatLocation(owner.area, owner.city, lang)}</p>
                  </div>
                </div>
                <div className="flex items-center ml-2 rtl:mr-2 rtl:ml-0">
                  <span className="text-[10px] font-black text-[#e2a05e] uppercase tracking-widest mr-2 rtl:ml-2 rtl:mr-0">{t.owner}</span>
                  <ChevronRight className={`text-gray-400 dark:text-gray-500 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-zinc-800/30 rounded-[32px] p-5 flex items-center justify-between border border-gray-100 dark:border-zinc-800 animate-pulse">
                <div className="flex items-center">
                  <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                  <div className="space-y-2 ml-4 rtl:mr-4 rtl:ml-0">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12 ml-2 rtl:mr-2 rtl:ml-0" />
              </div>
            )}
          </div>

          {approvalDate && (
            <div className="bg-[#fdf2e9] dark:bg-[#e2a05e]/10 p-5 rounded-[32px] border border-[#e2a05e]/20 flex items-center">
              <div className="p-3 bg-[#e2a05e] text-white rounded-2xl shadow-lg shadow-[#e2a05e]/20 shrink-0">
                <Calendar size={24} />
              </div>
              <div className="ml-4 rtl:mr-4 rtl:ml-0">
                <p className="text-xs text-[#e2a05e] font-black uppercase tracking-widest">{t.approvedOn}</p>
                <p className="font-black text-gray-900 dark:text-white text-lg">{approvalDate}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isOwnPet && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#1a1a1a] via-white dark:via-[#1a1a1a]/90 to-transparent z-[50]">
          <button 
            onClick={onChat} 
            className="w-full py-5 rounded-[24px] font-bold text-xl shadow-2xl flex items-center justify-center gap-3 transition-transform bg-[#e2a05e] text-white shadow-[#e2a05e]/30 active:scale-95"
          >
            <MessageCircle size={24} fill="white" /> {t.chatWithOwner}
          </button>
        </div>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{t.reportPet}</h3>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500"
                  >
                    <ArrowLeft size={20} className={lang === 'ar' ? '' : 'rotate-180'} />
                  </button>
                </div>

                {reportSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    <p className="text-gray-600 dark:text-gray-400 font-bold px-4">{t.reportSuccess}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t.reportReason}</p>
                    <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      {reportReasons.map(reason => (
                        <button
                          key={reason.id}
                          onClick={() => handleReport(reason.label)}
                          disabled={isReporting}
                          className="w-full p-5 text-left rounded-3xl border-2 border-gray-100 dark:border-zinc-800 hover:border-[#e2a05e] hover:bg-[#fdf2e9]/50 dark:hover:bg-[#e2a05e]/10 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#e2a05e]">{reason.label}</span>
                            <ChevronRight size={20} className={`text-gray-300 group-hover:text-[#e2a05e] ${lang === 'ar' ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
