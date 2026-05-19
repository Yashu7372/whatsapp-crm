import { Check, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'AED 299',
    period: '/month',
    features: ['1 WhatsApp number', '1 agent', '500 AI replies/month', 'Basic dashboard', 'Email support'],
    current: true,
  },
  {
    name: 'Growth',
    price: 'AED 599',
    period: '/month',
    popular: true,
    features: ['3 WhatsApp numbers', '5 agents', 'Unlimited AI replies', 'Campaign broadcasts', 'Smart retargeting', 'Priority support'],
    current: false,
  },
  {
    name: 'Agency',
    price: 'AED 1,499',
    period: '/month',
    features: ['10+ workspaces', 'Unlimited agents', 'White-label branding', 'Custom AI training', 'API access', 'Dedicated manager'],
    current: false,
  },
];

export default function BillingSettings() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Billing & Plans</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage your subscription and billing details</p>
      </div>

      {/* Current Plan Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.1))', borderColor: 'rgba(34,197,94,0.3)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Zap size={18} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Starter Plan</span>
              <span className="badge green">Active</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              14-day free trial · Ends May 27, 2026 · No card on file
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>AED 299<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Current Usage</h3>
          <span className="badge blue">This Month</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { label: 'AI Replies Used', used: 312, total: 500, color: 'var(--accent)' },
            { label: 'WhatsApp Numbers', used: 1, total: 1, color: 'var(--blue)' },
            { label: 'Team Members', used: 1, total: 1, color: 'var(--purple)' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.used}/{item.total}</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: item.color,
                  width: `${Math.min((item.used / item.total) * 100, 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Available Plans</h3>
      <div className="pricing-grid">
        {plans.map(plan => (
          <div className={`pricing-card ${plan.popular ? 'popular' : ''}`} key={plan.name}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{plan.name}</h3>
            <div className="price">{plan.price}<span>{plan.period}</span></div>
            <ul className="features">
              {plan.features.map((f, i) => (
                <li key={i}><Check size={14} color="var(--accent)" /> {f}</li>
              ))}
            </ul>
            <button className={`btn ${plan.current ? 'btn-secondary' : plan.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
              {plan.current ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
