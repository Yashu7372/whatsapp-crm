import { useEffect, useState } from 'react';
import { Copy, Ban } from 'lucide-react';
import { enterpriseApi, type Project, type UploadLink } from './enterpriseApi';

/** Format a Date for <input type="datetime-local"> without converting it to UTC first. */
const toLocalDateTimeInput = (d: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultExpiry = () => {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return toLocalDateTimeInput(d);
};

const status = (l: UploadLink): { label: string; tone: string } => {
  if (l.revokedAt) return { label: 'REVOKED', tone: 'red' };
  if (new Date(l.expiresAt) < new Date()) return { label: 'EXPIRED', tone: 'amber' };
  if (l.maxUploads != null && l.uploadCount >= l.maxUploads) return { label: 'EXHAUSTED', tone: 'amber' };
  return { label: 'ACTIVE', tone: 'green' };
};

export default function UploadLinks() {
  const [links, setLinks] = useState<UploadLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const [projectId, setProjectId] = useState('');
  const [docType, setDocType] = useState('');
  const [label, setLabel] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [maxUploads, setMaxUploads] = useState('');

  const load = () => enterpriseApi.uploadLinks().then(setLinks).catch(e => setError(String(e)));
  useEffect(() => { load(); }, []);
  useEffect(() => { enterpriseApi.projects().then(setProjects).catch(e => setError(String(e))); }, []);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      await enterpriseApi.createUploadLink({
        projectId: projectId || undefined,
        docType,
        label,
        password: password || undefined,
        // datetime-local is intentionally interpreted in the user's local timezone here; Date
        // then converts that instant to UTC for the API payload without shifting the displayed
        // wall-clock value beforehand.
        expiresAt: new Date(expiresAt).toISOString(),
        maxUploads: maxUploads ? Number(maxUploads) : undefined,
      });
      setLabel('');
      setDocType('');
      setPassword('');
      setMaxUploads('');
      setExpiresAt(defaultExpiry());
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      await enterpriseApi.revokeUploadLink(id);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = (l: UploadLink) => {
    void navigator.clipboard.writeText(l.url);
    setCopiedId(l.id);
    setTimeout(() => setCopiedId(''), 1500);
  };

  return <div className="ec-page">
    <header className="ec-topbar">
      <div className="ec-title">
        <h1>Upload Links</h1>
        <p>Shareable, expiring links a customer or applicant can use to submit documents with no account of their own — scanned before they ever reach the register.</p>
      </div>
    </header>

    {error && <div className="ec-error">{error}</div>}

    <section className="ec-card ec-section">
      <div className="ec-card-title"><h2>New link</h2><span>Tenant-admin controlled</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10 }}>
        <input className="ec-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Label — e.g. Acme Loan App #123, ID Documents" />
        <input className="ec-input" value={docType} onChange={e => setDocType(e.target.value.toUpperCase())} placeholder="Document type — e.g. LOAN_KYC" />
        <select className="ec-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">Tenant-level (no project)</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
        <input className="ec-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (optional)" />
        <input className="ec-input" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        <input className="ec-input" type="number" min={1} value={maxUploads} onChange={e => setMaxUploads(e.target.value)} placeholder="Max uploads (optional)" />
      </div>
      <div className="ec-kpi-meta" style={{ marginTop: 10 }}>
        Every upload is malware-scanned before it becomes a document. A rejected file never reaches the register. Links always expire — there is no permanent, unexpiring link.
      </div>
      <button className="ec-btn primary" disabled={busy || !label.trim() || !docType.trim() || !expiresAt} onClick={() => void create()} style={{ marginTop: 12 }}>
        {busy ? 'Creating…' : 'Create link'}
      </button>
    </section>

    <section className="ec-section">
      <div className="ec-card-title"><h2>Active and past links</h2><span>{links.length}</span></div>
      <div className="ec-table-wrap">
        <table className="ec-table">
          <thead>
            <tr><th>Label</th><th>Type / Project</th><th>Uploads</th><th>Expires</th><th>Status</th><th>Link</th><th>Action</th></tr>
          </thead>
          <tbody>
            {links.map(l => {
              const s = status(l);
              const proj = projects.find(p => p.id === l.projectId);
              return <tr key={l.id}>
                <td>{l.label}{l.requiresPassword && <><br /><small>Password protected</small></>}</td>
                <td>{l.docType}<br /><small>{proj ? proj.projectCode : 'Tenant-level'}</small></td>
                <td>{l.uploadCount}{l.maxUploads != null ? ` / ${l.maxUploads}` : ''}</td>
                <td>{new Date(l.expiresAt).toLocaleString()}</td>
                <td><span className={`ec-badge ${s.tone}`}>{s.label}</span></td>
                <td>
                  <button className="ec-btn" disabled={s.label !== 'ACTIVE'} onClick={() => copy(l)}>
                    <Copy size={13} />{copiedId === l.id ? 'Copied' : 'Copy'}
                  </button>
                </td>
                <td>
                  <button className="ec-btn" disabled={busy || s.label !== 'ACTIVE'} onClick={() => void revoke(l.id)}>
                    <Ban size={13} />Revoke
                  </button>
                </td>
              </tr>;
            })}
            {!links.length && <tr><td colSpan={7}><div className="ec-empty">No upload links yet.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
