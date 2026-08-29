import { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, Database, ExternalLink, FileText, FileUp, GitBranch,
  Play, Plus, RefreshCw, RotateCcw, ShieldCheck, Upload, Users, XCircle,
} from 'lucide-react';
import {
  api, createDemo, setActiveUser,
  type AccessView, type DemoState, type DocumentView, type Id, type RevisionView,
  type WorkflowDefinition, type WorkflowHistory, type WorkflowInstance, type WorkflowStepDefinition,
} from './api';
import './styles.css';

const STORAGE_KEY = 'project-control-foundation-demo';
const USER_KEY = 'project-control-active-user';

function App() {
  const [demo, setDemo] = useState<DemoState | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as DemoState : null;
  });
  const [selectedUserId, setSelectedUserId] = useState<Id | null>(() => localStorage.getItem(USER_KEY));
  const [access, setAccess] = useState<AccessView | null>(null);
  const [documents, setDocuments] = useState<DocumentView[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id | null>(null);
  const [revisions, setRevisions] = useState<RevisionView[]>([]);
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<Id | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepDefinition[]>([]);
  const [history, setHistory] = useState<WorkflowHistory | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Ready. Start the backend, then create a local demo.');
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('Checked from local UI');
  const [documentTitle, setDocumentTitle] = useState('New MEP Shop Drawing');
  const [documentPdf, setDocumentPdf] = useState<File | null>(null);
  const [revisionCode, setRevisionCode] = useState('B');
  const [revisionPdf, setRevisionPdf] = useState<File | null>(null);
  const [workflowCode, setWorkflowCode] = useState('DOC_REVIEW');
  const [workflowName, setWorkflowName] = useState('Document Review');
  const [workflowStepsText, setWorkflowStepsText] = useState('SUBMIT|Submit document|SUBMIT\nREVIEW|Reviewer review|APPROVE');

  const selectedDocument = useMemo(
    () => documents.find(document => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );
  const currentDefinitionStep = useMemo(
    () => workflow?.currentStep ? workflowSteps.find(step => step.stepCode === workflow.currentStep?.stepCode) ?? null : null,
    [workflow, workflowSteps],
  );
  const earlierSteps = useMemo(
    () => workflow?.currentStep ? workflowSteps.filter(step => step.sequence < workflow.currentStep!.sequence) : [],
    [workflow, workflowSteps],
  );

  const users = useMemo(() => demo ? [
    ['admin', demo.users.admin],
    ['submitter', demo.users.submitter],
    ['reviewer', demo.users.reviewer],
    ['viewer', demo.users.viewer],
  ] as const : [], [demo]);

  function can(action: string) {
    return access?.decisions[action]?.outcome === 'ALLOW';
  }

  function actorName(reference?: string | null) {
    if (!reference || !demo) return reference ?? 'system';
    const match = users.find(([, user]) => user.id === reference)?.[1];
    return match?.displayName ?? reference.slice(0, 8);
  }

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

  async function refreshAll(target = demo, userId = selectedUserId, preferredDocumentId = selectedDocumentId) {
    if (!target || !userId) return;
    setActiveUser(userId);
    const [nextAccess, docs, defs] = await Promise.all([
      api.getAccess(target.project.id, target.mepScope.id),
      api.listDocuments(target.project.id),
      api.listDefinitions(target.project.id),
    ]);
    const documentId = docs.some(doc => doc.id === preferredDocumentId)
      ? preferredDocumentId!
      : docs.find(doc => doc.id === target.document.id)?.id ?? docs[0]?.id ?? null;
    setAccess(nextAccess);
    setDocuments(docs);
    setDefinitions(defs);
    setSelectedDocumentId(documentId);
    if (!selectedDefinitionId && defs.length) setSelectedDefinitionId(defs[0].id);

    if (!documentId) {
      setRevisions([]); setWorkflow(null); setWorkflowSteps([]); setHistory(null);
      return;
    }
    const [revs, documentWorkflows] = await Promise.all([
      api.listRevisions(documentId),
      api.listDocumentWorkflows(documentId),
    ]);
    const instance = documentWorkflows.at(-1) ?? null;
    setRevisions(revs);
    setWorkflow(instance);
    if (instance) {
      const [steps, hist] = await Promise.all([
        api.listDefinitionSteps(instance.workflowDefinitionId),
        api.getHistory(instance.id),
      ]);
      setWorkflowSteps(steps);
      setHistory(hist);
      setSelectedDefinitionId(instance.workflowDefinitionId);
    } else {
      setWorkflowSteps([]);
      setHistory(null);
    }
    setMessage(`Backend state refreshed for ${nextAccess.displayName}.`);
  }

  async function seedDemo() {
    await run('Creating multi-user Project Control demo...', async () => {
      const created = await createDemo();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
      localStorage.setItem(USER_KEY, created.users.submitter.id);
      setDemo(created);
      setSelectedUserId(created.users.submitter.id);
      setActiveUser(created.users.submitter.id);
      setSelectedDocumentId(created.document.id);
      await refreshAll(created, created.users.submitter.id, created.document.id);
      setMessage('Demo created with Admin, Submitter, Reviewer and Read-only Viewer.');
    });
  }

  async function switchUser(userId: Id) {
    setSelectedUserId(userId);
    localStorage.setItem(USER_KEY, userId);
    setActiveUser(userId);
    await run('Switching project actor...', () => refreshAll(demo, userId));
  }

  async function chooseDocument(documentId: Id) {
    setSelectedDocumentId(documentId);
    await run('Loading document...', () => refreshAll(demo, selectedUserId, documentId));
  }

  async function submitDocument() {
    if (!demo || !documentPdf) return;
    await run('Submitting document and PDF...', async () => {
      const created = await api.submitDocument(
        demo.project.id, demo.mepScope.id, demo.contractor.id, documentTitle, documentPdf,
      );
      setDocumentPdf(null);
      setSelectedDocumentId(created.id);
      await refreshAll(demo, selectedUserId, created.id);
    });
  }

  async function uploadRevision() {
    if (!selectedDocument || !revisionPdf) return;
    await run(`Uploading revision ${revisionCode}...`, async () => {
      await api.uploadRevision(selectedDocument.id, revisionCode, `Revision ${revisionCode} from local UI`, revisionPdf);
      setRevisionPdf(null);
      setRevisionCode(String.fromCharCode(revisionCode.charCodeAt(0) + 1));
      await refreshAll();
    });
  }

  async function createWorkflow() {
    if (!demo) return;
    const steps = workflowStepsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const [stepCode, name, action] = line.split('|').map(value => value?.trim());
      if (!stepCode || !name || !action) throw new Error('Each workflow step must be STEP_CODE|Name|ACTION');
      return { stepCode, name, action };
    });
    await run('Creating and binding workflow...', async () => {
      const created = await api.createWorkflowFlow(demo.project.id, demo.mepScope.id, {
        code: workflowCode,
        name: workflowName,
        purposeCode: 'DOCUMENT_REVIEW',
        capabilityCode: 'DOCUMENT_CONTROL',
        steps,
      });
      setSelectedDefinitionId(created.definition.id);
      await refreshAll();
      setMessage(`Workflow ${created.definition.code} created and bound to MEP scope.`);
    });
  }

  async function startWorkflow() {
    if (!selectedDocument || !selectedDefinitionId) return;
    await run('Starting workflow for selected document...', async () => {
      await api.startDocumentWorkflow(selectedDocument.id, selectedDefinitionId, `Review ${selectedDocument.title}`);
      await refreshAll();
    });
  }

  async function completeStep() {
    if (!workflow || !currentDefinitionStep) return;
    await run(`Completing ${workflow.currentStep?.stepName}...`, async () => {
      await api.workflowAction(workflow.id, {
        actionType: 'COMPLETE_STEP', actionCode: currentDefinitionStep.completionActionCode, comment,
      });
      await refreshAll();
    });
  }

  async function addComment() {
    if (!workflow) return;
    await run('Adding workflow comment...', async () => {
      await api.workflowAction(workflow.id, { actionType: 'COMMENT', comment });
      await refreshAll();
    });
  }

  async function returnTo(stepCode: string) {
    if (!workflow) return;
    await run(`Returning to ${stepCode}...`, async () => {
      await api.workflowAction(workflow.id, {
        actionType: 'RETURN', targetStepCode: stepCode, comment: comment || 'Returned from local UI',
      });
      await refreshAll();
    });
  }

  async function rejectWorkflow() {
    if (!workflow) return;
    await run('Rejecting workflow...', async () => {
      await api.workflowAction(workflow.id, { actionType: 'REJECT', comment: comment || 'Rejected from local UI' });
      await refreshAll();
    });
  }

  useEffect(() => {
    if (!demo) return;
    const fallback = demo.users.submitter.id;
    const userId = selectedUserId && users.some(([, user]) => user.id === selectedUserId) ? selectedUserId : fallback;
    setSelectedUserId(userId);
    setActiveUser(userId);
    refreshAll(demo, userId).catch(() => {
      setMessage('Saved demo does not match the current backend database. Create a fresh demo if the backend was reset.');
    });
    // restore once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><GitBranch size={24}/><div><strong>Project Control</strong><span>Multi-user Lab</span></div></div>
        <div className="side-section">
          <span className="side-title">Implemented foundations</span>
          <div className="side-item"><CheckCircle2 size={17}/> Project context</div>
          <div className="side-item"><CheckCircle2 size={17}/> Documents & PDF</div>
          <div className="side-item"><CheckCircle2 size={17}/> Generic workflow</div>
          <div className="side-item"><CheckCircle2 size={17}/> Identity & access</div>
        </div>
        <div className="side-note">The user switcher is a local authentication stand-in. Authorization comes from persisted workspace, organization, project and scope relationships.</div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">SPRING MODULITH · LOCAL MULTI-USER TEST</p>
            <h1>Project Control Foundation</h1>
            <p className="subtitle">Submit and view PDFs, configure workflows, switch users and prove access decisions end-to-end.</p>
          </div>
          <div className="top-actions">
            <button className="ghost" disabled={busy || !demo} onClick={() => run('Refreshing...', () => refreshAll())}><RefreshCw size={16}/> Refresh</button>
            <button className="primary" disabled={busy} onClick={seedDemo}><Play size={16}/> Create fresh demo</button>
          </div>
        </header>

        <div className={`status ${error ? 'status-error' : ''}`}><Activity size={17}/><span>{error ?? message}</span>{busy && <span className="pulse">working</span>}</div>

        {!demo ? (
          <section className="empty-card"><Database size={40}/><h2>No local demo yet</h2><p>Start the backend, then create a fresh demo. Four users and the complete document/workflow context will be persisted through real APIs.</p></section>
        ) : (
          <>
            <section className="user-bar panel">
              <div className="user-bar-title"><Users size={20}/><div><strong>Act as user</strong><small>Every secured request sends this persisted user ID</small></div></div>
              <div className="user-options">
                {users.map(([role, user]) => <button key={user.id} className={selectedUserId === user.id ? 'user-pill active' : 'user-pill'} onClick={() => switchUser(user.id)} disabled={busy}><span>{user.displayName}</span><small>{role}</small></button>)}
              </div>
              <div className="permission-row">
                {['DOCUMENT_VIEW','DOCUMENT_SUBMIT','DOCUMENT_CONTENT_VIEW','WORKFLOW_CONFIGURE','WORKFLOW_START','WORKFLOW_ACT'].map(action => <span key={action} className={can(action) ? 'permission allow' : 'permission deny'}>{can(action) ? '✓' : '×'} {action.replaceAll('_',' ')}</span>)}
              </div>
            </section>

            <section className="metrics-grid">
              <Metric label="Project" value={demo.project.code} note={demo.project.name}/>
              <Metric label="Contractor" value={demo.contractor.displayName} note="SUBCONTRACTOR"/>
              <Metric label="Consultant" value={demo.consultant.displayName} note="CONSULTANT"/>
              <Metric label="Scope" value={demo.mepScope.code} note={`${demo.constructionScope.name} / ${demo.mepScope.name}`}/>
            </section>

            <section className="two-column">
              <article className="panel">
                <div className="panel-heading"><div><p className="eyebrow">DOCUMENT CONTROL</p><h2><FileText size={20}/> Documents & PDF</h2></div><span className="badge">{documents.length} visible</span></div>

                <div className="builder-box">
                  <h3><FileUp size={17}/> Submit document</h3>
                  <input value={documentTitle} onChange={e => setDocumentTitle(e.target.value)} placeholder="Document title"/>
                  <input type="file" accept="application/pdf" onChange={e => setDocumentPdf(e.target.files?.[0] ?? null)}/>
                  <button className="primary" disabled={busy || !can('DOCUMENT_SUBMIT') || !documentPdf || !documentTitle} onClick={submitDocument}><Upload size={15}/> Submit PDF</button>
                  {!can('DOCUMENT_SUBMIT') && <small className="denied-note">Current user is read-only for document submission.</small>}
                </div>

                <div className="document-list">
                  {documents.map(doc => <button className={doc.id === selectedDocumentId ? 'document-select active' : 'document-select'} key={doc.id} onClick={() => chooseDocument(doc.id)}><strong>{doc.documentNumber}</strong><span>{doc.title}</span><small>Rev {doc.currentRevisionCode ?? '—'} · {doc.status}</small></button>)}
                </div>

                {selectedDocument && <div className="document-card selected-card">
                  <div><strong>{selectedDocument.documentNumber}</strong><span>{selectedDocument.documentType}</span></div>
                  <h3>{selectedDocument.title}</h3>
                  <pre>{prettyJson(selectedDocument.metadataJson)}</pre>
                </div>}

                <div className="subheading">Revision history</div>
                <div className="timeline compact">
                  {revisions.map(rev => <div className="timeline-row" key={rev.id}><span className="dot"/><div><strong>Revision {rev.revisionCode}</strong><p>{rev.changeNotes}</p><small>{rev.originalFilename} · {rev.revisionStatus}</small><div><button className="link-button" disabled={busy || !can('DOCUMENT_CONTENT_VIEW') || !rev.contentUri?.startsWith('local-file:')} onClick={() => run('Opening PDF...', () => api.openPdf(rev.id))}><ExternalLink size={14}/> View PDF</button></div></div></div>)}
                </div>
                <div className="inline-form revision-form"><input value={revisionCode} maxLength={8} onChange={e => setRevisionCode(e.target.value.toUpperCase())}/><input type="file" accept="application/pdf" onChange={e => setRevisionPdf(e.target.files?.[0] ?? null)}/><button disabled={busy || !can('DOCUMENT_SUBMIT') || !revisionPdf || !selectedDocument} onClick={uploadRevision}><Upload size={15}/> Upload revision</button></div>
              </article>

              <article className="panel">
                <div className="panel-heading"><div><p className="eyebrow">GENERIC WORKFLOW</p><h2><GitBranch size={20}/> Document Workflow</h2></div><span className={`badge ${workflow?.status === 'RUNNING' ? 'badge-live' : ''}`}>{workflow?.status ?? 'NOT STARTED'}</span></div>

                <div className="builder-box">
                  <h3><Plus size={17}/> Create workflow definition</h3>
                  <div className="form-grid"><input value={workflowCode} onChange={e => setWorkflowCode(e.target.value.toUpperCase())} placeholder="WORKFLOW_CODE"/><input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Workflow name"/></div>
                  <textarea rows={3} value={workflowStepsText} onChange={e => setWorkflowStepsText(e.target.value)} />
                  <small>One step per line: STEP_CODE|Step name|COMPLETION_ACTION</small>
                  <button disabled={busy || !can('PROJECT_MANAGE') || !workflowCode || !workflowName} onClick={createWorkflow}><ShieldCheck size={15}/> Create + activate + bind</button>
                  {!can('PROJECT_MANAGE') && <small className="denied-note">Select Project Admin to configure new workflow definitions.</small>}
                </div>

                <div className="start-flow-row">
                  <select value={selectedDefinitionId ?? ''} onChange={e => setSelectedDefinitionId(e.target.value)}>{definitions.map(def => <option key={def.id} value={def.id}>{def.code} v{def.version} · {def.status}</option>)}</select>
                  <button className="primary" disabled={busy || !selectedDocument || !selectedDefinitionId || !can('WORKFLOW_START')} onClick={startWorkflow}><Play size={15}/> Start for selected document</button>
                </div>

                {workflow && <>
                  <div className="workflow-title"><strong>{workflow.businessKey}</strong><span>{workflow.workflowCode} · {workflow.purposeCode}</span><h3>{workflow.title}</h3></div>
                  <div className="stepper">{workflowSteps.map(step => { const visit = history?.steps.filter(v => v.stepCode === step.stepCode).at(-1); const active = workflow.currentStep?.stepCode === step.stepCode; return <div className={`step ${active ? 'active' : ''} ${visit?.status === 'COMPLETED' ? 'done' : ''}`} key={step.id}><span>{step.sequence}</span><div><strong>{step.name}</strong><small>{step.stepCode}{visit && ` · visit ${visit.visitNumber} · ${visit.status}`}</small></div></div>; })}</div>
                </>}

                {workflow?.status === 'RUNNING' && workflow.currentStep && <div className="action-box">
                  <div><span>Current step</span><strong>{workflow.currentStep.stepName}</strong><small>expects: {currentDefinitionStep?.completionActionCode}</small></div>
                  <label>Comment<textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}/></label>
                  <div className="action-buttons">
                    <button disabled={busy || !can('WORKFLOW_ACT')} onClick={addComment}>Comment</button>
                    <button className="success" disabled={busy || !can('WORKFLOW_ACT') || !currentDefinitionStep} onClick={completeStep}><CheckCircle2 size={15}/> Complete step</button>
                    {earlierSteps.length > 0 && <select disabled={busy || !can('WORKFLOW_ACT')} defaultValue="" onChange={e => { if (e.target.value) returnTo(e.target.value); e.currentTarget.value=''; }}><option value="" disabled>Return to…</option>{earlierSteps.map(step => <option key={step.id} value={step.stepCode}>{step.name}</option>)}</select>}
                    <button className="danger" disabled={busy || !can('WORKFLOW_ACT')} onClick={rejectWorkflow}><XCircle size={15}/> Reject</button>
                  </div>
                </div>}
              </article>
            </section>

            <section className="panel history-panel">
              <div className="panel-heading"><div><p className="eyebrow">AUDITABILITY</p><h2><RotateCcw size={20}/> Workflow action history</h2></div><span className="badge">{history?.actions.length ?? 0} actions</span></div>
              <div className="history-table"><div className="history-head"><span>Action</span><span>User</span><span>Transition</span><span>Comment</span></div>{history?.actions.map(action => <div className="history-row" key={action.id}><span><b>{action.actionType}</b><small>{action.actionCode}</small></span><span>{actorName(action.actorReference)}</span><span>{action.fromStepCode ?? 'START'} → {action.toStepCode ?? 'END'}</span><span>{action.comment ?? '—'}</span></div>)}</div>
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
