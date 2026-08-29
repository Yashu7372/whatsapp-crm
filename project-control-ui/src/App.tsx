import { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, Database, ExternalLink, FileText, FileUp, GitBranch,
  LogIn, LogOut, Play, RefreshCw, RotateCcw, Upload, UserCheck, Users, XCircle,
} from 'lucide-react';
import {
  api, auth, createDemo, DEMO_LOGIN_OPTIONS, LOCAL_DEMO_PASSWORD,
  type AccessView, type DemoState, type DocumentView, type Id, type RevisionView, type SessionUser,
  type WorkflowConfigurationOptions, type WorkflowDefinition, type WorkflowHistory,
  type WorkflowInstance, type WorkflowStepDefinition,
} from './api';
import WorkflowDefinitionBuilder, { type WorkflowBuilderInput } from './WorkflowDefinitionBuilder';
import './styles.css';

const STORAGE_KEY = 'project-control-foundation-demo-v4';

function App() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@local.demo');
  const [loginPassword, setLoginPassword] = useState(LOCAL_DEMO_PASSWORD);
  const [demo, setDemo] = useState<DemoState | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as DemoState : null;
  });
  const [access, setAccess] = useState<AccessView | null>(null);
  const [workflowOptions, setWorkflowOptions] = useState<WorkflowConfigurationOptions | null>(null);
  const [documents, setDocuments] = useState<DocumentView[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id | null>(null);
  const [revisions, setRevisions] = useState<RevisionView[]>([]);
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<Id | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepDefinition[]>([]);
  const [history, setHistory] = useState<WorkflowHistory | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Sign in with a local Project Control account.');
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('Checked from authenticated local UI');
  const [documentTitle, setDocumentTitle] = useState('New MEP Shop Drawing');
  const [documentPdf, setDocumentPdf] = useState<File | null>(null);
  const [revisionCode, setRevisionCode] = useState('B');
  const [revisionPdf, setRevisionPdf] = useState<File | null>(null);

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
    demo.users.admin, demo.users.site, demo.users.qce, demo.users.qcdc,
    demo.users.inspector, demo.users.re, demo.users.viewer,
  ] : [], [demo]);

  const isAdmin = session?.email === 'admin@local.demo';

  function can(action: string) {
    return access?.decisions[action]?.outcome === 'ALLOW';
  }

  function actorName(reference?: string | null) {
    if (!reference) return 'system';
    return users.find(user => user.id === reference)?.displayName ?? reference.slice(0, 8);
  }

  function assignmentSummary(value?: string | null) {
    if (!value || value === '{}') return { act: 'Any actionable actor', view: 'Any scope-visible user' };
    try {
      const parsed = JSON.parse(value) as {
        responsibility?: string;
        responsibilityCodes?: string[];
        act?: { responsibility?: string; responsibilityCodes?: string[] };
        view?: { responsibility?: string; responsibilityCodes?: string[] };
      };
      const values = (rule?: { responsibility?: string; responsibilityCodes?: string[] }) => {
        if (rule?.responsibility) return rule.responsibility;
        if (rule?.responsibilityCodes?.length) return rule.responsibilityCodes.join(' / ');
        return null;
      };
      const legacy = values(parsed);
      return {
        act: values(parsed.act) ?? legacy ?? 'Any actionable actor',
        view: values(parsed.view) ?? 'Any scope-visible user',
      };
    } catch {
      return { act: value, view: 'Unknown' };
    }
  }

  async function run(label: string, action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(label);
    try {
      await action();
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setError(detail);
      if (detail === 'Authentication required') setSession(null);
    } finally {
      setBusy(false);
    }
  }

  async function loadWorkflowOptions(target: DemoState, nextAccess: AccessView) {
    if (nextAccess.decisions.WORKFLOW_CONFIGURE?.outcome !== 'ALLOW') {
      setWorkflowOptions(null);
      return;
    }
    setWorkflowOptions(await api.getWorkflowOptions(target.project.id, target.mepScope.id));
  }

  async function refreshAll(target = demo, preferredDocumentId = selectedDocumentId) {
    if (!target || !session) return;
    const [nextAccess, docs, defs] = await Promise.all([
      api.getAccess(target.project.id, target.mepScope.id),
      api.listDocuments(target.project.id),
      api.listDefinitions(target.project.id),
    ]);
    await loadWorkflowOptions(target, nextAccess);
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

  async function signIn(email = loginEmail, password = loginPassword) {
    await run(`Signing in as ${email}...`, async () => {
      const next = await auth.login(email, password);
      setSession(next);
      setLoginEmail(email);
      setLoginPassword(password);
      if (demo) await refreshAfterLogin(next);
      setMessage(`Authenticated as ${next.displayName}.`);
    });
  }

  async function refreshAfterLogin(next: SessionUser) {
    setSession(next);
    if (!demo) return;
    const [nextAccess, docs, defs] = await Promise.all([
      api.getAccess(demo.project.id, demo.mepScope.id),
      api.listDocuments(demo.project.id),
      api.listDefinitions(demo.project.id),
    ]);
    await loadWorkflowOptions(demo, nextAccess);
    setAccess(nextAccess);
    setDocuments(docs);
    setDefinitions(defs);
    const documentId = docs.find(doc => doc.id === selectedDocumentId)?.id
      ?? docs.find(doc => doc.id === demo.document.id)?.id ?? docs[0]?.id ?? null;
    setSelectedDocumentId(documentId);
    if (!documentId) { setRevisions([]); setWorkflow(null); setWorkflowSteps([]); setHistory(null); return; }
    const [revs, flows] = await Promise.all([api.listRevisions(documentId), api.listDocumentWorkflows(documentId)]);
    setRevisions(revs);
    const instance = flows.at(-1) ?? null;
    setWorkflow(instance);
    if (instance) {
      const [steps, hist] = await Promise.all([api.listDefinitionSteps(instance.workflowDefinitionId), api.getHistory(instance.id)]);
      setWorkflowSteps(steps); setHistory(hist); setSelectedDefinitionId(instance.workflowDefinitionId);
    } else {
      setWorkflowSteps([]); setHistory(null);
    }
  }

  async function quickSignIn(email: string) {
    setLoginEmail(email);
    setLoginPassword(LOCAL_DEMO_PASSWORD);
    await signIn(email, LOCAL_DEMO_PASSWORD);
  }

  async function logout() {
    await run('Signing out...', async () => {
      await auth.logout();
      setSession(null);
      setAccess(null);
      setWorkflowOptions(null);
      setMessage('Signed out. Choose another authenticated account.');
    });
  }

  async function seedDemo() {
    await run('Creating authenticated Project Control demo...', async () => {
      const created = await createDemo();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
      setDemo(created);
      setSelectedDocumentId(created.document.id);
      const nextSession = await auth.me();
      setSession(nextSession);
      await refreshDemoAfterSeed(created, nextSession);
      setMessage('Demo created. The session is now Site Team; continue the ITR flow by signing in as each assigned user.');
    });
  }

  async function refreshDemoAfterSeed(created: DemoState, next: SessionUser) {
    setSession(next);
    const [nextAccess, docs, defs] = await Promise.all([
      api.getAccess(created.project.id, created.mepScope.id),
      api.listDocuments(created.project.id),
      api.listDefinitions(created.project.id),
    ]);
    await loadWorkflowOptions(created, nextAccess);
    setAccess(nextAccess); setDocuments(docs); setDefinitions(defs);
    const documentId = created.document.id;
    setSelectedDocumentId(documentId);
    const [revs, flows] = await Promise.all([api.listRevisions(documentId), api.listDocumentWorkflows(documentId)]);
    setRevisions(revs);
    const instance = flows.at(-1) ?? null;
    setWorkflow(instance);
    if (instance) {
      const [steps, hist] = await Promise.all([api.listDefinitionSteps(instance.workflowDefinitionId), api.getHistory(instance.id)]);
      setWorkflowSteps(steps); setHistory(hist); setSelectedDefinitionId(instance.workflowDefinitionId);
    }
  }

  async function chooseDocument(documentId: Id) {
    setSelectedDocumentId(documentId);
    await run('Loading document...', () => refreshAll(demo, documentId));
  }

  async function submitDocument() {
    if (!demo || !documentPdf) return;
    await run('Submitting document and PDF...', async () => {
      const originator = session?.email?.endsWith('@local.demo') && ['inspector@local.demo', 're@local.demo', 'viewer@local.demo'].includes(session.email)
        ? demo.consultant.id : demo.contractor.id;
      const created = await api.submitDocument(demo.project.id, demo.mepScope.id, originator, documentTitle, documentPdf);
      setDocumentPdf(null);
      setSelectedDocumentId(created.id);
      await refreshAll(demo, created.id);
    });
  }

  async function uploadRevision() {
    if (!selectedDocument || !revisionPdf) return;
    await run(`Uploading revision ${revisionCode}...`, async () => {
      await api.uploadRevision(selectedDocument.id, revisionCode, `Revision ${revisionCode} from authenticated UI`, revisionPdf);
      setRevisionPdf(null);
      setRevisionCode(String.fromCharCode(revisionCode.charCodeAt(0) + 1));
      await refreshAll();
    });
  }

  async function createWorkflow(input: WorkflowBuilderInput) {
    if (!demo) return;
    await run('Creating and binding workflow...', async () => {
      const created = await api.createWorkflowFlow(demo.project.id, demo.mepScope.id, input);
      setSelectedDefinitionId(created.definition.id);
      await refreshAll();
      setMessage(`Workflow ${created.definition.code} created from the visual step builder.`);
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
        actionType: 'RETURN', targetStepCode: stepCode, comment: comment || 'Returned from authenticated UI',
      });
      await refreshAll();
    });
  }

  async function rejectWorkflow() {
    if (!workflow) return;
    await run('Rejecting workflow...', async () => {
      await api.workflowAction(workflow.id, { actionType: 'REJECT', comment: comment || 'Rejected from authenticated UI' });
      await refreshAll();
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const current = await auth.me();
        setSession(current);
        if (demo) await refreshAfterLogin(current);
      } catch {
        setSession(null);
      } finally {
        setAuthChecked(true);
      }
    })();
    // initial session restore only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authChecked) {
    return <div className="login-page"><div className="login-card"><Database size={38}/><h1>Project Control</h1><p>Checking authenticated session…</p></div></div>;
  }

  if (!session) {
    return <div className="login-page">
      <div className="login-card">
        <div className="login-brand"><GitBranch size={30}/><div><strong>Project Control</strong><span>Spring Security local lab</span></div></div>
        <h1>Sign in</h1>
        <p>This is a real server-side authenticated session. User IDs can no longer be selected or spoofed from the browser.</p>
        {error && <div className="login-error">{error}</div>}
        <label>Email<input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></label>
        <button className="primary login-submit" disabled={busy} onClick={() => signIn()}><LogIn size={17}/> Sign in</button>
        <div className="demo-credentials"><strong>Local demo accounts</strong><small>All use password <code>{LOCAL_DEMO_PASSWORD}</code></small>
          <div className="demo-login-grid">{DEMO_LOGIN_OPTIONS.map(([email, label]) => <button key={email} disabled={busy} onClick={() => quickSignIn(email)}><span>{label}</span><small>{email}</small></button>)}</div>
        </div>
      </div>
    </div>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><GitBranch size={24}/><div><strong>Project Control</strong><span>Authenticated Workflow Lab</span></div></div>
      <div className="side-section">
        <span className="side-title">System foundations · not user permissions</span>
        <div className="side-item"><CheckCircle2 size={17}/> Project context</div>
        <div className="side-item"><CheckCircle2 size={17}/> Documents & PDF</div>
        <div className="side-item"><CheckCircle2 size={17}/> Generic workflow</div>
        <div className="side-item"><CheckCircle2 size={17}/> Identity & access</div>
        <div className="side-item"><CheckCircle2 size={17}/> Real authentication</div>
        <div className="side-item"><CheckCircle2 size={17}/> Step act/view rules</div>
      </div>
      <div className="side-note">The items above show implemented platform foundations only. The red/green permission chips in the main screen show what the currently authenticated user may actually do.</div>
    </aside>

    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">SPRING MODULITH · AUTHENTICATED LOCAL E2E</p>
          <h1>Project Control Foundation</h1>
          <p className="subtitle">Submit PDFs, configure reusable workflows visually, authenticate as each project actor and prove responsibility-aware execution.</p>
        </div>
        <div className="top-actions session-actions">
          <div className="session-pill"><UserCheck size={16}/><span><strong>{session.displayName}</strong><small>{session.email}</small></span></div>
          <button className="ghost" disabled={busy || !demo} onClick={() => run('Refreshing...', () => refreshAll())}><RefreshCw size={16}/> Refresh</button>
          {isAdmin && <button className="primary" disabled={busy} onClick={seedDemo}><Play size={16}/> Create fresh demo</button>}
          <button className="ghost" disabled={busy} onClick={logout}><LogOut size={16}/> Logout</button>
        </div>
      </header>

      <div className={`status ${error ? 'status-error' : ''}`}><Activity size={17}/><span>{error ?? message}</span>{busy && <span className="pulse">working</span>}</div>

      <section className="user-bar panel">
        <div className="user-bar-title"><Users size={20}/><div><strong>Authenticate as another project actor</strong><small>Blue identifies the signed-in account. Green/red chips below are the backend authorization decisions for that account.</small></div></div>
        <div className="user-options auth-options">{DEMO_LOGIN_OPTIONS.map(([email, label]) => <button key={email} className={session.email === email ? 'user-pill active' : 'user-pill'} onClick={() => quickSignIn(email)} disabled={busy}><span>{label}</span><small>{email}</small></button>)}</div>
        {access && <div className="permission-row" data-testid="permission-row">{['DOCUMENT_VIEW','DOCUMENT_SUBMIT','DOCUMENT_CONTENT_VIEW','WORKFLOW_CONFIGURE','WORKFLOW_START','WORKFLOW_ACT'].map(action => <span data-testid={`permission-${action}`} key={action} className={can(action) ? 'permission allow' : 'permission deny'} title={access.decisions[action]?.reason}>{can(action) ? '✓' : '×'} {action.replaceAll('_',' ')}</span>)}</div>}
      </section>

      {!demo ? <section className="empty-card"><Database size={40}/><h2>No local demo yet</h2><p>Sign in as <b>Project Admin</b> and create a fresh demo. The demo then signs in as Site Team so the real ITR sequence can begin.</p>{!isAdmin && <button className="primary" onClick={() => quickSignIn('admin@local.demo')}>Sign in as Project Admin</button>}</section> : <>
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
              {!can('DOCUMENT_SUBMIT') && <small className="denied-note">Current authenticated user is read-only for document submission.</small>}
            </div>
            <div className="document-list">{documents.map(doc => <button className={doc.id === selectedDocumentId ? 'document-select active' : 'document-select'} key={doc.id} onClick={() => chooseDocument(doc.id)}><strong>{doc.documentNumber}</strong><span>{doc.title}</span><small>Rev {doc.currentRevisionCode ?? '—'} · {doc.status}</small></button>)}</div>
            {selectedDocument && <div className="document-card selected-card"><div><strong>{selectedDocument.documentNumber}</strong><span>{selectedDocument.documentType}</span></div><h3>{selectedDocument.title}</h3><pre>{prettyJson(selectedDocument.metadataJson)}</pre></div>}
            <div className="subheading">Revision history</div>
            <div className="timeline compact">{revisions.map(rev => <div className="timeline-row" key={rev.id}><span className="dot"/><div><strong>Revision {rev.revisionCode}</strong><p>{rev.changeNotes}</p><small>{rev.originalFilename} · {rev.revisionStatus}</small><div><button className="link-button" disabled={busy || !can('DOCUMENT_CONTENT_VIEW') || !rev.contentUri?.startsWith('local-file:')} onClick={() => run('Opening PDF...', () => api.openPdf(rev.id))}><ExternalLink size={14}/> View PDF</button></div></div></div>)}</div>
            <div className="inline-form revision-form"><input value={revisionCode} maxLength={8} onChange={e => setRevisionCode(e.target.value.toUpperCase())}/><input type="file" accept="application/pdf" onChange={e => setRevisionPdf(e.target.files?.[0] ?? null)}/><button disabled={busy || !can('DOCUMENT_SUBMIT') || !revisionPdf || !selectedDocument} onClick={uploadRevision}><Upload size={15}/> Upload revision</button></div>
          </article>

          <article className="panel workflow-panel">
            <div className="panel-heading"><div><p className="eyebrow">GENERIC WORKFLOW</p><h2><GitBranch size={20}/> Document Workflow</h2></div><span className={`badge ${workflow?.status === 'RUNNING' ? 'badge-live' : ''}`}>{workflow?.status ?? 'NOT STARTED'}</span></div>

            <div className="subheading">Workflow configuration</div>
            <WorkflowDefinitionBuilder disabled={!can('WORKFLOW_CONFIGURE')} busy={busy} options={workflowOptions} onCreate={createWorkflow}/>

            <div className="subheading">Existing reusable definitions</div>
            <div className="start-flow-row"><select aria-label="Reusable workflow definition" value={selectedDefinitionId ?? ''} onChange={e => setSelectedDefinitionId(e.target.value)}>{definitions.map(def => <option key={def.id} value={def.id}>{def.code} v{def.version} · {def.status}</option>)}</select><button className="primary" disabled={busy || !selectedDocument || !selectedDefinitionId || !can('WORKFLOW_START')} onClick={startWorkflow}><Play size={15}/> Start for selected document</button></div>

            {workflow && <><div className="workflow-title"><strong>{workflow.businessKey}</strong><span>{workflow.workflowCode} · {workflow.purposeCode}</span><h3>{workflow.title}</h3></div><div className="stepper">{workflowSteps.map(step => {
              const visit = history?.steps.filter(v => v.stepCode === step.stepCode).at(-1);
              const active = workflow.currentStep?.stepCode === step.stepCode;
              const assignment = assignmentSummary(step.assignmentJson);
              return <div className={`step ${active ? 'active' : ''} ${visit?.status === 'COMPLETED' ? 'done' : ''}`} key={step.id}><span>{step.sequence}</span><div><strong>{step.name}</strong><small>{step.stepCode}{visit && ` · visit ${visit.visitNumber} · ${visit.status}`}</small><small className="assignment">Act: {assignment.act}</small><small className="assignment">View: {assignment.view}</small></div></div>;
            })}</div></>}
            {workflow?.status === 'RUNNING' && workflow.currentStep && <div className="action-box"><div><span>Current step</span><strong>{workflow.currentStep.stepName}</strong><small>expects: {currentDefinitionStep?.completionActionCode}</small><small className="assignment-callout">Can act: {assignmentSummary(workflow.currentStep.assignmentJson).act}</small><small className="assignment-callout">Can view: {assignmentSummary(workflow.currentStep.assignmentJson).view}</small></div><label>Comment<textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}/></label><div className="action-buttons"><button disabled={busy || !can('WORKFLOW_ACT')} onClick={addComment}>Comment</button><button className="success" disabled={busy || !can('WORKFLOW_ACT') || !currentDefinitionStep} onClick={completeStep}><CheckCircle2 size={15}/> Complete step</button>{earlierSteps.length > 0 && <select disabled={busy || !can('WORKFLOW_ACT')} defaultValue="" onChange={e => { if (e.target.value) returnTo(e.target.value); e.currentTarget.value=''; }}><option value="" disabled>Return to…</option>{earlierSteps.map(step => <option key={step.id} value={step.stepCode}>{step.name}</option>)}</select>}<button className="danger" disabled={busy || !can('WORKFLOW_ACT')} onClick={rejectWorkflow}><XCircle size={15}/> Reject</button></div><small className="denied-note">WORKFLOW ACT is only the coarse permission. The backend also checks the active step's configured act responsibility before accepting an action.</small></div>}
          </article>
        </section>

        <section className="panel history-panel"><div className="panel-heading"><div><p className="eyebrow">AUDITABILITY</p><h2><RotateCcw size={20}/> Workflow action history</h2></div><span className="badge">{history?.actions.length ?? 0} actions</span></div><div className="history-table"><div className="history-head"><span>Action</span><span>Authenticated user</span><span>Transition</span><span>Comment</span></div>{history?.actions.map(action => <div className="history-row" key={action.id}><span><b>{action.actionType}</b><small>{action.actionCode}</small></span><span>{actorName(action.actorReference)}</span><span>{action.fromStepCode ?? 'START'} → {action.toStepCode ?? 'END'}</span><span>{action.comment ?? '—'}</span></div>)}</div></section>
      </>}
    </main>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function prettyJson(value: string) {
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export default App;
