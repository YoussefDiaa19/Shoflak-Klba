import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../translations';
import { Heart, ChevronRight, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence, wrap } from 'framer-motion';

interface OnboardingViewProps {
  onComplete: () => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Sync document RTL
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = translations[lang] as any;

  const slides = [
    {
      bg: "bg-white dark:bg-[#1a1a1a]",
      visual: (
        <div className="absolute inset-0 flex items-center justify-center p-6 mt-12 overflow-hidden pointer-events-none">
          <div className="relative w-full max-w-sm flex items-center justify-center h-full">
            <img src="/pngwing.com (1).png" className="w-full h-auto max-h-[80%] object-contain" alt="Welcome" loading="lazy" />
          </div>
        </div>
      ),
      title: t.onboarding1Title || "Welcome to\nShoflak Klba",
      desc: t.onboarding1Desc || "Join the best community for pet owners looking to connect and find partners for their beloved pets."
    },
    {
      bg: "bg-[#f9f8f7] dark:bg-[#f9f8f7]",
      visual: (
        <div className="absolute inset-0 flex items-center justify-center p-4">
           <div className="relative w-full max-w-sm flex items-center justify-center">
              <img src="/ChatGPT%20Image%20Apr%2025,%202026,%2009_43_18%20PM.png" className="w-full h-auto object-contain drop-shadow-sm" alt="Matching Pets" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
           </div>
        </div>
      ),
      title: t.onboarding2Title || "Find a Mating Partner",
      desc: t.onboarding2Desc || "Easily discover the perfect match. Filter by breed, age, and location to find exactly what you're looking for."
    },
    {
      bg: "bg-[#d98a6c] dark:bg-[#b86134]",
      visual: (
        <div className="absolute inset-0 flex items-center justify-center p-8">
           <div className="relative w-full max-w-sm">
              <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" className="w-full aspect-square object-cover rounded-[40px] shadow-lg" alt="Dog" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-4 -left-2 bg-white dark:bg-zinc-800 p-4 rounded-3xl rounded-bl-none shadow-2xl flex items-center gap-2 border border-white/20"
              >
                <div className="flex gap-1">
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 bg-[#e2a05e] rounded-full" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 bg-[#e2a05e] rounded-full" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 bg-[#e2a05e] rounded-full" 
                  />
                </div>
              </motion.div>
           </div>
        </div>
      ),
      title: t.onboarding3Title || "Connect & Chat",
      desc: t.onboarding3Desc || "Send safe, discreet messages, get to know each other, and arrange meetups for your pets."
    }
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = Math.abs(scrollRef.current.scrollLeft);
    const width = scrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveSlide(index);
  };

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: index * width * (lang === 'ar' ? -1 : 1),
      behavior: 'smooth'
    });
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-white dark:bg-[#1a1a1a] flex flex-col font-sans animate-in fade-in duration-300 overflow-hidden">
      <div className={`absolute inset-0 transition-colors duration-700 ${slides[activeSlide].bg}`} />
      
      <div className="absolute top-[env(safe-area-inset-top)] pt-6 left-6 right-6 flex justify-between z-20 items-center pointer-events-none">
        <button onClick={(e) => { e.preventDefault(); setLang(lang === 'en' ? 'ar' : 'en'); }} className="pointer-events-auto px-5 py-2.5 rounded-full bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 font-bold text-xs shadow-xl active:scale-95 transition-transform drop-shadow-xl backdrop-blur-md">
           {lang === 'en' ? 'AR' : 'EN'}
        </button>
        {activeSlide < slides.length - 1 && (
           <button onClick={onComplete} className="pointer-events-auto px-5 py-2.5 rounded-full bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 font-bold text-xs shadow-xl active:scale-95 transition-transform drop-shadow-xl backdrop-blur-md">
             {t.skip || "Skip"}
           </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-x-auto flex snap-x snap-mandatory hide-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="min-w-full h-full flex flex-col items-center justify-center snap-start snap-always relative">
             <div className="flex-1 relative w-full h-full pointer-events-none">
                {slide.visual}
             </div>
             
             <div className="w-full h-[42%] bg-white dark:bg-[#1a1a1a] rounded-t-[48px] flex flex-col items-center justify-start pt-10 px-8 text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative overflow-hidden pointer-events-none">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight whitespace-pre-line relative z-10">{slide.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm text-sm relative z-10">{slide.desc}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Fixed bottom controls */}
      <div className="absolute bottom-8 lg:bottom-12 left-0 right-0 px-8 flex justify-between items-center z-20 pointer-events-none">
         <div className="flex gap-2.5 pointer-events-auto">
            {slides.map((_, i) => (
               <button 
                  key={i} 
                  onClick={() => scrollToSlide(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-gray-900 dark:bg-white' : 'w-2.5 bg-gray-900/20 dark:bg-white/30 hover:bg-gray-900/40 dark:hover:bg-white/50'}`} 
                  aria-label={`Go to slide ${i+1}`}
               />
            ))}
         </div>
         
         <div className="pointer-events-auto">
           {activeSlide === slides.length - 1 ? (
             <button 
               onClick={onComplete}
               className="shadow-xl px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-black text-sm active:scale-95 transition-transform flex items-center gap-2 drop-shadow-xl animate-in zoom-in duration-300"
             >
               {t.getStarted || "Get Started"} <ChevronRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
             </button>
           ) : (
             <button 
               onClick={() => scrollToSlide(activeSlide + 1)}
               className="shadow-xl w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center active:scale-95 transition-transform drop-shadow-xl animate-in fade-in zoom-in duration-300"
             >
               <ChevronRight size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
             </button>
           )}
         </div>
      </div>
    </div>
  );
};
