import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, MessageSquare, Zap, Send } from 'lucide-react';
import { crmApi } from '../api/crmApi';
import { isAuthenticated } from '../api/httpClient';

const bizTypes = [
  { id: 'dentist', icon: '🦷', name: 'Dentist / Clinic' },
  { id: 'salon', icon: '💇', name: 'Salon / Spa' },
  { id: 'car_rental', icon: '🚗', name: 'Car Rental' },
  { id: 'clinic', icon: '🏥', name: 'General Clinic' },
  { id: 'coaching', icon: '📚', name: 'Coaching Center' },
  { id: 'other', icon: '🏢', name: 'Other Business' },
];

const steps = [
  { title: 'Choose Your Business Type', subtitle: "We'll pre-load the right FAQ and templates for you" },
  { title: 'Set Up Your FAQ', subtitle: 'Review and customize your AI knowledge base' },
  { title: 'Connect WhatsApp', subtitle: 'Link your business WhatsApp number' },
  { title: 'Working Hours & Team', subtitle: 'Set your availability and invite team members' },
  { title: 'Send a Test Message', subtitle: 'See your AI bot in action!' },
];

export default function Onboarding() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const [step, setStep] = useState(0);
  const [bizType, setBizType] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const navigate = useNavigate();

  const next = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      try {
        await crmApi.updateWorkspace({
          businessType: bizType || 'other',
          whatsappPhoneId: whatsappPhoneId || undefined,
          whatsappToken: whatsappToken || undefined,
        });
      } catch (e) {
        console.error('Failed to save onboarding data:', e);
      }
      navigate('/dashboard');
    }
  };
  const prev = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Dhad Digital CRM</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Setup Wizard</div>
          </div>
        </div>

        {/* Progress */}
        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          Step {step + 1} of {steps.length}
        </div>
        <h2>{steps[step].title}</h2>
        <p className="subtitle">{steps[step].subtitle}</p>

        {/* Step Content */}
        {step === 0 && (
          <div className="biz-type-grid">
            {bizTypes.map(bt => (
              <div
                key={bt.id}
                className={`biz-type-card ${bizType === bt.id ? 'selected' : ''}`}
                onClick={() => setBizType(bt.id)}
              >
                <div className="biz-icon">{bt.icon}</div>
                <div className="biz-name">{bt.name}</div>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'What are your timings?', a: "We're open Sat–Thu, 9am–9pm" },
              { q: 'How much is a cleaning?', a: 'Deep cleaning starts at AED 250' },
              { q: 'Do you accept insurance?', a: 'Yes, we accept Daman, AXA, and Oman Insurance' },
            ].map((faq, i) => (
              <div key={i} style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Question</label>
                  <input className="form-input" defaultValue={faq.q} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Answer</label>
                  <input className="form-input" defaultValue={faq.a} />
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>+ Add another FAQ</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ padding: 24, background: 'var(--blue-glow)', borderRadius: 'var(--radius)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: 20 }}>
              <MessageSquare size={32} color="var(--blue)" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--blue)' }}>Connect Meta WhatsApp Cloud API</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                To connect WhatsApp, you need a Phone Number ID and an Access Token from the Meta Developer Portal.
              </p>
              <button className="btn btn-primary" onClick={() => window.open('https://developers.facebook.com', '_blank')}>
                🔗 Open Meta Developer Portal
              </button>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone Number ID</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 123456789012345" 
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Access Token</label>
                <input 
                  className="form-input" 
                  type="password" 
                  placeholder="Your Meta API token" 
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              You can also skip this and configure it later from the Dashboard Settings.
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Working Days</label>
                <select className="form-select" defaultValue="sat-thu">
                  <option value="sat-thu">Saturday – Thursday</option>
                  <option value="sun-thu">Sunday – Thursday</option>
                  <option value="mon-fri">Monday – Friday</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Working Hours</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="form-input" type="time" defaultValue="09:00" style={{ flex: 1 }} />
                  <span style={{ color: 'var(--text-muted)' }}>to</span>
                  <input className="form-input" type="time" defaultValue="21:00" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Invite a Team Member (optional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="colleague@clinic.ae" style={{ flex: 1 }} />
                <button className="btn btn-secondary">Invite</button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '2px solid var(--accent)',
            }}>
              <Send size={32} color="var(--accent)" />
            </div>

            {whatsappPhoneId && whatsappToken ? (
              <>
                <p style={{ fontSize: '0.92rem', marginBottom: 8 }}>
                  🎉 <strong>WhatsApp is configured!</strong>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                  Send any message to your connected WhatsApp Business number and your AI bot will reply automatically.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 600, fontSize: '0.88rem',
                }}>
                  ✅ Bot is live and ready to receive messages
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.92rem', marginBottom: 8 }}>
                  <strong>WhatsApp not connected yet</strong>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                  You skipped the WhatsApp step. You can connect it anytime from <strong>Settings → AI Bot Config</strong> after launching the dashboard.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  background: 'var(--orange-glow)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(249,115,22,0.3)', color: 'var(--orange)', fontWeight: 600, fontSize: '0.88rem',
                }}>
                  ⚙️ Configure WhatsApp after launch
                </div>
              </>
            )}

            <div style={{
              background: 'var(--bg-primary)', borderRadius: 'var(--radius)', padding: 20,
              border: '1px solid var(--border)', textAlign: 'left', maxWidth: 360, margin: '20px auto 0',
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>How it works:</div>
              <div className="message-bubble inbound" style={{ maxWidth: '100%', marginBottom: 8 }}>Hi, I need an appointment</div>
              <div className="message-bubble outbound" style={{ maxWidth: '100%' }}>
                Hello! I'm your AI assistant 😊 I'll help you book an appointment. What service are you looking for?
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button className="btn btn-ghost" onClick={prev} disabled={step === 0} style={{ opacity: step === 0 ? 0.3 : 1 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn btn-primary" onClick={next}>
            {step === 4 ? (
              <><Check size={16} /> Launch Dashboard</>
            ) : (
              <>Continue <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
