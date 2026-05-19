import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Bot, Clock, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

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

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    const interval = setInterval(() => api.getStats().then(setStats).catch(console.error), 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading analytics...</div>;

  const hasData = stats && (stats.messagesSent > 0 || stats.totalContacts > 0);

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Analytics Overview</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Live metrics from your WhatsApp AI bot</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Bot size={22} /></div>
          <div className="stat-value">{stats?.leadsToday ?? 0}</div>
          <div className="stat-label">Leads Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><MessageSquare size={22} /></div>
          <div className="stat-value">{stats?.messagesSent ?? 0}</div>
          <div className="stat-label">AI Messages Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={22} /></div>
          <div className="stat-value">{stats?.totalContacts ?? 0}</div>
          <div className="stat-label">Total Contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={22} /></div>
          <div className="stat-value">{stats?.totalBookings ?? 0}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
      </div>

      {!hasData ? (
        <div className="card mt-20">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No analytics data yet</h3>
            <p>Charts and trends will appear here once your WhatsApp bot starts handling conversations</p>
          </div>
        </div>
      ) : (
        <div className="grid-2 mt-20">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Message Activity</h3>
              <span className="badge green"><TrendingUp size={12} /> Live</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { label: 'AI Sent', value: stats?.messagesSent || 0 },
                  { label: 'Contacts', value: stats?.totalContacts || 0 },
                  { label: 'Bookings', value: stats?.totalBookings || 0 },
                  { label: 'Today\'s Leads', value: stats?.leadsToday || 0 },
                ]}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">AI vs Human</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
              {[
                { label: 'AI Handled', value: stats?.messagesSent || 0, color: 'var(--accent)', max: Math.max(stats?.messagesSent || 1, 1) },
                { label: 'Total Contacts', value: stats?.totalContacts || 0, color: 'var(--blue)', max: Math.max(stats?.totalContacts || 1, 1) },
                { label: 'Bookings Captured', value: stats?.totalBookings || 0, color: 'var(--purple)', max: Math.max(stats?.totalBookings || 1, 1) },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: item.color,
                      width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
