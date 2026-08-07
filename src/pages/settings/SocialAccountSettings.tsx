import { useState, useEffect } from 'react';
import { Share2, Plus, Trash2, AlertCircle, Camera, Play } from 'lucide-react';
import { http } from '../../api/httpClient';
import { useFeatures } from '../../contexts/FeaturesContext';

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  externalAccountId: string;
  status: string;
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  INSTAGRAM: <Camera size={16} />,
  YOUTUBE: <Play size={16} />,
};

export default function SocialAccountSettings() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: 'INSTAGRAM', accountName: '', externalAccountId: '' });
  const { isEnabled, plan } = useFeatures();

  const canPublish = isEnabled('SCHEDULED_PUBLISHING');

  useEffect(() => {
    if (!canPublish) { setLoading(false); return; }
    http.get<SocialAccount[]>('/social-accounts')
      .then(setAccounts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [canPublish]);

  const handleAdd = async () => {
    if (!form.accountName.trim()) return;
    try {
      const account = await http.post<SocialAccount>('/social-accounts', form);
      setAccounts(prev => [account, ...prev]);
      setShowForm(false);
      setForm({ platform: 'INSTAGRAM', accountName: '', externalAccountId: '' });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Disconnect this account?')) return;
    try {
      await http.delete<void>(`/social-accounts/${id}`);
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!canPublish) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Share2 size={20} />
          <h1>Social Accounts</h1>
        </div>
        <div className="empty-state">
          <AlertCircle size={40} />
          <p>Scheduled publishing is not enabled on the <strong>{plan}</strong> plan.</p>
          <p>Upgrade to connect Instagram, YouTube, and more.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Share2 size={20} />
        <h1>Social Accounts</h1>
        <button
          className="btn-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} /> Connect Account
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Connect Social Account</h3>
            <label>Platform</label>
            <select
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
            >
              <option value="INSTAGRAM">Instagram</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TIKTOK">TikTok</option>
            </select>
            <label>Account Name</label>
            <input
              type="text"
              placeholder="@username or channel name"
              value={form.accountName}
              onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
            />
            <label>External Account ID (optional)</label>
            <input
              type="text"
              placeholder="Platform-assigned ID"
              value={form.externalAccountId}
              onChange={e => setForm(f => ({ ...f, externalAccountId: e.target.value }))}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn-primary" onClick={handleAdd}>Connect</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <Share2 size={40} />
          <p>No social accounts connected.</p>
          <p>Connect Instagram or YouTube to start scheduling posts.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Account</th>
                <th>Status</th>
                <th>Connected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {PLATFORM_ICONS[account.platform] ?? <Share2 size={16} />}
                    {account.platform}
                  </td>
                  <td>{account.accountName || '—'}</td>
                  <td><span className={`badge ${account.status === 'CONNECTED' ? 'success' : ''}`}>{account.status}</span></td>
                  <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="icon-btn danger"
                      title="Disconnect"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
