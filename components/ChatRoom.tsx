
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { Chat, Pet, Owner, Message } from '../types';
import { translations } from '../translations';
import { ArrowLeft, Send, MoreVertical, ShieldAlert, X, AlertTriangle, UserX, Loader2, CheckSquare, Square, Plus, Camera, Image as ImageIcon, ImagePlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { compressImage, compressImageToFile } from '../imageUtils';
import { uploadToR2 } from '../r2Utils';
import { supabase } from '../supabase';

interface ChatRoomProps {
  chat: Chat;
  pet: Pet | null;
  currentUser: Owner;
  isOnline?: boolean;
  onBack: () => void;
  onSendMessage: (chatId: string, content: { text?: string, imageUrls?: string[], type: 'text' | 'image' }) => Promise<void>;
  onViewProfile: (ownerId: string) => void;
  onBlock?: (userId: string) => void;
  onMarkRead?: () => void;
  onReportMessages?: (chatId: string, reportedUserId: string, messageIds: string[], reason: string) => void;
  onFetchHistory?: (chatId: string) => Promise<void>;
  owners: Owner[];
}

const formatHeaderDate = (timestamp: number, lang: string = 'en') => {
  const date = new Date(timestamp);
  const now = new Date();
  const dMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = nowMidnight.getTime() - dMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return lang === 'ar' ? 'اليوم' : 'Today';
  if (diffDays === 1) return lang === 'ar' ? 'أمس' : 'Yesterday';
  if (diffDays < 7) return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
};

export const ChatRoom: React.FC<ChatRoomProps> = ({ chat, pet, currentUser, isOnline = true, onBack, onSendMessage, onViewProfile, onBlock, onMarkRead, onReportMessages, onFetchHistory, owners }) => {
  const lang = currentUser?.language || 'en';
  const t = translations[lang];
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);

  useEffect(() => {
    setHistoryFetched(false);
  }, [chat.id]);

  useEffect(() => {
    if (onFetchHistory && chat.id && !chat.id.startsWith('new:') && (!historyFetched || (chat.messages && chat.messages.length === 0))) {
      onFetchHistory(chat.id).then(() => setHistoryFetched(true));
    }
  }, [chat.id, onFetchHistory, historyFetched, chat.messages]);
  
  const [isReportingMode, setIsReportingMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [showReportReasonModal, setShowReportReasonModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const currentUserId = (currentUser?.id || '');
  const otherId = chat.participants.find(p => String(p) !== currentUserId);
  const otherUser = owners.find(o => o.id === otherId);
  
  const isBlockedByMe = currentUser.blockedUserIds?.includes(otherId || '');
  const isBlockedByThem = otherUser?.blockedUserIds?.includes(currentUserId);
  const isMessagingDisabled = isBlockedByMe || isBlockedByThem;

  const REPORT_REASONS = [
    lang === 'ar' ? 'رسائل مزعجة أو احتيال' : 'Scam or Fraud',
    lang === 'ar' ? 'تحرش أو مضايقة' : 'Harassment or Bullying',
    lang === 'ar' ? 'محتوى غير لائق' : 'Inappropriate Content',
    lang === 'ar' ? 'رسائل اقتحامية (Spam)' : 'Spam or Phishing',
    lang === 'ar' ? 'سلوك مريب' : 'Suspicious Behavior'
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [windowShrink, setWindowShrink] = useState(0);
  const isKeyboardOpen = useRef(false);
  const closedHeight = useRef(typeof window !== 'undefined' ? window.innerHeight : 800);

  // Handle keyboard show - native plugin & listener for Viewport changes
  useEffect(() => {
    let showSub: any = null;
    let hideSub: any = null;

    const onWindowResize = () => {
      if (!isKeyboardOpen.current) {
        closedHeight.current = window.innerHeight;
        setWindowShrink(0);
      } else {
        setWindowShrink(Math.max(0, closedHeight.current - window.innerHeight));
      }
    };
    window.addEventListener('resize', onWindowResize);

    if (Capacitor.isNativePlatform()) {
      showSub = Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
        isKeyboardOpen.current = true;
        setKeyboardHeight(info.keyboardHeight || 0);
        scrollToBottom('smooth');
        setTimeout(() => scrollToBottom('smooth'), 100);
        setTimeout(() => scrollToBottom('smooth'), 250);
      });
      hideSub = Keyboard.addListener('keyboardWillHide', () => {
        isKeyboardOpen.current = false;
        setKeyboardHeight(0);
        setWindowShrink(0);
        scrollToBottom('smooth');
        setTimeout(() => scrollToBottom('smooth'), 100);
      });
    }

    const onVPResize = () => {
      if (window.visualViewport) {
        const visibleHeight = window.visualViewport.height;
        const totalHeight = window.innerHeight;
        const diff = totalHeight - visibleHeight;
        if (diff > 100) {
          setKeyboardHeight(diff);
        } else {
          setKeyboardHeight(0);
        }
      }
    };
    
    if (!Capacitor.isNativePlatform()) {
      window.visualViewport?.addEventListener('resize', onVPResize);
    }

    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (!Capacitor.isNativePlatform()) {
        window.visualViewport?.removeEventListener('resize', onVPResize);
      }
      if (showSub) showSub.then((s: any) => s.remove());
      if (hideSub) hideSub.then((s: any) => s.remove());
    };
  }, [scrollToBottom]);

  // Initial load scroll
  useEffect(() => {
    if (chat.id) {
      isInitialLoad.current = true;
      // Instant scroll to bottom on entry
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        // Second pass after a short delay to ensure layout is ready
        setTimeout(() => {
          scrollToBottom('auto');
          isInitialLoad.current = false;
        }, 100);
      });
    }
  }, [chat.id, scrollToBottom]);

  // Message update scroll
  useEffect(() => {
    if (!isInitialLoad.current) {
      scrollToBottom('smooth');
    }
    if (onMarkRead) {
      onMarkRead();
    }
  }, [chat.messages.length, onMarkRead, scrollToBottom]);

  const handleSend = () => {
    if (!text.trim() || isMessagingDisabled) return;
    onSendMessage(chat.id, { text: text.trim(), type: 'text' });
    setText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const remainingSlots = 3 - selectedFiles.length;
      if (remainingSlots <= 0) {
        alert("Maximum 3 images allowed");
        return;
      }
      const newFiles = files.slice(0, remainingSlots);
      const newPreviewUrls = newFiles.map(f => URL.createObjectURL(f));
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setCurrentPreviewIndex(selectedFiles.length); // Focus on the first newly added image
      setShowPlusMenu(false);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  interface SendingMessage {
    id: string;
    previewUrls: string[];
    caption: string;
  }
  
  const [sendingMessages, setSendingMessages] = useState<SendingMessage[]>([]);

  const handleSendImage = async () => {
    if (selectedFiles.length === 0 || isMessagingDisabled) return;
    
    // Create optimistic message
    const filesToUpload = [...selectedFiles];
    const previews = [...previewUrls];
    const textContext = caption.trim();
    
    setPreviewUrls([]);
    setSelectedFiles([]);
    setCaption('');
    setShowPlusMenu(false);
    
    const tempId = `temp-${Date.now()}`;
    setSendingMessages(prev => [...prev, { id: tempId, previewUrls: previews, caption: textContext }]);
    
    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        // 1. Compress
        const compressedFile = await compressImageToFile(file);
        
        // 2. Upload to Cloudflare R2
        const publicUrl = await uploadToR2(compressedFile);
        uploadedUrls.push(publicUrl);
      }
        
      // 3. Send Message
      await onSendMessage(chat.id, { 
        imageUrls: uploadedUrls, 
        type: 'image',
        text: textContext || undefined
      });
      
    } catch (err: any) {
      console.error("Error sending image:", err);
      alert(err.message || "Failed to send image to Cloudflare R2. Please check your configuration.");
    } finally {
       setSendingMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string, messages: Message[] }[] = [];
    chat.messages.forEach((msg) => {
      const dateLabel = formatHeaderDate(msg.timestamp, lang);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateLabel) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: dateLabel, messages: [msg] });
      }
    });
    return groups;
  }, [chat.messages, lang]);

  const petName = pet?.name || t.deletedPet;
  const subLabel = pet 
    ? (pet.ownerId === currentUserId 
        ? `${t.interestedIn} ${petName}`
        : `${petName}'s ${t.owner}`)
    : t.deletedPet;

  const isWeb = Capacitor.getPlatform() === 'web';
  const effectiveKeyboardHeight = isWeb ? keyboardHeight : Math.max(0, keyboardHeight - windowShrink);

  return (
    <div 
      className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950 transition-[padding] duration-200 ease-out"
      style={{ paddingBottom: effectiveKeyboardHeight > 0 ? `${effectiveKeyboardHeight}px` : undefined }}
    >
      {showMenu && (
        <div className="fixed inset-0 z-[45]" onClick={() => setShowMenu(false)} />
      )}
      <div className="flex items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b dark:border-zinc-800 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md sticky top-0 z-[50]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-transparent outline-none border-none active:bg-gray-100 dark:active:bg-zinc-800 rounded-full text-gray-900 dark:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div 
            className={`flex items-center gap-3 transition-all ${isMessagingDisabled ? 'opacity-70 cursor-default' : 'cursor-pointer active:scale-95'}`} 
            onClick={() => !isMessagingDisabled && otherUser && onViewProfile(otherUser.id)}
          >
            <img src={otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId || undefined}`} className="w-10 h-10 rounded-full object-cover shadow-sm" alt={otherUser?.name || 'User'} referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white leading-tight truncate">{otherUser?.name || t.deletedUser}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">{subLabel}</p>
            </div>
          </div>
        </div>

        {!isMessagingDisabled && (
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 bg-transparent outline-none border-none text-gray-400 dark:text-gray-300 active:scale-90 transition-transform relative z-[60]">
              <MoreVertical size={24} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 z-[60] overflow-hidden">
                <button onClick={() => { setShowMenu(false); setIsReportingMode(true); setSelectedMessageIds([]); }} className="w-full flex items-center gap-3 p-4 text-sm font-bold text-[#e2a05e] bg-transparent active:bg-[#e2a05e]/10 transition-colors text-left outline-none border-none">
                  <ShieldAlert size={18} /> {t.reportMessages}
                </button>
                <button onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }} className="w-full flex items-center gap-3 p-4 text-sm font-bold text-red-600 bg-transparent active:bg-red-50 dark:active:bg-red-900/10 transition-colors text-left border-t border-gray-100 dark:border-zinc-800 outline-none">
                  <UserX size={18} /> {t.blockUser}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-zinc-950">
        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-20">
             <ShieldAlert size={64} className="mb-4" />
             <p className="font-bold tracking-widest">{t.chatEmpty}</p>
          </div>
        ) : groupedMessages.map((group) => (
          <div key={group.date} className="space-y-4">
            <div className="sticky top-0 z-[30] flex justify-center py-4">
              <div className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-zinc-700">
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{group.date}</span>
              </div>
            </div>
            <div className="space-y-4">
              {group.messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                const isSelected = selectedMessageIds.includes(msg.id);
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isInitialLoad.current ? '' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'}`}>
                    {!isMe && isReportingMode && (
                      <button 
                        onClick={() => {
                          setSelectedMessageIds(prev => 
                            prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                          );
                        }}
                        className="mr-3 mt-2 text-gray-400 hover:text-[#e2a05e] transition-colors animate-in slide-in-from-left-2"
                      >
                        {isSelected ? <CheckSquare size={20} className="text-[#e2a05e]" /> : <Square size={20} />}
                      </button>
                    )}
                    <div 
                      onClick={() => {
                        if (!isMe && isReportingMode) {
                          setSelectedMessageIds(prev => 
                            prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                          );
                        }
                      }}
                      className={`max-w-[85%] ${msg.type === 'image' ? 'p-1' : 'p-3.5'} rounded-[22px] shadow-sm relative ${isMe ? 'bg-[#e2a05e] text-white rounded-tr-none' : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-tl-none border-[0.5px] border-gray-100 dark:border-zinc-700'} ${isSelected ? 'ring-2 ring-[#e2a05e]' : ''} ${!isMe && isReportingMode ? 'cursor-pointer' : ''}`}
                    >
                      {msg.type === 'image' && msg.imageUrls && msg.imageUrls.length > 0 ? (
                        <div className="space-y-2">
                          <div className={`grid gap-1 ${msg.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {msg.imageUrls.map((url, i) => (
                              <div 
                                key={i} 
                                className={`${msg.imageUrls!.length === 3 && i === 0 ? 'col-span-2' : ''} relative rounded-[18px] overflow-hidden border-[0.1px] border-black/5 dark:border-white/5 shadow-sm bg-gray-100 dark:bg-zinc-700`}
                                style={{ maxHeight: msg.imageUrls?.length === 1 ? '300px' : 'none', minHeight: '100px' }}
                              >
                                <img 
                                  src={url || undefined} 
                                  loading="lazy"
                                  decoding="async"
                                  key={url}
                                  onLoad={() => {
                                    if (!isInitialLoad.current) {
                                      scrollToBottom('smooth');
                                    }
                                  }}
                                  className={`w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${msg.imageUrls?.length === 1 ? 'max-h-[300px]' : 'aspect-square'}`}
                                  onClick={(e) => {
                                    if (!isReportingMode) {
                                      e.stopPropagation();
                                      setViewerImages(msg.imageUrls!);
                                      setViewerIndex(i);
                                      setShowViewer(true);
                                    }
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                          </div>
                          {msg.text && (
                            <p className="text-sm font-medium whitespace-pre-wrap break-words px-2 pb-1">{msg.text}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm font-medium whitespace-pre-wrap break-words">{msg.text}</p>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${msg.type === 'image' ? 'px-2 pb-1' : ''}`}>
                        <p className={`text-[9px] font-bold ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Optimistic Sending Messages */}
        {sendingMessages.map((msg) => (
          <div key={msg.id} className="space-y-4 pt-2">
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-[85%] p-1 rounded-[22px] shadow-sm relative bg-[#e2a05e]/80 dark:bg-[#e2a05e]/60 text-white rounded-tr-none border-[0.5px] border-white/50">
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] rounded-[22px] z-10 flex items-center justify-center">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-full shadow-lg">
                    <Loader2 size={24} className="animate-spin text-[#e2a05e]" />
                  </div>
                </div>
                <div className="space-y-2 opacity-60 filter blur-[1px]">
                  <div className={`grid gap-1 ${msg.previewUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {msg.previewUrls.map((url, i) => (
                      <div key={i} className={`${msg.previewUrls.length === 3 && i === 0 ? 'col-span-2' : ''} relative rounded-[18px] overflow-hidden bg-white/10`} style={{ maxHeight: msg.previewUrls.length === 1 ? '300px' : 'none', minHeight: '100px' }}>
                        <img onLoad={() => scrollToBottom('smooth')} src={url || undefined} className={`w-full h-full object-cover ${msg.previewUrls.length === 1 ? 'max-h-[300px]' : 'aspect-square'}`} />
                      </div>
                    ))}
                  </div>
                  {msg.caption && (
                    <p className="text-sm font-medium whitespace-pre-wrap break-words px-2 pb-1">{msg.caption}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={scrollRef} className="h-4 w-full" />
      </div>

      <div className={`p-4 bg-white dark:bg-[#1a1a1a] border-t dark:border-zinc-800 ${effectiveKeyboardHeight > 0 ? 'pb-3' : 'pb-[calc(1rem+env(safe-area-inset-bottom))]'}`}>
        {isReportingMode ? (
          <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2">
            <button 
              onClick={() => { setIsReportingMode(false); setSelectedMessageIds([]); }} 
              className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold active:scale-95 transition-all"
            >
              {t.cancel}
            </button>
            <button 
              onClick={() => setShowReportReasonModal(true)} 
              disabled={selectedMessageIds.length === 0}
              className={`flex-1 py-3 rounded-2xl font-bold shadow-lg transition-all ${selectedMessageIds.length > 0 ? 'bg-[#e2a05e] text-white active:scale-95' : 'bg-gray-200 dark:bg-zinc-700 text-gray-400'}`}
            >
              {t.report} ({selectedMessageIds.length})
            </button>
          </div>
        ) : isMessagingDisabled ? (
          <div className="flex flex-col items-center justify-center py-5 px-6 bg-red-50 dark:bg-red-900/10 rounded-[30px] border border-red-100 dark:border-red-900/20 text-center animate-in slide-in-from-bottom-2">
            <UserX size={24} className="text-red-500 mb-2" />
            {isBlockedByMe ? (
              <>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{t.youBlockedUser}</p>
                <p className="text-[10px] font-black text-[#e2a05e] mt-2 uppercase tracking-tight">{t.unblockHint}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{t.youAreBlocked}</p>
                <p className="text-[10px] font-medium text-red-400 mt-1 uppercase tracking-widest">{t.cannotSendMessage}</p>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            {showPlusMenu && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowPlusMenu(false)} />
                <div className="absolute bottom-full left-0 mb-4 flex flex-col gap-1 p-1 bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in slide-in-from-bottom-2 duration-300 z-[101] min-w-[160px]">
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-3 w-full p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors text-black dark:text-white"
                  >
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                      <Camera size={20} className="text-black dark:text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{t.camera}</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 w-full p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors text-black dark:text-white"
                  >
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                      <ImageIcon size={20} className="text-black dark:text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{t.photo}</span>
                  </button>
                </div>
              </>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
            <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />

            <div className="flex items-center gap-2">
              <button 
                disabled={!isOnline}
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`p-3 rounded-full transition-all shadow-md ${!isOnline ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400 opacity-50 cursor-not-allowed' : (showPlusMenu ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rotate-45 active:scale-95' : 'bg-[#e2a05e] text-white active:scale-95')}`}
              >
                <Plus size={20} />
              </button>
              <div className={`flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-2 rounded-[30px] border border-gray-100 dark:border-zinc-700 ${!isOnline ? 'opacity-50' : ''}`}>
                <input 
                  type="text" 
                  placeholder={isOnline ? t.typeMessage : t.offlineLimited} 
                  disabled={!isOnline} 
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-900 dark:text-white text-sm disabled:cursor-not-allowed" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  onFocus={() => {
                    setTimeout(() => scrollToBottom('smooth'), 100);
                    setTimeout(() => scrollToBottom('smooth'), 300);
                    setTimeout(() => scrollToBottom('smooth'), 500);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                />
                <button onClick={handleSend} disabled={!text.trim() || !isOnline} className={`p-3 rounded-full shadow-lg transition-all flex items-center justify-center ${text.trim() && isOnline ? 'bg-[#e2a05e] text-white active:scale-95' : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed'}`}>
                  <Send size={18} fill={text.trim() && isOnline ? "white" : "none"} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {previewUrls.length > 0 && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300 overflow-hidden">
           {/* Top Header */}
           <div className="flex justify-between items-center px-6 pb-6 pt-[max(env(safe-area-inset-top,4rem),4rem)] bg-black/40 relative z-10">
              <button 
                onClick={() => { previewUrls.forEach(url => URL.revokeObjectURL(url)); setPreviewUrls([]); setSelectedFiles([]); setCaption(''); setCurrentPreviewIndex(0); }}
                className="p-3 bg-white/10 text-white rounded-full active:scale-90 transition-transform hover:bg-white/20"
              >
                <X size={24} />
              </button>
              <h3 className="text-white font-black uppercase tracking-widest text-sm drop-shadow-lg">Send Media</h3>
              <div className="w-12 h-12" /> {/* Spacer */}
           </div>
           
           {/* Main Image View */}
           <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">
              <img 
                src={previewUrls[currentPreviewIndex] || undefined} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" 
                referrerPolicy="no-referrer"
              />
           </div>

           {/* Bottom Controls */}
           <div className="bg-black/60 backdrop-blur-2xl p-6 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-white/5">
              {/* Thumbnail Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide justify-center">
                 {previewUrls.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => setCurrentPreviewIndex(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shadow-xl border-2 transition-all shrink-0 cursor-pointer ${i === currentPreviewIndex ? 'border-[#e2a05e] scale-110' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                    >
                       <img src={url || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           URL.revokeObjectURL(previewUrls[i]);
                           setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
                           setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
                           if (currentPreviewIndex >= i && currentPreviewIndex > 0) {
                             setCurrentPreviewIndex(prev => prev - 1);
                           }
                         }}
                         className="absolute top-0.5 right-0.5 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                       >
                         <Trash2 size={10} />
                       </button>
                    </div>
                 ))}
                 {previewUrls.length < 3 && (
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white transition-all shrink-0 bg-white/5"
                   >
                     <ImagePlus size={24} />
                   </button>
                 )}
              </div>

              {/* Caption Bar (WhatsApp Style) */}
              <div className="flex items-center gap-3">
                 <div className="flex-1 bg-zinc-900/80 border border-white/10 rounded-[28px] px-6 py-3 flex items-center gap-3 shadow-2xl ring-1 ring-white/5">
                    <textarea 
                      placeholder="Add a caption..." 
                      className="bg-transparent text-white text-sm outline-none resize-none h-6 w-full py-0.5 placeholder:text-gray-500 font-medium"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={1}
                    />
                 </div>
                 <button 
                   disabled={isUploading}
                   onClick={handleSendImage}
                   className="w-14 h-14 bg-[#e2a05e] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all disabled:opacity-50 shrink-0"
                 >
                   {isUploading ? (
                     <Loader2 size={24} className="animate-spin" />
                   ) : (
                     <Send size={24} fill="white" className="ml-1" />
                   )}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showBlockConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t.blockUser}?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">You will no longer see messages or pets from {otherUser?.name || 'this user'}.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBlockConfirm(false)} className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold active:scale-95 transition-all">{t.cancel}</button>
              <button onClick={() => { setShowBlockConfirm(false); if (otherId && onBlock) onBlock(otherId); }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {showReportReasonModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] p-6 space-y-4 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.reportMessagesTitle}</h3>
              <button onClick={() => setShowReportReasonModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.reportMessagesDesc}</p>
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto hide-scrollbar">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all ${reportReason === reason ? 'bg-[#e2a05e]/10 text-[#e2a05e] border-2 border-[#e2a05e]' : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <button 
              disabled={!reportReason}
              onClick={() => {
                if (onReportMessages && otherId) {
                  onReportMessages(chat.id, otherId, selectedMessageIds, reportReason);
                  setShowReportReasonModal(false);
                  setIsReportingMode(false);
                  setSelectedMessageIds([]);
                  setReportReason('');
                }
              }}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all mt-4 ${reportReason ? 'bg-[#e2a05e] text-white active:scale-95' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'}`}
            >
              {t.report}
            </button>
          </div>
        </div>
      )}

      {showViewer && viewerImages.length > 0 && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-6 pb-6 pt-[max(env(safe-area-inset-top,4rem),4rem)] bg-black/50">
            <button 
              onClick={() => setShowViewer(false)}
              className="p-3 bg-white/10 text-white rounded-full active:scale-90 transition-transform"
            >
              <X size={24} />
            </button>
            <div className="bg-white/10 px-4 py-2 rounded-full">
              <span className="text-white text-xs font-bold">{viewerIndex + 1} / {viewerImages.length}</span>
            </div>
            <div className="w-12 h-12" />
          </div>
          
          <div className="flex-1 flex items-center justify-center relative bg-black/20">
            {viewerImages.length > 1 && (
              <>
                <button 
                  onClick={() => setViewerIndex(prev => (prev - 1 + viewerImages.length) % viewerImages.length)}
                  className="absolute left-4 z-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-90"
                >
                  <ChevronLeft size={28} />
                </button>
                <button 
                  onClick={() => setViewerIndex(prev => (prev + 1) % viewerImages.length)}
                  className="absolute right-4 z-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-90"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            <img 
              src={viewerImages[viewerIndex] || undefined} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300 transition-all transform" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
