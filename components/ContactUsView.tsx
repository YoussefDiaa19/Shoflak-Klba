
import React, { useState } from 'react';
import { ArrowLeft, Send, MessageSquareText, ShieldCheck } from 'lucide-react';
import { Owner, SupportMessage } from '../types';
import { translations } from '../translations';
import { FormSkeleton } from './Skeleton';

interface ContactUsViewProps {
  onBack: () => void;
  currentUser: Owner;
  onSendInquiry: (msg: SupportMessage) => void;
  isLoading?: boolean;
}

export const ContactUsView: React.FC<ContactUsViewProps> = ({ onBack, currentUser, onSendInquiry, isLoading = false }) => {
  const lang = currentUser.language || 'en';
  const t = translations[lang];

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    setTimeout(() => {
      const newInquiry: SupportMessage = {
        id: `inq_${Date.now()}`,
        ownerId: currentUser.id,
        subject,
        message,
        timestamp: Date.now(),
        isRead: false
      };
      
      onSendInquiry(newInquiry);
      setIsSending(false);
      setIsSent(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setIsSent(false), 3000);
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
        <div className="p-5 flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white shadow-sm transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.contactUs}</h1>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] animate-in duration-500 flex flex-col">
      <div className="p-5 flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-10 border-b dark:border-zinc-800">
        <button onClick={onBack} className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white shadow-sm transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.contactUs}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-[#fdf2e9] dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-[#e2a05e]">
            <MessageSquareText size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.helpTitle}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.helpDesc}</p>
          </div>
        </div>

        {isSent ? (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-8 rounded-[32px] flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-green-800 dark:text-green-400">{t.msgSent}</h3>
            <p className="text-green-700 dark:text-green-500 text-sm">{t.msgSentDesc}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.subject}</label>
              <input 
                required
                placeholder={t.subjectPlaceholder}
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{t.message}</label>
              <textarea 
                required
                placeholder={t.messagePlaceholder}
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl h-48 text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700 resize-none" 
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className={`w-full py-5 rounded-[24px] font-bold text-xl flex items-center justify-center gap-3 shadow-xl shadow-[#e2a05e]/30 active:scale-95 transition-all ${isSending ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed' : 'bg-[#e2a05e] text-white shadow-[#e2a05e]/30'}`}
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                   <span>{t.sending}</span>
                </div>
              ) : (
                <>
                  <Send size={20} fill="white" /> {t.send}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="p-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
        © 2026 {t.appName}
      </div>
    </div>
  );
};
