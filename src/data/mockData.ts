import type { Contact, Conversation, Message, Booking, Campaign, DashboardStats } from '../types';

export const dashboardStats: DashboardStats = {
  leadsToday: 24,
  hoursSaved: 6.5,
  bookingsMonth: 47,
  messagesSent: 312,
  leadsChange: 12,
  hoursChange: 8,
  bookingsChange: 23,
  messagesChange: 15,
};

const contacts: Contact[] = [
  { id: 'c1', workspaceId: 'w1', waId: '971501234567', name: 'Ahmed Al Maktoum', phone: '+971501234567', language: 'ar', tags: ['vip', 'dental-cleaning'], lastSeenAt: '2026-05-13T10:30:00Z', createdAt: '2026-04-01T08:00:00Z' },
  { id: 'c2', workspaceId: 'w1', waId: '971509876543', name: 'Priya Sharma', phone: '+971509876543', language: 'hi', tags: ['new-patient'], lastSeenAt: '2026-05-13T09:15:00Z', createdAt: '2026-04-15T10:00:00Z' },
  { id: 'c3', workspaceId: 'w1', waId: '971507654321', name: 'Sarah Johnson', phone: '+971507654321', language: 'en', tags: ['returning'], lastSeenAt: '2026-05-12T16:45:00Z', createdAt: '2026-03-10T12:00:00Z' },
  { id: 'c4', workspaceId: 'w1', waId: '971503456789', name: 'Mohammed Al Rashid', phone: '+971503456789', language: 'ar', tags: ['braces', 'insurance-daman'], lastSeenAt: '2026-05-13T11:00:00Z', createdAt: '2026-05-01T09:00:00Z' },
  { id: 'c5', workspaceId: 'w1', waId: '971508765432', name: 'Ravi Patel', phone: '+971508765432', language: 'en', tags: ['root-canal'], lastSeenAt: '2026-05-11T14:30:00Z', createdAt: '2026-04-20T11:00:00Z' },
  { id: 'c6', workspaceId: 'w1', waId: '971502345678', name: 'Fatima Hassan', phone: '+971502345678', language: 'ar', tags: ['whitening', 'vip'], lastSeenAt: '2026-05-13T08:00:00Z', createdAt: '2026-02-14T07:00:00Z' },
  { id: 'c7', workspaceId: 'w1', waId: '971506543210', name: 'Deepak Kumar', phone: '+971506543210', language: 'hi', tags: ['checkup'], lastSeenAt: '2026-05-10T13:00:00Z', createdAt: '2026-05-05T10:00:00Z' },
  { id: 'c8', workspaceId: 'w1', waId: '971504321098', name: 'Lisa Chen', phone: '+971504321098', language: 'en', tags: ['implant'], lastSeenAt: '2026-05-12T11:00:00Z', createdAt: '2026-04-28T14:00:00Z' },
];

export const conversations: Conversation[] = [
  { id: 'cv1', workspaceId: 'w1', contactId: 'c1', contact: contacts[0], status: 'bot', lastMessage: 'شكراً، أريد حجز موعد لتنظيف الأسنان يوم السبت', lastMessageAt: '2026-05-13T10:30:00Z', unreadCount: 2, createdAt: '2026-05-13T10:00:00Z' },
  { id: 'cv2', workspaceId: 'w1', contactId: 'c2', contact: contacts[1], status: 'human', lastMessage: 'मुझे दांत में बहुत दर्द हो रहा है, कृपया जल्दी appointment दें', lastMessageAt: '2026-05-13T09:15:00Z', unreadCount: 1, createdAt: '2026-05-13T08:30:00Z' },
  { id: 'cv3', workspaceId: 'w1', contactId: 'c3', contact: contacts[2], status: 'open', lastMessage: 'Hi, do you accept AXA insurance for teeth whitening?', lastMessageAt: '2026-05-12T16:45:00Z', unreadCount: 0, createdAt: '2026-05-12T16:00:00Z' },
  { id: 'cv4', workspaceId: 'w1', contactId: 'c4', contact: contacts[3], status: 'bot', lastMessage: 'كم تكلفة تقويم الأسنان؟', lastMessageAt: '2026-05-13T11:00:00Z', unreadCount: 3, createdAt: '2026-05-13T10:45:00Z' },
  { id: 'cv5', workspaceId: 'w1', contactId: 'c5', contact: contacts[4], status: 'closed', lastMessage: 'Thank you, my appointment is confirmed for Thursday', lastMessageAt: '2026-05-11T14:30:00Z', unreadCount: 0, createdAt: '2026-05-11T13:00:00Z' },
  { id: 'cv6', workspaceId: 'w1', contactId: 'c6', contact: contacts[5], status: 'bot', lastMessage: 'أريد معرفة أسعار تبييض الأسنان', lastMessageAt: '2026-05-13T08:00:00Z', unreadCount: 1, createdAt: '2026-05-13T07:30:00Z' },
  { id: 'cv7', workspaceId: 'w1', contactId: 'c7', contact: contacts[6], status: 'open', lastMessage: 'Hello, I need a general checkup', lastMessageAt: '2026-05-10T13:00:00Z', unreadCount: 0, createdAt: '2026-05-10T12:30:00Z' },
];

