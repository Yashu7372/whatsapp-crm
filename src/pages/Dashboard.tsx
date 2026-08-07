import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, Clock, CalendarCheck, MessageSquare, Megaphone, TrendingUp, ArrowUpRight, Users, Zap, AlertCircle } from 'lucide-react';
import { crmApi, type CrmConversation, type CrmStats, type Workspace } from '../api/crmApi';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem' }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CrmStats>({ leadsToday: 0, messagesSent: 0, totalContacts: 0, totalBookings: 0 });
  const [conversations, setConversations] = useState<CrmConversation[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, c, w] = await Promise.all([
          crmApi.getStats(),
          crmApi.getConversations(),
          crmApi.getWorkspace(),
        ]);
        setStats(s);
        setConversations(c);
        setWorkspace(w);
      } catch (e) {
        console.error('Failed to load dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Poll every 10s
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* WhatsApp connection banner */}
      {workspace && !workspace.whatsappConnected && (
        <div style={{
          padding: '14px 20px', background: 'var(--orange-glow)', border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 'var(--radius)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertCircle size={20} color="var(--orange)" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: 'var(--orange)' }}>WhatsApp not connected</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
              Connect your WhatsApp Business account to start receiving messages
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings/bot')}>
            Connect Now
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Bot size={22} /></div>
          <div className="stat-value">{stats.leadsToday}</div>
          <div className="stat-label">Leads Handled by AI Today</div>
          <div className="stat-change up"><ArrowUpRight size={14} /> Live</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><MessageSquare size={22} /></div>
          <div className="stat-value">{stats.messagesSent}</div>
          <div className="stat-label">AI Messages Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={22} /></div>
          <div className="stat-value">{stats.totalContacts}</div>
          <div className="stat-label">Total Contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><CalendarCheck size={22} /></div>
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="card mt-20">
        <div className="card-header">
          <h3 className="card-title">Recent Conversations</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inbox')}>View All →</button>
        </div>
        {conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Connect WhatsApp and your first customer message will appear here</p>
          </div>
        ) : (
          <div>
            {conversations.slice(0, 8).map((conv) => (
              <div key={conv.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid var(--border)', cursor: 'pointer',
              }} onClick={() => navigate('/inbox')}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: conv.status === 'human' ? 'var(--yellow-glow)' : conv.status === 'bot' ? 'var(--accent-glow)' : 'var(--blue-glow)',
                  color: conv.status === 'human' ? 'var(--yellow)' : conv.status === 'bot' ? 'var(--accent)' : 'var(--blue)',
                  fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                }}>
                  {(conv.contactName || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{conv.contactName || conv.waId}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage || 'No messages'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {conv.unreadCount > 0 && <span className="nav-badge">{conv.unreadCount}</span>}
                  <span className={`badge ${conv.status === 'bot' ? 'green' : conv.status === 'human' ? 'yellow' : 'gray'}`}>
                    {conv.status === 'bot' ? '🤖 Bot' : conv.status === 'human' ? '👤 Agent' : 'Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card mt-20">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/inbox')}><MessageSquare size={16} /> Open Inbox</button>
          <button className="btn btn-secondary" onClick={() => navigate('/contacts')}><Users size={16} /> View Contacts</button>
          <button className="btn btn-secondary" onClick={() => navigate('/settings/bot')}><Bot size={16} /> Configure AI Bot</button>
        </div>
      </div>
    </div>
  );
}
