
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Layout } from './components/Layout';
import { HomeFeed } from './components/HomeFeed';
import { PetDetail } from './components/PetDetail';
import { FavoritesView } from './components/FavoritesView';
import { ChatListView } from './components/ChatListView';
import { ChatRoom } from './components/ChatRoom';
import { ProfileView } from './components/ProfileView';
import { OwnerProfile } from './components/OwnerProfile';
import { LoginView } from './components/LoginView';
import { AccountDetailsView } from './components/AccountDetailsView';
import { BlockedUsersView } from './components/BlockedUsersView';
import { ContactUsView } from './components/ContactUsView';
import { AdminDashboard } from './components/AdminDashboard';
import { OnboardingView } from './components/OnboardingView';
import { AdminInquiriesView } from './components/AdminInquiriesView';
import { LocationSetupView } from './components/LocationSetupView';
import { OfflineScreen } from './components/OfflineScreen';
import { Pet, View, PetType, Chat, Owner, Filters, Message, PetStatus, SupportMessage, PetReport, MessageReport } from './types';
import { supabase } from './supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { translations } from './translations';
import { X, Loader2, PawPrint } from 'lucide-react';
import { storage } from './preferences';

const PAGE_SIZE = 8;
const PET_COLUMNS = 'id, owner_id, name, type, breed, age, gender, location, description, is_vaccinated, personality, images, status, approved_at, created_at';
const PET_FEED_COLUMNS = 'id, owner_id, name, type, breed, age, gender, location, images, status, created_at, personality';
const PROFILE_COLUMNS = 'id, name, city, area, avatar, is_admin, language, blocked_user_ids, reported_pet_ids, fcm_token';
const MESSAGE_COLUMNS = 'id, sender_id, text, image_url, type, read_by, created_at';
const CHAT_COLUMNS = 'id, pet_id, participants, last_message, updated_at';

async function fetchWithRetry<T>(operation: () => Promise<{ data: T | null; error: any }>, retries = 3, delay = 1000): Promise<{ data: T | null; error: any }> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await operation();
      if (!result.error) return result;
      if (i === retries - 1) return result;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return { data: null, error: new Error("Max retries reached") };
}

const mapPet = (dbPet: any): Pet => {
  let status: PetStatus = 'pending';
  if (dbPet.status) {
    const s = dbPet.status.toString().trim().toLowerCase();
    if (s === 'approved') status = 'approved';
    else if (s === 'rejected') status = 'rejected';
    else if (s === 'deleted') status = 'deleted';
    else status = 'pending';
  }

  return {
    id: String(dbPet.id),
    ownerId: String(dbPet.owner_id),
    name: dbPet.name,
    type: dbPet.type as PetType,
    breed: dbPet.breed,
    age: dbPet.age,
    gender: dbPet.gender,
    location: dbPet.location,
    description: dbPet.description,
    isVaccinated: dbPet.is_vaccinated,
    personality: dbPet.personality || [],
    images: dbPet.images || [],
    status: status,
    approvedAt: dbPet.approved_at ? new Date(dbPet.approved_at).getTime() : undefined,
    createdAt: dbPet.created_at ? new Date(dbPet.created_at).getTime() : Date.now()
  };
};

const mapPetToDb = (pet: Partial<Pet>) => ({
  name: pet.name,
  type: pet.type,
  breed: pet.breed,
  age: pet.age,
  gender: pet.gender,
  location: pet.location,
  description: pet.description,
  is_vaccinated: pet.isVaccinated,
  personality: pet.personality,
  images: pet.images,
  owner_id: pet.ownerId,
  status: pet.status
});

const mapProfile = (dbProfile: any): Owner => ({
  id: String(dbProfile.id),
  name: dbProfile.name || 'User',
  username: dbProfile.username || '',
  city: dbProfile.city || '',
  area: dbProfile.area || '',
  avatar: dbProfile.avatar || '',
  isAdmin: dbProfile.is_admin || false,
  language: dbProfile.language || 'en',
  blockedUserIds: (dbProfile.blocked_user_ids || []).map((id: string) => String(id)),
  reportedPetIds: (dbProfile.reported_pet_ids || []).map((id: string) => String(id)),
  fcmToken: dbProfile.fcm_token
});

const mapOwnerToDb = (owner: Owner) => ({
  name: owner.name,
  city: owner.city,
  area: owner.area,
  avatar: owner.avatar,
  is_admin: owner.isAdmin,
  language: owner.language,
  blocked_user_ids: owner.blockedUserIds,
  reported_pet_ids: owner.reportedPetIds,
  fcm_token: owner.fcmToken
});

const getPhotoLabel = (count: number, lang?: string) => {
  const isAr = lang === 'ar';
  if (count <= 1) return isAr ? 'صورة' : 'Photo';
  return isAr ? `${count} صور` : `${count} photos`;
};

const mapMessage = (m: any): Message => {
  if (!m) return { id: '', senderId: '', text: '', imageUrls: [], type: 'text', timestamp: Date.now(), readBy: [] };
  
  const rawImageUrls = m.image_urls || m.image_url;
  let imageUrls: string[] = [];
  
  if (Array.isArray(rawImageUrls)) {
    imageUrls = rawImageUrls;
  } else if (typeof rawImageUrls === 'string' && rawImageUrls.length > 0) {
    if (rawImageUrls.startsWith('[') && rawImageUrls.endsWith(']')) {
      try {
        imageUrls = JSON.parse(rawImageUrls);
      } catch (e) {
        imageUrls = [rawImageUrls];
      }
    } else if (rawImageUrls.includes(',')) {
      imageUrls = rawImageUrls.split(',').map((u: string) => u.trim());
    } else {
      imageUrls = [rawImageUrls];
    }
  }

  const ts = m.created_at ? new Date(m.created_at).getTime() : Date.now();

  return {
    id: String(m.id || ''),
    senderId: String(m.sender_id || ''),
    text: m.text || '',
    imageUrls,
    type: m.type || (imageUrls.length > 0 ? 'image' : 'text'),
    timestamp: isNaN(ts) ? Date.now() : ts,
    readBy: Array.isArray(m.read_by) ? m.read_by.map((id: any) => String(id)) : []
  }
};

const mapSupportInquiry = (m: any): SupportMessage => ({
  id: String(m.id),
  ownerId: String(m.owner_id),
  subject: m.subject || '',
  message: m.message || '',
  timestamp: new Date(m.created_at).getTime(),
  isRead: m.is_read || false
});

const mapPetReport = (r: any): PetReport => ({
  id: String(r.id),
  petId: String(r.pet_id),
  reporterId: String(r.reporter_id),
  reason: r.reason,
  timestamp: new Date(r.created_at).getTime(),
  isResolved: r.is_resolved || false
});

