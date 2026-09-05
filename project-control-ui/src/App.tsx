import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, BadgeDollarSign, Building2, CheckCircle2, ChevronRight, ClipboardCheck,
  ClipboardList, Database, ExternalLink, FileText, FileUp, FolderTree, GitBranch,
  Home, Landmark, Layers3, LogIn, LogOut, Menu, Play, Plus, RefreshCw, Save,
  Settings, ShieldCheck, TrendingUp, Upload, UserRound, Workflow, X, XCircle,
} from 'lucide-react';
import {
  api, auth, createDemo, DEMO_LOGIN_OPTIONS, LOCAL_DEMO_PASSWORD,
  type AccessView, type Capability, type DemoState, type DocumentView, type Id,
  type RevisionView, type Scope, type SessionUser, type WorkflowBinding,
  type WorkflowConfigurationOptions, type WorkflowDefinition, type WorkflowHistory,
  type WorkflowInstance, type WorkflowStepDefinition,
} from './api';
import { productApi, type DocumentNumberSeries } from './productApi';
import { CommercialScreen, CostControlScreen, FinancialScreen, VerificationScreen } from './ControlScreens';
import WorkflowDefinitionBuilder, { type WorkflowBuilderInput } from './WorkflowDefinitionBuilder';
import './styles.css';

const STORAGE_KEY = 'project-control-foundation-demo-v4';

type ScreenKey =
  | 'overview'
  | 'documents'
  | 'workflows'
  | 'verification'
  | 'cost'
  | 'commercial'
  | 'financial'
  | 'designer'
  | 'admin';

const screenPath: Record<ScreenKey, string> = {
  overview: '/overview',
  documents: '/documents',
  workflows: '/workflows',
  verification: '/verification',
  cost: '/cost-control',
  commercial: '/commercial',
  financial: '/financial',
  designer: '/workflow-designer',
  admin: '/project-admin',
};

function screenFromPath(pathname = window.location.pathname): ScreenKey {
  if (pathname.includes('workflow-designer')) return 'designer';
  if (pathname.includes('project-admin')) return 'admin';
  if (pathname.includes('documents')) return 'documents';
  if (pathname.includes('verification')) return 'verification';
  if (pathname.includes('cost-control')) return 'cost';
  if (pathname.includes('commercial')) return 'commercial';
  if (pathname.includes('financial')) return 'financial';
  if (pathname.includes('workflows')) return 'workflows';
  return 'overview';
}

