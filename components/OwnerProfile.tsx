
import React, { useEffect } from 'react';
import { Pet, Owner } from '../types';
import { CITIES_DATA, DOG_BREEDS, CAT_BREEDS, BIRD_BREEDS } from '../data';
import { translations } from '../translations';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface OwnerProfileProps {
  ownerId: string;
  pets: Pet[];
  onBack: () => void;
  onPetClick: (p: Pet) => void;
  owners: Owner[];
  currentUser: Owner | null;
  isLoading?: boolean;
}

export const OwnerProfile: React.FC<OwnerProfileProps> = ({ ownerId, pets, onBack, onPetClick, owners, currentUser, isLoading = false }) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const owner = owners.find(o => o.id === ownerId);
  const ownerPets = pets.filter(p => p.ownerId === ownerId);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [ownerId]);

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

  if (!owner && !isLoading) return null;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Fixed Sticky Header */}
      <div className="px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] flex items-center gap-4 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-10 border-b dark:border-zinc-800 shrink-0">
        <button onClick={onBack} className={`p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white shadow-md border border-gray-200 dark:border-zinc-700 transition-colors ${lang === 'ar' ? 'rotate-180' : ''}`}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.ownerProfile}</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="flex flex-col items-center space-y-4 py-8">
          {isLoading ? (
            <Skeleton className="w-32 h-32 rounded-[48px]" />
          ) : (
            <img src={owner?.avatar} className="w-32 h-32 rounded-[48px] border-4 border-[#fdf2e9] dark:border-zinc-800 shadow-xl object-cover" alt={owner?.name} referrerPolicy="no-referrer" />
          )}
          <div className="text-center w-full space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-1/3 mx-auto" />
                <Skeleton className="h-4 w-1/4 mx-auto" />
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{owner?.name}</h2>
                <div className="flex items-center justify-center gap-1.5 text-gray-400 mt-2">
                  <MapPin size={16} />
                  <span className="font-medium">{owner && formatLocation(owner.area, owner.city)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-5 space-y-6">
          <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-[32px] p-6 flex items-center justify-center border border-gray-100 dark:border-zinc-800">
            <div className="text-center w-full">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-8 w-10" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{ownerPets.length}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.totalPets}</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 pb-20">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.listedPets}</h3>
            <div className="grid grid-cols-2 gap-4 pb-12">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-[28px]" />
                ))
              ) : (
                ownerPets.map(pet => (
                  <div 
                    key={pet.id} 
                    onClick={() => onPetClick(pet)}
                    className="relative rounded-[28px] overflow-hidden shadow-md group border border-gray-100 dark:border-zinc-800 active:scale-95 transition-transform"
                  >
                    <img src={pet.images[0]} className="w-full aspect-[4/5] object-cover" alt={pet.name} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <p className="text-white font-bold">{pet.name}, {pet.age}</p>
                      <p className="text-white/70 text-[10px] font-bold uppercase">
                        {lang === 'ar' 
                          ? ([...DOG_BREEDS, ...CAT_BREEDS, ...BIRD_BREEDS].find(b => b.en === pet.breed)?.ar || pet.breed)
                          : pet.breed
                        }
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
