
import React, { useState } from 'react';
import { SupportMessage, Owner } from '../types';
import { translations } from '../translations';
import { Mail, Clock, User, Trash2, CheckCircle, ArrowLeft, X } from 'lucide-react';

interface AdminInquiriesViewProps {
  inquiries: SupportMessage[];
  owners: Owner[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  currentUser: Owner;
  limit?: number;
}

export const AdminInquiriesView: React.FC<AdminInquiriesViewProps> = ({ 
  inquiries, owners, onMarkRead, onDelete, currentUser, limit
}) => {
  const lang = currentUser.language || 'en';
  const t = translations[lang];
  const [selectedInquiry, setSelectedInquiry] = useState<SupportMessage | null>(null);

  const sortedInquiries = [...inquiries].sort((a, b) => b.timestamp - a.timestamp);
  const displayedInquiries = limit ? sortedInquiries.slice(0, limit) : sortedInquiries;

  const handleOpenInquiry = (inq: SupportMessage) => {
    setSelectedInquiry(inq);
    if (!inq.isRead) {
      onMarkRead(inq.id);
    }
  };

  return (
    <div className="px-5 pt-6 animate-in fade-in duration-500 min-h-screen bg-white dark:bg-[#1a1a1a] pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t.inquiries}</h1>
        <div className="bg-[#e2a05e]/10 text-[#e2a05e] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
          {inquiries.filter(i => !i.isRead).length} {lang === 'en' ? 'New' : 'جديد'}
        </div>
      </div>

      <div className="space-y-4">
        {sortedInquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Mail size={64} className="mb-4 opacity-10" />
            <p className="font-bold">{t.noInquiries}</p>
          </div>
        ) : (
          <>
            {displayedInquiries.map(inquiry => {
              const sender = owners.find(o => o.id === inquiry.ownerId);
              return (
                <div 
                  key={inquiry.id} 
                  onClick={() => handleOpenInquiry(inquiry)}
                  className={`p-6 rounded-[32px] border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                    inquiry.isRead 
                      ? 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 opacity-60' 
                      : 'bg-[#fdf2e9] dark:bg-[#e2a05e]/5 border-[#e2a05e]/20 shadow-lg shadow-[#e2a05e]/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img src={sender?.avatar || undefined} className="w-10 h-10 rounded-full object-cover shadow-sm" alt={sender?.name} referrerPolicy="no-referrer" />
                      <div>
                        <p className="text-[10px] text-[#e2a05e] font-black uppercase tracking-widest">{t.from} {sender?.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{new Date(inquiry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => onDelete(inquiry.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-base font-bold text-gray-900 dark:text-white leading-tight ${!inquiry.isRead ? 'font-black' : ''}`}>{inquiry.subject}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 italic">{inquiry.message}</p>
                  </div>
                </div>
              );
            })}
            
            {limit && limit < sortedInquiries.length && (
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

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in fade-in duration-300 flex flex-col max-h-[85vh]">
            <div className="p-6 bg-gray-50 dark:bg-zinc-800 flex items-center justify-between border-b dark:border-zinc-700">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-[#e2a05e] text-white rounded-xl shadow-lg">
                    <Mail size={20} />
                 </div>
                 <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">{t.inquiries}</h2>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700">
                <img src={owners.find(o => o.id === selectedInquiry.ownerId)?.avatar || undefined} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{owners.find(o => o.id === selectedInquiry.ownerId)?.name}</h4>
                  <p className="text-xs text-gray-400 font-bold">{new Date(selectedInquiry.timestamp).toLocaleString()}</p>
                  <p className="text-[10px] text-[#e2a05e] font-bold uppercase tracking-widest mt-1">ID: {selectedInquiry.ownerId}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedInquiry.subject}</h3>
                <div className="h-1 w-12 bg-[#e2a05e] rounded-full" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              <div className="pt-8 border-t dark:border-zinc-800 flex justify-between items-center">
                 <button 
                  onClick={() => { onDelete(selectedInquiry.id); setSelectedInquiry(null); }}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 font-bold rounded-2xl active:scale-95 transition-all"
                 >
                   <Trash2 size={18} /> {t.delete}
                 </button>
                 <button 
                  onClick={() => setSelectedInquiry(null)}
                  className="px-8 py-3 bg-[#e2a05e] text-white font-bold rounded-2xl shadow-xl shadow-[#e2a05e]/20 active:scale-95 transition-all"
                 >
                   Done
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