function App() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@local.demo');
  const [loginPassword, setLoginPassword] = useState(LOCAL_DEMO_PASSWORD);
  const [context, setContext] = useState<DemoState | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as DemoState : null;
  });
  const [screen, setScreen] = useState<ScreenKey>(() => screenFromPath());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [access, setAccess] = useState<AccessView | null>(null);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [documents, setDocuments] = useState<DocumentView[]>([]);
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [bindings, setBindings] = useState<WorkflowBinding[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAdmin = access?.workspaceRoles.includes('PROJECT_ADMIN')
    ?? session?.email === 'admin@local.demo';

  async function refreshCore(target = context) {
    if (!target || !session) return;
    const [nextAccess, nextScopes, nextDocuments, nextDefinitions, nextBindings] = await Promise.all([
      api.getAccess(target.project.id),
      api.listScopes(target.project.id),
      api.listDocuments(target.project.id),
      api.listDefinitions(target.project.id),
      api.listProjectWorkflowBindings(target.project.id),
    ]);
    setAccess(nextAccess);
    setScopes(nextScopes);
    setDocuments(nextDocuments);
    setDefinitions(nextDefinitions);
    setBindings(nextBindings);
  }

  async function run(label: string, action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(label);
    try {
      await action();
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      setError(detail);
      if (detail === 'Authentication required') setSession(null);
    } finally {
      setBusy(false);
    }
  }

  function navigate(next: ScreenKey) {
    if ((next === 'designer' || next === 'admin') && !isAdmin) return;
    window.history.pushState({}, '', screenPath[next]);
    setScreen(next);
    setMobileNavOpen(false);
  }

  async function signIn(email = loginEmail, password = loginPassword) {
    await run('Signing in…', async () => {
      const next = await auth.login(email, password);
      setSession(next);
      setLoginEmail(email);
      setLoginPassword(password);
      if (context) {
        const target = context;
        const [nextAccess, nextScopes, nextDocuments, nextDefinitions, nextBindings] = await Promise.all([
          api.getAccess(target.project.id), api.listScopes(target.project.id), api.listDocuments(target.project.id),
          api.listDefinitions(target.project.id), api.listProjectWorkflowBindings(target.project.id),
        ]);
        setAccess(nextAccess); setScopes(nextScopes); setDocuments(nextDocuments);
        setDefinitions(nextDefinitions); setBindings(nextBindings);
      }
      setMessage(`Signed in as ${next.displayName}.`);
    });
  }

  async function logout() {
    await run('Signing out…', async () => {
      await auth.logout();
      setSession(null);
      setAccess(null);
      setScopes([]); setDocuments([]); setDefinitions([]); setBindings([]);
      window.history.replaceState({}, '', '/overview');
      setScreen('overview');
    });
  }

  async function initializeLocalProject() {
    await run('Creating local Project Control project…', async () => {
      const created = await createDemo();
      const adminSession = await auth.login(created.users.admin.email, LOCAL_DEMO_PASSWORD);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
      setContext(created);
      setSession(adminSession);
      const [nextAccess, nextScopes, nextDocuments, nextDefinitions, nextBindings] = await Promise.all([
        api.getAccess(created.project.id), api.listScopes(created.project.id), api.listDocuments(created.project.id),
        api.listDefinitions(created.project.id), api.listProjectWorkflowBindings(created.project.id),
      ]);
      setAccess(nextAccess); setScopes(nextScopes); setDocuments(nextDocuments);
      setDefinitions(nextDefinitions); setBindings(nextBindings);
      navigate('overview');
      setMessage('Local Project Control project initialized.');
    });
  }

  useEffect(() => {
    const onPop = () => setScreen(screenFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const current = await auth.me();
        setSession(current);
        if (context) {
          const target = context;
          const [nextAccess, nextScopes, nextDocuments, nextDefinitions, nextBindings] = await Promise.all([
            api.getAccess(target.project.id), api.listScopes(target.project.id), api.listDocuments(target.project.id),
            api.listDefinitions(target.project.id), api.listProjectWorkflowBindings(target.project.id),
          ]);
          setAccess(nextAccess); setScopes(nextScopes); setDocuments(nextDocuments);
          setDefinitions(nextDefinitions); setBindings(nextBindings);
        }
      } catch {
        setSession(null);
      } finally {
        setAuthChecked(true);
      }
    })();
    // Session restore happens once on application boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin && (screen === 'designer' || screen === 'admin')) navigate('overview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!authChecked) return <LoadingPage />;
  if (!session) {
    return <LoginPage
      busy={busy}
      error={error}
      email={loginEmail}
      password={loginPassword}
      onEmail={setLoginEmail}
      onPassword={setLoginPassword}
      onSignIn={() => signIn()}
      onQuickSignIn={email => signIn(email, LOCAL_DEMO_PASSWORD)}
    />;
  }

  const navItems: Array<{ key: ScreenKey; label: string; icon: ReactNode; admin?: boolean }> = [
    { key: 'overview', label: 'Overview', icon: <Home size={18}/> },
    { key: 'documents', label: 'Documents', icon: <FileText size={18}/> },
    { key: 'workflows', label: 'Workflows', icon: <Workflow size={18}/> },
    { key: 'verification', label: 'Verification', icon: <ClipboardCheck size={18}/> },
    { key: 'cost', label: 'Cost Control', icon: <BadgeDollarSign size={18}/> },
    { key: 'commercial', label: 'Commercial & IPC', icon: <Landmark size={18}/> },
    { key: 'financial', label: 'Financial & Cash Flow', icon: <TrendingUp size={18}/> },
    { key: 'designer', label: 'Workflow Designer', icon: <GitBranch size={18}/>, admin: true },
    { key: 'admin', label: 'Project Administration', icon: <Settings size={18}/>, admin: true },
  ];

  return <div className="product-shell">
    <aside className={`product-sidebar ${mobileNavOpen ? 'open' : ''}`}>
      <div className="product-brand">
        <div className="brand-mark"><Layers3 size={21}/></div>
        <div><strong>Project Control</strong><span>Project operating ledger</span></div>
        <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18}/></button>
      </div>

      <div className="project-context-card">
        <span>Current project</span>
        <strong>{context?.project.name ?? 'No project selected'}</strong>
        <small>{context ? `${context.project.code} · ${context.project.currency}` : 'Project discovery API not implemented yet'}</small>
      </div>

      <nav className="product-nav" aria-label="Project Control navigation">
        {navItems.filter(item => !item.admin || isAdmin).map(item =>
          <button key={item.key} className={screen === item.key ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.key)} data-testid={`nav-${item.key}`}>
            {item.icon}<span>{item.label}</span><ChevronRight size={15}/>
          </button>)}
      </nav>

      <div className="sidebar-footer">
        <div className="signed-user"><UserRound size={17}/><div><strong>{session.displayName}</strong><span>{session.email}</span></div></div>
        <button className="nav-logout" onClick={logout} disabled={busy}><LogOut size={16}/> Sign out</button>
      </div>
    </aside>

    {mobileNavOpen && <button className="nav-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"/>}

    <main className="product-main">
      <header className="product-topbar">
        <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={19}/></button>
        <div>
          <p>{context?.workspace.name ?? 'Project Control'}</p>
          <strong>{screenTitle(screen)}</strong>
        </div>
        <div className="topbar-actions">
          {context && <button className="button secondary compact" disabled={busy} onClick={() => run('Refreshing project…', () => refreshCore())}><RefreshCw size={15}/> Refresh</button>}
          {isAdmin && <span className="admin-badge"><ShieldCheck size={15}/> Project Admin</span>}
        </div>
      </header>

      {(message || error) && <div className={error ? 'global-notice error' : 'global-notice'}><Activity size={16}/><span>{error ?? message}</span>{busy && <b>working</b>}</div>}

      <div className="screen-container">
        {!context ? <NoProjectScreen isAdmin={isAdmin} busy={busy} onInitialize={initializeLocalProject}/> : <>
          {screen === 'overview' && <OverviewScreen
            context={context} scopes={scopes} documents={documents} definitions={definitions} bindings={bindings}
            onNavigate={navigate}
          />}
          {screen === 'documents' && <DocumentsScreen
            context={context} scopes={scopes} documents={documents} isAdmin={isAdmin}
            onDataChanged={() => refreshCore()}
          />}
          {screen === 'workflows' && <WorkflowsScreen
            context={context} scopes={scopes} documents={documents} definitions={definitions}
            onDataChanged={() => refreshCore()}
          />}
          {screen === 'verification' && <VerificationScreen
            context={context} scopes={scopes} documents={documents} definitions={definitions}
          />}
          {screen === 'cost' && <CostControlScreen context={context} scopes={scopes} documents={documents}/>} 
          {screen === 'commercial' && <CommercialScreen context={context} scopes={scopes} documents={documents}/>} 
          {screen === 'financial' && <FinancialScreen context={context}/>} 
          {screen === 'designer' && isAdmin && <WorkflowDesignerScreen
            context={context} scopes={scopes} definitions={definitions} bindings={bindings}
            onDataChanged={() => refreshCore()}
          />}
          {screen === 'admin' && isAdmin && <ProjectAdminScreen
            context={context} scopes={scopes}
            onDataChanged={() => refreshCore()}
          />}
        </>}
      </div>
    </main>
  </div>;
}

function LoadingPage() {
  return <div className="login-page"><div className="login-card compact-card"><Database size={36}/><h1>Project Control</h1><p>Restoring your session…</p></div></div>;
}

