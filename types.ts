
export type PetType = 'All' | 'Dog' | 'Cat' | 'Bird' | 'Other';
export type Gender = 'Male' | 'Female' | 'Any';
export type PetStatus = 'pending' | 'approved' | 'rejected' | 'deleted';

export interface AreaData {
  en: string;
  ar: string;
}

export interface CityData {
  en: string;
  ar: string;
  areas: AreaData[];
}

export interface Pet {
  id: string;
  name: string;
  age: number;
  breed: string;
  location: string;
  description: string;
  gender: 'Male' | 'Female';
  type: PetType;
  isVaccinated: boolean;
  personality: string[];
  images: string[];
  ownerId: string;
  status: PetStatus;
  approvedAt?: number;
  createdAt?: number;
}

export interface Owner {
  id: string;
  name: string;
  username?: string;
  city: string;
  area: string;
  avatar: string;
  email?: string;
  blockedUserIds?: string[];
  reportedPetIds?: string[];
  language?: 'en' | 'ar';
  isAdmin?: boolean;
  phone?: string;
  fcmToken?: string | null;
}

export interface SupportMessage {
  id: string;
  ownerId: string;
  subject: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

export interface PetReport {
  id: string;
  petId: string;
  reporterId: string;
  reason: string;
  timestamp: number;
  isResolved: boolean;
}

export interface MessageReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  chatId: string;
  messageIds: string[];
  reason: string;
  timestamp: number;
  isResolved: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrls?: string[];
  type: 'text' | 'image';
  timestamp: number;
  readBy: string[];
}

export interface Chat {
  id: string;
  participants: string[];
  petId: string;
  lastMessage: string;
  timestamp: number;
  messages: Message[];
  type?: 'adoption' | 'regular';
  initialized?: boolean;
}

export interface Filters {
  type: PetType;
  breed: string;
  minAge: number;
  maxAge: number;
  gender: Gender;
  city: string;
  area: string;
}

export type View = 'auth' | 'home' | 'favorites' | 'chats' | 'profile' | 'detail' | 'chat-room' | 'owner-profile' | 'account-details' | 'blocked-users' | 'contact-us' | 'admin-dashboard' | 'admin-inquiries' | 'admin-reports' | 'location-setup';
