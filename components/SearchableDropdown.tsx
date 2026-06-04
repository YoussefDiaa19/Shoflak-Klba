import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  en: string;
  ar: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  lang: 'en' | 'ar';
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    option.ar.includes(searchTerm)
  );

  const selectedOption = options.find(o => o.en === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-black dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700 cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption ? (lang === 'ar' ? selectedOption.ar : selectedOption.en) : placeholder}</span>
        <ChevronDown size={20} />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                className="w-full bg-transparent outline-none text-sm p-1 text-black dark:text-white"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div 
                key={option.en}
                className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer text-black dark:text-white"
                onClick={() => {
                  onChange(option.en);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {lang === 'ar' ? option.ar : option.en}
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500 text-sm">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};