function LoginPage({ busy, error, email, password, onEmail, onPassword, onSignIn, onQuickSignIn }: {
  busy: boolean; error: string | null; email: string; password: string;
  onEmail: (value: string) => void; onPassword: (value: string) => void;
  onSignIn: () => void; onQuickSignIn: (email: string) => void;
}) {
  return <div className="login-page product-login">
    <div className="login-card">
      <div className="login-brand"><Layers3 size={30}/><div><strong>Project Control</strong><span>Project operating ledger</span></div></div>
      <h1>Sign in</h1>
      <p>Access project documents, configured workflows and project administration according to your authenticated project role.</p>
      {error && <div className="login-error">{error}</div>}
      <label>Email<input value={email} onChange={event => onEmail(event.target.value)}/></label>
      <label>Password<input type="password" value={password} onChange={event => onPassword(event.target.value)}/></label>
      <button className="primary login-submit" disabled={busy} onClick={onSignIn}><LogIn size={17}/> Sign in</button>
      <details className="development-accounts">
        <summary>Local development accounts</summary>
        <small>Only for the current local foundation environment. Password: <code>{LOCAL_DEMO_PASSWORD}</code></small>
        <div className="demo-login-grid">{DEMO_LOGIN_OPTIONS.map(([accountEmail, label]) =>
          <button key={accountEmail} disabled={busy} onClick={() => onQuickSignIn(accountEmail)}><span>{label}</span><small>{accountEmail}</small></button>)}</div>
      </details>
    </div>
  </div>;
}

function NoProjectScreen({ isAdmin, busy, onInitialize }: { isAdmin: boolean; busy: boolean; onInitialize: () => void }) {
  return <section className="empty-product-state">
    <div className="empty-icon"><Building2 size={28}/></div>
    <h1>No project context selected</h1>
    <p>The product UI is ready, but the backend does not yet expose a signed-in project portfolio/discovery endpoint. For the local foundation environment, initialize the real Project Control sample project once.</p>
    {isAdmin
      ? <button className="button primary" disabled={busy} onClick={onInitialize}><Plus size={16}/> Initialize local project</button>
      : <p className="muted-callout">Sign in as Project Admin to initialize the local environment.</p>}
  </section>;
}

function OverviewScreen({ context, scopes, documents, definitions, bindings, onNavigate }: {
  context: DemoState; scopes: Scope[]; documents: DocumentView[]; definitions: WorkflowDefinition[]; bindings: WorkflowBinding[];
  onNavigate: (screen: ScreenKey) => void;
}) {
  const activeDefinitions = definitions.filter(item => item.status === 'ACTIVE').length;
  const activeBindings = bindings.filter(item => item.enabled).length;
  return <div className="screen-stack" data-testid="screen-overview">
    <ScreenHeader eyebrow="PROJECT OVERVIEW" title={context.project.name} description="A live view of the Project Control operating ledger, controlled documents and configured processes."/>

    <div className="metric-cards">
      <MetricCard label="Documents" value={documents.length} note="Visible to your project context" icon={<FileText size={19}/>} onClick={() => onNavigate('documents')}/>
      <MetricCard label="Project scopes" value={scopes.length} note="Configured scope tree nodes" icon={<FolderTree size={19}/>} onClick={() => onNavigate('admin')}/>
      <MetricCard label="Active workflows" value={activeDefinitions} note="Reusable process definitions" icon={<Workflow size={19}/>} onClick={() => onNavigate('workflows')}/>
      <MetricCard label="Scope bindings" value={activeBindings} note="Explicit workflow applicability" icon={<GitBranch size={19}/>} onClick={() => onNavigate('workflows')}/>
    </div>

    <div className="dashboard-grid">
      <section className="content-card">
        <CardHeader title="Recent documents" action={<button className="text-button" onClick={() => onNavigate('documents')}>Open register <ChevronRight size={14}/></button>}/>
        <div className="simple-list">
          {documents.slice(-5).reverse().map(document => <div className="simple-row" key={document.id}>
            <FileText size={17}/><div><strong>{document.documentNumber}</strong><span>{document.title}</span></div><StatusBadge value={document.status}/>
          </div>)}
          {!documents.length && <EmptyInline text="No documents are visible in this project yet."/>}
        </div>
      </section>

      <section className="content-card">
        <CardHeader title="Scope tree"/>
        <ScopeTree scopes={scopes}/>
      </section>
    </div>
  </div>;
}

