
import React, { useState } from 'react';
import { Owner } from '../types';
import { CITIES_DATA } from '../data';
import { translations } from '../translations';
import { MapPin, Globe, ArrowRight, Loader2 } from 'lucide-react';

interface LocationSetupViewProps {
  owner: Owner;
  onComplete: (city: string, area: string, language: 'en' | 'ar') => Promise<void>;
  onLogout: () => void;
}

export const LocationSetupView: React.FC<LocationSetupViewProps> = ({ owner, onComplete, onLogout }) => {
  const [lang, setLang] = useState<'en' | 'ar'>(owner.language || 'en');
  const t = translations[lang];
  
  const [city, setCity] = useState('Cairo');
  const [area, setArea] = useState('New Cairo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!city || !area || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComplete(city, area, lang);
    } catch (err) {
      console.error("Failed to save location:", err);
      setIsSubmitting(false);
    }
  };

  const cityData = CITIES_DATA.find(c => c.en === city);
  const areas = cityData ? cityData.areas : [];

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-[#1a1a1a] flex flex-col p-8 items-center justify-center text-center animate-in fade-in duration-500">
      <div className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] left-6 z-10 w-fit">
        <button 
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-xl text-gray-900 dark:text-white font-bold tracking-wide active:scale-95 transition-all text-sm shadow-sm"
        >
          <Globe size={18} className="text-[#e2a05e]" />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="max-w-sm w-full space-y-12">
        <div className="space-y-6 flex flex-col items-center mt-8">
          <div className="relative w-40 h-40 flex items-center justify-center -mb-2">
            {/* Map Base */}
            <div className="absolute bottom-0 text-[#e2a05e]/20 dark:text-[#e2a05e]/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </div>
            
            {/* Large Map Pin */}
            <div className="absolute -top-4 z-10 drop-shadow-[0_15px_15px_rgba(226,160,94,0.4)] dark:drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-8 duration-700 delay-150 fill-mode-both">
              <svg width="88" height="88" viewBox="0 0 24 24" fill="currentColor" className="text-[#e2a05e]">
                <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" />
                <circle cx="12" cy="8" r="3.5" className="fill-white dark:fill-[#1a1a1a]" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
              {t.enterLocation || "Enter your location"}
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e2a05e] transition-colors pointer-events-none" size={20} />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 border-2 border-transparent rounded-2xl text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-[#e2a05e]/30 transition-all font-bold appearance-none scrollbar-hide"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  const newCity = CITIES_DATA.find(c => c.en === e.target.value);
                  setArea(newCity ? newCity.areas[0].en : '');
                }}
              >
                {CITIES_DATA.map(c => (
                  <option key={c.en} value={c.en}>{lang === 'ar' ? c.ar : c.en}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e2a05e] transition-colors pointer-events-none" size={20} />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 border-2 border-transparent rounded-2xl text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-[#e2a05e]/30 transition-all font-bold appearance-none scrollbar-hide"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                {areas.map(a => (
                  <option key={a.en} value={a.en}>{lang === 'ar' ? a.ar : a.en}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleComplete}
            disabled={isSubmitting}
            className="w-full py-5 bg-[#e2a05e] text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-[#e2a05e]/40 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                {t.completeProfile || "Complete Profile"} <ArrowRight size={24} />
              </>
            )}
          </button>
        </div>

        <button 
          onClick={onLogout}
          className="text-gray-400 dark:text-gray-500 font-bold text-sm hover:text-red-500 transition-colors"
        >
          {t.logout || "Logout"}
        </button>
      </div>
    </div>
  );
};
