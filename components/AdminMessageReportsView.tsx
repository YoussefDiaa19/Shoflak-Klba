import React, { useState, useEffect } from 'react';
import { MessageReport, Owner, Message } from '../types';
import { translations } from '../translations';
import { Check, Trash2, ShieldAlert, UserX, MessageSquare, Loader2, X } from 'lucide-react';
import { supabase } from '../supabase';

interface AdminMessageReportsViewProps {
  reports: MessageReport[];
  owners: Owner[];
  onResolve: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: Owner;
  limit?: number;
}

export const AdminMessageReportsView: React.FC<AdminMessageReportsViewProps> = ({
  reports, owners, onResolve, onDeleteReport, onDeleteUser, currentUser, limit
}) => {
  const lang = currentUser.language || 'en';
  const t = translations[lang];
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [selectedReportForModal, setSelectedReportForModal] = useState<MessageReport | null>(null);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const displayedReports = limit ? reports.slice(0, limit) : reports;

  useEffect(() => {
    reports.forEach(report => {
      if (report.messageIds.length > 0 && !messages[report.id] && !loadingMessages[report.id]) {
        fetchMessages(report);
      }
    });
  }, [reports]);

  const fetchMessages = async (report: MessageReport) => {
    setLoadingMessages(prev => ({ ...prev, [report.id]: true }));
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('id', report.messageIds);
      
      if (error) throw error;
      
      if (data) {
        setMessages(prev => ({
          ...prev,
          [report.id]: data.map(m => {
            const rawImageUrls = m.image_urls || m.image_url;
            let imageUrls: string[] = [];
            if (Array.isArray(rawImageUrls)) {
              imageUrls = rawImageUrls;
            } else if (typeof rawImageUrls === 'string' && rawImageUrls.length > 0) {
              if (rawImageUrls.startsWith('[') && rawImageUrls.endsWith(']')) {
                try { imageUrls = JSON.parse(rawImageUrls); } catch (e) { imageUrls = [rawImageUrls]; }
              } else if (rawImageUrls.includes(',')) {
                imageUrls = rawImageUrls.split(',').map((u: string) => u.trim());
              } else {
                imageUrls = [rawImageUrls];
              }
            }
            return {
              id: m.id,
              senderId: m.sender_id,
              text: m.text,
              imageUrls,
              type: m.type || (imageUrls.length > 0 ? 'image' : 'text'),
              timestamp: new Date(m.created_at).getTime(),
              readBy: m.read_by || []
            };
          })
        }));
      }
    } catch (err) {
      console.error('Error fetching reported messages:', err);
    } finally {
      setLoadingMessages(prev => ({ ...prev, [report.id]: false }));
    }
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-50">
        <ShieldAlert size={64} className="mb-4" />
        <p className="font-bold tracking-widest uppercase">No Message Reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedReports.map(report => {
        const reporter = owners.find(o => o.id === report.reporterId);
        const reportedUser = owners.find(o => o.id === report.reportedUserId);
        const reportMessages = messages[report.id] || [];
        const isLoading = loadingMessages[report.id];

        return (
          <div key={report.id} className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border ${report.isResolved ? 'border-green-100 dark:border-green-900/30 opacity-60' : 'border-red-100 dark:border-red-900/30'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${report.isResolved ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Reported: {reportedUser?.name || 'Unknown User'}
                    {report.isResolved && <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Resolved</span>}
                  </h3>
                  <p className="text-xs text-gray-500">Reported by: {reporter?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400">{new Date(report.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reason</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.reason}</p>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare size={14} />
                Reported Messages ({report.messageIds.length})
              </p>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : reportMessages.length > 0 ? (
                <div className="space-y-2">
                  {reportMessages.slice(0, 2).map(msg => (
                    <div key={msg.id} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                      {msg.type === 'image' && msg.imageUrls && msg.imageUrls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 mb-1">
                          {msg.imageUrls.slice(0, 4).map((url, i) => (
                            <img key={i} src={url || undefined} alt="Reported" className="rounded-lg w-full h-20 object-cover border border-red-100 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setLightboxImage(url); }} referrerPolicy="no-referrer" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{msg.text}</p>
                      )}
                      {msg.type === 'image' && msg.text && <p className="text-sm text-gray-500 italic mb-1">{msg.text}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                  {reportMessages.length > 2 && (
                    <button 
                      onClick={() => setSelectedReportForModal(report)}
                      className="text-sm text-orange-500 font-bold mt-2 hover:underline"
                    >
                      View all {reportMessages.length} messages
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Messages could not be loaded or have been deleted.</p>
              )}
            </div>

            <div className="flex gap-3">
              {!report.isResolved && (
                <button 
                  onClick={() => onResolve(report.id)}
                  className="flex-1 py-3 bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-400 rounded-xl font-bold hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Ignore / Resolve
                </button>
              )}
              
              <button 
                onClick={() => onDeleteUser(report.reportedUserId)}
                className="flex-1 py-3 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <UserX size={18} />
                Delete User
              </button>

              <button 
                onClick={() => onDeleteReport(report.id)}
                className="p-3 bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                title="Delete Report"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}

      {limit && limit < reports.length && (
        <div className="py-6 flex items-center justify-center">
           <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce" />
             <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce [animation-delay:-0.15s]" />
             <div className="w-2 h-2 rounded-full bg-[#e2a05e] animate-bounce [animation-delay:-0.3s]" />
           </div>
        </div>
      )}

      {selectedReportForModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedReportForModal(null)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] p-6 space-y-4 shadow-2xl animate-in zoom-in duration-300 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reported Messages</h3>
              <button onClick={() => setSelectedReportForModal(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto hide-scrollbar space-y-2 flex-1">
              {messages[selectedReportForModal.id]?.map(msg => (
                <div key={msg.id} className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                  {msg.type === 'image' && msg.imageUrls && msg.imageUrls.length > 0 ? (
                    <div className="space-y-1 mb-1">
                      {msg.imageUrls.map((url, i) => (
                        <img key={i} src={url || undefined} alt="Reported" className="rounded-lg w-full max-h-60 object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setLightboxImage(url); }} referrerPolicy="no-referrer" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{msg.text}</p>
                  )}
                  {msg.type === 'image' && msg.text && <p className="text-sm text-gray-500 italic mb-1">{msg.text}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage || undefined} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in duration-300" referrerPolicy="no-referrer" />
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