function DocumentsScreen({ context, scopes, documents, isAdmin, onDataChanged }: {
  context: DemoState; scopes: Scope[]; documents: DocumentView[]; isAdmin: boolean; onDataChanged: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<Id | null>(documents[0]?.id ?? null);
  const [revisions, setRevisions] = useState<RevisionView[]>([]);
  const [availableDefinitions, setAvailableDefinitions] = useState<WorkflowDefinition[]>([]);
  const [documentWorkflows, setDocumentWorkflows] = useState<WorkflowInstance[]>([]);
  const [series, setSeries] = useState<DocumentNumberSeries[]>([]);
  const [scopeAccess, setScopeAccess] = useState<AccessView | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitScopeId, setSubmitScopeId] = useState<Id>(context.mepScope.id);
  const [originatorId, setOriginatorId] = useState<Id>(context.contractor.id);
  const [seriesCode, setSeriesCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [revisionCode, setRevisionCode] = useState('B');
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [selectedWorkflowDefinitionId, setSelectedWorkflowDefinitionId] = useState<Id>('');
  const [working, setWorking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selected = documents.find(item => item.id === selectedId) ?? documents[0] ?? null;
  const selectedSeries = series.find(item => item.seriesCode === seriesCode) ?? null;
  const canSubmit = isAdmin || scopeAccess?.decisions.DOCUMENT_SUBMIT?.outcome === 'ALLOW';

  useEffect(() => {
    if (!documents.length) { setSelectedId(null); return; }
    if (!selectedId || !documents.some(item => item.id === selectedId)) setSelectedId(documents[0].id);
  }, [documents, selectedId]);

  useEffect(() => {
    productApi.listNumberSeries(context.project.id).then(items => {
      setSeries(items);
      if (!seriesCode && items.length) setSeriesCode(items[0].seriesCode);
    }).catch(() => setSeries([]));
  }, [context.project.id, seriesCode]);

  useEffect(() => {
    api.getAccess(context.project.id, submitScopeId).then(setScopeAccess).catch(() => setScopeAccess(null));
  }, [context.project.id, submitScopeId]);

  useEffect(() => {
    if (!selected) { setRevisions([]); setAvailableDefinitions([]); setDocumentWorkflows([]); return; }
    Promise.all([
      api.listRevisions(selected.id),
      api.listAvailableDocumentWorkflowDefinitions(selected.id),
      api.listDocumentWorkflows(selected.id),
    ]).then(([nextRevisions, nextDefinitions, nextFlows]) => {
      setRevisions(nextRevisions);
      setAvailableDefinitions(nextDefinitions);
      setDocumentWorkflows(nextFlows);
      setSelectedWorkflowDefinitionId(current => nextDefinitions.some(item => item.id === current) ? current : nextDefinitions[0]?.id ?? '');
    }).catch(cause => setLocalError(cause instanceof Error ? cause.message : String(cause)));
  }, [selected?.id]);

  async function doWork(action: () => Promise<void>) {
    setWorking(true); setLocalError(null);
    try { await action(); } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setWorking(false); }
  }

  async function submit() {
    if (!file || !selectedSeries || !title.trim()) return;
    await doWork(async () => {
      const created = await productApi.submitDocument({
        projectId: context.project.id,
        scopeId: submitScopeId,
        originatorOrganizationId: originatorId,
        numberSeriesCode: selectedSeries.seriesCode,
        documentType: selectedSeries.documentType,
        title: title.trim(),
        description: description.trim(),
        metadataJson: '{}',
        file,
      });
      setSubmitOpen(false); setTitle(''); setDescription(''); setFile(null);
      await onDataChanged();
      setSelectedId(created.id);
    });
  }

  async function uploadRevision() {
    if (!selected || !revisionFile || !revisionCode.trim()) return;
    await doWork(async () => {
      await api.uploadRevision(selected.id, revisionCode.trim().toUpperCase(), `Revision ${revisionCode.trim().toUpperCase()}`, revisionFile);
      setRevisionFile(null);
      const next = await api.listRevisions(selected.id);
      setRevisions(next);
      await onDataChanged();
    });
  }

  async function startWorkflow() {
    if (!selected || !selectedWorkflowDefinitionId) return;
    await doWork(async () => {
      await api.startDocumentWorkflow(selected.id, selectedWorkflowDefinitionId, `Review ${selected.title}`);
      setDocumentWorkflows(await api.listDocumentWorkflows(selected.id));
    });
  }

  return <div className="screen-stack" data-testid="screen-documents">
    <ScreenHeader eyebrow="DOCUMENT CONTROL" title="Document Register" description="Project documents, immutable revisions and scope-applicable workflows." actions={
      <button className="button primary" onClick={() => setSubmitOpen(value => !value)}><FileUp size={16}/>{submitOpen ? 'Close submission' : 'Submit document'}</button>
    }/>
    {localError && <InlineError text={localError}/>} 

    {submitOpen && <section className="content-card form-card">
      <CardHeader title="New document" subtitle="Uses the selected project scope and an actual configured numbering series."/>
      <div className="form-grid three">
        <label>Project scope<select value={submitScopeId} onChange={event => setSubmitScopeId(event.target.value)}>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scopeLabel(scope, scopes)}</option>)}</select></label>
        <label>Originator organization<select value={originatorId} onChange={event => setOriginatorId(event.target.value)}><option value={context.contractor.id}>{context.contractor.displayName}</option><option value={context.consultant.id}>{context.consultant.displayName}</option></select></label>
        <label>Numbering series<select value={seriesCode} onChange={event => setSeriesCode(event.target.value)}>{series.map(item => <option key={item.id} value={item.seriesCode}>{item.seriesCode} · {item.documentType}</option>)}</select></label>
        <label className="span-2">Title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Document title"/></label>
        <label>Description<input value={description} onChange={event => setDescription(event.target.value)} placeholder="Optional description"/></label>
        <label className="span-2">Initial PDF<input type="file" accept="application/pdf" onChange={event => setFile(event.target.files?.[0] ?? null)}/></label>
      </div>
      {!canSubmit && <p className="field-warning">Your authenticated role cannot submit documents in the selected scope.</p>}
      {!series.length && <p className="field-warning">No document numbering series is configured. Project Admin can create one in Project Administration.</p>}
      <div className="form-actions"><button className="button primary" disabled={working || !canSubmit || !file || !selectedSeries || !title.trim()} onClick={submit}><Upload size={15}/> Submit document</button></div>
    </section>}

    <div className="register-layout">
      <section className="content-card register-list-card">
        <div className="register-list-heading"><strong>Documents</strong><span>{documents.length}</span></div>
        <div className="register-list">
          {documents.map(document => <button key={document.id} className={document.id === selected?.id ? 'register-row active' : 'register-row'} onClick={() => setSelectedId(document.id)}>
            <FileText size={17}/><div><strong>{document.documentNumber}</strong><span>{document.title}</span><small>{document.documentType} · Rev {document.currentRevisionCode ?? '—'}</small></div><StatusBadge value={document.status}/>
          </button>)}
          {!documents.length && <EmptyInline text="No documents are visible to this user."/>}
        </div>
      </section>

      <section className="content-card detail-card">
        {!selected ? <EmptyInline text="Select a document to see its details."/> : <>
          <div className="detail-title"><div><span>{selected.documentNumber}</span><h2>{selected.title}</h2></div><StatusBadge value={selected.status}/></div>
          <div className="detail-facts">
            <Fact label="Type" value={selected.documentType}/><Fact label="Revision" value={selected.currentRevisionCode ?? '—'}/><Fact label="Scope" value={scopeName(selected.primaryScopeId, scopes)}/><Fact label="Number source" value={selected.numberSource}/>
          </div>

          <div className="detail-section"><CardHeader title="Revision history"/>
            <div className="revision-list">{revisions.map(revision => <div className="revision-row" key={revision.id}>
              <div className="revision-marker">{revision.revisionCode}</div><div><strong>Revision {revision.revisionCode}</strong><span>{revision.changeNotes ?? 'No change note'}</span><small>{revision.originalFilename ?? 'No file'} · {new Date(revision.createdAt).toLocaleString()}</small></div>
              <button className="icon-text-button" disabled={!revision.contentUri?.startsWith('local-file:')} onClick={() => api.openPdf(revision.id)}><ExternalLink size={14}/> View PDF</button>
            </div>)}</div>
            {canSubmit && <div className="inline-upload"><input value={revisionCode} onChange={event => setRevisionCode(event.target.value.toUpperCase())} aria-label="Revision code"/><input type="file" accept="application/pdf" onChange={event => setRevisionFile(event.target.files?.[0] ?? null)}/><button className="button secondary compact" disabled={working || !revisionFile} onClick={uploadRevision}><Upload size={14}/> Add revision</button></div>}
          </div>

          <div className="detail-section"><CardHeader title="Applicable workflows" subtitle="Resolved from this document's exact project scope."/>
            <div className="workflow-start-row">
              <select value={selectedWorkflowDefinitionId} onChange={event => setSelectedWorkflowDefinitionId(event.target.value)} aria-label="Available workflow"><option value="">Select workflow…</option>{availableDefinitions.map(definition => <option key={definition.id} value={definition.id}>{definition.name} · v{definition.version}</option>)}</select>
              <button className="button primary compact" disabled={working || !selectedWorkflowDefinitionId} onClick={startWorkflow}><Play size={14}/> Start workflow</button>
            </div>
            {!availableDefinitions.length && <EmptyInline text="No enabled workflow is explicitly bound to this document scope."/>}
            {!!documentWorkflows.length && <div className="mini-flow-list">{documentWorkflows.map(flow => <div key={flow.id}><Workflow size={15}/><span><strong>{flow.businessKey}</strong>{flow.title}</span><StatusBadge value={flow.status}/></div>)}</div>}
          </div>
        </>}
      </section>
    </div>
  </div>;
}

