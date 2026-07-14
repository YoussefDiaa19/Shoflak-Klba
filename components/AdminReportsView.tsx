import React from 'react';
import { Pet, Owner, PetReport } from '../types';
import { translations } from '../translations';
import { AlertTriangle, CheckCircle2, Trash2, Calendar, ExternalLink } from 'lucide-react';

interface AdminReportsViewProps {
  reports: PetReport[];
  pets: Pet[];
  owners: Owner[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: Owner;
  limit?: number;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ 
  reports, pets, owners, onResolve, onDelete, onViewPet, onDeletePet, onDeleteUser, currentUser, limit
}) => {
  const lang = currentUser.language || 'en';
  const t = translations[lang];

  const sortedReports = [...reports].sort((a, b) => {
    if (a.isResolved === b.isResolved) return b.timestamp - a.timestamp;
    return a.isResolved ? 1 : -1;
  });
  const displayedReports = limit ? sortedReports.slice(0, limit) : sortedReports;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {sortedReports.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-medium bg-white dark:bg-zinc-900 rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
          <p>{t.noReports}</p>
        </div>
      ) : (
        <>
          {displayedReports.map(report => {
          const pet = pets.find(p => p.id === report.petId);
          const reporter = owners.find(o => o.id === report.reporterId);
          const petOwner = pet ? owners.find(o => o.id === pet.ownerId) : null;
          
          return (
            <div 
              key={report.id} 
              className={`bg-white dark:bg-zinc-900 p-5 rounded-[32px] border ${report.isResolved ? 'border-gray-100 dark:border-zinc-800 opacity-60' : 'border-red-100 dark:border-red-900/20 shadow-sm'} flex flex-col gap-4 transition-all`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-2xl ${report.isResolved ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{report.reason}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(report.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!report.isResolved && (
                    <button 
                      onClick={() => onResolve(report.id)}
                      className="p-3 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-2xl hover:bg-green-100 transition-colors"
                      title={t.markResolved}
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => onDelete(report.id)}
                    className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                    title={t.delete}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {pet && (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => onViewPet(pet)}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <img src={pet.images[0]} className="w-10 h-10 rounded-xl object-cover" alt={pet.name} referrerPolicy="no-referrer" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t.managePets}</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{pet.name}</p>
                      </div>
                      <ExternalLink size={14} className="text-gray-400" />
                    </button>
                    {!report.isResolved && (
                      <button 
                        onClick={() => onDeletePet(pet.id)}
                        className="flex items-center justify-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={12} /> {t.delete} {t.dog}/{t.cat}
                      </button>
                    )}
                  </div>
                )}
                {petOwner && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700">
                      <img src={petOwner.avatar} className="w-10 h-10 rounded-xl object-cover" alt={petOwner.name} referrerPolicy="no-referrer" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t.owner}</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{petOwner.name}</p>
                      </div>
                    </div>
                    {!report.isResolved && (
                      <button 
                        onClick={() => onDeleteUser(petOwner.id)}
                        className="flex items-center justify-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={12} /> {t.delete} {t.owner}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {reporter && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-gray-100 dark:border-zinc-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t.from}:</p>
                  <img src={reporter.avatar} className="w-5 h-5 rounded-md object-cover" alt={reporter.name} referrerPolicy="no-referrer" />
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{reporter.name}</p>
                </div>
              )}
            </div>
          );
        })}
        {limit && limit < sortedReports.length && (
          <div className="py-6 flex items-center justify-center">
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
  );
};
