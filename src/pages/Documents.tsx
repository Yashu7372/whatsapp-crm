import { useState, useEffect, type ReactElement } from 'react';
import { FileText, Plus, Upload, MessageSquare, GitBranch, ChevronRight, X, CheckCircle, XCircle, Clock, Archive } from 'lucide-react';
import { documentApi, workflowApi } from '../api/documentApi';
import type { Document, Workflow, DocumentComment } from '../api/documentApi';

const DOC_TYPES = ['GENERAL', 'POLICY', 'CONTRACT', 'REPORT', 'PROPOSAL', 'INVOICE', 'OTHER'];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280',
  IN_REVIEW: '#f59e0b',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
  PUBLISHED: '#3b82f6',
  ARCHIVED: '#9ca3af',
};

const STATUS_ICONS: Record<string, ReactElement> = {
  DRAFT: <FileText size={14} />,
  IN_REVIEW: <Clock size={14} />,
  APPROVED: <CheckCircle size={14} />,
  REJECTED: <XCircle size={14} />,
  PUBLISHED: <CheckCircle size={14} />,
  ARCHIVED: <Archive size={14} />,
};

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [filterType, setFilterType] = useState('');
  const [view, setView] = useState<'documents' | 'workflows'>('documents');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState('GENERAL');
  const [newDescription, setNewDescription] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  // Workflow form state
  const [wfName, setWfName] = useState('');
  const [wfDocType, setWfDocType] = useState('GENERAL');
  const [wfSteps, setWfSteps] = useState([{ name: 'Review', reviewerEmail: '' }]);

  useEffect(() => {
    loadDocs();
    loadWorkflows();
  }, [filterType]);

  async function loadDocs() {
    try {
      setLoading(true);
      const data = await documentApi.list(filterType || undefined);
      setDocs(data);
    } catch (e) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkflows() {
    try {
      const data = await workflowApi.list();
      setWorkflows(data);
    } catch {
      // non-blocking
    }
  }

  async function selectDoc(doc: Document) {
    setSelectedDoc(doc);
    try {
      const c = await documentApi.comments(doc.id);
      setComments(c);
    } catch {
      setComments([]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const doc = newFile
        ? await documentApi.create(newTitle, newDocType, newDescription, newFile)
        : await documentApi.createJson({ title: newTitle, docType: newDocType, description: newDescription });
      setDocs(prev => [doc, ...prev]);
      setShowCreateModal(false);
      setNewTitle(''); setNewDocType('GENERAL'); setNewDescription(''); setNewFile(null);
    } catch (e) {
      alert('Failed to create document');
    }
  }

  async function handleSubmitForApproval(docId: string) {
    try {
      await documentApi.submit(docId);
      loadDocs();
      if (selectedDoc?.id === docId) {
        setSelectedDoc(prev => prev ? { ...prev, status: 'IN_REVIEW' } : null);
      }
    } catch (e: any) {
      alert(e.message ?? 'Failed to submit for approval');
    }
  }

  async function handleDecide(docId: string, decision: string) {
    try {
      const approvals = await documentApi.approvals(docId);
      const pending = approvals.find(a => a.status === 'PENDING');
      if (!pending) { alert('No pending approval found'); return; }
      await documentApi.decide(pending.id, decision, '');
      loadDocs();
      if (selectedDoc?.id === docId) {
        const updated = await documentApi.get(docId);
        setSelectedDoc(updated);
      }
    } catch (e: any) {
      alert(e.message ?? 'Failed to submit decision');
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return;
    try {
      await documentApi.delete(docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch {
      alert('Failed to delete document');
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoc || !newComment.trim()) return;
    try {
      const c = await documentApi.addComment(selectedDoc.id, newComment.trim());
      setComments(prev => [...prev, c]);
      setNewComment('');
    } catch {
      alert('Failed to add comment');
    }
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    try {
      const wf = await workflowApi.create(wfName, wfDocType, wfSteps);
      setWorkflows(prev => [...prev, wf]);
      setShowWorkflowModal(false);
      setWfName(''); setWfDocType('GENERAL');
      setWfSteps([{ name: 'Review', reviewerEmail: '' }]);
    } catch {
      alert('Failed to create workflow');
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--header-h))', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{
        width: selectedDoc ? '380px' : '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: selectedDoc ? '1px solid var(--border)' : 'none',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Document Control
            </h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowWorkflowModal(true)} style={btnStyle('secondary')}>
                <GitBranch size={14} /> Workflows
              </button>
              <button onClick={() => setShowCreateModal(true)} style={btnStyle('primary')}>
                <Plus size={14} /> New Document
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType('')}
              style={filterType === '' ? activeFilterStyle : filterStyle}
            >
              All
            </button>
            {DOC_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={filterType === t ? activeFilterStyle : filterStyle}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Doc list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No documents yet. Create your first one.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => selectDoc(doc)}
                style={{
                  padding: '14px 16px',
                  marginBottom: 8,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${selectedDoc?.id === doc.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedDoc?.id === doc.id ? 'var(--accent-muted)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 500,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: `${STATUS_COLORS[doc.status] ?? '#6b7280'}22`,
                        color: STATUS_COLORS[doc.status] ?? '#6b7280',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        {STATUS_ICONS[doc.status]} {doc.status}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {doc.docType} · v{doc.currentVersion}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 3 }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedDoc && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Detail header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedDoc.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 500, padding: '2px 8px', borderRadius: '999px',
                    background: `${STATUS_COLORS[selectedDoc.status] ?? '#6b7280'}22`,
                    color: STATUS_COLORS[selectedDoc.status] ?? '#6b7280',
                  }}>
                    {selectedDoc.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedDoc.docType} · Version {selectedDoc.currentVersion}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedDoc.status === 'DRAFT' && (
                  <button onClick={() => handleSubmitForApproval(selectedDoc.id)} style={btnStyle('primary')}>
                    Submit for Approval
                  </button>
                )}
                {selectedDoc.status === 'IN_REVIEW' && (
                  <>
                    <button onClick={() => handleDecide(selectedDoc.id, 'APPROVED')} style={btnStyle('success')}>
                      Approve
                    </button>
                    <button onClick={() => handleDecide(selectedDoc.id, 'REJECTED')} style={btnStyle('danger')}>
                      Reject
                    </button>
                  </>
                )}
                <button onClick={() => handleDelete(selectedDoc.id)} style={btnStyle('ghost')}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Detail body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {selectedDoc.description && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={sectionTitle}>Description</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                  {selectedDoc.description}
                </p>
              </div>
            )}

            {selectedDoc.tags && selectedDoc.tags.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={sectionTitle}>Tags</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedDoc.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: '999px',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      fontSize: '0.75rem', color: 'var(--text-secondary)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <h3 style={sectionTitle}>Details</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['Created', new Date(selectedDoc.createdAt).toLocaleString()],
                    ['Updated', new Date(selectedDoc.updatedAt).toLocaleString()],
                    ['Workflow', selectedDoc.workflowId ? workflows.find(w => w.id === selectedDoc.workflowId)?.name ?? 'Assigned' : 'None'],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-muted)', width: '120px' }}>{label}</td>
                      <td style={{ padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Comments */}
            <div>
              <h3 style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={14} /> Comments ({comments.length})
              </h3>
              <div style={{ marginBottom: 12 }}>
                {comments.map(c => (
                  <div key={c.id} style={{
                    padding: '10px 14px', marginBottom: 8,
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {c.authorName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
                <button type="submit" style={btnStyle('primary')}>Post</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="New Document">
          <form onSubmit={handleCreate}>
            <Field label="Title">
              <input
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Document title"
                style={inputStyle}
              />
            </Field>
            <Field label="Type">
              <select value={newDocType} onChange={e => setNewDocType(e.target.value)} style={inputStyle}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
                placeholder="Optional description"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
            <Field label="File (optional)">
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-muted)',
              }}>
                <Upload size={14} />
                {newFile ? newFile.name : 'Click to upload'}
                <input type="file" hidden onChange={e => setNewFile(e.target.files?.[0] ?? null)} />
              </label>
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={btnStyle('secondary')}>Cancel</button>
              <button type="submit" style={btnStyle('primary')}>Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Workflow Modal */}
      {showWorkflowModal && (
        <Modal onClose={() => setShowWorkflowModal(false)} title="Document Workflows">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Existing Workflows
            </h3>
            {workflows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No workflows yet.</p>
            ) : (
              workflows.map(w => (
                <div key={w.id} style={{
                  padding: '8px 12px', marginBottom: 6,
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', fontSize: '0.875rem',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{w.docType}</span>
                </div>
              ))
            )}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Create Workflow
          </h3>
          <form onSubmit={handleCreateWorkflow}>
            <Field label="Name">
              <input required value={wfName} onChange={e => setWfName(e.target.value)} placeholder="e.g. Contract Approval" style={inputStyle} />
            </Field>
            <Field label="Document Type">
              <select value={wfDocType} onChange={e => setWfDocType(e.target.value)} style={inputStyle}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Approval Steps">
              {wfSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={step.name}
                    onChange={e => { const s = [...wfSteps]; s[i] = { ...s[i], name: e.target.value }; setWfSteps(s); }}
                    placeholder="Step name"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    value={step.reviewerEmail}
                    onChange={e => { const s = [...wfSteps]; s[i] = { ...s[i], reviewerEmail: e.target.value }; setWfSteps(s); }}
                    placeholder="Reviewer email"
                    style={{ ...inputStyle, flex: 1.5 }}
                  />
                  {wfSteps.length > 1 && (
                    <button type="button" onClick={() => setWfSteps(wfSteps.filter((_, j) => j !== i))} style={btnStyle('ghost')}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setWfSteps([...wfSteps, { name: '', reviewerEmail: '' }])} style={btnStyle('secondary')}>
                + Add Step
              </button>
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" onClick={() => setShowWorkflowModal(false)} style={btnStyle('secondary')}>Cancel</button>
              <button type="submit" style={btnStyle('primary')}>Create Workflow</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={btnStyle('ghost')}><X size={14} /></button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// Styles
const sectionTitle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const filterStyle: React.CSSProperties = {
  padding: '4px 12px', borderRadius: '999px',
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer',
};

const activeFilterStyle: React.CSSProperties = {
  ...filterStyle,
  background: 'var(--accent)', border: '1px solid var(--accent)',
  color: '#fff', fontWeight: 600,
};

function btnStyle(variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: 'none',
    transition: 'all 0.15s',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' },
    ghost:     { background: 'transparent', color: 'var(--text-muted)' },
    success:   { background: '#16a34a', color: '#fff' },
    danger:    { background: '#dc2626', color: '#fff' },
  };
  return { ...base, ...variants[variant] };
}