function WorkflowsScreen({ context, scopes, documents, definitions, onDataChanged }: {
  context: DemoState; scopes: Scope[]; documents: DocumentView[]; definitions: WorkflowDefinition[]; onDataChanged: () => Promise<void>;
}) {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<Id | null>(null);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<Id | null>(definitions[0]?.id ?? null);
  const [steps, setSteps] = useState<WorkflowStepDefinition[]>([]);
  const [definitionBindings, setDefinitionBindings] = useState<WorkflowBinding[]>([]);
  const [instanceSteps, setInstanceSteps] = useState<WorkflowStepDefinition[]>([]);
  const [history, setHistory] = useState<WorkflowHistory | null>(null);
  const [comment, setComment] = useState('Reviewed in Project Control');
  const [working, setWorking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedInstance = instances.find(item => item.id === selectedInstanceId) ?? null;
  const currentDefinitionStep = selectedInstance?.currentStep
    ? instanceSteps.find(item => item.stepCode === selectedInstance.currentStep?.stepCode) ?? null : null;
  const earlierSteps = selectedInstance?.currentStep
    ? instanceSteps.filter(item => item.sequence < selectedInstance.currentStep!.sequence) : [];

  async function loadInstances() {
    const nested = await Promise.all(documents.map(document => api.listDocumentWorkflows(document.id).catch(() => [] as WorkflowInstance[])));
    const next = nested.flat().sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
    setInstances(next);
    setSelectedInstanceId(current => next.some(item => item.id === current) ? current : next[0]?.id ?? null);
  }

  useEffect(() => { loadInstances().catch(() => setInstances([])); }, [documents.map(item => item.id).join('|')]);

  useEffect(() => {
    if (!selectedDefinitionId) { setSteps([]); setDefinitionBindings([]); return; }
    Promise.all([api.listDefinitionSteps(selectedDefinitionId), api.listDefinitionBindings(context.project.id, selectedDefinitionId)])
      .then(([nextSteps, nextBindings]) => { setSteps(nextSteps); setDefinitionBindings(nextBindings); })
      .catch(cause => setLocalError(cause instanceof Error ? cause.message : String(cause)));
  }, [context.project.id, selectedDefinitionId]);

  useEffect(() => {
    if (!selectedInstance) { setInstanceSteps([]); setHistory(null); return; }
    Promise.all([api.listDefinitionSteps(selectedInstance.workflowDefinitionId), api.getHistory(selectedInstance.id)])
      .then(([nextSteps, nextHistory]) => { setInstanceSteps(nextSteps); setHistory(nextHistory); })
      .catch(cause => setLocalError(cause instanceof Error ? cause.message : String(cause)));
  }, [selectedInstance?.id]);

  async function act(body: { actionType: string; actionCode?: string; targetStepCode?: string; comment?: string }) {
    if (!selectedInstance) return;
    setWorking(true); setLocalError(null);
    try {
      await api.workflowAction(selectedInstance.id, body);
      await loadInstances();
      setHistory(await api.getHistory(selectedInstance.id));
      await onDataChanged();
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setWorking(false); }
  }

  return <div className="screen-stack" data-testid="screen-workflows">
    <ScreenHeader eyebrow="WORKFLOW" title="Workflow Centre" description="Reusable project process definitions and live document workflow instances."/>
    {localError && <InlineError text={localError}/>} 

    <div className="workflow-page-grid">
      <section className="content-card definitions-card">
        <CardHeader title="Definitions" subtitle={`${definitions.length} configured for this project`}/>
        <div className="definition-list">{definitions.map(definition => <button key={definition.id} className={definition.id === selectedDefinitionId ? 'definition-row active' : 'definition-row'} onClick={() => setSelectedDefinitionId(definition.id)}>
          <GitBranch size={16}/><div><strong>{definition.name}</strong><span>{definition.code} · v{definition.version}</span></div><StatusBadge value={definition.status}/>
        </button>)}</div>
      </section>

      <section className="content-card definition-detail">
        {!selectedDefinitionId ? <EmptyInline text="Select a workflow definition."/> : <>
          {(() => { const definition = definitions.find(item => item.id === selectedDefinitionId); return definition ? <>
            <div className="detail-title"><div><span>{definition.code} · v{definition.version}</span><h2>{definition.name}</h2></div><StatusBadge value={definition.status}/></div>
            <div className="detail-facts"><Fact label="Purpose" value={definition.purposeCode}/><Fact label="Required capability" value={definition.requiredCapabilityCode}/><Fact label="Bound scopes" value={String(definitionBindings.filter(item => item.enabled).length)}/></div>
            <div className="workflow-definition-steps">{steps.map(step => <div key={step.id}><span>{step.sequence}</span><div><strong>{step.name}</strong><small>{step.stepCode} · {step.completionActionCode}</small></div></div>)}</div>
            <div className="binding-chips">{definitionBindings.filter(item => item.enabled).map(binding => <span key={binding.id}><Layers3 size={13}/>{scopeName(binding.scopeId, scopes)}</span>)}</div>
          </> : null; })()}
        </>}
      </section>
    </div>

    <section className="content-card">
      <CardHeader title="Workflow instances" subtitle="Instances linked to documents visible to the authenticated user."/>
      <div className="instance-table">
        <div className="table-head"><span>Business key</span><span>Workflow</span><span>Scope</span><span>Current step</span><span>Status</span></div>
        {instances.map(instance => <button key={instance.id} className={instance.id === selectedInstanceId ? 'table-row selected' : 'table-row'} onClick={() => setSelectedInstanceId(instance.id)}>
          <strong>{instance.businessKey}</strong><span>{instance.workflowCode}</span><span>{scopeName(instance.scopeId, scopes)}</span><span>{instance.currentStep?.stepName ?? '—'}</span><StatusBadge value={instance.status}/>
        </button>)}
        {!instances.length && <EmptyInline text="No workflow instances are linked to visible documents yet."/>}
      </div>
    </section>

    {selectedInstance && <section className="content-card workflow-instance-detail">
      <CardHeader title={selectedInstance.title} subtitle={`${selectedInstance.businessKey} · ${selectedInstance.workflowCode}`}/>
      <div className="instance-progress">{instanceSteps.map(step => {
        const visit = history?.steps.filter(item => item.stepCode === step.stepCode).at(-1);
        const active = selectedInstance.currentStep?.stepCode === step.stepCode;
        return <div key={step.id} className={active ? 'progress-step active' : visit?.status === 'COMPLETED' ? 'progress-step done' : 'progress-step'}><span>{step.sequence}</span><div><strong>{step.name}</strong><small>{visit ? `${visit.status} · visit ${visit.visitNumber}` : 'Waiting'}</small></div></div>;
      })}</div>

      {selectedInstance.status === 'RUNNING' && selectedInstance.currentStep && <div className="workflow-action-panel">
        <div><span>Current step</span><strong>{selectedInstance.currentStep.stepName}</strong><small>Expected action: {currentDefinitionStep?.completionActionCode ?? '—'}</small></div>
        <label>Comment<textarea value={comment} onChange={event => setComment(event.target.value)} rows={3}/></label>
        <div className="action-row">
          <button className="button secondary compact" disabled={working} onClick={() => act({ actionType: 'COMMENT', comment })}>Add comment</button>
          <button className="button primary compact" disabled={working || !currentDefinitionStep} onClick={() => act({ actionType: 'COMPLETE_STEP', actionCode: currentDefinitionStep?.completionActionCode, comment })}><CheckCircle2 size={14}/> Complete step</button>
          {earlierSteps.length > 0 && <select defaultValue="" disabled={working} onChange={event => { const value = event.target.value; if (value) act({ actionType: 'RETURN', targetStepCode: value, comment }); event.currentTarget.value = ''; }}><option value="" disabled>Return to…</option>{earlierSteps.map(step => <option key={step.id} value={step.stepCode}>{step.name}</option>)}</select>}
          <button className="button danger compact" disabled={working} onClick={() => act({ actionType: 'REJECT', comment })}><XCircle size={14}/> Reject</button>
        </div>
      </div>}

      <div className="history-list">{history?.actions.slice().reverse().map(action => <div key={action.id}><Activity size={14}/><div><strong>{action.actionType} · {action.actionCode}</strong><span>{action.fromStepCode ?? 'START'} → {action.toStepCode ?? 'END'}</span><small>{action.comment ?? 'No comment'}</small></div><time>{new Date(action.createdAt).toLocaleString()}</time></div>)}</div>
    </section>}
  </div>;
}

function WorkflowDesignerScreen({ context, scopes, definitions, bindings, onDataChanged }: {
  context: DemoState; scopes: Scope[]; definitions: WorkflowDefinition[]; bindings: WorkflowBinding[]; onDataChanged: () => Promise<void>;
}) {
  const [options, setOptions] = useState<WorkflowConfigurationOptions | null>(null);
  const [definitionId, setDefinitionId] = useState<Id>(definitions[0]?.id ?? '');
  const [bindingScopeId, setBindingScopeId] = useState<Id>(scopes[0]?.id ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const initialScope = scopes[0];
    if (!initialScope) { setOptions(null); return; }
    api.getWorkflowOptions(context.project.id, initialScope.id).then(setOptions).catch(cause => setLocalError(cause instanceof Error ? cause.message : String(cause)));
    if (!bindingScopeId) setBindingScopeId(initialScope.id);
  }, [context.project.id, scopes.map(item => item.id).join('|')]);

  useEffect(() => {
    if (!definitions.some(item => item.id === definitionId)) setDefinitionId(definitions[0]?.id ?? '');
  }, [definitions, definitionId]);

  async function create(input: WorkflowBuilderInput) {
    setMessage(null); setLocalError(null);
    try {
      const created = await api.createWorkflowFlow(context.project.id, input.scopeId, input);
      await onDataChanged();
      setDefinitionId(created.definition.id);
      setMessage(`${created.definition.name} created and bound to ${scopeName(input.scopeId, scopes)}.`);
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function bindExisting() {
    if (!definitionId || !bindingScopeId) return;
    setMessage(null); setLocalError(null);
    try {
      await api.bindDefinitionToScope(context.project.id, bindingScopeId, definitionId, true);
      await onDataChanged();
      setMessage(`Workflow bound to ${scopeName(bindingScopeId, scopes)}.`);
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
  }

  return <div className="screen-stack" data-testid="screen-designer">
    <ScreenHeader eyebrow="PROJECT ADMIN" title="Workflow Designer" description="Create reusable workflow definitions and explicitly bind them to real project scopes."/>
    {message && <div className="inline-success"><CheckCircle2 size={15}/>{message}</div>}
    {localError && <InlineError text={localError}/>} 

    <section className="content-card designer-card">
      <WorkflowDefinitionBuilder disabled={false} busy={false} projectName={context.project.name} options={options} onCreate={create}/>
    </section>

    <section className="content-card">
      <CardHeader title="Reuse an existing definition" subtitle="Bind one active project workflow to another eligible scope without duplicating the process definition."/>
      <div className="binding-form">
        <label>Workflow definition<select value={definitionId} onChange={event => setDefinitionId(event.target.value)}>{definitions.filter(item => item.status === 'ACTIVE').map(definition => <option key={definition.id} value={definition.id}>{definition.name} · v{definition.version}</option>)}</select></label>
        <label>Project scope<select value={bindingScopeId} onChange={event => setBindingScopeId(event.target.value)}>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scopeLabel(scope, scopes)}</option>)}</select></label>
        <button className="button primary" disabled={!definitionId || !bindingScopeId} onClick={bindExisting}><GitBranch size={15}/> Bind to scope</button>
      </div>
      <div className="binding-summary">{bindings.filter(item => item.enabled).map(binding => {
        const definition = definitions.find(item => item.id === binding.workflowDefinitionId);
        return <div key={binding.id}><GitBranch size={14}/><div><strong>{definition?.name ?? binding.workflowDefinitionId}</strong><span>{scopeName(binding.scopeId, scopes)}</span></div></div>;
      })}</div>
    </section>
  </div>;
}

