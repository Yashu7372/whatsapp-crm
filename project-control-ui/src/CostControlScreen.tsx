import { useEffect, useState, type ReactNode } from 'react';
import { Banknote, CircleDollarSign, Coins, ListTree, Plus, RefreshCw, Search, ShieldAlert, TrendingUp, WalletCards } from 'lucide-react';
import type { DemoState, DocumentView, Id, RevisionView, Scope } from './api';
import { controlApi, type BudgetDecision, type BudgetLine, type BudgetVersion, type CostNode, type CostStructure, type FinancialDrilldown } from './controlApi';
import { Empty, Kpi, LocalError, PanelHeader, loadAllRevisions, money, orgOptions, scopeName, statusClass, today } from './ControlUi';
import './control-ui.css';

function Posting({ title, value, onValue, extra, button, disabled, onClick }: {
  title: string; value: string; onValue: (value: string) => void; extra?: ReactNode;
  button: string; disabled: boolean; onClick: () => void;
}) {
  return <div className="posting-card"><strong>{title}</strong>{extra}<input type="number" value={value} onChange={event => onValue(event.target.value)}/><button className="button secondary" disabled={disabled} onClick={onClick}>{button}</button></div>;
}

export default function CostControlScreen({ context, scopes, documents }: { context: DemoState; scopes: Scope[]; documents: DocumentView[] }) {
  const [organizationId, setOrganizationId] = useState<Id>(context.contractor.id);
  const [structures, setStructures] = useState<CostStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<Id>('');
  const [nodes, setNodes] = useState<CostNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<Id>('');
  const [drilldown, setDrilldown] = useState<FinancialDrilldown | null>(null);
  const [budget, setBudget] = useState<BudgetVersion | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [decision, setDecision] = useState<BudgetDecision | null>(null);
  const [revisions, setRevisions] = useState<Array<{ document: DocumentView; revision: RevisionView }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [structureCode, setStructureCode] = useState('INTERNAL_COST');
  const [structureName, setStructureName] = useState('Internal Cost CBS');
  const [nodeCode, setNodeCode] = useState('MEP-001');
  const [nodeName, setNodeName] = useState('MEP Delivery');
  const [scopeId, setScopeId] = useState<Id>(context.mepScope.id);
  const [budgetAmount, setBudgetAmount] = useState('500000');
  const [exposure, setExposure] = useState('25000');
  const [commitmentRef, setCommitmentRef] = useState('PO-001');
  const [commitmentAmount, setCommitmentAmount] = useState('50000');
  const [actualAmount, setActualAmount] = useState('10000');
  const [forecastAmount, setForecastAmount] = useState('120000');
  const [evidenceRevisionId, setEvidenceRevisionId] = useState<Id>('');

  const selectedOrg = orgOptions(context).find(item => item.id === organizationId);
  const summary = selectedNodeId
    ? drilldown?.costStructures.flatMap(item => item.nodes).find(item => item.node.id === selectedNodeId)?.financialSummary ?? null
    : null;

  async function load() {
    setBusy(true); setError(null);
    try {
      const [nextStructures, nextDrilldown, nextRevisions] = await Promise.all([
        controlApi.listCostStructures(context.project.id, organizationId),
        controlApi.financialDrilldown(context.project.id, organizationId),
        loadAllRevisions(documents),
      ]);
      setStructures(nextStructures); setDrilldown(nextDrilldown); setRevisions(nextRevisions);
      const structureId = nextStructures.some(item => item.id === selectedStructureId) ? selectedStructureId : nextStructures[0]?.id ?? '';
      setSelectedStructureId(structureId);
      if (structureId) {
        const nextNodes = await controlApi.listCostNodes(context.project.id, structureId);
        setNodes(nextNodes);
        setSelectedNodeId(current => nextNodes.some(item => item.id === current) ? current : nextNodes[0]?.id ?? '');
      } else { setNodes([]); setSelectedNodeId(''); }
      const cachedBudgetId = localStorage.getItem(`pc-budget:${context.project.id}:${organizationId}`);
      if (cachedBudgetId) {
        try {
          const nextBudget = await controlApi.getBudget(context.project.id, cachedBudgetId);
          setBudget(nextBudget); setBudgetLines(await controlApi.listBudgetLines(context.project.id, cachedBudgetId));
        } catch { setBudget(null); setBudgetLines([]); }
      } else { setBudget(null); setBudgetLines([]); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setDrilldown(null); setStructures([]); setNodes([]);
    } finally { setBusy(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [context.project.id, organizationId]);
  useEffect(() => {
    if (!selectedStructureId) { setNodes([]); setSelectedNodeId(''); return; }
    controlApi.listCostNodes(context.project.id, selectedStructureId).then(items => {
      setNodes(items);
      setSelectedNodeId(current => items.some(item => item.id === current) ? current : items[0]?.id ?? '');
    }).catch(cause => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [context.project.id, selectedStructureId]);

  async function work(action: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  async function createStructure() {
    await work(async () => {
      const created = await controlApi.createCostStructure(context.project.id, {
        owningOrganizationId: organizationId, code: structureCode, name: structureName, structureType: 'INTERNAL_COST',
      });
      setSelectedStructureId(created.id); await load();
    });
  }

  async function createNode() {
    if (!selectedStructureId) return;
    await work(async () => {
      const created = await controlApi.createCostNode(context.project.id, selectedStructureId, {
        parentNodeId: null, code: nodeCode, name: nodeName, category: 'COST', sortOrder: nodes.length + 1,
      });
      await controlApi.linkScope(context.project.id, created.id, { scopeId, allocationPercent: 100, relationshipType: 'ALLOCATION' });
      setSelectedNodeId(created.id); await load();
    });
  }

  async function createBudget() {
    if (!selectedStructureId || !selectedNodeId) return;
    await work(async () => {
      let nextBudget = await controlApi.createBudget(context.project.id, {
        costStructureId: selectedStructureId, baselineType: 'ORIGINAL', currency: context.project.currency,
      });
      await controlApi.addBudgetLine(context.project.id, nextBudget.id, {
        costNodeId: selectedNodeId, scopeId, amount: Number(budgetAmount), notes: 'Budget line from Project Control UI',
      });
      nextBudget = await controlApi.getBudget(context.project.id, nextBudget.id);
      localStorage.setItem(`pc-budget:${context.project.id}:${organizationId}`, nextBudget.id);
      setBudget(nextBudget); setBudgetLines(await controlApi.listBudgetLines(context.project.id, nextBudget.id));
    });
  }

  async function transitionBudget(action: 'submit' | 'approve') {
    if (!budget) return;
    await work(async () => {
      const next = action === 'submit'
        ? await controlApi.submitBudget(context.project.id, budget.id, budget.version)
        : await controlApi.approveBudget(context.project.id, budget.id, budget.version);
      setBudget(next); await load();
    });
  }

  async function previewBudget() {
    if (!selectedNodeId) return;
    await work(async () => setDecision(await controlApi.budgetCheck(context.project.id, {
      owningOrganizationId: organizationId, scopeId, costNodeId: selectedNodeId,
      proposedExposure: Number(exposure), requestResourceReference: 'ui://budget-preview',
    })));
  }

  async function createCommitment() {
    if (!selectedNodeId) return;
    await work(async () => {
      await controlApi.createCommitment(context.project.id, {
        owningOrganizationId: organizationId,
        counterpartyOrganizationId: organizationId === context.contractor.id ? context.consultant.id : context.contractor.id,
        contractId: null, scopeId, costNodeId: selectedNodeId, reference: commitmentRef,
        amount: Number(commitmentAmount), currency: context.project.currency, committedAt: new Date().toISOString(),
        sourceDocumentRevisionId: evidenceRevisionId || null,
      });
      await load();
    });
  }

  async function postActual() {
    if (!selectedNodeId) return;
    await work(async () => {
      await controlApi.postActualCost(context.project.id, {
        owningOrganizationId: organizationId, scopeId, costNodeId: selectedNodeId, commitmentId: null,
        sourceType: 'MANUAL_POSTING', sourceReference: `ACT-${Date.now()}`, counterpartyOrganizationId: null,
        amount: Number(actualAmount), currency: context.project.currency, accountingDate: today(),
        sourceDocumentRevisionId: evidenceRevisionId || null,
      });
      await load();
    });
  }

  async function setForecast() {
    if (!selectedNodeId) return;
    await work(async () => {
      await controlApi.setForecast(context.project.id, {
        owningOrganizationId: organizationId, scopeId, costNodeId: selectedNodeId, forecastPeriod: today(),
        remainingForecastAmount: Number(forecastAmount), currency: context.project.currency,
        basis: 'LATEST_REMAINING_FORECAST', sourceDocumentRevisionId: evidenceRevisionId || null,
      });
      await load();
    });
  }

  return <div className="screen-stack" data-testid="screen-cost">
    <div className="control-title"><div><p>ORGANIZATION-PRIVATE COST</p><h1>Cost Control</h1><span>Separate Scope and CBS dimensions, approved budget, commitments, actuals, forecast and deterministic budget control.</span></div><button className="button secondary" disabled={busy} onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    <div className="control-toolbar">
      <label>Financial perspective<select aria-label="Financial perspective" value={organizationId} onChange={event => setOrganizationId(event.target.value)}>{orgOptions(context).map(org => <option key={org.id} value={org.id}>{org.displayName}</option>)}</select></label>
      <div className="control-privacy"><ShieldAlert size={15}/> Private cost is shown only when the signed-in actor represents {selectedOrg?.displayName ?? 'this organization'} in this project.</div>
    </div>
    <LocalError value={error}/>

    {drilldown && <div className="control-kpis">
      <Kpi label="Current budget" value={money(summary?.currentBudget, drilldown.currency)} icon={<WalletCards/>}/>
      <Kpi label="Exposure" value={money(summary?.budgetExposure, drilldown.currency)} icon={<CircleDollarSign/>}/>
      <Kpi label="Actual" value={money(summary?.actual, drilldown.currency)} icon={<Banknote/>}/>
      <Kpi label="EAC / VAC" value={`${money(summary?.eac, drilldown.currency)} / ${money(summary?.vac, drilldown.currency)}`} icon={<TrendingUp/>}/>
    </div>}

    <div className="control-grid two">
      <section className="content-card">
        <PanelHeader title="Cost Breakdown Structure" hint="CBS remains separate from the Project Scope tree. A deliberate allocation link joins the dimensions."/>
        <div className="control-inline-form"><input aria-label="Cost structure code" value={structureCode} onChange={event => setStructureCode(event.target.value.toUpperCase())} placeholder="Structure code"/><input aria-label="Cost structure name" value={structureName} onChange={event => setStructureName(event.target.value)} placeholder="Structure name"/><button className="button primary" disabled={busy} onClick={createStructure}><Plus size={15}/> Structure</button></div>
        <select className="control-wide-select" aria-label="Cost structure" value={selectedStructureId} onChange={event => setSelectedStructureId(event.target.value)}><option value="">Select structure…</option>{structures.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>
        <div className="control-inline-form"><input aria-label="Cost node code" value={nodeCode} onChange={event => setNodeCode(event.target.value.toUpperCase())}/><input aria-label="Cost node name" value={nodeName} onChange={event => setNodeName(event.target.value)}/><select aria-label="Cost node project scope" value={scopeId} onChange={event => setScopeId(event.target.value)}>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select><button className="button secondary" disabled={busy || !selectedStructureId} onClick={createNode}><Plus size={15}/> Node + scope link</button></div>
        <div className="control-list">{nodes.map(item => <button key={item.id} className={item.id === selectedNodeId ? 'control-list-row active' : 'control-list-row'} onClick={() => setSelectedNodeId(item.id)}><ListTree size={16}/><div><strong>{item.code}</strong><span>{item.name}</span></div><span className={statusClass(item.status)}>{item.status}</span></button>)}{!nodes.length && <Empty>No CBS nodes yet.</Empty>}</div>
      </section>

      <section className="content-card">
        <PanelHeader title="Approved budget lifecycle" hint="Original → Submitted → Approved. The backend owns lifecycle and optimistic version checks."/>
        {!budget ? <div className="control-form-grid"><label>Amount<input aria-label="Budget amount" type="number" value={budgetAmount} onChange={event => setBudgetAmount(event.target.value)}/></label><button className="button primary" disabled={busy || !selectedNodeId} onClick={createBudget}><Plus size={15}/> Create original budget</button></div> : <>
          <div className="control-record"><div><span>Budget v{budget.versionNumber}</span><strong>{budget.baselineType}</strong></div><b className={statusClass(budget.status)}>{budget.status}</b></div>
          <div className="control-table"><div className="control-table-head"><span>CBS node</span><span>Scope</span><span>Amount</span></div>{budgetLines.map(line => <div className="control-table-row" key={line.id}><span>{nodes.find(node => node.id === line.costNodeId)?.code ?? line.costNodeId.slice(0, 8)}</span><span>{scopeName(scopes, line.scopeId)}</span><strong>{money(line.amount, budget.currency)}</strong></div>)}</div>
          <div className="control-actions">{budget.status === 'DRAFT' && <button className="button secondary" onClick={() => transitionBudget('submit')}>Submit budget</button>}{budget.status === 'SUBMITTED' && <button className="button primary" onClick={() => transitionBudget('approve')}>Approve budget</button>}</div>
        </>}
      </section>
    </div>

    <div className="control-grid two">
      <section className="content-card"><PanelHeader title="Budget control preview" hint="The same deterministic policy gate is run authoritatively inside commitment creation."/><div className="control-inline-form"><input aria-label="Proposed exposure" type="number" value={exposure} onChange={event => setExposure(event.target.value)}/><button className="button secondary" disabled={busy || !selectedNodeId} onClick={previewBudget}><Search size={15}/> Check exposure</button></div>{decision && <div className={`budget-decision ${decision.decision === 'ALLOW' ? 'allow' : 'block'}`}><strong>{decision.decision}</strong><span>{decision.reason}</span><div>Available before {money(decision.availableBefore, context.project.currency)} → after {money(decision.availableAfter, context.project.currency)}</div></div>}</section>
      <section className="content-card"><PanelHeader title="Posting evidence" hint="Optional controlled document revision provenance for commitment, actual and forecast facts."/><select className="control-wide-select" aria-label="Cost posting evidence revision" value={evidenceRevisionId} onChange={event => setEvidenceRevisionId(event.target.value)}><option value="">No document revision</option>{revisions.map(({ document, revision }) => <option key={revision.id} value={revision.id}>{document.documentNumber} · Rev {revision.revisionCode}</option>)}</select></section>
    </div>

    <section className="content-card"><PanelHeader title="Cost postings" hint="These write to the organization-private cost ledger. Contract commercial truth stays separate."/><div className="posting-grid">
      <Posting title="Commitment" value={commitmentAmount} onValue={setCommitmentAmount} extra={<input aria-label="Commitment reference" value={commitmentRef} onChange={event => setCommitmentRef(event.target.value.toUpperCase())}/>} button="Create commitment" disabled={!selectedNodeId || busy} onClick={createCommitment}/>
      <Posting title="Actual cost" value={actualAmount} onValue={setActualAmount} button="Post actual" disabled={!selectedNodeId || busy} onClick={postActual}/>
      <Posting title="Remaining forecast" value={forecastAmount} onValue={setForecastAmount} button="Set forecast" disabled={!selectedNodeId || busy} onClick={setForecast}/>
    </div></section>

    {drilldown && <section className="content-card"><PanelHeader title="Scope financial & verification drilldown" hint={drilldown.aggregationRule}/><div className="control-table wide"><div className="control-table-head six"><span>Scope</span><span>Actual</span><span>Open commitment</span><span>EAC</span><span>Verification</span><span>Accepted qty</span></div>{drilldown.scopes.map(scope => <div className="control-table-row six" key={scope.scopeId}><strong>{scope.scopeName}</strong><span>{money(scope.directLedgerSummary.actual, drilldown.currency)}</span><span>{money(scope.directLedgerSummary.openCommitment, drilldown.currency)}</span><span>{money(scope.directLedgerSummary.eac, drilldown.currency)}</span><span>{scope.verificationSummary.acceptedPackageCount}/{scope.verificationSummary.packageCount} accepted</span><span>{scope.verificationSummary.acceptedQuantity}</span></div>)}</div></section>}
  </div>;
}