export const messages: Record<string, Message[]> = {
  cv1: [
    { id: 'm1', conversationId: 'cv1', direction: 'inbound', content: 'السلام عليكم', msgType: 'text', intent: 'GREETING', confidenceScore: 0.98, sentAt: '2026-05-13T10:00:00Z' },
    { id: 'm2', conversationId: 'cv1', direction: 'outbound', content: 'وعليكم السلام! أهلاً بكم في عيادة سمايل الطبية 😊 كيف يمكنني مساعدتك اليوم؟', msgType: 'text', sentAt: '2026-05-13T10:00:15Z' },
    { id: 'm3', conversationId: 'cv1', direction: 'inbound', content: 'أريد حجز موعد لتنظيف الأسنان', msgType: 'text', intent: 'BOOKING_REQUEST', confidenceScore: 0.95, sentAt: '2026-05-13T10:05:00Z' },
    { id: 'm4', conversationId: 'cv1', direction: 'outbound', content: 'بالتأكيد! تنظيف الأسنان العميق يبدأ من 250 درهم. لدينا مواعيد متاحة:\n\n📅 السبت 17 مايو - 10:00 صباحاً\n📅 السبت 17 مايو - 2:00 ظهراً\n📅 الأحد 18 مايو - 11:00 صباحاً\n\nأي موعد يناسبك؟', msgType: 'text', sentAt: '2026-05-13T10:05:20Z' },
    { id: 'm5', conversationId: 'cv1', direction: 'inbound', content: 'شكراً، أريد حجز موعد لتنظيف الأسنان يوم السبت', msgType: 'text', intent: 'BOOKING_REQUEST', confidenceScore: 0.92, sentAt: '2026-05-13T10:30:00Z' },
  ],
  cv2: [
    { id: 'm6', conversationId: 'cv2', direction: 'inbound', content: 'Hello', msgType: 'text', intent: 'GREETING', confidenceScore: 0.97, sentAt: '2026-05-13T08:30:00Z' },
    { id: 'm7', conversationId: 'cv2', direction: 'outbound', content: 'Hello! Welcome to Smile Dental Clinic 😊 How can I help you today?', msgType: 'text', sentAt: '2026-05-13T08:30:10Z' },
    { id: 'm8', conversationId: 'cv2', direction: 'inbound', content: 'मुझे दांत में बहुत दर्द हो रहा है, कृपया जल्दी appointment दें', msgType: 'text', intent: 'COMPLAINT', confidenceScore: 0.65, sentAt: '2026-05-13T09:15:00Z' },
    { id: 'm9', conversationId: 'cv2', direction: 'outbound', content: '⚠️ This conversation has been flagged for human review. A staff member will respond shortly.', msgType: 'text', sentAt: '2026-05-13T09:15:05Z' },
  ],
  cv3: [
    { id: 'm10', conversationId: 'cv3', direction: 'inbound', content: 'Hi, do you accept AXA insurance for teeth whitening?', msgType: 'text', intent: 'INQUIRY', confidenceScore: 0.91, sentAt: '2026-05-12T16:00:00Z' },
    { id: 'm11', conversationId: 'cv3', direction: 'outbound', content: 'Hello Sarah! Yes, we do accept AXA insurance. However, please note that teeth whitening is typically considered a cosmetic procedure and may not be fully covered. We recommend checking with your insurance provider for specific coverage details.\n\nWould you like to book a consultation? We can check your coverage during your visit! 😊', msgType: 'text', sentAt: '2026-05-12T16:00:20Z' },
    { id: 'm12', conversationId: 'cv3', direction: 'inbound', content: 'That sounds great, what times do you have available?', msgType: 'text', intent: 'BOOKING_REQUEST', confidenceScore: 0.88, sentAt: '2026-05-12T16:45:00Z' },
  ],
};

