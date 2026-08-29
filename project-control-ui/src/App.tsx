import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Database, FileText, GitBranch, Play, RefreshCw, RotateCcw, Send, XCircle } from 'lucide-react';
import { api, createDemo, type DemoState, type DocumentView, type RevisionView, type WorkflowHistory, type WorkflowInstance } from './api';
import './styles.css';

const STORAGE_KEY = 'project-control-foundation-demo';

function App() {
  const [demo, setDemo] = useState<DemoState | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as DemoState : null;
  });
  const [documents, setDocuments] = useState<DocumentView[]>([]);
  const [revisions, setRevisions] = useState<RevisionView[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(demo?.workflowInstance ?? null);
  const [history, setHistory] = useState<WorkflowHistory | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Ready. Start the backend, then create a local demo.');
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('Checked from local UI');
  const [actor, setActor] = useState('local-tester');
  const [revisionCode, setRevisionCode] = useState('B');

  const currentDefinitionStep = useMemo(() => {
    if (!demo || !workflow?.currentStep) return null;
    return demo.workflowSteps.find(step => step.stepCode === workflow.currentStep?.stepCode) ?? null;
  }, [demo, workflow]);

  const earlierSteps = useMemo(() => {
    if (!demo || !workflow?.currentStep) return [];
    return demo.workflowSteps.filter(step => step.sequence < workflow.currentStep!.sequence);
  }, [demo, workflow]);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(label);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshAll(target = demo) {
    if (!target) return;
    const [docs, revs, instance, hist] = await Promise.all([
      api.listDocuments(target.project.id),
      api.listRevisions(target.document.id),
      api.getWorkflow(target.workflowInstance.id),
      api.getHistory(target.workflowInstance.id),
    ]);
    setDocuments(docs);
    setRevisions(revs);
    setWorkflow(instance);
    setHistory(hist);
    setMessage('Backend state refreshed.');
  }

  async function seedDemo() {
    await run('Creating full Project Control demo...', async () => {
      const created = await createDemo();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
      setDemo(created);
      setWorkflow(created.workflowInstance);
      await refreshAll(created);
      setMessage('Demo created: Project + Scope + Capability + Document + Revision + Workflow are live.');
    });
  }

  async function completeStep() {
    if (!workflow || !currentDefinitionStep) return;
    await run(`Completing ${workflow.currentStep?.stepName}...`, async () => {
      const updated = await api.workflowAction(workflow.id, {
        actionType: 'COMPLETE_STEP',
        actionCode: currentDefinitionStep.completionActionCode,
        actorReference: actor,
        comment,
      });
      setWorkflow(updated);
      if (demo) await refreshAll(demo);
    });
  }

  async function addComment() {
    if (!workflow) return;
    await run('Adding workflow comment...', async () => {
      await api.workflowAction(workflow.id, {
        actionType: 'COMMENT', actorReference: actor, comment,
      });
      if (demo) await refreshAll(demo);
    });
  }

  async function returnTo(stepCode: string) {
    if (!workflow) return;
    await run(`Returning to ${stepCode}...`, async () => {
      const updated = await api.workflowAction(workflow.id, {
        actionType: 'RETURN', targetStepCode: stepCode,
        actorReference: actor, comment: comment || 'Returned from local UI',
      });
      setWorkflow(updated);
      if (demo) await refreshAll(demo);
    });
  }

  async function rejectWorkflow() {
    if (!workflow) return;
    await run('Rejecting workflow...', async () => {
      const updated = await api.workflowAction(workflow.id, {
        actionType: 'REJECT', actorReference: actor,
        comment: comment || 'Rejected from local UI',
      });
      setWorkflow(updated);
      if (demo) await refreshAll(demo);
    });
  }

  async function addRevision() {
    if (!demo) return;
    await run(`Adding revision ${revisionCode}...`, async () => {
      await api.addRevision(demo.document.id, revisionCode, `Revision ${revisionCode} created from local UI`);
      await refreshAll(demo);
      setRevisionCode(String.fromCharCode(revisionCode.charCodeAt(0) + 1));
    });
  }

  useEffect(() => {
    if (demo) {
      refreshAll(demo).catch(() => {
        setMessage('Saved demo points to a backend database that is not currently available. Create a new demo if you reset the backend.');
      });
    }
    // initial restore only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><GitBranch size={24} /><div><strong>Project Control</strong><span>Foundation Lab</span></div></div>
        <div className="side-section">
          <span className="side-title">Implemented foundations</span>
          <div className="side-item"><CheckCircle2 size={17}/> Project context</div>
          <div className="side-item"><CheckCircle2 size={17}/> Documents & revisions</div>
          <div className="side-item"><CheckCircle2 size={17}/> Generic workflow</div>
        </div>
        <div className="side-note">Local UI intentionally has no authentication yet. It tests the domain foundations directly.</div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">SPRING MODULITH · LOCAL END-TO-END TEST</p>
            <h1>Project Control Foundation</h1>
            <p className="subtitle">Prove real API behaviour before we build the production navigation and security experience.</p>
          </div>
          <div className="top-actions">
            <button className="ghost" disabled={busy || !demo} onClick={() => run('Refreshing...', () => refreshAll())}><RefreshCw size={16}/> Refresh</button>
            <button className="primary" disabled={busy} onClick={seedDemo}><Play size={16}/> Create fresh demo</button>
          </div>
        </header>

        <div className={`status ${error ? 'status-error' : ''}`}>
          <Activity size={17}/><span>{error ?? message}</span>{busy && <span className="pulse">working</span>}
        </div>

        {!demo ? (
          <section className="empty-card">
            <Database size={40}/>
            <h2>No local demo yet</h2>
            <p>Start the backend on port 8080, then click <strong>Create fresh demo</strong>. The UI will create the entire Project → Scope → Capability → Document → Workflow chain through real REST APIs.</p>
          </section>
        ) : (
          <>
            <section className="metrics-grid">
              <Metric label="Project" value={demo.project.code} note={demo.project.name}/>
              <Metric label="Organization" value={demo.contractor.displayName} note={demo.participant.partyRole}/>
              <Metric label="Scope" value={demo.mepScope.code} note={`${demo.constructionScope.name} / ${demo.mepScope.name}`}/>
              <Metric label="Capabilities" value={String(demo.capabilities.length)} note={demo.capabilities.map(c => c.capabilityCode).join(' · ')}/>
            </section>

            <section className="two-column">
              <article className="panel">
                <div className="panel-heading"><div><p className="eyebrow">FOUNDATION 02</p><h2><FileText size={20}/> Documents</h2></div><span className="badge">{documents.length} registered</span></div>
                {documents.map(doc => (
                  <div className="document-card" key={doc.id}>
                    <div><strong>{doc.documentNumber}</strong><span>{doc.documentType}</span></div>
                    <h3>{doc.title}</h3>
                    <div className="meta-row"><span>Scope <b>{doc.primaryScopeId === demo.mepScope.id ? 'MEP' : 'Project'}</b></span><span>Current revision <b>{doc.currentRevisionCode ?? '—'}</b></span><span>Status <b>{doc.status}</b></span></div>
                    <pre>{prettyJson(doc.metadataJson)}</pre>
                  </div>
                ))}
                <div className="subheading">Immutable revision history</div>
                <div className="timeline compact">
                  {revisions.map(rev => <div className="timeline-row" key={rev.id}><span className="dot"/><div><strong>Revision {rev.revisionCode}</strong><p>{rev.changeNotes}</p><small>{rev.originalFilename} · {rev.revisionStatus}</small></div></div>)}
                </div>
                <div className="inline-form"><input value={revisionCode} maxLength={8} onChange={e => setRevisionCode(e.target.value.toUpperCase())}/><button disabled={busy || !revisionCode} onClick={addRevision}><Send size={15}/> Add revision</button></div>
              </article>

              <article className="panel">
                <div className="panel-heading"><div><p className="eyebrow">FOUNDATION 03</p><h2><GitBranch size={20}/> Generic Workflow</h2></div><span className={`badge ${workflow?.status === 'RUNNING' ? 'badge-live' : ''}`}>{workflow?.status}</span></div>
                <div className="workflow-title"><strong>{workflow?.businessKey}</strong><span>{workflow?.workflowCode} · {workflow?.purposeCode}</span><h3>{workflow?.title}</h3></div>
                <div className="stepper">
                  {demo.workflowSteps.map(step => {
                    const visit = history?.steps.filter(v => v.stepCode === step.stepCode).at(-1);
                    const active = workflow?.currentStep?.stepCode === step.stepCode;
                    return <div className={`step ${active ? 'active' : ''} ${visit?.status === 'COMPLETED' ? 'done' : ''}`} key={step.id}><span>{step.sequence}</span><div><strong>{step.name}</strong><small>{step.stepCode}{visit && ` · visit ${visit.visitNumber} · ${visit.status}`}</small></div></div>;
                  })}
                </div>

                {workflow?.status === 'RUNNING' && workflow.currentStep && <div className="action-box">
                  <div><span>Current step</span><strong>{workflow.currentStep.stepName}</strong><small>expects: {currentDefinitionStep?.completionActionCode}</small></div>
                  <label>Actor reference<input value={actor} onChange={e => setActor(e.target.value)}/></label>
                  <label>Comment<textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}/></label>
                  <div className="action-buttons">
                    <button disabled={busy} onClick={addComment}>Comment</button>
                    <button className="success" disabled={busy || !currentDefinitionStep} onClick={completeStep}><CheckCircle2 size={15}/> Complete step</button>
                    {earlierSteps.length > 0 && <select disabled={busy} defaultValue="" onChange={e => { if (e.target.value) returnTo(e.target.value); e.currentTarget.value=''; }}><option value="" disabled>Return to…</option>{earlierSteps.map(step => <option key={step.id} value={step.stepCode}>{step.name}</option>)}</select>}
                    <button className="danger" disabled={busy} onClick={rejectWorkflow}><XCircle size={15}/> Reject</button>
                  </div>
                </div>}
              </article>
            </section>

            <section className="panel history-panel">
              <div className="panel-heading"><div><p className="eyebrow">AUDITABILITY</p><h2><RotateCcw size={20}/> Workflow action history</h2></div><span className="badge">{history?.actions.length ?? 0} actions</span></div>
              <div className="history-table">
                <div className="history-head"><span>Action</span><span>Actor</span><span>Transition</span><span>Comment</span></div>
                {history?.actions.map(action => <div className="history-row" key={action.id}><span><b>{action.actionType}</b><small>{action.actionCode}</small></span><span>{action.actorReference ?? 'system'}</span><span>{action.fromStepCode ?? 'START'} → {action.toStepCode ?? 'END'}</span><span>{action.comment ?? '—'}</span></div>)}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function prettyJson(value: string) {
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export default App;
