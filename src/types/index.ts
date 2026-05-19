export type BusinessType = 'dentist' | 'car_rental' | 'salon' | 'clinic' | 'coaching' | 'other';
export type Plan = 'starter' | 'growth' | 'agency';
export type ConversationStatus = 'open' | 'bot' | 'human' | 'closed';
export type MessageDirection = 'inbound' | 'outbound';
export type Intent = 'INQUIRY' | 'BOOKING_REQUEST' | 'COMPLAINT' | 'CONFIRMATION' | 'GREETING' | 'UNKNOWN';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type UserRole = 'owner' | 'agent' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  businessType: BusinessType;
  whatsappNumber: string;
  plan: Plan;
  trialEndsAt: string;
  createdAt: string;
}

export interface User {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  waId: string;
  name: string;
  phone: string;
  language: string;
  tags: string[];
  lastSeenAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  contact: Contact;
  status: ConversationStatus;
  assignedTo?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  content: string;
  mediaUrl?: string;
  msgType: string;
  intent?: Intent;
  confidenceScore?: number;
  sentAt: string;
}

export interface Booking {
  id: string;
  workspaceId: string;
  contactId: string;
  contact: Contact;
  serviceType: string;
  scheduledAt: string;
  durationMins: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  templateId: string;
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  clickedCount: number;
  status: CampaignStatus;
  createdAt: string;
}

export interface DashboardStats {
  leadsToday: number;
  hoursSaved: number;
  bookingsMonth: number;
  messagesSent: number;
  leadsChange: number;
  hoursChange: number;
  bookingsChange: number;
  messagesChange: number;
}
