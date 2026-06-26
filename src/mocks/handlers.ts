import { http, HttpResponse } from 'msw';

const mockUser = {
  id: 'user-1', email: 'demo@dhad.digital', name: 'Yashu Demo',
  role: 'ADMIN', tenantId: 'tenant-1', avatarUrl: null,
};

const mockContacts = Array.from({ length: 12 }, (_, i) => ({
  id: `contact-${i + 1}`,
  name: ['Ahmed Al-Rashid', 'Sara Mohamed', 'Khalid Hassan', 'Fatima Al-Zahra', 'Omar Abdullah',
    'Layla Nasser', 'Mohammed Al-Farsi', 'Aisha Malik', 'Yusuf Ibrahim', 'Hana Al-Sayed',
    'Tariq Mansoor', 'Rania Khalil'][i],
  phone: `+9715${String(50000000 + i * 1234567).slice(0, 8)}`,
  email: `contact${i + 1}@example.com`,
  status: ['LEAD', 'ACTIVE', 'PROSPECT', 'CUSTOMER'][i % 4],
  tags: [['VIP', 'Returning'], ['New'], ['Hot Lead'], ['Premium']][i % 4],
  lastSeen: new Date(Date.now() - i * 86400000).toISOString(),
  createdAt: new Date(Date.now() - i * 86400000 * 5).toISOString(),
  source: ['WhatsApp', 'Instagram', 'Website', 'Referral'][i % 4],
  totalSpent: Math.floor(Math.random() * 5000),
  notes: '',
}));

const mockMessages = Array.from({ length: 20 }, (_, i) => ({
  id: `msg-${i + 1}`,
  contactId: `contact-${(i % 12) + 1}`,
  contactName: mockContacts[i % 12].name,
  content: [
    'Hi, I want to know more about your products', 'Can you send me the price list?',
    'Is this available?', 'Thank you!', 'When will my order arrive?',
    'I need help with my booking', 'Great service!', 'Please call me',
    'Can I get a discount?', 'Order confirmed, thanks!',
    'What are your working hours?', 'I want to cancel my order',
    'Where is my delivery?', 'Product received, all good!',
    'How do I track my order?', 'Can I change my address?',
    'Do you have this in blue?', 'I want to place a bulk order',
    'Is there a warranty?', 'Please send me an invoice',
  ][i],
  direction: i % 3 === 0 ? 'OUTBOUND' : 'INBOUND',
  status: ['DELIVERED', 'READ', 'SENT'][i % 3],
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  channel: ['whatsapp', 'instagram', 'whatsapp'][i % 3],
}));

const mockCampaigns = [
  { id: 'camp-1', name: 'Ramadan Sale 2025', status: 'ACTIVE', reach: 2450, opens: 1890, clicks: 342, conversions: 89, createdAt: new Date().toISOString(), channel: 'whatsapp' },
  { id: 'camp-2', name: 'Summer Collection Launch', status: 'DRAFT', reach: 0, opens: 0, clicks: 0, conversions: 0, createdAt: new Date().toISOString(), channel: 'instagram' },
  { id: 'camp-3', name: 'VIP Customer Appreciation', status: 'COMPLETED', reach: 567, opens: 489, clicks: 123, conversions: 45, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), channel: 'whatsapp' },
  { id: 'camp-4', name: 'New Product Announcement', status: 'SCHEDULED', reach: 0, opens: 0, clicks: 0, conversions: 0, createdAt: new Date().toISOString(), channel: 'email' },
];

const mockAnalytics = {
  overview: { totalContacts: 2847, activeChats: 142, campaignsSent: 18, revenue: 48920 },
  messageVolume: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { weekday: 'short' }),
    inbound: Math.floor(Math.random() * 200 + 100),
    outbound: Math.floor(Math.random() * 150 + 80),
  })),
  channelBreakdown: [
    { channel: 'WhatsApp', value: 68, color: '#25d366' },
    { channel: 'Instagram', value: 22, color: '#e1306c' },
    { channel: 'Website', value: 10, color: '#4f8ef7' },
  ],
  conversionFunnel: [
    { stage: 'Reach', count: 5420 }, { stage: 'Engaged', count: 3210 },
    { stage: 'Leads', count: 1890 }, { stage: 'Qualified', count: 842 },
    { stage: 'Converted', count: 312 },
  ],
};

