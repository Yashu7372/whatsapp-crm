import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Send } from 'lucide-react';
import { enterpriseApi, type DocumentPage, type DocumentRecord } from './enterpriseApi';

const badge = (status: string) =>
  status === 'APPROVED' || status === 'PUBLISHED' ? 'green'
    : status.includes('REJECT') ? 'red'
    : status.includes('REVIEW') ? 'amber' : 'teal';

const securityBadge = (classification?: string) =>
  classification === 'RESTRICTED' ? 'red' : classification === 'ORGANIZATION' ? 'amber' : 'teal';

const ISSUE_PURPOSES = ['FOR_INFORMATION', 'FOR_REVIEW', 'FOR_APPROVAL', 'FOR_CONSTRUCTION', 'AS_BUILT'];

const CHANNEL_LABEL: Record<DocumentRecord['intakeChannel'], string> = {
  PORTAL: 'Portal', LINK: 'Upload link', WHATSAPP: 'WhatsApp', EMAIL: 'Email',
};

// Purposes the backend will only accept on an approved document; surfaced here so the control is
// disabled rather than letting the user discover the rule through a 409.
const APPROVAL_REQUIRED_PURPOSES = new Set(['FOR_CONSTRUCTION', 'AS_BUILT']);

export default function DocumentRegister() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [purpose, setPurpose] = useState('FOR_INFORMATION');

  const apply = (result: DocumentPage) => {
    setDocs(result.documents);
    setHasMore(result.hasMore);
    setPage(result.page);
    setError('');
  };

  // Matches the loading idiom used across the enterprise screens: the request is started in the
  // effect and state is set from its callback, never synchronously in the effect body.
  useEffect(() => {
    enterpriseApi.documents(0).then(apply).catch(e => setError(String(e)));
  }, []);

  const load = (target: number) =>
    enterpriseApi.documents(target).then(apply).catch(e => setError(String(e)));

  const issue = async (documentId: string) => {
    setBusyId(documentId);
    setError('');
    try {
      await enterpriseApi.issueCurrentRevision(documentId, purpose);
      await load(page);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId('');
    }
  };

  // Filtering stays client-side over the loaded page; the authorization filter and the page
  // boundary are both applied server-side.
  const filtered = useMemo(() => docs.filter(d =>
    `${d.documentCode ?? ''} ${d.title} ${d.docType} ${d.status} ${d.securityClassification ?? ''} ${d.discipline ?? ''}`
      .toLowerCase().includes(query.toLowerCase())), [docs, query]);

  const canIssue = (d: DocumentRecord) =>
    d.status !== 'REJECTED' && d.status !== 'ARCHIVED'
    && (!APPROVAL_REQUIRED_PURPOSES.has(purpose) || d.status === 'APPROVED' || d.status === 'PUBLISHED');

  return <div className="ec-page">
    <header className="ec-topbar">
      <div className="ec-title">
        <h1>Document Register</h1>
        <p>Controlled register with exact revision, security scope, issue purpose, workflow status and contractual deadline.</p>
      </div>
      <button className="ec-btn" onClick={() => void load(page)}><RefreshCw size={15} />Refresh</button>
    </header>

    {error && <div className="ec-error">{error}</div>}

    <div className="ec-filterbar">
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#8190a5' }} />
        <input
          className="ec-input"
          style={{ width: '100%', paddingLeft: 36 }}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search number, title, type, discipline, security or status"
        />
      </div>
      <label>
        <small>Issue purpose</small>
        <select className="ec-select" value={purpose} onChange={e => setPurpose(e.target.value)}>
          {ISSUE_PURPOSES.map(p => <option key={p} value={p}>{p.replaceAll('_', ' ')}</option>)}
        </select>
      </label>
    </div>

    <div className="ec-table-wrap">
      <table className="ec-table">
        <thead>
          <tr>
            <th>Document</th><th>Type / Discipline</th><th>Revision</th><th>Security</th>
            <th>Issue purpose</th><th>Status</th><th>Return code</th><th>SLA due</th>
            <th>Source</th><th>Last update</th><th>Issue</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(d => <tr key={d.id}>
            <td>
              <div className="ec-doc-code">{d.documentCode || 'Unnumbered'}</div>
              <div><Link to={`/control/documents/${d.id}`}>{d.title}</Link></div>
              {(d.packageCode || d.locationCode) && <small>{d.packageCode ?? '—'} • {d.locationCode ?? '—'}</small>}
            </td>
            <td>{d.docType}<br /><small>{d.discipline ?? '—'}</small></td>
            <td>
              <strong>{d.currentRevisionCode ?? String(d.currentVersion).padStart(2, '0')}</strong>
              <br /><small>Version {d.currentVersion}</small>
            </td>
            <td><span className={`ec-badge ${securityBadge(d.securityClassification)}`}>{d.securityClassification ?? 'PROJECT'}</span></td>
            <td>{d.issuePurpose?.replaceAll('_', ' ') ?? '—'}</td>
            <td><span className={`ec-badge ${badge(d.status)}`}>{d.status.replaceAll('_', ' ')}</span></td>
            <td>{d.reviewOutcome || '—'}</td>
            <td>{d.dueAt ? new Date(d.dueAt).toLocaleDateString() : '—'}</td>
            <td>
              <span className={`ec-badge ${d.intakeChannel === 'PORTAL' ? '' : 'teal'}`}>{CHANNEL_LABEL[d.intakeChannel]}</span>
              {d.uploaderName && <><br /><small>{d.uploaderName}</small></>}
            </td>
            <td>{new Date(d.updatedAt).toLocaleDateString()}</td>
            <td>
              <button
                className="ec-btn"
                disabled={busyId === d.id || !canIssue(d)}
                title={canIssue(d) ? `Issue the current revision as ${purpose.replaceAll('_', ' ')}`
                  : `A ${d.status} document cannot be issued as ${purpose.replaceAll('_', ' ')}`}
                onClick={() => void issue(d.id)}
              >
                <Send size={14} />{busyId === d.id ? 'Issuing…' : 'Issue'}
              </button>
            </td>
          </tr>)}
          {!filtered.length && <tr><td colSpan={11}><div className="ec-empty">No documents match the current authorization scope and filter.</div></td></tr>}
        </tbody>
      </table>
    </div>

    <div className="ec-filterbar" style={{ justifyContent: 'space-between' }}>
      <span className="ec-kpi-meta">Page {page + 1} — {docs.length} document(s) on this page</span>
      <span style={{ display: 'flex', gap: 8 }}>
        <button className="ec-btn" disabled={page === 0} onClick={() => void load(page - 1)}>Previous</button>
        <button className="ec-btn" disabled={!hasMore} onClick={() => void load(page + 1)}>Next</button>
      </span>
    </div>

    <div className="ec-card ec-section">
      <div className="ec-card-title"><h2>Visibility policy</h2><span>Server enforced</span></div>
      <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>PROJECT</strong> — active project participants may read; only the originator company or an explicit named grant can edit/issue.</div></div>
      <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>ORGANIZATION</strong> — originator company, explicit grants and assigned reviewers only.</div></div>
      <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>RESTRICTED</strong> — explicit grants or workflow assignment only; the UI never treats hidden controls as security.</div></div>
      <div className="ec-insight"><div className="ec-insight-dot" /><div>Issuing publishes the current revision and supersedes the previously issued one. Only issued revisions can be placed on a transmittal.</div></div>
    </div>
  </div>;
}
