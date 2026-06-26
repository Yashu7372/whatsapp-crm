import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock data
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
  content: ['Hi, I want to know more about your products', 'Can you send me the price list?',
    'Is this available?', 'Thank you!', 'When will my order arrive?',
    'I need help with my booking', 'Great service!', 'Please call me',
    'Can I get a discount?', 'Order confirmed, thanks!',
    'What are your working hours?', 'I want to cancel my order',
    'Where is my delivery?', 'Product received, all good!',
    'How do I track my order?', 'Can I change my address?',
    'Do you have this in blue?', 'I want to place a bulk order',
    'Is there a warranty?', 'Please send me an invoice'][i],
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

const mockTrends = [
  { id: 't1', topic: 'Ramadan Fashion Trends 2025', score: 94, category: 'Fashion', platform: 'Instagram', growth: '+234%', keywords: ['abaya', 'modest fashion', 'ramadan'] },
  { id: 't2', topic: 'Luxury Fragrance Reviews', score: 87, category: 'Fragrance', platform: 'TikTok', growth: '+189%', keywords: ['oud', 'arabic perfume', 'luxury'] },
  { id: 't3', topic: 'Gold Jewelry Investment', score: 78, category: 'Jewelry', platform: 'YouTube', growth: '+145%', keywords: ['gold', 'investment', 'jewelry'] },
  { id: 't4', topic: 'Summer Collection Launches', score: 72, category: 'Fashion', platform: 'Instagram', growth: '+112%', keywords: ['summer', 'collection', 'new arrival'] },
];

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

// ---- Auth routes ----
app.post('/api/v1/auth/login', (req, res) => {
  res.json({ accessToken: 'mock-access-token-xyz', refreshToken: 'mock-refresh-token-xyz', user: mockUser });
});
app.post('/api/v1/auth/refresh', (req, res) => {
  res.json({ accessToken: 'mock-access-token-xyz', refreshToken: 'mock-refresh-token-xyz' });
});
app.get('/api/v1/auth/me', (req, res) => res.json(mockUser));

// ---- Dashboard ----
app.get('/api/v1/dashboard/stats', (req, res) => res.json(mockAnalytics.overview));
app.get('/api/v1/dashboard/activity', (req, res) => res.json(mockMessages.slice(0, 8)));

// ---- Contacts ----
app.get('/api/v1/contacts', (req, res) => res.json({ content: mockContacts, totalElements: mockContacts.length, totalPages: 1, number: 0 }));
app.get('/api/v1/contacts/:id', (req, res) => res.json(mockContacts.find(c => c.id === req.params.id) || mockContacts[0]));
app.post('/api/v1/contacts', (req, res) => res.status(201).json({ ...req.body, id: 'new-contact-' + Date.now() }));
app.put('/api/v1/contacts/:id', (req, res) => res.json({ ...req.body, id: req.params.id }));
app.delete('/api/v1/contacts/:id', (req, res) => res.status(204).send());

// ---- Inbox / Messages ----
app.get('/api/v1/conversations', (req, res) => res.json({ content: mockMessages.slice(0, 10), totalElements: 20 }));
app.get('/api/v1/messages', (req, res) => res.json({ content: mockMessages, totalElements: mockMessages.length }));
app.post('/api/v1/messages', (req, res) => res.status(201).json({ id: 'msg-new', ...req.body, timestamp: new Date().toISOString() }));

// ---- Campaigns ----
app.get('/api/v1/campaigns', (req, res) => res.json({ content: mockCampaigns, totalElements: mockCampaigns.length }));
app.get('/api/v1/campaigns/:id', (req, res) => res.json(mockCampaigns.find(c => c.id === req.params.id) || mockCampaigns[0]));
app.post('/api/v1/campaigns', (req, res) => res.status(201).json({ ...req.body, id: 'camp-new', status: 'DRAFT' }));

// ---- Analytics ----
app.get('/api/v1/analytics/overview', (req, res) => res.json(mockAnalytics.overview));
app.get('/api/v1/analytics/messages', (req, res) => res.json(mockAnalytics.messageVolume));
app.get('/api/v1/analytics/channels', (req, res) => res.json(mockAnalytics.channelBreakdown));
app.get('/api/v1/analytics/funnel', (req, res) => res.json(mockAnalytics.conversionFunnel));
app.get('/api/v1/analytics', (req, res) => res.json(mockAnalytics));

// ---- Products ----
app.get('/api/v1/products', (req, res) => res.json({ content: mockProducts, totalElements: mockProducts.length }));
app.post('/api/v1/products', (req, res) => res.status(201).json({ ...req.body, id: 'prod-new' }));

// ---- Orders ----
app.get('/api/v1/orders', (req, res) => res.json({ content: mockOrders, totalElements: mockOrders.length }));
app.get('/api/v1/orders/:id', (req, res) => res.json(mockOrders[0]));

// ---- Leads ----
app.get('/api/v1/leads', (req, res) => res.json({ content: mockLeads, totalElements: mockLeads.length }));

// ---- Trends ----
app.get('/api/v1/trends', (req, res) => res.json({ content: mockTrends, totalElements: mockTrends.length }));

// ---- Content / Approvals ----
app.get('/api/v1/content', (req, res) => res.json({ content: [], totalElements: 0 }));
app.get('/api/v1/approvals', (req, res) => res.json({ content: [], totalElements: 0 }));
app.get('/api/v1/calendar', (req, res) => res.json({ content: [], totalElements: 0 }));

// ---- Platforms ----
app.get('/api/v1/platforms', (req, res) => res.json([
  { id: 'p1', name: 'WhatsApp Business', connected: true, status: 'ACTIVE', phone: '+971501234567' },
  { id: 'p2', name: 'Instagram', connected: false, status: 'DISCONNECTED' },
  { id: 'p3', name: 'Facebook', connected: false, status: 'DISCONNECTED' },
]));

// ---- Team ----
app.get('/api/v1/team/members', (req, res) => res.json([mockUser]));

// ---- Learning Insights ----
app.get('/api/v1/insights', (req, res) => res.json({ content: [], totalElements: 0 }));

// ---- Documents ----
app.get('/api/v1/documents', (req, res) => res.json({ content: [], totalElements: 0 }));

// ---- Bookings ----
app.get('/api/v1/bookings', (req, res) => res.json({ content: [], totalElements: 0 }));

// ---- Settings ----
app.get('/api/v1/settings/bot', (req, res) => res.json({ enabled: true, greeting: 'Hello! How can I help you today?', language: 'en' }));
app.get('/api/v1/settings/billing', (req, res) => res.json({ plan: 'PRO', status: 'ACTIVE', nextBilling: '2025-07-01', amount: 299 }));
app.get('/api/v1/settings/webhook', (req, res) => res.json({ webhookUrl: 'https://api.dhad.digital/webhook', verified: true }));

// ---- Legacy Express routes (/api) ----
app.get('/api/workspace', (req, res) => res.json({ id: 'ws-1', name: 'Dhad Digital', plan: 'PRO' }));
app.get('/api/contacts', (req, res) => res.json(mockContacts));
app.get('/api/messages', (req, res) => res.json(mockMessages));

// Catch-all: return empty success for unmapped routes
app.all('/api/{*path}', (req, res) => {
  console.log(`[mock] unhandled: ${req.method} ${req.path}`);
  res.json({ content: [], data: [], totalElements: 0, success: true });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Mock server running on http://localhost:${PORT}`));