export const bookings: Booking[] = [
  { id: 'b1', workspaceId: 'w1', contactId: 'c1', contact: contacts[0], serviceType: 'Deep Cleaning', scheduledAt: '2026-05-17T10:00:00Z', durationMins: 45, status: 'pending', createdAt: '2026-05-13T10:30:00Z' },
  { id: 'b2', workspaceId: 'w1', contactId: 'c3', contact: contacts[2], serviceType: 'Whitening Consultation', scheduledAt: '2026-05-15T14:00:00Z', durationMins: 30, status: 'confirmed', createdAt: '2026-05-12T17:00:00Z' },
  { id: 'b3', workspaceId: 'w1', contactId: 'c5', contact: contacts[4], serviceType: 'Root Canal - Phase 2', scheduledAt: '2026-05-15T09:00:00Z', durationMins: 60, status: 'confirmed', createdAt: '2026-05-11T14:30:00Z' },
  { id: 'b4', workspaceId: 'w1', contactId: 'c6', contact: contacts[5], serviceType: 'Teeth Whitening', scheduledAt: '2026-05-16T11:00:00Z', durationMins: 45, status: 'pending', createdAt: '2026-05-13T08:00:00Z' },
  { id: 'b5', workspaceId: 'w1', contactId: 'c8', contact: contacts[7], serviceType: 'Implant Consultation', scheduledAt: '2026-05-14T15:00:00Z', durationMins: 30, status: 'confirmed', createdAt: '2026-05-12T11:00:00Z' },
  { id: 'b6', workspaceId: 'w1', contactId: 'c4', contact: contacts[3], serviceType: 'Braces Consultation', scheduledAt: '2026-05-19T10:00:00Z', durationMins: 45, status: 'pending', createdAt: '2026-05-13T11:00:00Z' },
  { id: 'b7', workspaceId: 'w1', contactId: 'c7', contact: contacts[6], serviceType: 'General Checkup', scheduledAt: '2026-05-20T09:00:00Z', durationMins: 30, status: 'pending', notes: 'First visit', createdAt: '2026-05-10T13:00:00Z' },
];

export const campaigns: Campaign[] = [
  { id: 'cp1', workspaceId: 'w1', name: 'Ramadan Special – 30% Off Cleaning', templateId: 't1', scheduledAt: '2026-05-10T09:00:00Z', sentCount: 245, deliveredCount: 238, readCount: 189, repliedCount: 42, clickedCount: 67, status: 'sent', createdAt: '2026-05-09T15:00:00Z' },
  { id: 'cp2', workspaceId: 'w1', name: 'Eid Al Adha – Free Checkup Week', templateId: 't2', scheduledAt: '2026-06-07T08:00:00Z', sentCount: 0, deliveredCount: 0, readCount: 0, repliedCount: 0, clickedCount: 0, status: 'scheduled', createdAt: '2026-05-12T10:00:00Z' },
  { id: 'cp3', workspaceId: 'w1', name: 'Summer Whitening Package', templateId: 't3', scheduledAt: '2026-05-05T10:00:00Z', sentCount: 312, deliveredCount: 298, readCount: 210, repliedCount: 58, clickedCount: 89, status: 'sent', createdAt: '2026-05-04T14:00:00Z' },
  { id: 'cp4', workspaceId: 'w1', name: 'Insurance Reminder – Daman Holders', templateId: 't4', sentCount: 0, deliveredCount: 0, readCount: 0, repliedCount: 0, clickedCount: 0, status: 'draft', createdAt: '2026-05-13T09:00:00Z' },
];

export { contacts };

export const weeklyLeadsData = [
  { day: 'Mon', leads: 18, booked: 8 },
  { day: 'Tue', leads: 22, booked: 12 },
  { day: 'Wed', leads: 15, booked: 7 },
  { day: 'Thu', leads: 28, booked: 15 },
  { day: 'Fri', leads: 12, booked: 5 },
  { day: 'Sat', leads: 32, booked: 18 },
  { day: 'Sun', leads: 24, booked: 11 },
];

export const intentDistribution = [
  { name: 'Inquiry', value: 38, color: '#3b82f6' },
  { name: 'Booking', value: 28, color: '#22c55e' },
  { name: 'Greeting', value: 18, color: '#a855f7' },
  { name: 'Complaint', value: 8, color: '#ef4444' },
  { name: 'Confirmation', value: 5, color: '#f97316' },
  { name: 'Unknown', value: 3, color: '#64748b' },
];

export const monthlyData = [
  { month: 'Jan', messages: 820, bookings: 34 },
  { month: 'Feb', messages: 1050, bookings: 41 },
  { month: 'Mar', messages: 1380, bookings: 52 },
  { month: 'Apr', messages: 1620, bookings: 61 },
  { month: 'May', messages: 1890, bookings: 47 },
];