const VIEW_ORDER: Record<string, number> = {
  'home': 0,
  'admin-dashboard': 0,
  'chats': 1,
  'favorites': 2,
  'profile': 3
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Owner | null>(null);
  const [view, setView] = useState<View>('home');
  const [history, setHistory] = useState<View[]>([]);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for back
  const [profileMenuInitial, setProfileMenuInitial] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const viewRef = useRef<View>(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const done = await storage.get('shoflak_onboarding_done');
        setShowOnboarding(done !== 'true');
      } catch (e) {
        setShowOnboarding(true);
      } finally {
        setHasCheckedOnboarding(true);
      }
    };
    checkOnboarding();
  }, []);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const initTheme = async () => {
      const theme = await storage.get('theme');
      setIsDarkMode(theme === 'dark');
    };
    initTheme();
  }, []);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!isLoading) {
      if (Capacitor.isNativePlatform()) {
        CapSplashScreen.hide().catch(console.warn);
      }
    }
  }, [isLoading]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deletedAccountLoginError, setDeletedAccountLoginError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [homeFetchError, setHomeFetchError] = useState<string | null>(null);
  const [favFetchError, setFavFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [homePets, setHomePets] = useState<Pet[]>([]);
  const homePetsRef = useRef<Pet[]>([]);
  useEffect(() => { homePetsRef.current = homePets; }, [homePets]);
  
  const [favPets, setFavPets] = useState<Pet[]>([]); 
  const favPetsRef = useRef<Pet[]>([]);
  useEffect(() => { favPetsRef.current = favPets; }, [favPets]);
  const [otherPets, setOtherPets] = useState<Pet[]>([]); 
  const [adminPets, setAdminPets] = useState<Pet[]>([]); 

  // TanStack Query for caching initial home pets
  const { data: queryPets } = useQuery({
    queryKey: ['pets', 'approved'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pets').select(PET_FEED_COLUMNS).eq('status', 'approved').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return (data || []).map(mapPet);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: view === 'home',
  });

  const queryPetsApplied = useRef(false);
  useEffect(() => {
    if (queryPets && queryPets.length > 0 && homePets.length === 0 && !queryPetsApplied.current) {
      setHomePets(queryPets);
      queryPetsApplied.current = true;
    }
  }, [queryPets, homePets.length]);
  const [adminInquiries, setAdminInquiries] = useState<SupportMessage[]>([]);
  const [adminReports, setAdminReports] = useState<PetReport[]>([]);
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favSearchQuery, setFavSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [blockedByThemIds, setBlockedByThemIds] = useState<string[]>([]);
  
  const [isUserSyncComplete, setIsUserSyncComplete] = useState(false);
  const isUserSyncCompleteRef = useRef(false);
  useEffect(() => { isUserSyncCompleteRef.current = isUserSyncComplete; }, [isUserSyncComplete]);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [favPage, setFavPage] = useState(0);
  const [favHasMore, setFavHasMore] = useState(true);
  const [isFetchingMoreFavs, setIsFetchingMoreFavs] = useState(false);

  const [adminTab, setAdminTab] = useState<'overview' | 'pending' | 'pets' | 'users' | 'inquiries' | 'reports' | 'message-reports' | 'broadcast'>('overview');
  const [adminMessageReports, setAdminMessageReports] = useState<MessageReport[]>([]);

  const [homeViewMode, setHomeViewMode] = useState<'list' | 'grid'>('list');
  useEffect(() => {
    const initViewMode = async () => {
      const mode = await storage.get('homeViewMode');
      if (mode === 'grid') setHomeViewMode('grid');
    };
    initViewMode();
  }, []);

  const [activeCategory, setActiveCategory] = useState<PetType>('All');
  const [filters, setFilters] = useState<Filters>({ 
    type: 'All', breed: '', minAge: 1, maxAge: 30, gender: 'Any', city: '', area: ''
  });
  const [isOnline, setIsOnline] = useState(true);
  const isOnlineRef = useRef(true);
  const [hasInitialData, setHasInitialData] = useState(false);
  const isComponentMounted = useRef(true);

  // Sync isOnlineRef
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Handle OAuth callback logic if running in a popup
  useEffect(() => {
    if (window.opener && (window.location.hash || window.location.search)) {
      const hash = window.location.hash;
      const search = window.location.search;
      
      if (hash.includes('access_token')) {
        window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, '*');
        // Give it a tiny bit of time to ensure message is sent before closing
        setTimeout(() => window.close(), 500);
      } else if (search.includes('error')) {
        const params = new URLSearchParams(search);
        const errorDescription = params.get('error_description') || params.get('error') || 'Authentication failed';
        window.opener.postMessage({ 
          type: 'OAUTH_ERROR', 
          error: errorDescription
        }, '*');
        setTimeout(() => window.close(), 500);
      }
    }
  }, []);

  const currentUserIdRef = useRef<string | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const currentUserRef = useRef<Owner | null>(null);
  const allOwnersRef = useRef<Owner[]>([]);
  const chatsRef = useRef<Chat[]>([]);

  const scrollPositions = useRef<Record<string, number>>({});
  const lastFavSearchRef = useRef('');
  const lastFavsCountRef = useRef(0);
  const lastFiltersRef = useRef<string>(JSON.stringify(filters));
  const lastCategoryRef = useRef<string>('');
  const lastUserIdRef = useRef<string | null>(null);
  const lastViewRef = useRef<string>(view);
  
  useEffect(() => { chatsRef.current = chats; }, [chats]);
  useEffect(() => { 
    currentUserRef.current = currentUser; 
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);
  useEffect(() => { selectedChatIdRef.current = selectedChatId; }, [selectedChatId]);
  useEffect(() => { allOwnersRef.current = allOwners; }, [allOwners]);

  useEffect(() => {
    const root = window.document.documentElement;
    const updateStatusBar = async () => {
      try {
        if (isDarkMode) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      } catch (e) {
        // Will fail on web preview, safe to ignore
      }
    };

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      storage.set('theme', 'dark').catch(() => {});
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      storage.set('theme', 'light').catch(() => {});
    }
    
    updateStatusBar();
  }, [isDarkMode]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setHistory(prev => {
      const newHistory = [...prev];
      const lastView = newHistory.pop();
      
      // If we are going back to profile from a sub-setting, tell it to show the menu
      if (lastView === 'profile' && ['account-details', 'blocked-users', 'contact-us'].includes(view)) {
        setProfileMenuInitial(true);
      } else {
        setProfileMenuInitial(false);
      }

      if (lastView) setView(lastView);
      else setView('home');
      return newHistory;
    });
  }, [view]);

  // Native Android Hardware back button / Edge Swipe back
  useEffect(() => {
    const handleBackButton = async () => {
      const event = new CustomEvent('hardwareBack', { cancelable: true });
      window.dispatchEvent(event);
      if (event.defaultPrevented) return;

      if (view !== 'home' && view !== 'chats' && view !== 'favorites' && view !== 'profile') {
        goBack();
      } else {
        // We are on a root tab, minimize the app
        await CapacitorApp.minimizeApp();
      }
    };
    
    CapacitorApp.addListener('backButton', handleBackButton);
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [view, goBack]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const pageRef = useRef(0);
  const favPageRef = useRef(0);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { favPageRef.current = favPage; }, [favPage]);

  const isFetchingHomeRef = useRef(false);
  const fetchHomePets = useCallback(async (reset: boolean = false, customFilters?: Filters) => {
    if (isFetchingHomeRef.current && !reset) return;
    
    // If we are already fetching a reset, don't start another reset fetch simultaneously
    if (reset && isFetchingHomeRef.current) return;

    isFetchingHomeRef.current = true;

    // Fail Fast: Block offline fetches fundamentally
    if (!navigator.onLine || !isOnlineRef.current) {
      setHomeFetchError(null);
      setHasInitialData(false);
      setIsOnline(false);
      setIsFetchingMore(false);
      setIsDataLoading(false);
      setIsLoading(false);
      isFetchingHomeRef.current = false;
      return;
    }

    if (reset) {
      setPage(0);
      pageRef.current = 0;
      setHasMore(true);
      // Only clear if we don't have cached data to show, to prevent flickering
      if (homePetsRef.current.length === 0) {
        setHomePets([]);
        setIsDataLoading(true);
      }
      setHomeFetchError(null);
    }
    
    if (!reset) setIsFetchingMore(true);
    // Don't set isDataLoading if we already have pets (prevents flickering to skeleton)
    else if (homePetsRef.current.length === 0) setIsDataLoading(true);

    const activeFilters = customFilters || filters;
    try {
      const targetPage = reset ? 0 : pageRef.current;
      const from = targetPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await fetchWithRetry<any[]>(async () => {
        let query = supabase
          .from('pets')
          .select(PET_FEED_COLUMNS)
          .eq('status', 'approved') 
          .order('created_at', { ascending: false })
          .range(from, to);

        if (activeFilters.type !== 'All') query = query.eq('type', activeFilters.type);
        if (activeFilters.gender !== 'Any') query = query.eq('gender', activeFilters.gender);
        if (activeFilters.breed) query = query.ilike('breed', `%${activeFilters.breed}%`);
        
        const parsedMin = Number(activeFilters.minAge);
        if (!isNaN(parsedMin) && parsedMin >= 1) {
          query = query.gte('age', parsedMin);
        }
        const parsedMax = Number(activeFilters.maxAge);
        if (!isNaN(parsedMax) && parsedMax <= 30) {
          query = query.lte('age', parsedMax);
        }

        if (activeFilters.city) query = query.ilike('location', `%${activeFilters.city}%`);
        if (activeFilters.area) query = query.ilike('location', `%${activeFilters.area}%`);
        
        if (currentUserIdRef.current) {
          query = query.neq('owner_id', currentUserIdRef.current);
        }
        return await query;
      });

      if (error) throw error;

      if (!isComponentMounted.current) return;

      if (data) {
        const mapped = data.map(mapPet);
        if (reset) {
          setHomePets(mapped);
        } else {
          setHomePets(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            return [...prev, ...mapped.filter(p => !existingIds.has(p.id))];
          });
        }
        setHasInitialData(true);
        if (data.length < PAGE_SIZE) setHasMore(false);
        else setPage(targetPage + 1);
      }
    } catch (err: any) {
      console.warn("Home fetch error:", err);
      const errStr = err?.message || String(err) || "";
      const isNetworkObjError = errStr.toLowerCase().includes('fetch') || errStr.toLowerCase().includes('network');
      
      if (isComponentMounted.current) {
        if ((!isOnlineRef.current || !navigator.onLine) || isNetworkObjError) {
          setHomeFetchError(null);
          setHasInitialData(false);
          setIsOnline(false);
        } else {
          setHomeFetchError(err.message || String(err));
          if (reset && homePetsRef.current.length === 0) {
            try {
              const { data: fallbackData } = await supabase.from('pets').select(PET_FEED_COLUMNS).eq('status', 'approved').limit(PAGE_SIZE);
              if (fallbackData) setHomePets(fallbackData.map(mapPet));
            } catch (e) {}
          }
        }
      }
    } finally {
      if (isComponentMounted.current) {
        setIsFetchingMore(false);
        setIsDataLoading(false);
        setIsLoading(false);
        isFetchingHomeRef.current = false;
      }
    }
  }, [filters]); // NO homePets.length

  const fetchFavPets = useCallback(async (reset: boolean = false) => {
    // Fail Fast: Block offline fetches fundamentally
    if (!navigator.onLine || !isOnlineRef.current) {
      setFavFetchError(null);
      setIsFetchingMoreFavs(false);
      setIsDataLoading(false);
      setIsLoading(false);
      return;
    }

    const userId = currentUserIdRef.current;
    if (!userId) return;

    if (reset) {
      setFavPage(0);
      favPageRef.current = 0;
      setFavHasMore(true);
      setFavPets([]);
      setFavFetchError(null);
    }

    if (!reset) setIsFetchingMoreFavs(true);
    else setIsDataLoading(true);

    try {
      const targetPage = reset ? 0 : favPageRef.current;
      const from = targetPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await fetchWithRetry<any[]>(async () => {
        let query = supabase
          .from('favorites')
          .select(`pet_id, pets(${PET_FEED_COLUMNS})`)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (favSearchQuery) {
          query = query.or(`name.ilike.%${favSearchQuery}%,breed.ilike.%${favSearchQuery}%`, { foreignTable: 'pets' });
        }
        return await query;
      });

      if (error) throw error;

      if (data) {
        const mapped = data.filter(f => f.pets).map(f => mapPet(f.pets));
        if (reset) {
          setFavPets(mapped);
        } else {
          setFavPets(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            return [...prev, ...mapped.filter(p => !existingIds.has(p.id))];
          });
        }
        if (data.length < PAGE_SIZE) setFavHasMore(false);
        else setFavPage(targetPage + 1);
      }
    } catch (err: any) {
      console.error("Favorites fetch error:", err);
      setFavFetchError(err.message || String(err));
    } finally {
      setIsFetchingMoreFavs(false);
      setIsDataLoading(false);
      setIsLoading(false);
    }
  }, [favSearchQuery]); // Removed favPage dependency to avoid infinite loops

  const updatePetsWithMerge = useCallback((newPetsData: Pet[]) => {
    setOtherPets(prev => {
      const petMap = new Map();
      if (Array.isArray(prev)) {
        prev.forEach((p: Pet) => petMap.set(p.id, p));
      }
      newPetsData.forEach(p => petMap.set(p.id, p));
      return Array.from(petMap.values());
    });
  }, []);

  const fetchUserSpecificData = useCallback(async (userId: string, showSkeleton = false, isAdmin: boolean = false) => {
    // Fail Fast: Block offline user-specific fetches fundamentally
    if (!navigator.onLine || !isOnlineRef.current) {
      setHasInitialData(false);
      setIsOnline(false);
      setIsUserSyncComplete(true);
      if (showSkeleton) setIsDataLoading(false);
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setIsUserSyncComplete(true);
      return;
    }
    if (showSkeleton) {
      setIsDataLoading(true);
      setIsUserSyncComplete(false);
    }
    try {
      const [
        pRes,
        cRes,
        fRes,
        mRes,
        bRes,
        rRes
      ] = await Promise.allSettled([
        fetchWithRetry(async () => await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle()),
        fetchWithRetry(async () => await supabase.from('chats').select(`${CHAT_COLUMNS}, messages(${MESSAGE_COLUMNS})`).filter('participants', 'cs', JSON.stringify([userId])).order('updated_at', { ascending: false }).order('created_at', { foreignTable: 'messages', ascending: false }).limit(10, { foreignTable: 'messages' })),
        fetchWithRetry(async () => await supabase.from('favorites').select('pet_id').eq('user_id', userId).order('created_at', { ascending: false })),
        fetchWithRetry(async () => await supabase.from('pets').select(PET_FEED_COLUMNS).eq('owner_id', userId).order('created_at', { ascending: false })),
        fetchWithRetry(async () => await supabase.from('profiles').select('id').filter('blocked_user_ids', 'cs', JSON.stringify([userId]))),
        fetchWithRetry(async () => await supabase.from('pet_reports').select('pet_id').eq('reporter_id', userId))
      ]);

      if (!isComponentMounted.current) return;

      // Handle Profile
      if (pRes.status === 'fulfilled' && pRes.value.data) {
        const profileData = pRes.value.data;
        const owner = mapProfile(profileData);
        storage.set(`shoflak_profile_${userId}`, owner).catch(() => {});
        setCurrentUser(owner);
      } else if (pRes.status === 'rejected' || (pRes.status === 'fulfilled' && pRes.value.error)) {
        console.error("Profile sync error:", (pRes as any).reason || (pRes as any).value?.error);
        setToast({ message: "Failed to sync profile data", type: 'error' });
      }

      // Handle Blocked By Them
      if (bRes.status === 'fulfilled' && bRes.value.data) {
        setBlockedByThemIds(bRes.value.data.map((p: any) => String(p.id)));
      }

      // Handle My Pets
      if (mRes.status === 'fulfilled' && mRes.value.data) {
        const myMapped = (mRes.value.data as any[]).map(mapPet);
        updatePetsWithMerge(myMapped);
      } else if (mRes.status === 'rejected' || (mRes.status === 'fulfilled' && mRes.value.error)) {
        console.error("My pets sync error:", (mRes as any).reason || (mRes as any).value?.error);
        setToast({ message: "Failed to sync your pets", type: 'error' });
      }

      // Handle Favorites IDs
      if (fRes.status === 'fulfilled' && fRes.value.data) {
        setFavorites(fRes.value.data.map((f: any) => String(f.pet_id)));
      }

      // Handle Chats
      if (cRes.status === 'fulfilled' && cRes.value.data) {
        const chatsData = cRes.value.data as any[];
        const pIds = new Set<string>();
        
        setChats(prev => {
          const newProcessedChats = chatsData.map((c: any) => {
            (c.participants || []).forEach((pid: string) => pIds.add(pid));
            
            // Preserve existing messages
            const chatIdStr = String(c.id);
            const existingChat = prev.find(ec => String(ec.id) === chatIdStr);
            const dbMessages = (c.messages || []).map(mapMessage).sort((a: any, b: any) => a.timestamp - b.timestamp);
            
            let existingMessages = (existingChat && existingChat.messages) ? existingChat.messages : [];
            
            // Merge: filter out from dbMessages what we already have in existingMessages
            const existingIds = new Set(existingMessages.map((m: any) => m.id));
            const uniqueNew = dbMessages.filter((m: any) => !existingIds.has(m.id));
            const mergedMessages = [...existingMessages, ...uniqueNew].sort((a: any, b: any) => a.timestamp - b.timestamp);
            
            const lastMsg = mergedMessages.length > 0 ? mergedMessages[mergedMessages.length - 1] : null;
            
            return {
              id: chatIdStr, 
              petId: String(c.pet_id), 
              participants: (c.participants || []).map((p: string) => String(p)), 
              lastMessage: lastMsg ? (lastMsg.type === 'image' ? (lastMsg.text || getPhotoLabel(lastMsg.imageUrls?.length || 1, currentUserRef.current?.language)) : lastMsg.text) : (c.last_message || ''), 
              timestamp: lastMsg ? lastMsg.timestamp : (c.updated_at ? new Date(c.updated_at).getTime() : Date.now()),
              messages: mergedMessages
            };
          });

          // Deduplicate and merge
          const merged = [...newProcessedChats];
          prev.forEach(pChat => {
            const pChatIdStr = String(pChat.id);
            if (!merged.find(mc => String(mc.id) === pChatIdStr)) {
              merged.push(pChat);
            }
          });
          
          return merged.sort((a, b) => b.timestamp - a.timestamp);
        });

        chatsData.forEach((c: any) => {
          (c.participants || []).forEach((pid: string) => pIds.add(pid));
        });

        if (pIds.size > 0) {
          const { data: profiles } = await supabase.from('profiles').select(PROFILE_COLUMNS).in('id', Array.from(pIds));
          if (profiles) {
            const newOwners = (profiles as any[]).map(mapProfile);
            setAllOwners(prev => {
              const combined = [...prev, ...newOwners];
              return Array.from(new Map(combined.map(o => [o.id, o])).values());
            });
          }
        }
      } else if (cRes.status === 'rejected' || (cRes.status === 'fulfilled' && cRes.value.error)) {
        console.error("Chats sync error:", (cRes as any).reason || (cRes as any).value?.error);
        setToast({ message: "Failed to sync chats", type: 'error' });
      }

      // Handle My Reports
      if (rRes.status === 'fulfilled' && rRes.value.data) {
        // Log reports count for debugging
        console.log(`Synced ${rRes.value.data.length} of my reports.`);
      }

      setHasInitialData(true);
      setIsUserSyncComplete(true);
      if (isAdmin) {
        try {
          const [
            { data: allPetsData },
            { data: allProfilesData },
            { data: allInquiriesData },
            { data: allReportsData },
            { data: allMessageReportsData }
          ] = await Promise.all([
            supabase.from('pets').select(PET_FEED_COLUMNS).order('created_at', { ascending: false }).limit(300),
            supabase.from('profiles').select(PROFILE_COLUMNS).limit(500),
            supabase.from('support_inquiries').select('id, owner_id, subject, message, created_at, is_read').order('created_at', { ascending: false }).limit(200),
            supabase.from('pet_reports').select('id, pet_id, reporter_id, reason, created_at, is_resolved').order('created_at', { ascending: false }).limit(200),
            supabase.from('message_reports').select('id, reporter_id, reported_user_id, chat_id, message_ids, reason, created_at, status').order('created_at', { ascending: false }).limit(200)
          ]);

          if (allPetsData) {
            setAdminPets(allPetsData.map(mapPet));
          }
          if (allProfilesData) {
            setAllOwners(allProfilesData.map(mapProfile));
          }
          if (allInquiriesData) {
            setAdminInquiries(allInquiriesData.map(mapSupportInquiry));
          }
          if (allReportsData) {
            setAdminReports(allReportsData.map(mapPetReport));
          }
          if (allMessageReportsData) {
            setAdminMessageReports(allMessageReportsData.map(r => ({
              id: r.id,
              reporterId: r.reporter_id,
              reportedUserId: r.reported_user_id,
              chatId: r.chat_id,
              messageIds: r.message_ids || [],
              reason: r.reason,
              timestamp: new Date(r.created_at).getTime(),
              isResolved: r.status !== 'pending'
            })));
          }
        } catch (adminErr) {
          console.error("Admin data fetch error:", adminErr);
        }
      }
    } catch (err: any) {
      console.error("User sync error:", err);
      const errStr = err?.message || String(err) || "";
      const isNetworkObjError = errStr.toLowerCase().includes('fetch') || errStr.toLowerCase().includes('network');
      
      if (isNetworkObjError || !navigator.onLine || !isOnlineRef.current) {
        setHasInitialData(false);
        setIsOnline(false); // Force offline state to trigger OfflineScreen
      }
      setIsUserSyncComplete(true);
    } finally {
      setIsUserSyncComplete(true);
      if (showSkeleton) setIsDataLoading(false);
      setIsLoading(false);
    }
  }, []);

  const markChatAsRead = useCallback(async (chatId: string) => {
    if (chatId.startsWith('new:')) return;
    const userId = currentUserRef.current?.id;
    if (!userId) return;

    // First fetch the actual messages if we don't have them (lazy load enrichment)
    const active = chatsRef.current.find(c => c.id === chatId);
    if (active && active.messages.length > 0 && !active.messages[0].text && !active.messages[0].imageUrls?.length) {
      // It's a skeleton/minimal message list, fetch full history first
      await fetchChatHistory(chatId);
    }

    setChats(prev => {
      const chat = prev.find(c => c.id === chatId);
      if (!chat) return prev;
      
      const hasUnread = chat.messages.some(m => m.senderId !== userId && !m.readBy.some(id => id === userId));
      if (!hasUnread) return prev;

      return prev.map(c => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.map(m => {
              if (m.senderId !== userId && !m.readBy.some(id => id === userId)) {
                return { ...m, readBy: [...m.readBy, userId] };
              }
              return m;
            })
          };
        }
        return c;
      });
    });

    const { data: unread, error: fetchError } = await supabase
      .from('messages')
      .select('id, read_by')
      .eq('chat_id', chatId)
      .not('sender_id', 'eq', userId);

    if (fetchError) {
      console.error("Error fetching unread messages:", fetchError);
      return;
    }

    if (unread && unread.length > 0) {
      const messagesToUpdate = unread.filter(msg => {
        const rb = Array.isArray(msg.read_by) ? msg.read_by : [];
        return !rb.some(id => String(id) === userId);
      });

      if (messagesToUpdate.length > 0) {
        // Update all unread messages in parallel for better performance
        await Promise.all(messagesToUpdate.map(msg => {
          const currentReadBy = Array.isArray(msg.read_by) ? msg.read_by : [];
          return supabase.from('messages').update({ 
            read_by: [...currentReadBy, userId] 
          }).eq('id', msg.id);
        }));
      }
    }
  }, []);

  const handleReportMessages = useCallback(async (chatId: string, reportedUserId: string, messageIds: string[], reason: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('message_reports')
        .insert({
          reporter_id: currentUser.id,
          reported_user_id: reportedUserId,
          chat_id: chatId,
          message_ids: messageIds,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;
      
      setToast({ message: translations[currentUser.language || 'en'].reportSuccess, type: 'success' });
    } catch (err) {
      console.error("Error reporting messages:", err);
      setToast({ message: "Failed to submit report. Please try again.", type: 'error' });
    }
  }, [currentUser]);

  const handleBlockUser = useCallback(async (targetId: string) => {
    if (!currentUserRef.current) return;
    const myId = currentUserRef.current.id;
    const target = targetId;
    const currentBlocks = currentUserRef.current.blockedUserIds || [];
    
    if (currentBlocks.includes(target)) return;

    const newBlocks = [...currentBlocks, target];
    setCurrentUser(prev => prev ? { ...prev, blockedUserIds: newBlocks } : null);
    await supabase.from('profiles').update({ blocked_user_ids: newBlocks }).eq('id', myId);
    
    fetchUserSpecificData(myId, false, currentUserRef.current?.isAdmin);
  }, [fetchUserSpecificData]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    currentUserIdRef.current = null;
    setFavorites([]);
    setDirection(-1);
    setView('home');
    setHistory([]);
    setIsLoggingOut(false);
  }, []);

  const handleSendMessage = async (chatId: string, content: { text?: string, imageUrls?: string[], type: 'text' | 'image' }) => {
    if (!currentUserRef.current) return;
    const currentUser = currentUserRef.current;
    
    let targetChatId = chatId;
    let newChat: Chat | null = null;

    if (chatId.startsWith('new:')) {
      const petId = chatId.split(':')[1];
      const selectedPet = allKnownPets.find(p => String(p.id) === String(petId));
      if (!selectedPet) return;
      const participants = [currentUser.id, selectedPet.ownerId].sort();

      const { data: insertedChat, error: chatErr } = await supabase.from('chats').insert({
        pet_id: petId,
        participants: participants,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select('id, pet_id, participants, updated_at, last_message').single();

      if (chatErr) {
        console.error("Failed to create chat", chatErr);
        return;
      }
      targetChatId = String(insertedChat.id);
      setSelectedChatId(targetChatId);
      newChat = {
        id: targetChatId,
        petId,
        participants,
        type: 'adoption' as const,
        timestamp: new Date(insertedChat.updated_at).getTime(),
        messages: [],
        lastMessage: content.text || (content.imageUrls && content.imageUrls.length > 0 ? "Sent a photo" : "")
      };
      if (newChat) {
        const chatToInsert = newChat;
        setChats(prev => prev.some(c => c.id === chatToInsert.id) ? prev : [chatToInsert, ...prev]);
      }
    }

    const { data: insertedMsg, error: msgErr } = await supabase.from('messages').insert({
      chat_id: targetChatId,
      sender_id: currentUser.id,
      text: content.text || '',
      image_url: content.imageUrls && content.imageUrls.length > 0 ? JSON.stringify(content.imageUrls) : null,
      type: content.type || 'text',
      read_by: [currentUser.id],
    }).select(MESSAGE_COLUMNS).single();

    if (msgErr) {
      console.error("Failed to send msg", msgErr);
      if (typeof window !== 'undefined') alert(`Message send error: ${msgErr.message}`);
      return;
    }

    const message: Message = mapMessage(insertedMsg);

    setChats(prev => prev.map(c => {
      if (c.id === targetChatId) {
        if (c.messages?.some(m => m.id === message.id)) return c;
        return {
          ...c,
          messages: [...(c.messages || []), message],
          timestamp: message.timestamp,
          lastMessage: message.type === 'image' ? 'Image' : (message.text || "")
        } as Chat;
      }
      return c;
    }));

    const lastMsgText = message.type === 'image' ? 'Image' : (message.text || "");
    await supabase.from('chats').update({ 
      updated_at: new Date().toISOString(),
      last_message: lastMsgText
    }).eq('id', targetChatId);

    const targetChat = newChat || chats.find(c => c.id === targetChatId);
    if (targetChat) {
      const otherParticipantId = targetChat.participants.find(p => String(p) !== currentUser.id);
      if (otherParticipantId) {
        // notification logic removed
      }
    }
  };


  const handleLocationComplete = async (city: string, area: string, lang: 'en' | 'ar') => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, city, area, language: lang };
    const { error } = await supabase.from('profiles').update({ city, area, language: lang }).eq('id', currentUser.id);
    if (error) {
      console.error("Error saving location:", error);
      throw error;
    }
    setCurrentUser(updatedUser);
    setView('home');
    setDirection(1);
  };

  const handleDeleteAccount = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const userId = authUser.id;
    
    setIsDeletingAccount(true);
    try {
      console.log("Starting PRIORITY account deletion for user:", userId);

      // STEP 1: WIPE PROFILE RECORD while session is 100% valid
      console.log("Wiping profile record from database...");
      const { error: profileError } = await supabase.from('profiles').update({
        name: 'Deleted User',
        city: '',
        area: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=deleted_${userId}`
      }).eq('id', userId);
      
      if (profileError) {
        console.error("Database wipe failed:", profileError);
      }

      // STEP 2: Scramble Auth Account (to prevent re-login)
      const randomPassword = Math.random().toString(36) + Math.random().toString(36) + "!" + Date.now();
      await supabase.auth.updateUser({ 
        password: randomPassword,
        data: { deleted: true, wiped: true } 
      });

      // STEP 3: Cleanup other data (preserving chats and messages)
      const { data: userPets } = await supabase.from('pets').select('id').eq('owner_id', userId);
      const petIds = userPets?.map(p => p.id) || [];
      
      await supabase.from('favorites').delete().eq('user_id', userId);
      if (petIds.length > 0) {
        await supabase.from('favorites').delete().in('pet_id', petIds);
      }
      
      // We no longer delete chats or messages to preserve conversation history
      // await supabase.from('messages').delete().eq('sender_id', userId);
      
      await supabase.from('support_inquiries').delete().eq('owner_id', userId);
      await supabase.from('pets').update({ status: 'deleted' }).eq('owner_id', userId);

      // STEP 4: Verify and Finalize
      const { data: verify } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (verify) {
        console.error("Profile record still exists. Wiping as fallback.");
        await supabase.from('profiles').update({
          name: 'DELETED_USER',
          city: '',
          area: ''
        }).eq('id', userId);
      }

      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Critical error during deletion:", err);
      await supabase.auth.signOut();
      window.location.reload();
    } finally {
      setIsDeletingAccount(false);
    }
  }, []);

  const performAdminUserDeletion = useCallback(async (targetId: string) => {
    if (!currentUser?.isAdmin) return;
    
    try {
      console.log("Admin: Deleting user data for:", targetId);

      // 1. Get user's pets
      const { data: userPets } = await supabase.from('pets').select('id').eq('owner_id', targetId);
      const petIds = userPets?.map(p => p.id) || [];

      // 2. Preserve chats and messages
      // We no longer delete chats or messages to preserve conversation history
      
      // 3. Delete other related data
      await supabase.from('favorites').delete().eq('user_id', targetId);
      if (petIds.length > 0) {
        await supabase.from('favorites').delete().in('pet_id', petIds);
      }
      
      await supabase.from('support_inquiries').delete().eq('owner_id', targetId);
      await supabase.from('pets').update({ status: 'deleted' }).eq('owner_id', targetId);
      
      // 4. Wipe profile instead of deleting
      await supabase.from('profiles').update({
        name: 'Deleted User',
        city: '',
        area: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=deleted_${targetId}`
      }).eq('id', targetId);
      
      // 5. Update local state
      setAllOwners(prev => prev.filter(o => o.id !== targetId));
      setHomePets(prev => prev.filter(p => p.ownerId !== targetId));
      setFavPets(prev => prev.filter(p => p.id !== targetId)); // favorites is pet_id list
      setOtherPets(prev => prev.filter(p => p.ownerId !== targetId));
      setAdminPets(prev => prev.filter(p => p.ownerId !== targetId));
      setChats(prev => prev.map(c => {
        if (c.participants.includes(targetId)) {
          // Keep the chat but it's now with a deleted user
          return c;
        }
        return c;
      }));

      console.log("Admin: User deletion completed.");
      fetchUserSpecificData(currentUser.id, false, true);
    } catch (err) {
      console.error("Admin: Error deleting user:", err);
    }
  }, [currentUser, fetchUserSpecificData]);

  const handleMsg = useCallback(async (payload: any) => {
    const raw = payload.new;
    if (!raw) return;
    const msg = mapMessage(raw);
    const cid = String(raw.chat_id);
    const myId = currentUserIdRef.current;
    
    if (!myId) return;

    // If this is a new message for a chat we have, ensure it's fully mapped
    setChats(prev => {
      const idx = prev.findIndex(c => String(c.id) === cid);
      if (idx === -1) {
        // ... (existing logic to fetch new chat)
        supabase.from('chats').select(CHAT_COLUMNS).eq('id', cid).single().then(({ data: chatData }) => {
          if (chatData) {
            const newChat: Chat = {
              id: String(chatData.id),
              petId: String(chatData.pet_id),
              participants: (chatData.participants || []).map((p: any) => String(p)),
              lastMessage: msg.type === 'image' ? (msg.text || getPhotoLabel(msg.imageUrls?.length || 1, currentUserRef.current?.language)) : (msg.text || ''),
              timestamp: msg.timestamp,
              messages: [msg]
            };
            setChats(curr => {
               if (curr.some(c => c.id === newChat.id)) return curr;
               return [newChat, ...curr].sort((a,b) => b.timestamp - a.timestamp);
            });
            const otherP = newChat.participants.find(p => p !== myId);
            if (otherP && !allOwnersRef.current.some(o => o.id === otherP)) {
              supabase.from('profiles').select('id, name, avatar, is_admin').eq('id', otherP).single().then(({ data: prof }) => {
                if (prof) setAllOwners(prevO => [...prevO, mapProfile(prof)]);
              });
            }
          }
        });
        return prev;
      }

      const chat = prev[idx];
      if (chat.messages.some(m => m.id === msg.id)) return prev;

      // Ensure we mark as read if active
      if (selectedChatIdRef.current === cid && msg.senderId !== myId) {
        const rb = [...msg.readBy];
        if (!rb.includes(myId)) {
          rb.push(myId);
          msg.readBy = rb;
          supabase.from('messages').update({ read_by: rb }).eq('id', msg.id);
        }
      }

      const optIdx = chat.messages.findIndex(m => m.id.startsWith('temp-') && m.text === msg.text && m.senderId === msg.senderId);
      let updatedMsgs = [...chat.messages];
      if (optIdx !== -1) {
        updatedMsgs[optIdx] = msg;
      } else {
        updatedMsgs.push(msg);
      }

      const next = [...prev];
      next[idx] = { 
        ...chat, 
        messages: updatedMsgs.sort((a,b) => a.timestamp - b.timestamp), 
        lastMessage: msg.type === 'image' ? (msg.text || getPhotoLabel(msg.imageUrls?.length || 1, currentUserRef.current?.language)) : (msg.text || ''), 
        timestamp: Math.max(chat.timestamp, msg.timestamp) 
      };
      return next.sort((a,b) => b.timestamp - a.timestamp);
    });
  }, []);

  const fetchChatHistory = useCallback(async (chatId: string) => {
    if (!chatId || chatId.startsWith('new:')) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(MESSAGE_COLUMNS)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data) {
        const fullMessages = data.map(mapMessage);
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: fullMessages } : c));
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  }, []);

  const handleMsgUpdate = useCallback((payload: any) => {
    const raw = payload.new;
    if (!raw) return;
    const msg = mapMessage(raw);
    const cid = String(raw.chat_id);

    setChats(prev => prev.map(chat => {
      if (chat.id === cid) {
        return {
          ...chat,
          messages: chat.messages.map(m => m.id === msg.id ? msg : m)
        };
      }
      return chat;
    }));
  }, []);

  useEffect(() => {
      const userId = currentUser?.id;
      if (!userId) return;
      const isAdmin = currentUser?.isAdmin || false;

    const handleChatUpdate = (payload: any) => {
      const newChat = payload.new;
      if (!newChat) return;
      
      const parts = Array.isArray(newChat.participants) ? newChat.participants : [];
      if (!parts.map((p: any) => String(p)).includes(userId)) return;
      
      // Fetch latest messages since message RLS might prevent realtime broadcast
      fetchChatHistory(String(newChat.id));
      
      setChats(prev => {
        const idx = prev.findIndex(c => String(c.id) === String(newChat.id));
        if (idx === -1) {
          fetchUserSpecificData(userId, false, isAdmin);
          return prev;
        }
        
        const next = [...prev];
        const ts = newChat.updated_at ? new Date(newChat.updated_at).getTime() : Date.now();
        next[idx] = {
          ...next[idx],
          lastMessage: newChat.last_message || next[idx].lastMessage,
          timestamp: isNaN(ts) ? next[idx].timestamp : ts,
          participants: parts.map((p: any) => String(p))
        };
        return next.sort((a,b) => b.timestamp - a.timestamp);
      });
    };

    const channel = supabase.channel('global_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleMsg)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, handleMsgUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, handleChatUpdate)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, handleMsg, handleMsgUpdate, fetchUserSpecificData, fetchChatHistory]);

  useEffect(() => {
    // We rely on the missingIds logic in the next useEffect to load profiles on-demand
    // This removes the redundant fetch of 100 profiles to save egress
  }, []);

  // Ensure we have owner profiles for the selected pet and active chat
  useEffect(() => {
    const missingIds = new Set<string>();
    
    // Check selected pet owner
    if (selectedPet) {
      const ownerId = selectedPet.ownerId;
      if (!allOwners.find(o => o.id === ownerId)) {
        missingIds.add(ownerId);
      }
    }
    
    // Check active chat participants
    if (selectedChatId) {
      let participants: string[] = [];
      if (selectedChatId.startsWith('new:')) {
        const petId = selectedChatId.split(':')[1];
        const pet = allKnownPets.find(p => p.id === petId);
        if (pet) participants = [currentUser?.id || '', pet.ownerId];
      } else {
        const chat = chats.find(c => c.id === selectedChatId);
        if (chat) participants = chat.participants;
      }
      
      participants.forEach(pid => {
        const id = pid;
        if (id && !allOwners.find(o => o.id === id)) {
          missingIds.add(id);
        }
      });
    }

    if (missingIds.size > 0) {
      supabase.from('profiles').select(PROFILE_COLUMNS).in('id', Array.from(missingIds)).then(({ data }) => {
        if (data && data.length > 0) {
          const newOwners = data.map(mapProfile);
          setAllOwners(prev => {
            const combined = [...prev, ...newOwners];
            return Array.from(new Map(combined.map(o => [o.id, o])).values());
          });
        }
      });
    }
  }, [selectedPet?.id, selectedChatId, allOwners.length, chats.length]);

  const handleAuthChange = useCallback(async (sessionUser: any) => {
    if (sessionUser) {
      setShowOnboarding(false);
      await storage.set('shoflak_onboarding_done', 'true');
    }
    
    const wasLoggedIn = !!currentUserIdRef.current;
    const isSameUser = (sessionUser?.id || null) === currentUserIdRef.current;
    
    if (isSameUser && isUserSyncComplete) {
      return;
    }
    
    try {
      if (!sessionUser) {
        setCurrentUser(null);
        currentUserIdRef.current = null;
        setFavorites([]);
        setBlockedByThemIds([]);
        setIsUserSyncComplete(true);
        setIsLoading(false);
        return;
      }

      console.log("Syncing profile for user:", sessionUser.id);
      const id = sessionUser.id;
      currentUserIdRef.current = id;
      
      // Perform profile creation logic only if needed inside handleAuthChange
      // or let useUserProfile handle the fetching.
      // For now, let's keep the core profile check logic here to ensure
      // redirects (location-setup etc) work correctly.
      
      let { data: profile, error: profileFetchError } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
      
      if (profileFetchError) {
         // ... network error handling ...
         const errStr = profileFetchError?.message || String(profileFetchError) || "";
         if (errStr.toLowerCase().includes('fetch') || !navigator.onLine) {
            const saved = await storage.getJSON<Owner>(`shoflak_profile_${id}`);
            if (saved) {
              setCurrentUser(saved);
              setIsUserSyncComplete(true);
              setIsLoading(false);
              return;
            }
         }
      }

      if ((profile && (profile.name === 'DELETED_USER' || profile.name === 'Deleted User')) || sessionUser.user_metadata?.deleted) {
        await supabase.auth.signOut();
        setDeletedAccountLoginError("Your account has been deleted. Please use another account to sign in.");
        setCurrentUser(null);
        currentUserIdRef.current = null;
        setFavorites([]);
        setIsUserSyncComplete(true);
        setIsLoading(false);
        return;
      }

      if (!profile) {
        // Create profile if missing
        const metadata = sessionUser.user_metadata || {};
        const { data: newProfile } = await supabase.from('profiles').upsert({
          id: sessionUser.id,
          name: metadata.full_name || metadata.name || 'User',
          avatar: metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.id}`,
          isAdmin: false,
          language: 'en'
        }).select(PROFILE_COLUMNS).maybeSingle();
        profile = newProfile;
      }

      if (profile) {
        const owner = mapProfile(profile);
        setCurrentUser(owner);
        // NO early setIsUserSyncComplete(true) - wait for fetchUserSpecificData
        
        // Caching for offline
        storage.set(`shoflak_profile_${id}`, owner).catch(() => {});

        // Fetch remaining user data (chats, favs, etc)
        await fetchUserSpecificData(id, false, owner.isAdmin);

        // Redirects
        if (!owner.isAdmin && (!owner.city || !owner.area)) setView('location-setup');
        else if (owner.isAdmin) setView('admin-dashboard');
        else if (['auth', 'location-setup', 'location-select'].includes(view)) setView('home');
        
        setShowAuthModal(false);
      }
    } catch (err) {
      console.error("Auth change error catch block:", err);
      setIsUserSyncComplete(true);
    } finally {
      setIsLoading(false);
      setIsDataLoading(false);
    }
  }, [view, fetchUserSpecificData, showAuthModal]);

  const handleAuthCheck = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const isNetworkErr = error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Network');
    
    if (error && (isNetworkErr || !navigator.onLine || !isOnlineRef.current)) {
      console.warn("Offline auth check failed, attempting to read local session directly");
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) {
          const storedSession = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (storedSession?.user) {
            handleAuthChange(storedSession.user);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse local session fallback", e);
      }
    }
    
    handleAuthChange(session?.user || null);
  }, [handleAuthChange]);

  const lastRefreshTime = useRef(0);
  const refreshAllData = useCallback(async () => {
    // Prevent excessive refreshes (debouncing)
    const now = Date.now();
    if (now - lastRefreshTime.current < 2000) return;
    lastRefreshTime.current = now;

    // Fail Fast: Instant Offline Lock on Boot
    if (Capacitor.isNativePlatform()) {
      const net = await Network.getStatus();
      if (!net.connected) {
         setIsOnline(false);
         setHasInitialData(false);
         setIsLoading(false);
         return;
      }
    } else {
      if (!navigator.onLine) {
         setIsOnline(false);
         setHasInitialData(false);
         setIsLoading(false);
         return;
      }
    }

    if (!currentUserIdRef.current) {
      handleAuthCheck();
      if (!isLoggingOut) {
        const parsedFilters = lastFiltersRef.current ? JSON.parse(lastFiltersRef.current) : { type: 'All', breed: '', minAge: 1, maxAge: 30, gender: 'Any', city: '', area: '' };
        fetchHomePets(true, parsedFilters);
      }
    } else {
      fetchUserSpecificData(currentUserIdRef.current, false, currentUserRef.current?.isAdmin);
    }
  }, [handleAuthCheck, fetchHomePets, fetchUserSpecificData, isLoggingOut]);

  useEffect(() => {
    // Initial network check
    if (Capacitor.isNativePlatform()) {
      Network.getStatus().then(status => {
        setIsOnline(status.connected);
      });
      Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
        if (status.connected && refreshAllData) {
          // Add a tiny delay before refreshing data to ensure network is fully stable
          setTimeout(() => refreshAllData(), 500);
        }
      });
    } else {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        if (refreshAllData) refreshAllData();
      };
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [refreshAllData]);

  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Global message listener for OAuth popups
  useEffect(() => {
    const syncSession = async (hash: string) => {
      console.log("SyncSession triggered with hash data");
      setIsSyncing(true);
      try {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log("Tokens found, forcing session...");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error && data.user) {
            handleAuthChange(data.user);
          }
        }
      } finally {
        setIsSyncing(false);
      }
    };

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        console.log("Global OAuth success signal received. Parsing tokens...");
        const { hash } = event.data.payload || {};
        if (hash) await syncSession(hash);
        else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) handleAuthChange(session.user);
        }
      }
    };

    const handleStorage = async (event: StorageEvent) => {
      if (event.key === 'supabase.auth.token' && event.newValue) {
        console.log("Session detected in storage, syncing...");
        await syncSession(event.newValue);
        try {
          localStorage.removeItem('supabase.auth.token'); // Clean up
        } catch (e) {}
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [handleAuthChange]);

  useEffect(() => {
    handleAuthCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user || null);
    });

    // Safety timeout: dismiss loading screen after 8 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
    safetyTimeoutRef.current = safetyTimeout;

    return () => {
      subscription.unsubscribe();
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [handleAuthCheck, handleAuthChange]);

  // --- Push Notifications Setup ---
  useEffect(() => {
    if (!currentUser || !Capacitor.isNativePlatform()) return;

    let isMounted = true;

    const setupPush = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive !== 'granted') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('User denied push notification permissions');
        return;
      }

      // Add listeners BEFORE registering
      PushNotifications.addListener('registration', async ({ value }) => {
        if (!isMounted) return;
        console.log('Registered for Push. Raw Token:', value);
        
        let tokenToSave = value;
        if (Capacitor.getPlatform() === 'ios') {
          try {
            const { FCM } = await import('@capacitor-community/fcm');
            const fcmToken = await FCM.getToken();
            
            // Wait sometimes the token is present and valid
            if (fcmToken && fcmToken.token) {
               tokenToSave = fcmToken.token;
            }
            console.log('Got FCM Token for iOS:', tokenToSave);
          } catch (err) {
            console.warn('Failed to get FCM token on iOS (GoogleService-Info.plist might be missing):', err);
          }
        }
        
        if (currentUser.fcmToken !== tokenToSave) {
          const { error } = await supabase.from('profiles').update({ fcm_token: tokenToSave }).eq('id', currentUser.id);
          if (!error) {
            setCurrentUser(prev => prev ? { ...prev, fcmToken: tokenToSave } : prev);
          }
        }
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration:', JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received (foreground):', notification);
        const data = notification.data || (notification as any).notification?.data;
        let shouldShowLocal = true;
        
        if (data?.type === 'chat_message' && data?.chatId) {
          if (viewRef.current === 'chat-room' && selectedChatIdRef.current === data.chatId) {
            shouldShowLocal = false;
          }
        }
        
        if (shouldShowLocal) {
          LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 1000000),
                title: notification.title || 'New Notification',
                body: notification.body || '',
                sound: 'default',
                extra: data || {}
              }
            ]
          });
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed:', notification);
        const data = notification.notification.data;
        if (data) {
          if (data.type === 'chat_message' && data.chatId) {
            setSelectedChatId(data.chatId);
            setHistory(prev => [...prev, 'chat-room']);
            setView('chat-room');
          } else if (data.type === 'pet_status') {
            setHistory(prev => [...prev, 'profile']);
            setView('profile');
          } else if (data.type === 'announcement') {
            setHistory(prev => [...prev, 'home']);
            setView('home');
          }
        }
      });

      // Android 8+ requires a notification channel to display notifications
      try {
        await PushNotifications.createChannel({
          id: 'default',
          name: 'Shoflak Klba Messages',
          description: 'Receive notifications for new messages',
          importance: 5,
          visibility: 1,
          vibration: true,
        });
      } catch (err) {
        console.log('Channel creation error (usually ignored on iOS):', err);
      }

      try {
        await PushNotifications.register();
      } catch (err) {
        console.warn('PushNotifications register failed:', err);
      }

      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Local notification action performed:', notification);
        const data = notification.notification.extra;
        if (data) {
          if (data.type === 'chat_message' && data.chatId) {
            setSelectedChatId(data.chatId);
            setHistory(prev => [...prev, 'chat-room']);
            setView('chat-room');
          } else if (data.type === 'pet_status') {
            setHistory(prev => [...prev, 'profile']);
            setView('profile');
          } else if (data.type === 'announcement') {
            setHistory(prev => [...prev, 'home']);
            setView('home');
          }
        }
      });
    };

    setupPush();

    return () => {
      isMounted = false;
      PushNotifications.removeAllListeners();
      LocalNotifications.removeAllListeners();
    };
  }, [currentUser?.id]);
  // --------------------------------

  useEffect(() => { 
    const userId = currentUser?.id || null;
    const authChanged = userId !== lastUserIdRef.current;
    
    if (view === 'home' || view === 'favorites' || view === 'detail') {
       const filtersStr = JSON.stringify(filters);
       const categoryChanged = activeCategory !== lastCategoryRef.current;
       const filtersChanged = filtersStr !== lastFiltersRef.current;
       const viewChanged = view !== lastViewRef.current;
       
       if (categoryChanged || filtersChanged || authChanged || viewChanged) {
         // Update refs first to prevent redundant triggers
         lastCategoryRef.current = activeCategory;
         lastFiltersRef.current = filtersStr;
         lastUserIdRef.current = userId;
         lastViewRef.current = view;
         
         // Only refresh home pets if on home or if auth/filters changed significantly
         if (view === 'home' || authChanged || filtersChanged || categoryChanged) {
           fetchHomePets(true);
         }
       }
    } else {
      if (authChanged) {
        lastUserIdRef.current = userId;
      }
    }
  }, [filters, activeCategory, currentUser?.id, fetchHomePets, view]);

  useEffect(() => {
    if (view === 'favorites' && currentUser) {
      const searchChanged = favSearchQuery !== lastFavSearchRef.current;
      const favsCountChanged = favorites.length !== lastFavsCountRef.current;
      const viewChanged = view !== lastViewRef.current;
      
      if (searchChanged || favsCountChanged || viewChanged) {
        lastFavSearchRef.current = favSearchQuery;
        lastFavsCountRef.current = favorites.length;
        lastViewRef.current = view;
        fetchFavPets(true);
      }
    } else if (view !== 'favorites') {
      lastViewRef.current = view;
    }
  }, [view, currentUser?.id, favSearchQuery, favorites.length, favFetchError, fetchFavPets]);

  const filteredHomePets = useMemo(() => {
    const iBlocked = (currentUser?.blockedUserIds || []);
    const theyBlocked = blockedByThemIds;
    const reported = currentUser?.reportedPetIds || [];
    const myId = currentUser?.id;
    
    return homePets.filter(p => {
      const ownerId = p.ownerId;
      return ownerId !== myId && !iBlocked.includes(ownerId) && !theyBlocked.includes(ownerId) && !reported.includes(p.id);
    });
  }, [homePets, currentUser?.id, currentUser?.blockedUserIds, currentUser?.reportedPetIds, blockedByThemIds, isUserSyncComplete]);

  const filteredFavPets = useMemo(() => {
    const iBlocked = (currentUser?.blockedUserIds || []);
    const theyBlocked = blockedByThemIds;
    const reported = currentUser?.reportedPetIds || [];
    const favIds = new Set(favorites);
    
    return favPets.filter(p => {
      const ownerId = p.ownerId;
      return favIds.has(p.id) && !iBlocked.includes(ownerId) && !theyBlocked.includes(ownerId) && !reported.includes(p.id);
    });
  }, [favPets, currentUser?.blockedUserIds, currentUser?.reportedPetIds, blockedByThemIds, favorites, isUserSyncComplete]);

  const filteredChats = useMemo(() => {
    const myId = (currentUser?.id || '');
    if (!myId) return chats;
    const myBlocks = (currentUser?.blockedUserIds || []);
    const theyBlocked = blockedByThemIds;
    
    return chats.filter((chat) => {
      const otherId = chat.participants.find(p => p !== myId);
      if (!otherId) return false;
      
      const iBlockedThem = myBlocks.includes(otherId);
      const theyBlockedMe = theyBlocked.includes(otherId);
      
      return !iBlockedThem && !theyBlockedMe;
    });
  }, [chats, currentUser?.id, currentUser?.blockedUserIds, blockedByThemIds, isUserSyncComplete]);

  const unreadCount = useMemo(() => {
    const myId = (currentUser?.id || '');
    if (!myId) return 0;
    
    return filteredChats.filter((chat) => 
      chat.messages.some(m => 
        m.senderId !== myId && 
        !m.readBy.some(rid => rid === myId)
      )
    ).length;
  }, [filteredChats, currentUser?.id]);

  const allKnownPets = useMemo(() => {
    const combined = [...homePets, ...favPets, ...otherPets, ...adminPets];
    return Array.from(new Map(combined.map(p => [p.id, p])).values());
  }, [homePets, favPets, otherPets, adminPets]);

  const isTransitioning = useRef(false);
  const handleScroll = useCallback((top: number) => {
    if (!isTransitioning.current) {
      scrollPositions.current[view] = top;
    }
  }, [view]);

  useEffect(() => {
    const saved = scrollPositions.current[view] || 0;
    isTransitioning.current = true;
    
    // Give the DOM enough time to completely render the target view's list 
    // before applying scroll lock on slower processors.
    let timeoutId: NodeJS.Timeout;
    const rfId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        const main = document.getElementById('app-main');
        if (main) {
           main.scrollTo({ top: saved, behavior: 'instant' });
        }
        isTransitioning.current = false;
      }, 0);
    });

    return () => {
      cancelAnimationFrame(rfId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [view]);

  const handleMarkRead = useCallback(() => {
    if (selectedChatId) {
      markChatAsRead(selectedChatId);
    }
  }, [selectedChatId, markChatAsRead]);

  // The rest of the app handles its own loading states (skeletons)

  const getActiveChatPet = () => {
    if (!selectedChatId) return null;
    const petIdMatch = selectedChatId.startsWith('new:') ? selectedChatId.split(':')[1] : null;
    if (petIdMatch) {
       return allKnownPets.find(p => p.id === petIdMatch) || selectedPet;
    }
    const currentChat = chats.find(c => c.id === selectedChatId);
    if (!currentChat) return selectedPet;
    return allKnownPets.find(p => p.id === currentChat.petId) || selectedPet;
  };

  const ROOT_TABS = ['home', 'chats', 'favorites', 'profile', 'admin-dashboard'];
  const isRootView = ROOT_TABS.includes(view);
  const activeRootTab = isRootView 
    ? view 
    : (history.slice().reverse().find(v => ROOT_TABS.includes(v)) || 'home');

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
      opacity: direction === 0 ? 1 : 0,
      zIndex: 120
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 110,
      transition: {
        x: { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
      opacity: 0,
      zIndex: 100,
      transition: {
        x: { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 },
        opacity: { duration: 0.15 }
      }
    })
  };

  const appLang = currentUser?.language || 'en';
  const tStr = translations[appLang];

  if (!isOnline && !hasInitialData && !isLoading) {
    return (
      <>
        <OfflineScreen onRetry={refreshAllData} language={appLang} />
      </>
    );
  }

  if (showOnboarding && !currentUser) {
    return (
      <>
        <OnboardingView onComplete={async () => {
          setShowOnboarding(false);
          await storage.set('shoflak_onboarding_done', 'true');
          setShowAuthModal(true);
        }} />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {!isOnline && hasInitialData && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className={`fixed top-0 left-0 right-0 z-[5000] p-2 sm:p-3 shadow-lg flex items-center justify-center gap-2 font-bold text-sm text-center
              ${isDarkMode ? 'bg-red-900/90 text-red-100 backdrop-blur-xl border-b border-red-800' : 'bg-red-500 text-white'}`}
          >
           <Loader2 size={16} className="animate-spin opacity-80" />
           {tStr.youAreOffline}
          </motion.div>
        )}
      </AnimatePresence>

      <Layout 
      currentView={view} 
      onViewChange={(nv) => {
        if (!currentUser && ['chats', 'favorites', 'profile'].includes(nv)) {
          setShowAuthModal(true);
          return;
        }

        setProfileMenuInitial(false);

        const currentIdx = VIEW_ORDER[view] ?? -1;
        const nextIdx = VIEW_ORDER[nv] ?? -1;
        
        if (['home', 'chats', 'favorites', 'profile', 'admin-dashboard'].includes(nv) && ['home', 'chats', 'favorites', 'profile', 'admin-dashboard'].includes(view)) {
          setDirection(0); // 0 means no animation
        } else if (currentIdx !== -1 && nextIdx !== -1) {
          setDirection(nextIdx >= currentIdx ? 1 : -1);
        } else {
          setDirection(1);
        }

        setView(nv);
      }} 
      unreadCount={unreadCount} 
      currentUser={currentUser}
      onScroll={handleScroll}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-6 right-6 z-[200] flex justify-center pointer-events-none"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center space-x-3 pointer-events-auto ${
              toast.type === 'success' 
                ? 'bg-green-500/90 border-green-400 text-white' 
                : 'bg-red-500/90 border-red-400 text-white'
            }`}>
              {toast.type === 'success' ? (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              ) : (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <X size={14} />
                </div>
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Root Tabs: Keep these mounted to perfectly preserve scroll, state, and DOM. Toggle visibility instead of unmounting. */}
      <>
        <div className="w-full min-h-full" style={{ display: isRootView && activeRootTab === 'home' ? 'block' : 'none' }}>
            <HomeFeed 
              isActive={view === 'home' && !selectedPet}
              pets={filteredHomePets} activeCategory={activeCategory}
              onCategoryChange={(cat) => { setActiveCategory(cat); setFilters(prev => ({ ...prev, type: cat })); }}
              onPetClick={async (p) => { 
                setDirection(1);
                setSelectedPet(p); 
                setHistory(prev => [...prev, 'home']); 
                setView('detail'); 
                // Fetch full details if needed
                const { data } = await supabase.from('pets').select(PET_COLUMNS).eq('id', p.id).single();
                if (data) setSelectedPet(mapPet(data));
              }} 
              favorites={favorites}
              onToggleFavorite={async (pid) => {
                 if (!currentUser) { 
                   setShowAuthModal(true);
                   return; 
                 }
                 const isFav = favorites.includes(pid);
                 setFavorites(prev => isFav ? prev.filter(id => id !== pid) : [pid, ...prev]);
                 if (isFav) await supabase.from('favorites').delete().match({ user_id: currentUser.id, pet_id: pid });
                 else await supabase.from('favorites').insert({ user_id: currentUser.id, pet_id: pid });
                 // Removed redundant fetchUserSpecificData
              }}
              filters={filters} onFilterChange={setFilters}
              currentUser={currentUser} isLoading={isDataLoading && homePets.length === 0}
              viewMode={homeViewMode} onViewModeChange={setHomeViewMode}
              onLoadMore={() => fetchHomePets(false)} hasMore={hasMore} isFetchingMore={isFetchingMore}
              error={homeFetchError} onRetry={() => fetchHomePets(true)}
            />
        </div>

        <div className="w-full min-h-full" style={{ display: isRootView && activeRootTab === 'favorites' ? 'block' : 'none' }}>
            {currentUser && (
              <FavoritesView 
                pets={filteredFavPets} 
                favorites={favorites} 
                currentUser={currentUser}
                onPetClick={async (p) => { 
                  setDirection(1);
                  setSelectedPet(p); 
                  setHistory(prev => [...prev, 'favorites']); 
                  setView('detail'); 
                  const { data } = await supabase.from('pets').select(PET_COLUMNS).eq('id', p.id).single();
                  if (data) setSelectedPet(mapPet(data));
                }}
                onToggleFavorite={async (pid) => {
                   if (!currentUser) return;
                   const isFav = favorites.includes(pid);
                   setFavorites(prev => isFav ? prev.filter(id => id !== pid) : [pid, ...prev]);
                   if (isFav) await supabase.from('favorites').delete().match({ user_id: currentUser.id, pet_id: pid });
                   else await supabase.from('favorites').insert({ user_id: currentUser.id, pet_id: pid });
                   // No need to fetchUserSpecificData here, local state is already updated
                }}
                searchQuery={favSearchQuery}
                onSearchChange={setFavSearchQuery}
                isLoading={isDataLoading && favPets.length === 0}
                onLoadMore={() => fetchFavPets(false)}
                hasMore={favHasMore}
                isFetchingMore={isFetchingMoreFavs}
                onLogin={() => { setDirection(1); setView('auth'); }}
                error={favFetchError}
                onRetry={() => fetchFavPets(true)}
              />
            )}
        </div>

        <div className="w-full min-h-full" style={{ display: isRootView && activeRootTab === 'chats' ? 'block' : 'none' }}>
            {currentUser && (
              <ChatListView 
                chats={filteredChats} 
                pets={allKnownPets} 
                owners={allOwners} 
                currentUser={currentUser}
                onChatSelect={(id) => { setDirection(1); setSelectedChatId(id); markChatAsRead(id); setHistory(prev => [...prev, 'chats']); setView('chat-room'); }}
                isLoading={isDataLoading}
                onLogin={() => { setDirection(1); setView('auth'); }}
              />
            )}
        </div>

        <div className="w-full min-h-full" style={{ display: isRootView && activeRootTab === 'profile' ? 'block' : 'none' }}>
            {currentUser && (
              <ProfileView 
                isActive={view === 'profile' && !selectedPet}
                pets={allKnownPets} owner={currentUser} isLoading={isDataLoading}
                initialShowMenu={profileMenuInitial}
                onRetry={() => {
                  if (currentUserIdRef.current) {
                    fetchUserSpecificData(currentUserIdRef.current, true, currentUserRef.current?.isAdmin);
                  }
                }}
                onAddPet={async (p) => { 
                  if (!currentUser) return; 
                  try {
                    const dbMapped = mapPetToDb({ ...p, ownerId: currentUser.id });
                    const { data, error } = await supabase.from('pets').insert(dbMapped).select(PET_COLUMNS);
                    if (error) {
                      console.error("Error inserting pet:", error);
                    } else if (data && data.length > 0) {
                      const newlyAddedPet = mapPet(data[0]);
                      updatePetsWithMerge([newlyAddedPet]);
                      // Background refresh
                      fetchUserSpecificData(currentUser.id, false, currentUser.isAdmin); 
                    }
                  } catch (err: any) {
                    console.error("Critical error adding pet:", err);
                  }
                }}
                onUpdatePet={async (p) => { 
                  if (!currentUser) return false; 
                  const dbMapped = mapPetToDb(p);
                  dbMapped.status = 'pending';
                  const { data, error } = await supabase.from('pets').update(dbMapped).eq('id', p.id).select(PET_COLUMNS);
                  if (error) {
                    console.error("Error updating pet:", error);
                    return false;
                  }
                  if (data && data.length > 0) {
                    const updated = mapPet(data[0]);
                    updatePetsWithMerge([updated]);
                  }
                  fetchUserSpecificData(currentUser.id, false, currentUser.isAdmin); 
                  return true; 
                }}
                onDeletePet={async (id) => { 
                  if (!currentUser) return; 
                  await supabase.from('pets').update({ status: 'deleted' }).eq('id', id); 
                  setHomePets(prev => prev.filter(p => p.id !== id));
                  setFavPets(prev => prev.filter(p => p.id !== id));
                  setOtherPets(prev => prev.filter(p => p.id !== id));
                  setAdminPets(prev => prev.filter(p => p.id !== id));
                  fetchUserSpecificData(currentUser.id, false, currentUser.isAdmin); 
                }}
                isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                onLogout={handleLogout} 
                onGoToAccount={() => { setDirection(1); setHistory(prev => [...prev, 'profile']); setProfileMenuInitial(false); setView('account-details'); }}
                onGoToBlocked={() => { setDirection(1); setHistory(prev => [...prev, 'profile']); setProfileMenuInitial(false); setView('blocked-users'); }} onGoToContactUs={() => { setDirection(1); setHistory(prev => [...prev, 'profile']); setProfileMenuInitial(false); setView('contact-us'); }}
                onUpdateOwner={async (o) => { 
                  if (!currentUser) return; 
                  const dbData = mapOwnerToDb(o);
                  const { error } = await supabase.from('profiles').update(dbData).eq('id', o.id);
                  if (error) {
                    console.error("Update profile error:", error);
                  } else {
                    setCurrentUser(o); 
                    setAllOwners(prev => prev.map(existing => existing.id === o.id ? o : existing));
                  }
                }}
                onPetClick={async (p) => { 
                  setDirection(1);
                  setSelectedPet(p); 
                  setHistory(prev => [...prev, 'profile']);
                  setView('detail'); 
                  const { data } = await supabase.from('pets').select(PET_COLUMNS).eq('id', p.id).single();
                  if (data) setSelectedPet(mapPet(data));
                }} 
                onLogin={() => { setDirection(1); setView('auth'); }}
              />
            )}
        </div>

        <div className="w-full min-h-full" style={{ display: isRootView && activeRootTab === 'admin-dashboard' ? 'block' : 'none' }}>
            {currentUser?.isAdmin && (
              <AdminDashboard
                pets={allKnownPets}
                owners={allOwners}
                inquiries={adminInquiries}
                onApprove={async (id) => {
                  await supabase.from('pets').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
                  fetchUserSpecificData(currentUser.id, false, true);
                }}
                onReject={async (id) => {
                  await supabase.from('pets').update({ status: 'rejected' }).eq('id', id);
                  fetchUserSpecificData(currentUser.id, false, true);
                }}
                onDeletePet={async (id) => {
                  await supabase.from('pets').update({ status: 'deleted' }).eq('id', id);
                  setHomePets(prev => prev.filter(p => p.id !== id));
                  setFavPets(prev => prev.filter(p => p.id !== id));
                  setOtherPets(prev => prev.filter(p => p.id !== id));
                  setAdminPets(prev => prev.filter(p => p.id !== id));
                  fetchUserSpecificData(currentUser.id, false, true);
                }}
                onMarkInquiryRead={async (id) => {
                  await supabase.from('support_inquiries').update({ is_read: true }).eq('id', id);
                  setAdminInquiries(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
                }}
                onDeleteInquiry={async (id) => {
                  await supabase.from('support_inquiries').delete().eq('id', id);
                  setAdminInquiries(prev => prev.filter(i => i.id !== id));
                }}
                reports={adminReports}
                messageReports={adminMessageReports}
                onResolveReport={async (id) => {
                  await supabase.from('pet_reports').update({ is_resolved: true }).eq('id', id);
                  setAdminReports(prev => prev.map(r => r.id === id ? { ...r, isResolved: true } : r));
                }}
                onDeleteReport={async (id) => {
                  await supabase.from('pet_reports').delete().eq('id', id);
                  setAdminReports(prev => prev.filter(r => r.id !== id));
                }}
                onResolveMessageReport={async (id) => {
                  await supabase.from('message_reports').update({ status: 'resolved' }).eq('id', id);
                  setAdminMessageReports(prev => prev.map(r => r.id === id ? { ...r, isResolved: true } : r));
                }}
                onDeleteMessageReport={async (id) => {
                  await supabase.from('message_reports').delete().eq('id', id);
                  setAdminMessageReports(prev => prev.filter(r => r.id !== id));
                }}
                onDeleteUser={performAdminUserDeletion}
                onLogout={handleLogout} 
                onViewPet={async (p) => { 
                  setDirection(1); 
                  const { data } = await supabase.from('pets').select(PET_COLUMNS).eq('id', p.id).single();
                  if (data) setSelectedPet(mapPet(data));
                  else setSelectedPet(p);
                  setHistory(prev => [...prev, 'admin-dashboard']); 
                  setView('detail'); 
                }}
                onViewUser={(id) => { setDirection(1); setSelectedOwnerId(id); setHistory(prev => [...prev, 'admin-dashboard']); setView('owner-profile'); }}
                currentUser={currentUser}
                activeTab={adminTab}
                setActiveTab={setAdminTab}
                onRefreshData={() => fetchUserSpecificData(currentUser.id, true, true)}
              />
            )}
        </div>
      </>

      {/* Sub views overlay */}
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        {!['home', 'chats', 'favorites', 'profile', 'admin-dashboard'].includes(view) && (
          <motion.div
            key={view}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className={`fixed inset-0 z-[100] bg-white dark:bg-[#1a1a1a] ${['chat-room', 'detail', 'owner-profile', 'auth'].includes(view) ? 'overflow-hidden h-screen' : 'overflow-y-auto min-h-full'} hide-scrollbar transform-gpu will-change-transform`}
          >
            <div className={`${view === 'chat-room' ? 'h-full' : 'min-h-full'} flex flex-col`}>
              {view === 'auth' && (
            <LoginView 
              onLogin={(u) => { setDirection(1); setCurrentUser(u); setView('home'); setDeletedAccountLoginError(null); }} 
              existingOwners={allOwners} 
              onBack={goBack}
              externalError={deletedAccountLoginError}
            />
          )}
          
          {view === 'detail' && selectedPet && (
            <PetDetail 
              pet={selectedPet} owners={allOwners} currentUser={currentUser} isLoading={isDataLoading}
              onBack={goBack} 
              onReport={async (reason) => {
                if (!selectedPet || !currentUser) return;
                
                // 1. Submit the report
                await supabase.from('pet_reports').insert({
                  pet_id: selectedPet.id,
                  reporter_id: currentUser.id,
                  reason: reason
                });

                // 2. Remove from favorites if it exists
                const isFav = favorites.includes(selectedPet.id);
                if (isFav) {
                  setFavorites(prev => prev.filter(id => id !== selectedPet.id));
                  await supabase.from('favorites').delete().match({ user_id: currentUser.id, pet_id: selectedPet.id });
                }

                // 3. Hide it from the user immediately (Database update)
                const currentReported = currentUser.reportedPetIds || [];
                if (!currentReported.includes(selectedPet.id)) {
                  const newReported = [...currentReported, selectedPet.id];
                  setCurrentUser(prev => prev ? { ...prev, reportedPetIds: newReported } : null);
                  await supabase.from('profiles').update({ reported_pet_ids: newReported }).eq('id', currentUser.id);
                }

                // 4. Show feedback
                setToast({ message: translations[currentUser.language || 'en'].reportSuccess, type: 'success' });

                // 5. Go back to previous view
                goBack();
                
                // 6. Refresh user data after a short delay to sync with DB
                setTimeout(() => {
                  if (currentUser) fetchUserSpecificData(currentUser.id, false, currentUser.isAdmin);
                }, 2000);
              }}
              onChat={async () => {
                 if (!currentUser) { 
                   setShowAuthModal(true);
                   return; 
                 }
                 
                 setDirection(1);
                 setHistory(prev => [...prev, view]);

                 const p = [currentUser.id, selectedPet.ownerId].sort();
                 const { data: ex } = await supabase.from('chats')
                   .select('id')
                   .eq('pet_id', selectedPet.id)
                   .filter('participants', 'cs', JSON.stringify(p))
                   .maybeSingle();

                 if (ex) { 
                   setSelectedChatId(ex.id); 
                   markChatAsRead(ex.id); 
                   setDirection(1);
                   setView('chat-room'); 
                 }
                 else {
                   setSelectedChatId(`new:${selectedPet.id}`);
                   setDirection(1);
                   setView('chat-room');
                 }
              }} 
              onViewOwner={(id) => { 
                setDirection(1);
                setSelectedOwnerId(id); 
                setHistory(prev => [...prev, view]);
                setView('owner-profile'); 
              }}
            />
          )}

          {view === 'owner-profile' && selectedOwnerId && (
            <OwnerProfile 
              ownerId={selectedOwnerId} pets={allKnownPets} owners={allOwners} currentUser={currentUser} isLoading={isDataLoading}
              onBack={goBack} onPetClick={async (p) => { 
                setDirection(1);
                setSelectedPet(p); 
                setHistory(prev => [...prev, view]);
                setView('detail'); 
                const { data } = await supabase.from('pets').select(PET_COLUMNS).eq('id', p.id).single();
                if (data) setSelectedPet(mapPet(data));
              }}
            />
          )}

          {view === 'blocked-users' && currentUser && (
            <BlockedUsersView 
              blockedIds={currentUser.blockedUserIds || []} 
              owners={allOwners} 
              currentUser={currentUser}
              onBack={goBack}
              onUnblock={async (id) => {
                const target = id;
                const newBlocks = (currentUser.blockedUserIds || []).filter(rid => rid !== target);
                setCurrentUser({ ...currentUser, blockedUserIds: newBlocks });
                await supabase.from('profiles').update({ blocked_user_ids: newBlocks }).eq('id', currentUser.id);
                fetchUserSpecificData(currentUser.id, false, currentUser.isAdmin);
              }}
            />
          )}

          {view === 'chat-room' && currentUser && selectedChatId && (() => {
            const petId = selectedChatId.startsWith('new:') ? selectedChatId.split(':')[1] : '';
            const associatedPet = petId ? allKnownPets.find(p => String(p.id) === petId) || null : null;
            const otherParticipantId = associatedPet?.ownerId;
            const participants = otherParticipantId ? [currentUser.id, otherParticipantId] : [currentUser.id];
            const chatObject = selectedChatId.startsWith('new:') 
              ? { id: selectedChatId, type: 'adoption', petId, participants, messages: [], timestamp: Date.now(), initialized: false, lastMessage: "" } as Chat
              : (chats.find(c => String(c.id) === selectedChatId) as Chat) || { id: selectedChatId, type: 'adoption', petId: '', participants: [], messages: [], timestamp: Date.now(), initialized: true, lastMessage: "" } as Chat;
            const finalPet = selectedChatId.startsWith('new:') ? associatedPet : (allKnownPets.find(p => String(p.id) === String((chats.find(c => String(c.id) === selectedChatId))?.petId)) || null);
            return (
              <ChatRoom 
                chat={chatObject}
                pet={finalPet}
                currentUser={currentUser}
                isOnline={isOnline}
                onBack={goBack}
                onSendMessage={handleSendMessage}
                onViewProfile={(id) => { 
                  setDirection(1);
                  setSelectedOwnerId(id); 
                  setHistory(prev => [...prev, view]);
                  setView('owner-profile'); 
                }}
                onBlock={async (id) => {
                   const newBlocks = [...(currentUser.blockedUserIds || []), id];
                   setCurrentUser({ ...currentUser, blockedUserIds: newBlocks });
                   await supabase.from('profiles').update({ blocked_user_ids: newBlocks }).eq('id', currentUser.id);
                   goBack();
                }}
                onMarkRead={() => markChatAsRead(selectedChatId)}
                onReportMessages={handleReportMessages}
                onFetchHistory={fetchChatHistory}
                owners={allOwners}
              />
            );
          })()}

          {view === 'account-details' && currentUser && (
            <AccountDetailsView
              owner={currentUser}
              onBack={goBack}
              onUpdateOwner={async (o) => {
                const dbData = mapOwnerToDb(o);
                const { error } = await supabase.from('profiles').update(dbData).eq('id', o.id);
                if (error) {
                  console.error("Account update error:", error);
                  throw error;
                } else {
                  setCurrentUser(o);
                  // Also update in allOwners to reflect changes across the app (chats, lists, etc)
                  setAllOwners(prev => prev.map(existing => existing.id === o.id ? o : existing));
                }
              }}
              onDeleteAccount={handleDeleteAccount}
              isLoading={isDataLoading}
            />
          )}

          {view === 'contact-us' && currentUser && (
            <ContactUsView
              onBack={goBack}
              currentUser={currentUser}
              onSendInquiry={async (msg) => {
                await supabase.from('support_inquiries').insert({
                  owner_id: msg.ownerId,
                  subject: msg.subject,
                  message: msg.message,
                  is_read: false
                });
              }}
              isLoading={isDataLoading}
            />
          )}

          {view === 'admin-inquiries' && currentUser?.isAdmin && (
            <AdminInquiriesView
              inquiries={adminInquiries} 
              owners={allOwners}
              onMarkRead={async (id) => {
                 await supabase.from('support_inquiries').update({ is_read: true }).eq('id', id);
                 setAdminInquiries(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
              }}
              onDelete={async (id) => {
                 await supabase.from('support_inquiries').delete().eq('id', id);
                 setAdminInquiries(prev => prev.filter(i => i.id !== id));
              }}
              currentUser={currentUser}
            />
          )}

          {view === 'location-setup' && currentUser && (
            <LocationSetupView 
              owner={currentUser}
              onComplete={handleLocationComplete}
              onLogout={handleLogout}
            />
          )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overscroll-none touch-none" onClick={(e) => { e.preventDefault(); setShowAuthModal(false); }}>
          <div className="w-[88%] sm:w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in duration-300" onClick={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 z-[210] p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm active:scale-90"
            >
              <X size={20} />
            </button>
            <div className="overflow-y-auto hide-scrollbar max-h-[85vh]">
              <LoginView 
                onLogin={(u) => { setCurrentUser(u); setShowAuthModal(false); setDeletedAccountLoginError(null); }} 
                existingOwners={allOwners}
                isInline={true}
                externalError={deletedAccountLoginError}
              />
            </div>
          </div>
        </div>
      )}

      {(isLoggingOut || isDeletingAccount || isSyncing) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-gray-100 dark:border-zinc-800">
            <Loader2 className={`w-5 h-5 animate-spin ${isDeletingAccount ? 'text-red-500' : 'text-[#e2a05e]'}`} />
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              {isSyncing 
                ? (currentUser?.language === 'ar' || (typeof window !== 'undefined' && document.documentElement.dir === 'rtl') ? 'مزامنة...' : 'Syncing...')
                : isDeletingAccount 
                  ? (currentUser?.language === 'ar' ? 'جاري الحذف...' : 'Deleting...') 
                  : (currentUser?.language === 'ar' ? 'تسجيل الخروج...' : 'Logging out...')
              }
            </span>
          </div>
        </div>
      )}

      </Layout>
    </>
  );
};

export default App;