function ProjectAdminScreen({ context, scopes, onDataChanged }: { context: DemoState; scopes: Scope[]; onDataChanged: () => Promise<void> }) {
  const [selectedScopeId, setSelectedScopeId] = useState<Id>(scopes[0]?.id ?? '');
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [series, setSeries] = useState<DocumentNumberSeries[]>([]);
  const [scopeCode, setScopeCode] = useState('');
  const [scopeNameValue, setScopeNameValue] = useState('');
  const [scopeType, setScopeType] = useState('DISCIPLINE');
  const [parentScopeId, setParentScopeId] = useState<Id>('');
  const [capabilityCode, setCapabilityCode] = useState('DOCUMENT_CONTROL');
  const [seriesCode, setSeriesCode] = useState('');
  const [documentType, setDocumentType] = useState('DOCUMENT');
  const [prefix, setPrefix] = useState('DOC');
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedScopeId && scopes.length) setSelectedScopeId(scopes[0].id);
    if (selectedScopeId && !scopes.some(item => item.id === selectedScopeId)) setSelectedScopeId(scopes[0]?.id ?? '');
  }, [scopes, selectedScopeId]);

  useEffect(() => {
    if (!selectedScopeId) { setCapabilities([]); return; }
    api.listScopeCapabilities(context.project.id, selectedScopeId).then(setCapabilities).catch(() => setCapabilities([]));
  }, [context.project.id, selectedScopeId]);

  useEffect(() => { productApi.listNumberSeries(context.project.id).then(setSeries).catch(() => setSeries([])); }, [context.project.id]);

  async function createScope() {
    setMessage(null); setLocalError(null);
    try {
      const created = await productApi.createScope(context.project.id, {
        parentScopeId: parentScopeId || null,
        scopeType: scopeType.trim().toUpperCase(), code: scopeCode.trim().toUpperCase(), name: scopeNameValue.trim(),
      });
      setScopeCode(''); setScopeNameValue('');
      await onDataChanged(); setSelectedScopeId(created.id);
      setMessage(`Scope ${created.name} created.`);
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function enableCapability() {
    if (!selectedScopeId || !capabilityCode.trim()) return;
    setMessage(null); setLocalError(null);
    try {
      await productApi.setScopeCapability(context.project.id, selectedScopeId, capabilityCode.trim().toUpperCase(), true);
      setCapabilities(await api.listScopeCapabilities(context.project.id, selectedScopeId));
      setMessage(`Capability ${capabilityCode.trim().toUpperCase()} enabled.`);
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function defineSeries() {
    setMessage(null); setLocalError(null);
    try {
      await productApi.defineNumberSeries(context.project.id, {
        seriesCode: seriesCode.trim().toUpperCase(), documentType: documentType.trim().toUpperCase(),
        prefix: prefix.trim().toUpperCase(), padding: 4, separator: '-',
      });
      setSeries(await productApi.listNumberSeries(context.project.id));
      setSeriesCode('');
      setMessage('Document numbering series saved.');
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : String(cause)); }
  }

  return <div className="screen-stack" data-testid="screen-admin">
    <ScreenHeader eyebrow="PROJECT ADMIN" title="Project Administration" description="Project structure and configuration that already exists in the current backend foundation."/>
    {message && <div className="inline-success"><CheckCircle2 size={15}/>{message}</div>}
    {localError && <InlineError text={localError}/>} 

    <section className="content-card">
      <CardHeader title="Project identity"/>
      <div className="project-facts"><Fact label="Project code" value={context.project.code}/><Fact label="Workspace" value={context.workspace.name}/><Fact label="Currency" value={context.project.currency}/><Fact label="Time zone" value={context.project.timeZone}/></div>
    </section>

    <div className="admin-grid">
      <section className="content-card">
        <CardHeader title="Project scopes" subtitle="The actual configurable scope tree for this project."/>
        <ScopeTree scopes={scopes} selectedId={selectedScopeId} onSelect={setSelectedScopeId}/>
        <div className="subform">
          <strong>Add scope</strong>
          <div className="form-grid two"><label>Parent<select value={parentScopeId} onChange={event => setParentScopeId(event.target.value)}><option value="">Root scope</option>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scopeLabel(scope, scopes)}</option>)}</select></label><label>Scope type<input value={scopeType} onChange={event => setScopeType(event.target.value.toUpperCase())}/></label><label>Code<input value={scopeCode} onChange={event => setScopeCode(event.target.value.toUpperCase())}/></label><label>Name<input value={scopeNameValue} onChange={event => setScopeNameValue(event.target.value)}/></label></div>
          <button className="button secondary compact" disabled={!scopeCode.trim() || !scopeNameValue.trim()} onClick={createScope}><Plus size={14}/> Add scope</button>
        </div>
      </section>

      <section className="content-card">
        <CardHeader title="Scope capabilities" subtitle={selectedScopeId ? scopeName(selectedScopeId, scopes) : 'Select a scope'}/>
        <div className="capability-list">{capabilities.map(capability => <div key={capability.id}><span>{capability.capabilityCode}</span><StatusBadge value={capability.enabled ? 'ENABLED' : 'DISABLED'}/></div>)}{!capabilities.length && <EmptyInline text="No capabilities configured on this scope."/>}</div>
        <div className="subform"><strong>Enable capability</strong><div className="inline-field"><input value={capabilityCode} onChange={event => setCapabilityCode(event.target.value.toUpperCase())}/><button className="button secondary compact" disabled={!selectedScopeId || !capabilityCode.trim()} onClick={enableCapability}><Plus size={14}/> Enable</button></div></div>
      </section>
    </div>

    <section className="content-card">
      <CardHeader title="Document numbering" subtitle="Project-level numbering series used by the Document Register."/>
      <div className="number-series-table"><div className="table-head four"><span>Series</span><span>Document type</span><span>Prefix</span><span>Next number</span></div>{series.map(item => <div className="series-row" key={item.id}><strong>{item.seriesCode}</strong><span>{item.documentType}</span><span>{item.prefix}</span><span>{item.nextNumber}</span></div>)}</div>
      <div className="subform"><strong>Add or update series</strong><div className="form-grid three"><label>Series code<input value={seriesCode} onChange={event => setSeriesCode(event.target.value.toUpperCase())}/></label><label>Document type<input value={documentType} onChange={event => setDocumentType(event.target.value.toUpperCase())}/></label><label>Prefix<input value={prefix} onChange={event => setPrefix(event.target.value.toUpperCase())}/></label></div><button className="button secondary compact" disabled={!seriesCode.trim() || !documentType.trim() || !prefix.trim()} onClick={defineSeries}><Save size={14}/> Save series</button></div>
    </section>
  </div>;
}

function ScreenHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="screen-header"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{actions && <div className="screen-actions">{actions}</div>}</div>;
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="card-header"><div><strong>{title}</strong>{subtitle && <span>{subtitle}</span>}</div>{action}</div>;
}

function MetricCard({ label, value, note, icon, onClick }: { label: string; value: number; note: string; icon: ReactNode; onClick: () => void }) {
  return <button className="metric-card" onClick={onClick}><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></button>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="fact"><span>{label}</span><strong>{value}</strong></div>;
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  return <span className={`status-badge ${normalized}`}>{value.replaceAll('_', ' ')}</span>;
}

function EmptyInline({ text }: { text: string }) {
  return <div className="empty-inline"><ClipboardList size={18}/><span>{text}</span></div>;
}

function InlineError({ text }: { text: string }) {
  return <div className="inline-error"><XCircle size={16}/><span>{text}</span></div>;
}

function ScopeTree({ scopes, selectedId, onSelect }: { scopes: Scope[]; selectedId?: Id; onSelect?: (id: Id) => void }) {
  const roots = scopes.filter(scope => !scope.parentScopeId);
  const renderNode = (scope: Scope, depth: number): ReactNode => {
    const children = scopes.filter(child => child.parentScopeId === scope.id);
    const content = <div className="scope-node-content"><Layers3 size={14}/><div><strong>{scope.name}</strong><span>{scope.scopeType} · {scope.code}</span></div></div>;
    return <div className="scope-node" key={scope.id}>
      {onSelect ? <button style={{ paddingLeft: `${12 + depth * 18}px` }} className={selectedId === scope.id ? 'scope-select selected' : 'scope-select'} onClick={() => onSelect(scope.id)}>{content}</button>
        : <div style={{ paddingLeft: `${12 + depth * 18}px` }} className="scope-static">{content}</div>}
      {children.map(child => renderNode(child, depth + 1))}
    </div>;
  };
  return <div className="scope-tree">{roots.map(root => renderNode(root, 0))}{!scopes.length && <EmptyInline text="No project scopes configured."/>}</div>;
}

function scopeName(scopeId: Id | null | undefined, scopes: Scope[]) {
  if (!scopeId) return 'Unscoped';
  return scopes.find(scope => scope.id === scopeId)?.name ?? scopeId.slice(0, 8);
}

function scopeLabel(scope: Scope, scopes: Scope[]) {
  const names: string[] = [];
  let current: Scope | undefined = scope;
  const seen = new Set<Id>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id); names.unshift(current.name);
    current = current.parentScopeId ? scopes.find(item => item.id === current?.parentScopeId) : undefined;
  }
  return `${names.join(' / ')} · ${scope.scopeType}`;
}

function screenTitle(screen: ScreenKey) {
  switch (screen) {
    case 'documents': return 'Document Register';
    case 'workflows': return 'Workflow Centre';
    case 'verification': return 'Verification & Measurement';
    case 'cost': return 'Cost Control';
    case 'commercial': return 'Commercial & IPC';
    case 'financial': return 'Financial & Cash Flow';
    case 'designer': return 'Workflow Designer';
    case 'admin': return 'Project Administration';
    default: return 'Project Overview';
  }
}

export default App;