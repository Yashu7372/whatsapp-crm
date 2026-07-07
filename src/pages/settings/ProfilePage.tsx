import { useState, useEffect } from 'react';
import { User, Save, LogOut, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { crmApi, type Workspace } from '../../api/crmApi';
import { logout } from '../../api/httpClient';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    crmApi.getWorkspace().then((w) => {
      setWorkspace(w);
      setName(w.name || '');
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await crmApi.updateWorkspace({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="animate-in" style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile & Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage your workspace settings and account</p>
      </div>

      {/* Workspace Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent)" /> Workspace
          </h3>
          {saved && <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600 }}>
            <CheckCircle size={14} /> Saved
          </span>}
        </div>

        <div style={{
          width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent), #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          fontSize: '1.8rem', fontWeight: 800, color: '#fff',
        }}>
          {name ? name[0].toUpperCase() : '?'}
        </div>

        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your Business Name" />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Plan</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge green" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
              {workspace?.plan || 'starter'} plan
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Webhook Token: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>
                {workspace?.webhookVerifyToken || '—'}
              </code>
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      {/* WhatsApp Status */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">WhatsApp Status</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: workspace?.whatsappConnected ? 'var(--accent)' : 'var(--red)',
          }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {workspace?.whatsappConnected ? 'Connected' : 'Not Connected'}
          </span>
          {workspace?.whatsappNumber && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{workspace.whatsappNumber}</span>
          )}
          {!workspace?.whatsappConnected && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/settings/bot')}>Configure</button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--red)' }}>Account Actions</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Sign Out</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Return to the onboarding screen</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
