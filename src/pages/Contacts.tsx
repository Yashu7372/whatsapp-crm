import { useState, useEffect } from 'react';
import { Search, Filter, Download, MessageSquare, Tag, Globe } from 'lucide-react';
import { api } from '../services/api';

const langLabels: Record<string, string> = { en: 'English', ar: 'العربية', hi: 'हिंदी' };
const avatarBgs = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c2d12', '#4f46e5'];

export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getContacts().then(setContacts).catch(console.error).finally(() => setLoading(false));
    const interval = setInterval(() => api.getContacts().then(setContacts).catch(console.error), 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading contacts...</div>;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>All Contacts</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{contacts.length} total contacts</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <Search size={16} color="#64748b" />
          <input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{contacts.length === 0 ? 'No contacts yet' : 'No matches'}</h3>
            <p>{contacts.length === 0 ? 'Contacts will appear here when customers message you on WhatsApp' : 'Try a different search'}</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Contact</th><th>Phone</th><th>Language</th><th>Last Seen</th></tr>
              </thead>
              <tbody>
                {filtered.map((contact, i) => (
                  <tr key={contact.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', background: avatarBgs[i % avatarBgs.length],
                          fontWeight: 700, fontSize: '0.78rem', flexShrink: 0,
                        }}>
                          {(contact.name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{contact.name || contact.wa_id}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{contact.phone || contact.wa_id}</td>
                    <td>
                      <span className="badge blue" style={{ gap: 4 }}>
                        <Globe size={11} /> {langLabels[contact.language] || contact.language || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {contact.last_seen_at ? new Date(contact.last_seen_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