const mockProducts = Array.from({ length: 8 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: ['Premium Abaya', 'Signature Oud Perfume', 'Gold Bracelet', 'Silk Shayla',
    'Pearl Necklace', 'Luxury Watch', 'Designer Bag', 'Embroidered Kandura'][i],
  price: [299, 189, 450, 89, 380, 1200, 650, 220][i],
  stock: Math.floor(Math.random() * 50 + 5),
  category: ['Fashion', 'Fragrance', 'Jewelry', 'Fashion', 'Jewelry', 'Accessories', 'Accessories', 'Fashion'][i],
  status: i % 5 === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
  imageUrl: null,
  sku: `SKU-${1000 + i}`,
}));

const mockOrders = Array.from({ length: 10 }, (_, i) => ({
  id: `order-${i + 1}`,
  orderNumber: `ORD-2025-${1000 + i}`,
  contactName: mockContacts[i % 12].name,
  contactPhone: mockContacts[i % 12].phone,
  status: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'][i % 5],
  total: Math.floor(Math.random() * 1500 + 100),
  items: 1 + (i % 3),
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

const mockLeads = Array.from({ length: 8 }, (_, i) => ({
  id: `lead-${i + 1}`,
  contactName: mockContacts[i].name,
  phone: mockContacts[i].phone,
  score: Math.floor(Math.random() * 40 + 60),
  stage: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'][i % 5],
  value: Math.floor(Math.random() * 2000 + 500),
  source: ['WhatsApp', 'Instagram', 'Referral', 'Website'][i % 4],
  lastActivity: new Date(Date.now() - i * 86400000).toISOString(),
  assignedTo: 'Yashu Demo',
  tags: [['Hot'], ['Warm'], ['Cold'], ['VIP']][i % 4],
}));

const mockTrends = [
  { id: 't1', topic: 'Ramadan Fashion Trends 2025', score: 94, category: 'Fashion', platform: 'Instagram', growth: '+234%', keywords: ['abaya', 'modest fashion', 'ramadan'] },
  { id: 't2', topic: 'Luxury Fragrance Reviews', score: 87, category: 'Fragrance', platform: 'TikTok', growth: '+189%', keywords: ['oud', 'arabic perfume', 'luxury'] },
  { id: 't3', topic: 'Gold Jewelry Investment', score: 78, category: 'Jewelry', platform: 'YouTube', growth: '+145%', keywords: ['gold', 'investment', 'jewelry'] },
  { id: 't4', topic: 'Summer Collection Launches', score: 72, category: 'Fashion', platform: 'Instagram', growth: '+112%', keywords: ['summer', 'collection', 'new arrival'] },
];

const paged = (content: unknown[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0 });
const empty = () => ({ content: [], totalElements: 0, totalPages: 0, number: 0 });

export const handlers = [
  // Auth
  http.post('/api/v1/auth/login', () => HttpResponse.json({ accessToken: 'mock-token', refreshToken: 'mock-refresh', user: mockUser })),
  http.post('/api/v1/auth/refresh', () => HttpResponse.json({ accessToken: 'mock-token', refreshToken: 'mock-refresh' })),
  http.get('/api/v1/auth/me', () => HttpResponse.json(mockUser)),

  // Dashboard
  http.get('/api/v1/dashboard/stats', () => HttpResponse.json(mockAnalytics.overview)),
  http.get('/api/v1/dashboard/activity', () => HttpResponse.json(mockMessages.slice(0, 8))),

  // Contacts
  http.get('/api/v1/contacts', () => HttpResponse.json(paged(mockContacts))),
  http.get('/api/v1/contacts/:id', ({ params }) => HttpResponse.json(mockContacts.find(c => c.id === params.id) ?? mockContacts[0])),
  http.post('/api/v1/contacts', async ({ request }) => { const b = await request.json() as object; return HttpResponse.json({ ...b, id: 'new-' + Date.now() }, { status: 201 }); }),
  http.put('/api/v1/contacts/:id', async ({ request, params }) => { const b = await request.json() as object; return HttpResponse.json({ ...b, id: params.id }); }),
  http.delete('/api/v1/contacts/:id', () => new HttpResponse(null, { status: 204 })),

  // Conversations / Messages
  http.get('/api/v1/conversations', () => HttpResponse.json(paged(mockMessages.slice(0, 10)))),
  http.get('/api/v1/messages', () => HttpResponse.json(paged(mockMessages))),
  http.post('/api/v1/messages', async ({ request }) => { const b = await request.json() as object; return HttpResponse.json({ ...b, id: 'msg-new', timestamp: new Date().toISOString() }, { status: 201 }); }),

  // Campaigns
  http.get('/api/v1/campaigns', () => HttpResponse.json(paged(mockCampaigns))),
  http.get('/api/v1/campaigns/:id', ({ params }) => HttpResponse.json(mockCampaigns.find(c => c.id === params.id) ?? mockCampaigns[0])),
  http.post('/api/v1/campaigns', async ({ request }) => { const b = await request.json() as object; return HttpResponse.json({ ...b, id: 'camp-new', status: 'DRAFT' }, { status: 201 }); }),

  // Analytics
  http.get('/api/v1/analytics/overview', () => HttpResponse.json(mockAnalytics.overview)),
  http.get('/api/v1/analytics/messages', () => HttpResponse.json(mockAnalytics.messageVolume)),
  http.get('/api/v1/analytics/channels', () => HttpResponse.json(mockAnalytics.channelBreakdown)),
  http.get('/api/v1/analytics/funnel', () => HttpResponse.json(mockAnalytics.conversionFunnel)),
  http.get('/api/v1/analytics', () => HttpResponse.json(mockAnalytics)),

  // Products
  http.get('/api/v1/products', () => HttpResponse.json(paged(mockProducts))),
  http.post('/api/v1/products', async ({ request }) => { const b = await request.json() as object; return HttpResponse.json({ ...b, id: 'prod-new' }, { status: 201 }); }),

  // Orders
  http.get('/api/v1/orders', () => HttpResponse.json(paged(mockOrders))),
  http.get('/api/v1/orders/:id', () => HttpResponse.json(mockOrders[0])),

  // Leads
  http.get('/api/v1/leads', () => HttpResponse.json(paged(mockLeads))),

  // Trends
  http.get('/api/v1/trends', () => HttpResponse.json(paged(mockTrends))),

  // Platforms
  http.get('/api/v1/platforms', () => HttpResponse.json([
    { id: 'p1', name: 'WhatsApp Business', connected: true, status: 'ACTIVE', phone: '+971501234567' },
    { id: 'p2', name: 'Instagram', connected: false, status: 'DISCONNECTED' },
    { id: 'p3', name: 'Facebook', connected: false, status: 'DISCONNECTED' },
  ])),

  // Team
  http.get('/api/v1/team/members', () => HttpResponse.json([mockUser])),

  // Settings
  http.get('/api/v1/settings/bot', () => HttpResponse.json({ enabled: true, greeting: 'Hello! How can I help you today?', language: 'en' })),
  http.get('/api/v1/settings/billing', () => HttpResponse.json({ plan: 'PRO', status: 'ACTIVE', nextBilling: '2025-07-01', amount: 299 })),
  http.get('/api/v1/settings/webhook', () => HttpResponse.json({ webhookUrl: 'https://api.dhad.digital/webhook', verified: true })),
  http.put('/api/v1/settings/:section', async ({ request }) => { const b = await request.json() as object; return HttpResponse.json(b); }),

  // Empty collections
  http.get('/api/v1/content', () => HttpResponse.json(empty())),
  http.get('/api/v1/approvals', () => HttpResponse.json(empty())),
  http.get('/api/v1/calendar', () => HttpResponse.json(empty())),
  http.get('/api/v1/insights', () => HttpResponse.json(empty())),
  http.get('/api/v1/documents', () => HttpResponse.json(empty())),
  http.get('/api/v1/bookings', () => HttpResponse.json(empty())),

  // Legacy /api routes
  http.get('/api/workspace', () => HttpResponse.json({ id: 'ws-1', name: 'Dhad Digital', plan: 'PRO' })),
  http.get('/api/contacts', () => HttpResponse.json(mockContacts)),
  http.get('/api/messages', () => HttpResponse.json(mockMessages)),
];
