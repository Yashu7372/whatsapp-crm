import { useState, useEffect } from 'react';
import { Bot, Shield, Clock, MessageSquare, Globe, Save, CheckCircle, AlertCircle, Wifi, Plus, Trash2 } from 'lucide-react';
import { crmApi, type FaqItem, type Workspace } from '../../api/crmApi';

export default function BotSettings() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('other');
  const [businessHours, setBusinessHours] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [faq, setFaq] = useState<FaqItem[]>([]);

  useEffect(() => {
    crmApi.getWorkspace().then((w) => {
      setWorkspace(w);
      setName(w.name || '');
      setBusinessType(w.businessType || 'other');
      setBusinessHours(w.businessHours || '');
      setWhatsappPhoneId(w.whatsappPhoneId || '');
      setWhatsappToken(w.whatsappToken || '');
      setWhatsappNumber(w.whatsappNumber || '');
      setFaq(w.faq || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await crmApi.updateWorkspace({
        name, businessType, businessHours,
        whatsappPhoneId: whatsappPhoneId || undefined,
        whatsappToken: whatsappToken || undefined,
        whatsappNumber: whatsappNumber || undefined,
        faq,
      });
      setWorkspace(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const addFaq = () => setFaq([...faq, { q: '', a: '' }]);
  const removeFaq = (i: number) => setFaq(faq.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: 'q' | 'a', value: string) => {
    const updated = [...faq];
    updated[i] = { ...updated[i], [field]: value };
    setFaq(updated);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading settings...</div>;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Bot Configuration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Configure WhatsApp connection, FAQ knowledge base, and AI behavior
          </p>
        </div>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 600 }}>
            <CheckCircle size={16} /> Saved!
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* WhatsApp Connection — Most Important */}
        <div className="card" style={{
          borderColor: workspace?.whatsappConnected ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)',
          background: workspace?.whatsappConnected
            ? 'linear-gradient(135deg, rgba(34,197,94,0.05), var(--bg-card))'
            : 'linear-gradient(135deg, rgba(249,115,22,0.05), var(--bg-card))',
        }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wifi size={18} /> WhatsApp Connection
              {workspace?.whatsappConnected ? (
                <span className="badge green"><CheckCircle size={11} /> Connected</span>
              ) : (
                <span className="badge orange"><AlertCircle size={11} /> Not Connected</span>
              )}
            </h3>
          </div>

          <div style={{
            padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}>
            <strong>How to get these values:</strong>
            <ol style={{ paddingLeft: 20, marginTop: 8, lineHeight: 2 }}>
              <li>Go to <a href="https://developers.facebook.com" target="_blank" style={{ color: 'var(--blue)' }}>Meta Developer Portal</a></li>
              <li>Create/select your WhatsApp Business App</li>
              <li>Go to <strong>WhatsApp → API Setup</strong></li>
              <li>Copy your <strong>Phone Number ID</strong> and <strong>Temporary Access Token</strong></li>
              <li>For the webhook URL, use: <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>
                https://YOUR_DOMAIN/webhook
              </code></li>
              <li>Set verify token to: <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>
                {workspace?.webhookVerifyToken || 'loading...'}
              </code></li>
            </ol>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number ID *</label>
              <input className="form-input" placeholder="e.g. 123456789012345"
                value={whatsappPhoneId} onChange={e => setWhatsappPhoneId(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Access Token *</label>
              <input className="form-input" type="password" placeholder="Your WhatsApp API access token"
                value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp Business Number (for display)</label>
            <input className="form-input" placeholder="+971 50 123 4567"
              value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--blue-glow)', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', color: 'var(--blue)' }}>
            <strong>Webhook Verify Token:</strong> {workspace?.webhookVerifyToken || '—'}
            <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>(use this when configuring webhook in Meta Developer Portal)</span>
          </div>
        </div>

        {/* Business Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} /> Business Profile
            </h3>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select className="form-select" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                <option value="dentist">🦷 Dentist</option>
                <option value="salon">💇 Salon</option>
                <option value="car_rental">🚗 Car Rental</option>
                <option value="clinic">🏥 Clinic</option>
                <option value="coaching">📚 Coaching Center</option>
                <option value="other">🏢 Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Business Hours</label>
            <input className="form-input" value={businessHours} onChange={e => setBusinessHours(e.target.value)}
              placeholder="e.g. Sat–Thu, 9:00 AM – 9:00 PM" />
          </div>
        </div>

        {/* FAQ */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} /> FAQ Knowledge Base
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={addFaq}><Plus size={14} /> Add FAQ</button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            The AI bot uses these Q&As to answer customer questions. Add your most common questions here.
          </p>
          {faq.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>No FAQs yet. Add some to help your AI bot answer customer questions.</p>
              <button className="btn btn-primary btn-sm mt-20" onClick={addFaq}><Plus size={14} /> Add First FAQ</button>
            </div>
          ) : (
            faq.map((item, i) => (
              <div key={i} style={{
                padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Question</label>
                      <input className="form-input" value={item.q} onChange={e => updateFaq(i, 'q', e.target.value)}
                        placeholder="e.g. What are your timings?" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Answer</label>
                      <input className="form-input" value={item.a} onChange={e => updateFaq(i, 'a', e.target.value)}
                        placeholder="e.g. We're open Sat–Thu, 9am–9pm" />
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFaq(i)} style={{ marginLeft: 8 }}>
                    <Trash2 size={14} color="var(--red)" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Language */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} /> Language Settings
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { code: 'en', label: 'English', flag: '🇬🇧' },
              { code: 'ar', label: 'العربية', flag: '🇦🇪' },
              { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
            ].map(lang => (
              <div key={lang.code} style={{
                padding: '14px 24px', border: '2px solid var(--accent)', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-glow)', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{lang.flag}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lang.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
            <Clock size={12} style={{ verticalAlign: 'middle' }} /> Gemini AI automatically detects and replies in the customer's language
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
