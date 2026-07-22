
import React, { useMemo } from 'react';
import { Owner } from '../types';
import { translations } from '../translations';
import { ArrowLeft, ShieldAlert, Unlock } from 'lucide-react';
import { BlockedRowSkeleton } from './Skeleton';
import { PawIllustration } from './PawIllustration';

interface BlockedUsersViewProps {
  blockedIds: string[];
  owners: Owner[];
  onUnblock: (id: string) => void;
  onBack: () => void;
  currentUser: Owner | null;
  isLoading?: boolean;
}

export const BlockedUsersView: React.FC<BlockedUsersViewProps> = ({ blockedIds, owners, onUnblock, onBack, currentUser, isLoading = false }) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];

  // Filter and deduplicate blocked owners
  const blockedOwners = useMemo(() => {
    const uniqueOwners = new Map<string, Owner>();
    owners.forEach(o => {
      if (blockedIds.includes(o.id)) {
        uniqueOwners.set(o.id, o);
      }
    });
    return Array.from(uniqueOwners.values());
  }, [blockedIds, owners]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] animate-in duration-500">
      <div className="px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] flex items-center gap-4 border-b dark:border-zinc-800">
        <button onClick={onBack} className={`p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white shadow-sm transition-colors`}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.blockedAccounts}</h1>
      </div>

      <div className="p-5 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <BlockedRowSkeleton key={i} />)
        ) : blockedOwners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-6">
            <PawIllustration />
            <p className="font-bold tracking-widest uppercase text-xs opacity-50">{t.noBlockedUsers}</p>
          </div>
        ) : (
          blockedOwners.map(owner => (
            <div key={owner.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <img src={owner.avatar || undefined} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={owner.name} referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{owner.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => onUnblock(owner.id)}
                className="flex items-center gap-2 px-4 py-2 bg-[#e2a05e] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform"
              >
                <Unlock size={14} /> {t.unblock}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
