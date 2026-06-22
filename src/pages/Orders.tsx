import { useEffect, useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { orderApi, type Order } from '../api/orderApi';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'var(--blue)',
  PROCESSING: 'var(--yellow)',
  CONFIRMED: 'var(--accent)',
  SHIPPED: 'var(--purple)',
  DELIVERED: 'var(--accent)',
  CANCELLED: 'var(--red)',
};

const STATUS_OPTIONS = ['RECEIVED', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function OrderPayload({ raw }: { raw: string }) {
  const [expanded, setExpanded] = useState(false);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = raw; }
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide payload' : 'View payload'}
      </button>
      {expanded && (
        <pre style={{
          marginTop: 8, padding: 10, background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-xs)', fontSize: '0.72rem',
          overflowX: 'auto', color: 'var(--text-secondary)',
        }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    orderApi.list().then(setOrders).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await orderApi.updateStatus(id, status);
      load();
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WhatsApp Orders</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Orders received via WhatsApp Commerce catalog
        </p>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <ShoppingCart size={40} color="var(--text-muted)" />
          <p>No orders yet. Orders placed via your WhatsApp Commerce catalog will appear here.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: STATUS_COLORS[o.status] + '22',
                      color: STATUS_COLORS[o.status] || 'var(--text-secondary)',
                    }}>
                      {o.status}
                    </span>
                    {o.catalogId && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Catalog: {o.catalogId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {fmt(o.createdAt)}
                    {o.waMessageId && ` · WA: ${o.waMessageId.slice(0, 12)}…`}
                  </div>
                </div>
                <select
                  className="form-input"
                  style={{ width: 'auto', fontSize: '0.82rem', padding: '4px 8px' }}
                  value={o.status}
                  disabled={updatingId === o.id}
                  onChange={(e) => handleStatus(o.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 10 }}>
                <OrderPayload raw={o.orderPayload} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
