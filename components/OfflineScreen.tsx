import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { translations } from '../translations';

interface OfflineScreenProps {
  onRetry: () => void;
  language: 'en' | 'ar';
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry, language }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-black z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
        <WifiOff size={48} />
      </div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
        {t.noInternet}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        {t.noInternetDesc}
      </p>
      
      <button 
        onClick={onRetry}
        className="flex items-center justify-center gap-2 w-full max-w-xs bg-[#e2a05e] hover:bg-[#d1904d] text-white py-4 rounded-full font-bold active:scale-95 transition-all shadow-sm"
      >
        <RefreshCw size={20} />
        {t.retryContent}
      </button>
    </div>
  );
};
