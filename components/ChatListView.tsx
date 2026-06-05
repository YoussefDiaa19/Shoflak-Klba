
import React, { useState, useRef, useEffect } from 'react';
import { Chat, Pet, Owner } from '../types';
import { translations } from '../translations';
import { Search, CheckCheck, MessageCircle, X, ShieldAlert, Camera } from 'lucide-react';
import { ChatRowSkeleton } from './Skeleton';
import { PawIllustration } from './PawIllustration';

interface ChatListViewProps {
  chats: Chat[];
  pets: Pet[];
  onChatSelect: (id: string) => void;
  currentUser: Owner | null;
  owners: Owner[];
  isLoading?: boolean;
  onLogin: () => void;
}

export const ChatListView: React.FC<ChatListViewProps> = ({ chats, pets, onChatSelect, currentUser, owners, isLoading = false, onLogin }) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleChatsCount, setVisibleChatsCount] = useState(10);
  const observerRef = useRef<HTMLDivElement>(null);

  const myId = (currentUser?.id || '');
  const myBlocks = (currentUser?.blockedUserIds || []);

  const filteredChats = chats.filter(chat => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    const otherId = chat.participants.find(id => String(id) !== myId);
    const otherOwner = owners.find(o => o.id === otherId);
    const pet = pets.find(p => String(p.id) === String(chat.petId));
    
    const ownerName = (otherOwner?.name || t.deletedUser).toLowerCase();
    const petName = (pet?.name || t.deletedPet).toLowerCase();
    
    return (
      petName.includes(query) || 
      ownerName.includes(query)
    );
  });

  const displayedChats = filteredChats.slice(0, visibleChatsCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleChatsCount((prev) => prev + 10);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setVisibleChatsCount(10);
  }, [searchQuery]);

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] animate-in fade-in duration-500 min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t.messages}</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder={t.searchChats}
          className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[#e2a05e]/20 transition-all font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-zinc-700 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="space-y-1 pb-32">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <ChatRowSkeleton key={i} />)
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-6">
            <PawIllustration />
            <p className="font-bold tracking-widest uppercase text-xs opacity-50">{t.noConversations}</p>
          </div>
        ) : (
          <>
            {displayedChats.map(chat => {
              const otherId = chat.participants.find(id => String(id) !== myId);
              const pet = pets.find(p => String(p.id) === String(chat.petId));
              const owner = owners.find(o => o.id === otherId);
              
              const iBlockedThem = currentUser ? myBlocks.includes(otherId || '') : false;
              const theyBlockedMe = currentUser ? (owner?.blockedUserIds?.some(id => id === myId)) : false;
              const isBlocked = iBlockedThem || theyBlockedMe;

              const displayName = owner?.name || t.deletedUser;
              const displayAvatar = owner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId || chat.id}`;
              const petThumb = pet?.images?.[0] || `https://api.dicebear.com/7.x/bottts/svg?seed=${chat.petId}`;

              const unreadCount = chat.messages.filter((m: any) => 
                String(m.senderId) !== myId && 
                !m.readBy.some((rid: string) => rid === myId)
              ).length;

              return (
                <div 
                  key={chat.id} 
                  onClick={() => onChatSelect(chat.id)} 
                  className={`flex flex-row items-center p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[28px] transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-zinc-700 ${isBlocked ? 'opacity-70' : ''}`}
                >
                  <div className="relative shrink-0 flex-shrink-0 w-[4rem] min-w-[4rem] mr-4 block">
                    <div className="w-16 h-16 rounded-[24px] overflow-hidden shadow-md ring-2 ring-white dark:ring-zinc-800 bg-gray-100 dark:bg-zinc-800">
                      <img src={displayAvatar} loading="lazy" decoding="async" className={`w-full h-full object-cover ${isBlocked ? 'grayscale' : ''}`} alt={displayName} referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl border-2 border-white dark:border-zinc-900 overflow-hidden shadow-lg bg-gray-200">
                      <img src={petThumb} loading="lazy" decoding="async" className={`w-full h-full object-cover ${isBlocked ? 'grayscale' : ''}`} referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className={`font-black text-black dark:text-white truncate ${unreadCount > 0 && !isBlocked ? 'text-[#e2a05e]' : ''}`}>{displayName}</h3>
                        {isBlocked && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-[8px] font-black uppercase rounded-md shrink-0">
                            <ShieldAlert size={8} /> {iBlockedThem ? t.blockedBadge : t.youHaveBeenBlocked}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className={`flex items-center gap-1.5 text-sm truncate ${unreadCount > 0 && !isBlocked ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {chat.messages.length > 0 && chat.messages[chat.messages.length - 1].type === 'image' && (
                          <Camera size={14} className="shrink-0" />
                        )}
                        <span className="truncate">{chat.lastMessage || 'Start a conversation'}</span>
                      </div>
                      <div className="flex items-center ml-2">
                        {unreadCount > 0 && !isBlocked ? (
                          <div className="bg-[#e2a05e] text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-[#e2a05e]/20 animate-in zoom-in duration-500">
                            {unreadCount}
                          </div>
                        ) : (
                          chat.messages.length > 0 && chat.messages[chat.messages.length-1].senderId === myId && <CheckCheck size={16} className={`${isBlocked ? 'text-gray-400' : 'text-[#e2a05e]'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={observerRef} className="h-4" />
          </>
        )}
      </div>
    </div>
  );
};
