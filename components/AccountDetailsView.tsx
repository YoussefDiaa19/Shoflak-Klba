
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Owner } from '../types';
import { CITIES_DATA } from '../data';
import { translations } from '../translations';
import { compressImage, compressImageToFile } from '../imageUtils';
import { uploadToR2 } from '../r2Utils';
import { ArrowLeft, Save, Camera, MapPin, User, Phone, Globe, Edit3, Trash2, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { FormSkeleton } from './Skeleton';

interface AccountDetailsViewProps {
  owner: Owner;
  onUpdateOwner: (o: Owner) => void;
  onDeleteAccount: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

export const AccountDetailsView: React.FC<AccountDetailsViewProps> = ({ owner, onUpdateOwner, onDeleteAccount, onBack, isLoading = false }) => {
  const lang = owner.language || 'en';
  const t = translations[lang];
  const [editForm, setEditForm] = useState(owner);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableAreas = useMemo(() => {
    const city = CITIES_DATA.find(c => c.en === editForm.city);
    return city ? city.areas : [];
  }, [editForm.city]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedFile = await compressImageToFile(file);
        const publicUrl = await uploadToR2(compressedFile);
        setEditForm({ ...editForm, avatar: publicUrl });
      } catch (err: any) {
        console.error("Avatar upload failed:", err);
        alert(err.message || "Failed to upload avatar to Cloudflare R2.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setEditForm({ 
      ...editForm, 
      avatar: '' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsSaving(true);
    const finalOwner = {
      ...editForm
    };
    
    try {
      await onUpdateOwner(finalOwner);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onBack();
      }, 1500);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } catch (err) {
      console.error("Delete account error:", err);
      setError('Failed to delete account');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
        <div className="p-5 flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white shadow-md border border-gray-200 dark:border-zinc-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.accountDetails}</h1>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] animate-in slide-in-from-right-4 duration-500">
      <div className="p-5 flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-20">
        <button onClick={onBack} className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white shadow-md border border-gray-200 dark:border-zinc-700 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.accountDetails}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-8 space-y-8 pb-32">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer inline-block" onClick={() => !isCompressing && fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-[40px] border-[3px] border-white dark:border-zinc-800 shadow-xl overflow-hidden relative bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
              {editForm.avatar ? (
                <img 
                  src={editForm.avatar} 
                  className={`w-full h-full object-cover transition-opacity ${isCompressing ? 'opacity-30' : 'opacity-100 group-hover:opacity-90'}`} 
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={64} className="text-gray-300 dark:text-zinc-600" />
              )}
              {isCompressing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 size={32} className="text-[#e2a05e] animate-spin" />
                </div>
              )}
            </div>
            
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-11 h-11 bg-[#e2a05e] dark:bg-[#c08246] rounded-full border-[3.5px] border-white dark:border-[#1a1a1a] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 z-10">
              <Camera size={18} className="text-white fill-white/20" />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>
          <button 
            type="button" 
            onClick={handleRemoveAvatar}
            className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-50 dark:bg-red-900/10 rounded-full"
          >
            <Trash2 size={12} /> {t.remove}
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> {t.fullName}
            </label>
            <input 
              required
              className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white font-medium outline-none border border-gray-100 dark:border-zinc-700" 
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} /> {t.city}
              </label>
              <select 
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white font-bold outline-none border border-gray-100 dark:border-zinc-700 appearance-none" 
                value={editForm.city} 
                onChange={e => {
                  const city = CITIES_DATA.find(c => c.en === e.target.value);
                  setEditForm({...editForm, city: e.target.value, area: city ? city.areas[0].en : ''});
                }}
              >
                {CITIES_DATA.map(c => <option key={c.en} value={c.en}>{lang === 'ar' ? c.ar : c.en}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> {t.area}
              </label>
              <select 
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-gray-900 dark:text-white font-bold outline-none border border-gray-100 dark:border-zinc-700 appearance-none" 
                value={editForm.area} 
                onChange={e => setEditForm({...editForm, area: e.target.value})}
              >
                {availableAreas.map(a => <option key={a.en} value={a.en}>{lang === 'ar' ? a.ar : a.en}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            type="submit" 
            disabled={isSaving || isCompressing || showSuccess}
            className={`w-full py-5 rounded-[24px] font-bold text-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all ${
              showSuccess ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-[#e2a05e] text-white shadow-[#e2a05e]/30'
            }`}
          >
            {isSaving ? (
              <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : showSuccess ? (
              <><CheckCircle2 size={24} /> {t.savedSuccessfully}</>
            ) : (
              <><Save size={24} /> {t.saveChanges}</>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-4 rounded-[24px] font-bold text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <Trash2 size={20} /> {t.deleteAccount}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t.deleteAccount}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {t.deleteAccountWarning}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 size={20} className="animate-spin" />}
                {isDeleting ? t.deleting : t.delete}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full py-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold active:scale-95 transition-all"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.savedSuccessfully}</h2>
          </div>
        </div>
      )}
    </div>
  );
};
