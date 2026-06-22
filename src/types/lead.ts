export interface LeadSignal {
  id: string;
  tenantId: string;
  contactId: string | null;
  conversationId: string | null;
  signalType: 'INBOUND_MESSAGE' | 'FORM' | 'COMMENT' | 'MANUAL';
  intentCategory: string | null;
  messageText: string | null;
  score: number;
  platformCode: string;
  capturedAt: string;
  createdAt: string;
}
