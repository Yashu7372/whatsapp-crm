import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, X } from 'lucide-react';
import { productApi, type Product, type CreateProductInput } from '../api/productApi';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [retailerId, setRetailerId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [inventoryCount, setInventoryCount] = useState('');

  function load() {
    setLoading(true);
    setError(null);
    productApi.list().then(setProducts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const input: CreateProductInput = {
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        ...(price.trim() && { price: price.trim() }),
        currency: currency || 'AED',
        ...(retailerId.trim() && { retailerId: retailerId.trim() }),
        ...(imageUrl.trim() && { imageUrl: imageUrl.trim() }),
        ...(inventoryCount.trim() && { inventoryCount: parseInt(inventoryCount) }),
      };
      await productApi.create(input);
      setName(''); setDescription(''); setPrice(''); setRetailerId('');
      setImageUrl(''); setInventoryCount(''); setCurrency('AED');
      setShowForm(false);
      load();
    } catch (err: any) {
      alert('Failed to create product: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Archive this product?')) return;
    try {
      await productApi.delete(id);
      load();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Products</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage your product catalog for WhatsApp Commerce
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700 }}>Add Product</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="form-input" placeholder="Product name *" value={name} onChange={(e) => setName(e.target.value)} required />
              <textarea className="form-input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="form-input" placeholder="Price (e.g. 99.99)" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {['AED', 'USD', 'EUR', 'GBP', 'INR', 'SAR'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <input className="form-input" placeholder="Retailer ID (Meta Commerce)" value={retailerId} onChange={(e) => setRetailerId(e.target.value)} />
              <input className="form-input" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <input className="form-input" placeholder="Inventory count" type="number" value={inventoryCount} onChange={(e) => setInventoryCount(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" /></div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <Package size={40} color="var(--text-muted)" />
          <p>No products yet. Add your first product to start using WhatsApp Commerce.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Product</button>
        </div>
      )}

      {products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {products.map((p) => (
            <div key={p.id} className="card" style={{ position: 'relative' }}>
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name}
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: 12 }} />
              )}
              {!p.imageUrl && (
                <div style={{
                  width: '100%', height: 80, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Package size={32} color="var(--text-muted)" />
                </div>
              )}
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              {p.description && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 8, lineHeight: 1.5 }}>
                  {p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <div>
                  {p.price != null && (
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {p.currency} {Number(p.price).toFixed(2)}
                    </span>
                  )}
                  {p.inventoryCount != null && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 8 }}>
                      Stock: {p.inventoryCount}
                    </span>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: '4px 8px' }}
                  onClick={() => handleDelete(p.id)} title="Archive">
                  <Trash2 size={14} />
                </button>
              </div>
              {p.retailerId && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  SKU: {p.retailerId}
                </div>
              )}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Added {fmt(p.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
