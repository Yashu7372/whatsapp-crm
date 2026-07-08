import { http } from './httpClient';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Workspace {
  name: string;
  businessType: string;
  businessHours: string;
  whatsappPhoneId: string | null;
  whatsappToken: string | null;
  whatsappNumber: string | null;
  faq: FaqItem[];
  webhookVerifyToken: string;
  plan: string;
  whatsappConnected: boolean;
}

export interface UpdateWorkspaceInput {
  name?: string;
  businessType?: string;
  businessHours?: string;
  whatsappPhoneId?: string;
  whatsappToken?: string;
  whatsappNumber?: string;
  faq?: FaqItem[];
}

export interface CrmStats {
  leadsToday: number;
  messagesSent: number;
  totalContacts: number;
  totalBookings: number;
}

export interface CrmConversation {
  id: string;
  contactName: string | null;
  contactPhone: string | null;
  waId: string | null;
  language: string;
  status: 'bot' | 'human' | 'closed';
  priority: string;
  botEnabled: boolean;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
}

export interface CrmAgent {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CrmMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string | null;
  sentAt: string;
  intent: string | null;
  confidenceScore: number | null;
  actionType: string | null;
  buttons: string | null;
  aiGenerated: boolean;
}

export interface CrmContact {
  id: string;
  waId: string;
  phoneNumber: string;
  displayName: string | null;
  language: string;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface CrmBooking {
  id: string;
  contactName: string | null;
  phoneNumber: string | null;
  serviceType: string;
  scheduledAt: string | null;
  durationMins: number;
  status: string;
  notes: string | null;
}

export const crmApi = {
  getWorkspace: () =>
    http.get<Workspace>('/crm/workspace'),

  updateWorkspace: (input: UpdateWorkspaceInput) =>
    http.put<Workspace>('/crm/workspace', input),

  getStats: () =>
    http.get<CrmStats>('/crm/stats'),

  getConversations: () =>
    http.get<CrmConversation[]>('/crm/conversations'),

  getMessages: (conversationId: string) =>
    http.get<CrmMessage[]>(`/crm/conversations/${conversationId}/messages`),

  updateConversationStatus: (conversationId: string, status: 'bot' | 'human' | 'closed') =>
    http.put<CrmConversation>(`/crm/conversations/${conversationId}/status`, { status }),

  sendMessage: (conversationId: string, message: string) =>
    http.post<CrmMessage>(`/crm/conversations/${conversationId}/send`, { message }),

  getAgents: () =>
    http.get<CrmAgent[]>('/crm/agents'),

  assignConversation: (conversationId: string, agentId: string) =>
    http.post<CrmConversation>(`/crm/conversations/${conversationId}/assign`, { agentId }),

  getContacts: () =>
    http.get<CrmContact[]>('/crm/contacts'),

  getBookings: () =>
    http.get<CrmBooking[]>('/crm/bookings'),
};
