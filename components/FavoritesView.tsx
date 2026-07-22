
import React, { useEffect, useRef } from 'react';
import { Pet, Owner } from '../types';
import { translateBreed } from '../data';
import { translations } from '../translations';
import { Heart, Search, X, LogIn } from 'lucide-react';
import { PetCardSkeleton } from './Skeleton';

import { PawIllustration } from './PawIllustration';

interface FavoritesViewProps {
  pets: Pet[];
  onPetClick: (pet: Pet) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  currentUser: Owner | null;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLogin: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ 
  pets, onPetClick, onToggleFavorite, favorites, currentUser, isLoading = false,
  onLoadMore, hasMore = false, isFetchingMore = false, searchQuery, onSearchChange, onLogin,
  error, onRetry
}) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading || isFetchingMore || !hasMore || !onLoadMore || !currentUser) return;

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
  }, [isLoading, isFetchingMore, hasMore, onLoadMore, pets.length, currentUser]);

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top,4.5rem),4.5rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-[#1a1a1a] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.favorites}</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder={t.searchFavorites}
          className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white outline-none"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-zinc-700 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pb-32">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <PetCardSkeleton key={i} mode="grid" />
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
        ) : pets.length === 0 && !isFetchingMore ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-6">
            <PawIllustration />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.emptyList}</h2>
              <p className="text-gray-400 max-w-[200px] mx-auto">{t.favsEmptyDesc}</p>
            </div>
          </div>
        ) : (
          <>
            {pets.map(pet => (
              <div 
                key={pet.id} 
                className="relative rounded-[28px] overflow-hidden shadow-md group border border-gray-100 dark:border-zinc-800 cursor-pointer active:scale-95 transition-transform"
                onClick={() => onPetClick(pet)}
              >
                <div className="relative pb-[100%]">
                  <div className="absolute inset-0">
                    <img src={pet.images[0] || undefined} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={pet.name} referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(pet.id); }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-white/20 backdrop-blur-md text-red-500 border border-white/30 active:scale-125 transition-transform"
                >
                  <Heart size={16} fill="#ef4444" />
                </button>
                <div className="absolute bottom-3 left-4 pointer-events-none">
                  <p className="text-white font-bold">{pet.name}</p>
                  <p className="text-white/70 text-[10px] font-bold uppercase">{translateBreed(pet.breed, lang)}</p>
                </div>
              </div>
            ))}
            
            {(hasMore || isFetchingMore) && (
              <div 
                ref={loadMoreRef} 
                className={`col-span-full py-6 flex items-center justify-center`}
              >
                 <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce" />
                   <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce [animation-delay:-0.3s]" />
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
