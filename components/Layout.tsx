
import React, { useRef, useEffect } from 'react';
import { View, Owner } from '../types';
import { Home, MessageCircle, Heart, User, LayoutDashboard, Mail } from 'lucide-react';
import { translations } from '../translations';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  unreadCount?: number;
  currentUser?: Owner | null;
  onScroll?: (top: number) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, unreadCount = 0, currentUser, onScroll }) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !onScroll) return;

    let ticking = false;

    const handleScrollEvent = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll(main.scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    main.addEventListener('scroll', handleScrollEvent, { passive: true });
    return () => main.removeEventListener('scroll', handleScrollEvent);
  }, [onScroll]);

  const hideNav = [
    'detail', 
    'chat-room', 
    'auth', 
    'account-details',
    'contact-us',
    'blocked-users',
    'owner-profile'
  ].includes(currentView);

  const navItems = currentUser?.isAdmin 
    ? [
        { id: 'admin-dashboard', icon: LayoutDashboard, label: t.home },
        { id: 'admin-inquiries', icon: Mail, label: t.inquiries, badgeCount: 0 },
        { id: 'profile', icon: User, label: t.settings },
      ]
    : [
        { id: 'home', icon: Home, label: t.home },
        { id: 'chats', icon: MessageCircle, label: t.chats, badgeCount: currentUser ? unreadCount : 0 },
        { id: 'favorites', icon: Heart, label: t.favsShort },
        { id: 'profile', icon: User, label: t.profile },
      ];

  const handleTabClick = async (id: View) => {
    await Haptics.impact({ style: ImpactStyle.Light });
    onViewChange(id);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a]">
      <main id="app-main" ref={mainRef} className="flex-grow overflow-y-auto hide-scrollbar">
        {children}
      </main>

      {!hideNav && (
        <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[85%] max-w-[340px] bg-zinc-900 dark:bg-white rounded-full p-2 flex justify-between items-center space-x-1 rtl:space-x-reverse shadow-2xl z-50 border border-white/10 dark:border-black/5 transition-all duration-500">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'admin-dashboard' && currentView === 'home' && currentUser?.isAdmin);
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as View)}
                className={`flex-1 flex items-center justify-center py-3.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white scale-105 shadow-xl font-bold' 
                    : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-900'
                }`}
              >
                <div className="relative">
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    fill={isActive && item.id !== 'admin-inquiries' ? 'currentColor' : 'none'} 
                  />
                  
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1 border-2 border-zinc-900 dark:border-white animate-in zoom-in duration-300 shadow-sm">
                      <span className="text-[9px] font-black text-white leading-none">
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
