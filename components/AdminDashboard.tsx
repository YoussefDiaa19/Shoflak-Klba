import React, { useState, useMemo, useEffect } from 'react';
import { Pet, Owner, SupportMessage, PetReport, MessageReport } from '../types';
import { translations } from '../translations';
import { Check, X, ShieldAlert, LogOut, Users, Package, Clock, MapPin, Trash2, PieChart, RefreshCw, AlertTriangle, ChevronRight, Mail, Flag, MessageSquare, Megaphone, Bell } from 'lucide-react';

import { AdminInquiriesView } from './AdminInquiriesView';
import { AdminReportsView } from './AdminReportsView';
import { AdminMessageReportsView } from './AdminMessageReportsView';
import { supabase } from '../supabase';

const BroadcastForm: React.FC<{ currentUser: Owner }> = ({ currentUser }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{success?: boolean, message?: string} | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    
    setSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-broadcast', {
        body: { title, body }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send broadcast');
      }

      // Check if our edge function returned a soft JSON error
      if (data && data.error) {
        throw new Error(`Edge Function Error: ${data.error}`);
      }

      setResult({ success: true, message: data?.message || `Successfully sent to ${data?.sent || 0} devices!` });
      setTitle('');
      setBody('');
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'An error occurred' });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-4">
      {result && (
        <div className={`p-4 rounded-2xl text-sm font-bold ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Notification Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g. Server Maintenance"
          className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Notification Body</label>
        <textarea 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          placeholder="e.g. We will be down for 30 minutes tonight."
          className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white min-h-[100px]"
          required
        />
      </div>
      <button 
        type="submit" 
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full bg-[#e2a05e] text-white font-bold rounded-2xl py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {sending ? <RefreshCw className="animate-spin" size={20} /> : <Megaphone size={20} />}
        {sending ? 'Sending...' : 'Send Broadcast'}
      </button>
    </form>
  );
};

interface AdminDashboardProps {
  pets: Pet[];
  owners: Owner[];
  inquiries: SupportMessage[];
  reports: PetReport[];
  messageReports: MessageReport[];
  onApprove: (petId: string) => void;
  onReject: (petId: string) => void;
  onDeletePet: (petId: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onMarkInquiryRead: (id: string) => void;
  onDeleteInquiry: (id: string) => void;
  onResolveReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onResolveMessageReport: (id: string) => void;
  onDeleteMessageReport: (id: string) => void;
  onLogout: () => void;
  onViewPet: (pet: Pet) => void;
  onViewUser: (userId: string) => void;
  currentUser: Owner;
  activeTab: 'overview' | 'pending' | 'pets' | 'users' | 'inquiries' | 'reports' | 'message-reports' | 'broadcast';
  setActiveTab: (tab: 'overview' | 'pending' | 'pets' | 'users' | 'inquiries' | 'reports' | 'message-reports' | 'broadcast') => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  pets, owners, inquiries, reports, messageReports, onApprove, onReject, onDeletePet, onDeleteUser, onMarkInquiryRead, onDeleteInquiry, onResolveReport, onDeleteReport, onResolveMessageReport, onDeleteMessageReport, onLogout, onViewPet, onViewUser, currentUser, activeTab, setActiveTab, onRefreshData 
}) => {
  const lang = currentUser.language || 'en';
  const t = translations[lang];
  
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pet' | 'user', id: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Directly filter based on trusted sanitized data from App.tsx
  const activePets = useMemo(() => pets.filter(p => p.status !== 'deleted'), [pets]);
  const pendingPets = useMemo(() => activePets.filter(p => p.status === 'pending'), [activePets]);
  const approvedPets = useMemo(() => activePets.filter(p => p.status === 'approved'), [activePets]);
  const rejectedPets = useMemo(() => activePets.filter(p => p.status === 'rejected'), [activePets]);
  
  const handleRefresh = async () => {
    console.log("[ADMIN] Manually refreshing global data...");
    setIsRefreshing(true);
    if (onRefreshData) await onRefreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    const { type, id } = deleteTarget;
    console.log(`[ADMIN-UI] DELETION CONFIRMED. Type: ${type}, ID: ${id}`);
    setIsDeleting(true);

    try {
      if (type === 'pet') {
        await onDeletePet(id);
      } else {
        await onDeleteUser(id);
      }
      console.log(`[ADMIN-UI] ${type} deletion completed.`);
    } catch (err) {
      console.error("[ADMIN-UI] Error during deletion:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex flex-col animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="bg-[#e2a05e] p-2 rounded-xl text-white shadow-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{t.adminDashboard}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.overview}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className={`p-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-2xl active:scale-95 transition-all border border-gray-200 dark:border-zinc-700 ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={20} />
          </button>
          <button onClick={onLogout} className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl active:scale-95 transition-transform border border-red-100 dark:border-red-900/20">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 pt-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: t.overview, icon: PieChart },
          { id: 'pending', label: t.pendingApproval, icon: Clock, count: pendingPets.length },
          { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
          { id: 'pets', label: t.managePets, icon: Package, count: activePets.length },
          { id: 'users', label: t.manageUsers, icon: Users, count: owners.filter(o => !o.isAdmin).length },
          { id: 'inquiries', label: t.inquiries, icon: Mail, count: inquiries.filter(i => !i.isRead).length },
          { id: 'reports', label: t.reports, icon: Flag, count: reports.filter(r => !r.isResolved).length },
          { id: 'message-reports', label: 'Message Reports', icon: MessageSquare, count: messageReports.filter(r => !r.isResolved).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-[#e2a05e] text-white shadow-lg' 
                : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-zinc-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-[#e2a05e]' : 'bg-red-500 text-white'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('users')}>
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Users size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.totalUsers}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{owners.filter(o => !o.isAdmin).length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('pets')}>
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Package size={20} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.managePets}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activePets.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm">
               <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><PieChart size={18} className="text-[#e2a05e]" /> {t.statsByCategory}</h3>
               <div className="grid grid-cols-3 gap-2 text-center mb-6">
                 <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-yellow-600 uppercase">{t.statusPending}</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{pendingPets.length}</p>
                 </div>
                 <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-green-600 uppercase">{t.statusApproved}</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{approvedPets.length}</p>
                 </div>
                 <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-red-600 uppercase">{t.statusRejected}</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{rejectedPets.length}</p>
                 </div>
               </div>
               <div className="space-y-3">
                 {['Dog', 'Cat', 'Bird'].map(type => {
                   const count = activePets.filter(p => p.type === type).length;
                   const percentage = activePets.length > 0 ? (count / activePets.length) * 100 : 0;
                   return (
                     <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase">
                          <span className="text-gray-500">{type}s</span>
                          <span className="text-gray-900 dark:text-white">{count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#e2a05e] rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Megaphone size={24} className="text-[#e2a05e]" /> Global Broadcast</h2>
            <p className="text-sm text-gray-500 mb-6">Send a push notification to all users who have enabled notifications on their devices.</p>
            
            <BroadcastForm currentUser={currentUser} />
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingPets.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-medium bg-white dark:bg-zinc-900 rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800">
                <Clock size={48} className="mx-auto mb-4 opacity-20" />
                <p>{t.noPendingPets}</p>
              </div>
            ) : (
              pendingPets.map(pet => (
                <div key={pet.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer w-full" onClick={() => onViewPet(pet)}>
                    {pet.images && pet.images.length > 0 ? (
                      <img src={pet.images[0]} className="w-16 h-16 rounded-2xl object-cover shadow-sm shrink-0" alt={pet.name} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{pet.name}, {pet.age}</h3>
                      <p className="text-xs text-gray-500 truncate">{pet.breed} • {pet.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end mt-2 sm:mt-0">
                    <button onClick={() => onApprove(pet.id)} className="flex-1 sm:flex-none flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-2xl hover:bg-green-100 transition-colors shadow-sm">
                      <Check size={20} />
                    </button>
                    <button onClick={() => onReject(pet.id)} className="flex-1 sm:flex-none flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-100 transition-colors shadow-sm">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="space-y-4">
            {activePets.map(pet => (
              <div key={pet.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewPet(pet)}>
                  {pet.images && pet.images.length > 0 ? (
                    <img src={pet.images[0]} className="w-12 h-12 rounded-xl object-cover" alt={pet.name} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Package size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{pet.name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{pet.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onViewPet(pet); }} className="p-2 text-gray-400 hover:text-[#e2a05e] transition-colors"><ChevronRight size={18} /></button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    console.log("[ADMIN-UI] Prompting delete for pet:", pet.id);
                    setDeleteTarget({ type: 'pet', id: pet.id });
                  }} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {owners.filter(o => !o.isAdmin).length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-medium">
                 {t.noUsersFound}
               </div>
            ) : (
              owners.filter(o => !o.isAdmin).map(owner => (
                <div key={owner.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewUser(owner.id)}>
                    <img src={owner.avatar} className="w-12 h-12 rounded-xl object-cover" alt={owner.name} referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{owner.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onViewUser(owner.id); }} className="p-2 text-gray-400 hover:text-[#e2a05e] transition-colors"><ChevronRight size={18} /></button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      console.log("[ADMIN-UI] Prompting delete for user:", owner.id);
                      setDeleteTarget({ type: 'user', id: owner.id });
                    }} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <AdminInquiriesView 
            inquiries={inquiries}
            owners={owners}
            onMarkRead={onMarkInquiryRead}
            onDelete={onDeleteInquiry}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'reports' && (
          <AdminReportsView 
            reports={reports}
            pets={pets}
            owners={owners}
            onResolve={onResolveReport}
            onDelete={onDeleteReport}
            onViewPet={onViewPet}
            onDeletePet={(id) => setDeleteTarget({ type: 'pet', id })}
            onDeleteUser={(id) => setDeleteTarget({ type: 'user', id })}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'message-reports' && (
          <AdminMessageReportsView
            reports={messageReports}
            owners={owners}
            onResolve={onResolveMessageReport}
            onDeleteReport={onDeleteMessageReport}
            onDeleteUser={(id) => setDeleteTarget({ type: 'user', id })}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] p-8 space-y-6 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t.confirmDelete}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {deleteTarget.type === 'pet' ? t.deletePetWarning : t.deleteUserWarning}
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)} 
                className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button 
                disabled={isDeleting}
                onClick={confirmDelete} 
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Trash2 size={20} />}
                {isDeleting ? "Deleting..." : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};