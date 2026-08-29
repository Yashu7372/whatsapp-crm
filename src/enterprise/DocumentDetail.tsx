import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { enterpriseApi, type DocumentRecord, type DocumentApprovalSummary } from './enterpriseApi';

const badge = (status: string) =>
  status === 'APPROVED' || status === 'PUBLISHED' ? 'green'
    : status.includes('REJECT') ? 'red'
    : status.includes('REVIEW') ? 'amber' : 'teal';

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [approvals, setApprovals] = useState<DocumentApprovalSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    enterpriseApi.getDocument(id).then(setDoc).catch(e => setError(String(e)));
    enterpriseApi.documentApprovals(id).then(setApprovals).catch(() => {});
  }, [id]);

  if (error) return <div className="ec-page"><div className="ec-error">{error}</div></div>;
  if (!doc) return <div className="ec-page"><div className="ec-loading">Loading document…</div></div>;

  return <div className="ec-page">
    <header className="ec-topbar">
      <div className="ec-title">
        <Link to="/control/documents" className="ec-btn" style={{ marginBottom: 12, display: 'inline-flex' }}>
          <ArrowLeft size={15} />Back to register
        </Link>
        <h1>{doc.title}</h1>
        <p>{doc.documentCode || 'Unnumbered'} · {doc.docType}{doc.discipline ? ` · ${doc.discipline}` : ''}</p>
      </div>
      <span className={`ec-badge ${badge(doc.status)}`} style={{ fontSize: '0.9rem' }}>{doc.status.replaceAll('_', ' ')}</span>
    </header>

    <div className="ec-card ec-section">
      <div className="ec-card-title"><h2>Document details</h2></div>
      <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>Revision</strong> — {doc.currentRevisionCode ?? String(doc.currentVersion).padStart(2, '0')} (version {doc.currentVersion})</div></div>
      <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>Security classification</strong> — {doc.securityClassification ?? 'PROJECT'}</div></div>
      {doc.issuePurpose && <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>Issue purpose</strong> — {doc.issuePurpose.replaceAll('_', ' ')}</div></div>}
      {doc.description && <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>Description</strong> — {doc.description}</div></div>}
      <div className="ec-insight"><div className="ec-insight-dot" /><div><strong>Last updated</strong> — {new Date(doc.updatedAt).toLocaleString()}</div></div>
    </div>

    <div className="ec-card ec-section">
      <div className="ec-card-title"><h2>Approval history</h2></div>
      {approvals.length === 0 && <div className="ec-empty">This document has not been submitted for approval.</div>}
      {approvals.map(a => <div key={a.id} className="ec-insight">
        <div className="ec-insight-dot" />
        <div>
          <span className={`ec-badge ${badge(a.status)}`}>{a.status.replaceAll('_', ' ')}</span>{' '}
          step {a.currentStep + 1} · started {new Date(a.startedAt).toLocaleDateString()}
          {a.completedAt && <> · completed {new Date(a.completedAt).toLocaleDateString()}</>}
        </div>
      </div>)}
    </div>
  </div>;
}
