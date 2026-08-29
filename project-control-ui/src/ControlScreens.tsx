import { useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign, Banknote, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck,
  Coins, FileCheck2, Landmark, Link2, ListTree, Plus, RefreshCw, Search, ShieldAlert,
  TrendingUp, WalletCards,
} from 'lucide-react';
import { api, type DemoState, type DocumentView, type Id, type RevisionView, type Scope, type WorkflowDefinition } from './api';
import {
  controlApi,
  type BudgetDecision, type BudgetLine, type BudgetVersion, type CashFlow, type Contract,
  type ContractItem, type ContractSummary, type CostNode, type CostStructure, type FinancialDrilldown,
  type Measurement, type Payment, type PaymentApplication, type PaymentApplicationLine, type PaymentTrace,
  type Valuation, type VerificationBundle, type VerificationPackage, type VerificationTrace,
} from './controlApi';
import './control-ui.css';

const money = (value: number | null | undefined, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value ?? 0);
const number = (value: number | null | undefined) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 4 }).format(value ?? 0);
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 7)}-01`;
const sixMonthsAhead = () => {
  const date = new Date(); date.setMonth(date.getMonth() + 6); return date.toISOString().slice(0, 10);
};

function statusClass(value?: string | null) {
  const normalized = (value ?? '').toUpperCase();
  if (['APPROVED','ACCEPTED','CERTIFIED','PAID','ACTIVE','COMPLETED','ALLOW'].includes(normalized)) return 'control-status good';
  if (['REJECTED','BLOCK','CANCELLED','VOID'].includes(normalized)) return 'control-status bad';
  if (['SUBMITTED','PARTIALLY_ACCEPTED','ACCEPTED_WITH_COMMENTS','DRAFT'].includes(normalized)) return 'control-status warn';
  return 'control-status neutral';
}

function scopeName(scopes: Scope[], scopeId?: Id | null) {
  return scopes.find(scope => scope.id === scopeId)?.name ?? '—';
}

function orgOptions(context: DemoState) {
  return [context.contractor, context.consultant];
}

function PanelHeader({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return <div className="control-panel-head"><div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>{action}</div>;
}

function LocalError({ value }: { value: string | null }) {
  return value ? <div className="control-error"><ShieldAlert size={16}/><span>{value}</span></div> : null;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="control-empty">{children}</div>;
}

async function loadAllRevisions(documents: DocumentView[]) {
  const groups = await Promise.all(documents.map(async document => ({ document, revisions: await api.listRevisions(document.id) })));
  return groups.flatMap(group => group.revisions.map(revision => ({ document: group.document, revision })));
}

export function CostControlScreen({ context, scopes, documents }: { context: DemoState; scopes: Scope[]; documents: DocumentView[] }) {
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

  const selectedStructure = structures.find(item => item.id === selectedStructureId) ?? null;
  const selectedNode = nodes.find(item => item.id === selectedNodeId) ?? null;
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
        setNodes(nextNodes); setSelectedNodeId(current => nextNodes.some(item => item.id === current) ? current : nextNodes[0]?.id ?? '');
      } else { setNodes([]); setSelectedNodeId(''); }
      const cachedBudgetId = localStorage.getItem(`pc-budget:${context.project.id}:${organizationId}`);
      if (cachedBudgetId) {
        try {
          const nextBudget = await controlApi.getBudget(context.project.id, cachedBudgetId);
          setBudget(nextBudget); setBudgetLines(await controlApi.listBudgetLines(context.project.id, cachedBudgetId));
        } catch { setBudget(null); setBudgetLines([]); }
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setDrilldown(null); }
    finally { setBusy(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [context.project.id, organizationId]);
  useEffect(() => {
    if (!selectedStructureId) { setNodes([]); return; }
    controlApi.listCostNodes(context.project.id, selectedStructureId).then(items => {
      setNodes(items); setSelectedNodeId(current => items.some(item => item.id === current) ? current : items[0]?.id ?? '');
    }).catch(cause => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [context.project.id, selectedStructureId]);

  async function work(action: () => Promise<void>) { setBusy(true); setError(null); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); } }

  async function createStructure() {
    await work(async () => {
      const created = await controlApi.createCostStructure(context.project.id, { owningOrganizationId: organizationId, code: structureCode, name: structureName, structureType: 'INTERNAL_COST' });
      setSelectedStructureId(created.id); await load();
    });
  }
  async function createNode() {
    if (!selectedStructureId) return;
    await work(async () => {
      const created = await controlApi.createCostNode(context.project.id, selectedStructureId, { code: nodeCode, name: nodeName, category: 'COST', sortOrder: nodes.length + 1 });
      await controlApi.linkScope(context.project.id, created.id, { scopeId, allocationPercent: 100, relationshipType: 'ALLOCATION' });
      setSelectedNodeId(created.id); await load();
    });
  }
  async function createBudget() {
    if (!selectedStructureId || !selectedNodeId) return;
    await work(async () => {
      let nextBudget = await controlApi.createBudget(context.project.id, { costStructureId: selectedStructureId, baselineType: 'ORIGINAL', currency: context.project.currency });
      await controlApi.addBudgetLine(context.project.id, nextBudget.id, { costNodeId: selectedNodeId, scopeId, amount: Number(budgetAmount), notes: 'Budget line from Project Control UI' });
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
    await work(async () => setDecision(await controlApi.budgetCheck(context.project.id, { owningOrganizationId: organizationId, scopeId, costNodeId: selectedNodeId, proposedExposure: Number(exposure), requestResourceReference: 'ui://budget-preview' })));
  }
  async function createCommitment() {
    if (!selectedNodeId) return;
    await work(async () => {
      await controlApi.createCommitment(context.project.id, { owningOrganizationId: organizationId, counterpartyOrganizationId: organizationId === context.contractor.id ? context.consultant.id : context.contractor.id, contractId: null, scopeId, costNodeId: selectedNodeId, reference: commitmentRef, amount: Number(commitmentAmount), currency: context.project.currency, committedAt: new Date().toISOString(), sourceDocumentRevisionId: evidenceRevisionId || null });
      await load();
    });
  }
  async function postActual() {
    if (!selectedNodeId) return;
    await work(async () => {
      await controlApi.postActualCost(context.project.id, { owningOrganizationId: organizationId, scopeId, costNodeId: selectedNodeId, commitmentId: null, sourceType: 'MANUAL_POSTING', sourceReference: `ACT-${Date.now()}`, counterpartyOrganizationId: null, amount: Number(actualAmount), currency: context.project.currency, accountingDate: today(), sourceDocumentRevisionId: evidenceRevisionId || null });
      await load();
    });
  }
  async function setForecast() {
    if (!selectedNodeId) return;
    await work(async () => {
      await controlApi.setForecast(context.project.id, { owningOrganizationId: organizationId, scopeId, costNodeId: selectedNodeId, forecastPeriod: today(), remainingForecastAmount: Number(forecastAmount), currency: context.project.currency, basis: 'LATEST_REMAINING_FORECAST', sourceDocumentRevisionId: evidenceRevisionId || null });
      await load();
    });
  }

  return <div className="screen-stack" data-testid="screen-cost">
    <div className="control-title"><div><p>ORGANIZATION-PRIVATE COST</p><h1>Cost Control</h1><span>Separate Scope and CBS dimensions, approved budget, commitments, actuals, forecast and deterministic budget control.</span></div><button className="button secondary" disabled={busy} onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    <div className="control-toolbar"><label>Financial perspective<select value={organizationId} onChange={event => setOrganizationId(event.target.value)}>{orgOptions(context).map(org => <option key={org.id} value={org.id}>{org.displayName}</option>)}</select></label><div className="control-privacy"><ShieldAlert size={15}/> Private cost is shown only when the signed-in actor represents {selectedOrg?.displayName ?? 'this organization'}.</div></div>
    <LocalError value={error}/>

    {drilldown && <div className="control-kpis">
      <Kpi label="Current budget" value={money(summary?.currentBudget, drilldown.currency)} icon={<WalletCards/>}/>
      <Kpi label="Exposure" value={money(summary?.budgetExposure, drilldown.currency)} icon={<CircleDollarSign/>}/>
      <Kpi label="Actual" value={money(summary?.actual, drilldown.currency)} icon={<Banknote/>}/>
      <Kpi label="EAC / VAC" value={`${money(summary?.eac, drilldown.currency)} / ${money(summary?.vac, drilldown.currency)}`} icon={<TrendingUp/>}/>
    </div>}

    <div className="control-grid two">
      <section className="content-card"><PanelHeader title="Cost Breakdown Structure" hint="CBS remains separate from the Project Scope tree."/>
        <div className="control-inline-form"><input value={structureCode} onChange={e => setStructureCode(e.target.value.toUpperCase())} placeholder="Structure code"/><input value={structureName} onChange={e => setStructureName(e.target.value)} placeholder="Structure name"/><button className="button primary" disabled={busy} onClick={createStructure}><Plus size={15}/> Structure</button></div>
        <select className="control-wide-select" value={selectedStructureId} onChange={e => setSelectedStructureId(e.target.value)}><option value="">Select structure…</option>{structures.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>
        <div className="control-inline-form"><input value={nodeCode} onChange={e => setNodeCode(e.target.value.toUpperCase())}/><input value={nodeName} onChange={e => setNodeName(e.target.value)}/><select value={scopeId} onChange={e => setScopeId(e.target.value)}>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select><button className="button secondary" disabled={busy || !selectedStructureId} onClick={createNode}><Plus size={15}/> Node + scope link</button></div>
        <div className="control-list">{nodes.map(item => <button key={item.id} className={item.id === selectedNodeId ? 'control-list-row active' : 'control-list-row'} onClick={() => setSelectedNodeId(item.id)}><ListTree size={16}/><div><strong>{item.code}</strong><span>{item.name}</span></div><ChevronRight size={15}/></button>)}{!nodes.length && <Empty>No CBS nodes yet.</Empty>}</div>
      </section>

      <section className="content-card"><PanelHeader title="Approved budget lifecycle" hint="Original → Submitted → Approved. Browser storage remembers only the selected version ID; the backend remains authoritative."/>
        {!budget ? <div className="control-form-grid"><label>Amount<input type="number" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)}/></label><button className="button primary" disabled={busy || !selectedNodeId} onClick={createBudget}><Plus size={15}/> Create original budget</button></div> : <>
          <div className="control-record"><div><span>Budget v{budget.versionNumber}</span><strong>{budget.baselineType}</strong></div><b className={statusClass(budget.status)}>{budget.status}</b></div>
          <div className="control-table"><div className="control-table-head"><span>CBS node</span><span>Scope</span><span>Amount</span></div>{budgetLines.map(line => <div className="control-table-row" key={line.id}><span>{nodes.find(node => node.id === line.costNodeId)?.code ?? line.costNodeId.slice(0,8)}</span><span>{scopeName(scopes,line.scopeId)}</span><strong>{money(line.amount, budget.currency)}</strong></div>)}</div>
          <div className="control-actions">{budget.status === 'DRAFT' && <button className="button secondary" onClick={() => transitionBudget('submit')}>Submit budget</button>}{budget.status === 'SUBMITTED' && <button className="button primary" onClick={() => transitionBudget('approve')}>Approve budget</button>}</div>
        </>}
      </section>
    </div>

    <div className="control-grid two">
      <section className="content-card"><PanelHeader title="Budget control preview" hint="Preview uses the same deterministic policy gate used authoritatively during commitment creation."/><div className="control-inline-form"><input type="number" value={exposure} onChange={e => setExposure(e.target.value)}/><button className="button secondary" disabled={busy || !selectedNodeId} onClick={previewBudget}><Search size={15}/> Check exposure</button></div>{decision && <div className={`budget-decision ${decision.decision === 'ALLOW' ? 'allow' : 'block'}`}><strong>{decision.decision}</strong><span>{decision.reason}</span><div>Available before {money(decision.availableBefore, context.project.currency)} → after {money(decision.availableAfter, context.project.currency)}</div></div>}</section>
      <section className="content-card"><PanelHeader title="Posting evidence" hint="Optional controlled document revision provenance for commitment, actual and forecast facts."/><select className="control-wide-select" value={evidenceRevisionId} onChange={e => setEvidenceRevisionId(e.target.value)}><option value="">No document revision</option>{revisions.map(({document,revision}) => <option key={revision.id} value={revision.id}>{document.documentNumber} · Rev {revision.revisionCode}</option>)}</select></section>
    </div>

    <section className="content-card"><PanelHeader title="Cost postings" hint="These write to the real cost ledger. Private cost is never merged with contract commercial truth."/>
      <div className="posting-grid">
        <Posting title="Commitment" value={commitmentAmount} onValue={setCommitmentAmount} extra={<input value={commitmentRef} onChange={e => setCommitmentRef(e.target.value.toUpperCase())}/>} button="Create commitment" disabled={!selectedNodeId || busy} onClick={createCommitment}/>
        <Posting title="Actual cost" value={actualAmount} onValue={setActualAmount} button="Post actual" disabled={!selectedNodeId || busy} onClick={postActual}/>
        <Posting title="Remaining forecast" value={forecastAmount} onValue={setForecastAmount} button="Set forecast" disabled={!selectedNodeId || busy} onClick={setForecast}/>
      </div>
    </section>

    {drilldown && <section className="content-card"><PanelHeader title="Scope financial & verification drilldown" hint={drilldown.aggregationRule}/><div className="control-table wide"><div className="control-table-head six"><span>Scope</span><span>Actual</span><span>Open commitment</span><span>EAC</span><span>Verification</span><span>Accepted qty</span></div>{drilldown.scopes.map(scope => <div className="control-table-row six" key={scope.scopeId}><strong>{scope.scopeName}</strong><span>{money(scope.directLedgerSummary.actual, drilldown.currency)}</span><span>{money(scope.directLedgerSummary.openCommitment, drilldown.currency)}</span><span>{money(scope.directLedgerSummary.eac, drilldown.currency)}</span><span>{scope.verificationSummary.acceptedPackageCount}/{scope.verificationSummary.packageCount} accepted</span><span>{number(scope.verificationSummary.acceptedQuantity)}</span></div>)}</div></section>}
  </div>;
}

export function CommercialScreen({ context, scopes, documents }: { context: DemoState; scopes: Scope[]; documents: DocumentView[] }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractId, setContractId] = useState<Id>('');
  const [items, setItems] = useState<ContractItem[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [application, setApplication] = useState<PaymentApplication | null>(null);
  const [applicationLines, setApplicationLines] = useState<PaymentApplicationLine[]>([]);
  const [trace, setTrace] = useState<PaymentTrace | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [revisions, setRevisions] = useState<Array<{ document: DocumentView; revision: RevisionView }>>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  const [contractNumber, setContractNumber] = useState('SUBCONTRACT-001');
  const [contractValue, setContractValue] = useState('1000000');
  const [itemCode, setItemCode] = useState('CHW-001'); const [itemValue, setItemValue] = useState('250000');
  const [valuationMethod, setValuationMethod] = useState('LUMP_SUM'); const [itemScopeId, setItemScopeId] = useState<Id>(context.mepScope.id);
  const [quantity, setQuantity] = useState('100'); const [rate, setRate] = useState('1000');
  const [valuationValue, setValuationValue] = useState('50000'); const [measurementId, setMeasurementId] = useState<Id>('');
  const [revisionId, setRevisionId] = useState<Id>('');
  const [applicationNumber, setApplicationNumber] = useState('IPC-001');
  const [paymentAmount, setPaymentAmount] = useState('10000');

  async function load() {
    setBusy(true); setError(null);
    try {
      const [nextContracts, nextMeasurements, nextRevisions] = await Promise.all([controlApi.listContracts(context.project.id), controlApi.listMeasurements(context.project.id), loadAllRevisions(documents)]);
      setContracts(nextContracts); setMeasurements(nextMeasurements); setRevisions(nextRevisions);
      const nextId = nextContracts.some(item => item.id === contractId) ? contractId : nextContracts[0]?.id ?? '';
      setContractId(nextId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  async function loadContract(id: Id) {
    if (!id) { setItems([]); setValuations([]); setPayments([]); setSummary(null); return; }
    try {
      const [nextItems,nextValuations,nextPayments,nextSummary] = await Promise.all([controlApi.listContractItems(context.project.id,id),controlApi.listValuations(context.project.id,id),controlApi.listPayments(context.project.id,id),controlApi.contractSummary(context.project.id,id)]);
      setItems(nextItems); setValuations(nextValuations); setPayments(nextPayments); setSummary(nextSummary);
      const cached = localStorage.getItem(`pc-ipc:${context.project.id}:${id}`);
      if (cached) { try { const app = await controlApi.getPaymentApplication(context.project.id,cached); setApplication(app); setApplicationLines(await controlApi.listPaymentApplicationLines(context.project.id,cached)); } catch { setApplication(null); setApplicationLines([]); } }
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [context.project.id]);
  useEffect(() => { void loadContract(contractId); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [contractId]);
  async function work(action:()=>Promise<void>){setBusy(true);setError(null);try{await action()}catch(cause){setError(cause instanceof Error?cause.message:String(cause))}finally{setBusy(false)}}

  async function createContract(){await work(async()=>{const created=await controlApi.createContract(context.project.id,{payerParticipantId:context.consultantParticipant.id,payeeParticipantId:context.contractorParticipant.id,contractNumber,contractType:'SUBCONTRACT',currency:context.project.currency,originalValue:Number(contractValue),visibilityPolicy:'CONTRACT_SHARED'});setContractId(created.id);await load()})}
  async function createItem(){if(!contractId)return;await work(async()=>{await controlApi.createContractItem(context.project.id,contractId,{scopeId:itemScopeId,itemCode,description:'Commercial item from Project Control UI',valuationMethod,unit:valuationMethod==='QUANTITY_RATE'?'m':null,plannedQuantity:valuationMethod==='QUANTITY_RATE'?Number(quantity):null,rate:valuationMethod==='QUANTITY_RATE'?Number(rate):null,contractValue:valuationMethod==='QUANTITY_RATE'?Number(quantity)*Number(rate):Number(itemValue),dueDate:null});await loadContract(contractId)})}
  async function createValuation(item: ContractItem){await work(async()=>{const quantityBased=item.valuationMethod==='QUANTITY_RATE';await controlApi.createValuation(context.project.id,{contractId,contractItemId:item.id,valuationNumber:`VAL-${Date.now().toString().slice(-6)}`,sourceType:quantityBased?null:'CONTROLLED_DOCUMENT',sourceReference:quantityBased?null:'ui://valuation',sourceDocumentRevisionId:quantityBased?null:(revisionId||null),measurementId:quantityBased?(measurementId||null):null,currentValue:quantityBased?null:Number(valuationValue),retention:0,otherDeductions:0});await loadContract(contractId)})}
  async function createApplication(){if(!contractId)return;await work(async()=>{const app=await controlApi.createPaymentApplication(context.project.id,{contractId,applicationNumber,periodFrom:monthStart(),periodTo:today(),dueDate:null,sourceDocumentRevisionId:revisionId||null});localStorage.setItem(`pc-ipc:${context.project.id}:${contractId}`,app.id);setApplication(app);setApplicationLines([])})}
  async function addAppLine(valuation: Valuation){if(!application)return;await work(async()=>{await controlApi.addPaymentApplicationLine(context.project.id,application.id,{valuationLineId:valuation.id,claimedValue:valuation.eligibleValue});setApplication(await controlApi.getPaymentApplication(context.project.id,application.id));setApplicationLines(await controlApi.listPaymentApplicationLines(context.project.id,application.id))})}
  async function submitApplication(){if(!application)return;await work(async()=>setApplication(await controlApi.submitPaymentApplication(context.project.id,application.id,application.version)))}
  async function certifyApplication(){if(!application)return;await work(async()=>{const lines=applicationLines.map(line=>({valuationLineId:line.valuationLineId,certifiedValue:line.claimedValue,reason:'Certified in Project Control UI'}));setApplication(await controlApi.certifyPaymentApplication(context.project.id,application.id,application.version,lines));setApplicationLines(await controlApi.listPaymentApplicationLines(context.project.id,application.id);)})}

  async function recordPayment(){if(!application)return;await work(async()=>{await controlApi.recordPayment(context.project.id,{paymentApplicationId:application.id,paymentReference:`PAY-${Date.now().toString().slice(-6)}`,amount:Number(paymentAmount),paidAt:new Date().toISOString(),sourceDocumentRevisionId:revisionId||null});await loadContract(contractId)})}
  async function openTrace(paymentId:Id){await work(async()=>setTrace(await controlApi.paymentTrace(context.project.id,paymentId)))}

  return <div className="screen-stack" data-testid="screen-commercial">
    <div className="control-title"><div><p>CONTRACT COMMERCIAL TRUTH</p><h1>Commercial & IPC</h1><span>Contracts, measurable items, valuations, applications, certification, payment and typed evidence trace.</span></div><button className="button secondary" onClick={load} disabled={busy}><RefreshCw size={15}/> Refresh</button></div><LocalError value={error}/>
    <div className="control-kpis"><Kpi label="Contract value" value={money(summary?.currentValue,context.project.currency)} icon={<Landmark/>}/><Kpi label="Valued to date" value={money(summary?.valuedToDate,context.project.currency)} icon={<Coins/>}/><Kpi label="Certified" value={money(summary?.certifiedToDate,context.project.currency)} icon={<FileCheck2/>}/><Kpi label="Outstanding certified" value={money(summary?.outstandingCertified,context.project.currency)} icon={<Banknote/>}/></div>

    <div className="control-grid two"><section className="content-card"><PanelHeader title="Contracts" hint="Contract truth is shared only with authorized contract parties/project administration."/><div className="control-inline-form"><input value={contractNumber} onChange={e=>setContractNumber(e.target.value.toUpperCase())}/><input type="number" value={contractValue} onChange={e=>setContractValue(e.target.value)}/><button className="button primary" disabled={busy} onClick={createContract}><Plus size={15}/> Contract</button></div><div className="control-list">{contracts.map(contract=><button key={contract.id} className={contract.id===contractId?'control-list-row active':'control-list-row'} onClick={()=>setContractId(contract.id)}><Landmark size={16}/><div><strong>{contract.contractNumber}</strong><span>{contract.contractType} · {money(contract.originalValue,contract.currency)}</span></div><span className={statusClass(contract.status)}>{contract.status}</span></button>)}{!contracts.length&&<Empty>No visible contracts.</Empty>}</div></section>
    <section className="content-card"><PanelHeader title="Commercial evidence / measurement source" hint="Non-quantity valuations require controlled document revision evidence. Quantity-rate valuations require accepted measurement truth."/><label className="control-field">Controlled revision<select value={revisionId} onChange={e=>setRevisionId(e.target.value)}><option value="">Select revision…</option>{revisions.map(({document,revision})=><option key={revision.id} value={revision.id}>{document.documentNumber} · Rev {revision.revisionCode}</option>)}</select></label><label className="control-field">Accepted measurement<select value={measurementId} onChange={e=>setMeasurementId(e.target.value)}><option value="">Select measurement…</option>{measurements.filter(m=>m.acceptedQuantity>0).map(m=><option key={m.id} value={m.id}>{m.subjectResourceReference} · {number(m.acceptedQuantity)} {m.unit}</option>)}</select></label></section></div>

    {contractId&&<section className="content-card"><PanelHeader title="Contract items & valuation"/><div className="control-inline-form"><input value={itemCode} onChange={e=>setItemCode(e.target.value.toUpperCase())}/><select value={itemScopeId} onChange={e=>setItemScopeId(e.target.value)}>{scopes.map(scope=><option key={scope.id} value={scope.id}>{scope.name}</option>)}</select><select value={valuationMethod} onChange={e=>setValuationMethod(e.target.value)}><option value="LUMP_SUM">Lump sum</option><option value="QUANTITY_RATE">Quantity × rate</option><option value="MILESTONE">Milestone</option><option value="PERCENTAGE">Percentage</option><option value="TIME_BASED">Time based</option><option value="OTHER">Other</option></select>{valuationMethod==='QUANTITY_RATE'?<><input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Quantity"/><input type="number" value={rate} onChange={e=>setRate(e.target.value)} placeholder="Rate"/></>:<input type="number" value={itemValue} onChange={e=>setItemValue(e.target.value)} placeholder="Contract value"/>}<button className="button secondary" onClick={createItem} disabled={busy}><Plus size={15}/> Item</button></div>
      <div className="control-table wide"><div className="control-table-head six"><span>Item</span><span>Scope</span><span>Method</span><span>Quantity</span><span>Value</span><span>Valuation</span></div>{items.map(item=><div className="control-table-row six" key={item.id}><strong>{item.itemCode}</strong><span>{scopeName(scopes,item.scopeId)}</span><span>{item.valuationMethod}</span><span>{item.plannedQuantity?`${number(item.plannedQuantity)} ${item.unit??''}`:'—'}</span><span>{money(item.contractValue,context.project.currency)}</span><button className="text-button" onClick={()=>createValuation(item)} disabled={busy}>{item.valuationMethod==='QUANTITY_RATE'?'Value measurement':'Create valuation'}</button></div>)}</div>
      {items.some(i=>i.valuationMethod!=='QUANTITY_RATE')&&<div className="control-inline-form"><label>Current valuation<input type="number" value={valuationValue} onChange={e=>setValuationValue(e.target.value)}/></label></div>}
    </section>}

    <section className="content-card"><PanelHeader title="Valuations" hint="Quantity-rate rows expose the accepted measurement used to establish value."/><div className="control-table wide"><div className="control-table-head six"><span>Valuation</span><span>Source</span><span>Accepted qty</span><span>Current</span><span>Cumulative</span><span>Eligible</span></div>{valuations.map(v=><div className="control-table-row six" key={v.id}><strong>{v.valuationNumber}</strong><span>{v.measurementId?'ACCEPTED_MEASUREMENT':v.sourceType}</span><span>{v.acceptedQuantity?`${number(v.acceptedQuantity)} ${v.unit??''}`:'—'}</span><span>{money(v.currentValue,context.project.currency)}</span><span>{money(v.cumulativeValue,context.project.currency)}</span><span>{money(v.eligibleValue,context.project.currency)}</span></div>)}</div></section>

    <section className="content-card"><PanelHeader title="IPC / Payment application" hint="The backend currently exposes get-by-ID rather than a project application list; the UI remembers the last selected application ID for continuity." action={!application?<button className="button primary" onClick={createApplication} disabled={busy||!contractId}><Plus size={15}/> New IPC</button>:undefined}/>{!application?<div className="control-inline-form"><input value={applicationNumber} onChange={e=>setApplicationNumber(e.target.value.toUpperCase())}/></div>:<><div className="control-record"><div><span>{application.applicationNumber}</span><strong>{monthStart()} → {today()}</strong></div><b className={statusClass(application.status)}>{application.status}</b></div>{application.status==='DRAFT'&&<div className="control-chip-row">{valuations.filter(v=>!applicationLines.some(line=>line.valuationLineId===v.id)).map(v=><button key={v.id} className="control-chip" onClick={()=>addAppLine(v)}>+ {v.valuationNumber} · {money(v.eligibleValue,context.project.currency)}</button>)}</div>}<div className="control-table"><div className="control-table-head"><span>Valuation</span><span>Claimed</span><span>Certified</span></div>{applicationLines.map(line=><div className="control-table-row" key={line.id}><span>{valuations.find(v=>v.id===line.valuationLineId)?.valuationNumber??line.valuationLineId.slice(0,8)}</span><span>{money(line.claimedValue,context.project.currency)}</span><span>{money(line.certifiedValue,context.project.currency)}</span></div>)}</div><div className="control-actions">{application.status==='DRAFT'&&<button className="button secondary" onClick={submitApplication} disabled={!applicationLines.length||busy}>Submit IPC</button>}{application.status==='SUBMITTED'&&<button className="button primary" onClick={certifyApplication} disabled={busy}>Certify all lines</button>}{application.status==='CERTIFIED'&&<><input type="number" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/><button className="button primary" onClick={recordPayment} disabled={busy}>Record payment</button></>}</div></>}</section>

    <section className="content-card"><PanelHeader title="Payments & provenance"/><div className="control-table"><div className="control-table-head"><span>Payment</span><span>Amount</span><span>Trace</span></div>{payments.map(payment=><div className="control-table-row" key={payment.id}><strong>{payment.paymentReference}</strong><span>{money(payment.amount,payment.currency)}</span><button className="text-button" onClick={()=>openTrace(payment.id)}><Link2 size={14}/> Trace</button></div>)}</div>{trace&&<TracePanel trace={trace}/>}</section>
  </div>;
}

export function VerificationScreen({ context, scopes, documents, definitions }: { context: DemoState; scopes: Scope[]; documents: DocumentView[]; definitions: WorkflowDefinition[] }) {
  const [scopeId,setScopeId]=useState<Id>(context.mepScope.id); const [packages,setPackages]=useState<VerificationPackage[]>([]); const [packageId,setPackageId]=useState<Id>(''); const [bundle,setBundle]=useState<VerificationBundle|null>(null); const [measurements,setMeasurements]=useState<Measurement[]>([]); const [trace,setTrace]=useState<VerificationTrace|null>(null); const [revisions,setRevisions]=useState<Array<{document:DocumentView;revision:RevisionView}>>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null);
  const [packageNumber,setPackageNumber]=useState('VER-001'); const [subjectRef,setSubjectRef]=useState('WORK://MEP/CHW/ZONE-B'); const [claimedQuantity,setClaimedQuantity]=useState('100'); const [unit,setUnit]=useState('m'); const [evidenceRevisionId,setEvidenceRevisionId]=useState<Id>(''); const [workflowDefinitionId,setWorkflowDefinitionId]=useState<Id>(''); const [decision,setDecision]=useState('ACCEPTED'); const [acceptedQty,setAcceptedQty]=useState('100'); const [rejectedQty,setRejectedQty]=useState('0'); const [measuredQty,setMeasuredQty]=useState('100');
  const verificationDefinitions=definitions.filter(def=>def.status==='ACTIVE'&&def.requiredCapabilityCode==='VERIFICATION');
  async function load(){setBusy(true);setError(null);try{const [nextPackages,nextMeasurements,nextRevisions]=await Promise.all([controlApi.listVerificationPackages(context.project.id,scopeId),controlApi.listMeasurements(context.project.id,scopeId),loadAllRevisions(documents)]);setPackages(nextPackages);setMeasurements(nextMeasurements);setRevisions(nextRevisions);const nextId=nextPackages.some(p=>p.id===packageId)?packageId:nextPackages[0]?.id??'';setPackageId(nextId);if(nextId)setBundle(await controlApi.getVerificationPackage(context.project.id,nextId));else setBundle(null);setWorkflowDefinitionId(current=>verificationDefinitions.some(d=>d.id===current)?current:verificationDefinitions[0]?.id??'')}catch(cause){setError(cause instanceof Error?cause.message:String(cause))}finally{setBusy(false)}}
  useEffect(()=>{void load();/* eslint-disable-next-line react-hooks/exhaustive-deps */},[context.project.id,scopeId]);
  useEffect(()=>{if(packageId)controlApi.getVerificationPackage(context.project.id,packageId).then(setBundle).catch(cause=>setError(cause instanceof Error?cause.message:String(cause)));},[context.project.id,packageId]);
  async function work(action:()=>Promise<void>){setBusy(true);setError(null);try{await action();await load()}catch(cause){setError(cause instanceof Error?cause.message:String(cause))}finally{setBusy(false)}}
  async function createPackage(){await work(async()=>{const created=await controlApi.createVerificationPackage(context.project.id,{scopeId,packageNumber,subjectType:'WORK_VERIFICATION',submittingOrganizationId:context.contractor.id,parentPackageId:null});setPackageId(created.id)})}
  async function addItem(){if(!bundle)return;await work(async()=>{await controlApi.addVerificationItem(context.project.id,bundle.verificationPackage.id,{version:bundle.verificationPackage.version,subjectResourceReference:subjectRef,claimedProgress:null,claimedQuantity:Number(claimedQuantity),unit,completionStatement:null})})}
  async function addEvidence(){if(!bundle||!evidenceRevisionId)return;await work(async()=>{await controlApi.addVerificationEvidence(context.project.id,bundle.verificationPackage.id,{version:bundle.verificationPackage.version,documentRevisionId:evidenceRevisionId,evidenceType:'CONTROLLED_DOCUMENT',visibilityScope:'PROJECT',required:true})})}
  async function submitPackage(){if(!bundle||!workflowDefinitionId)return;await work(async()=>{await controlApi.submitVerificationPackage(context.project.id,bundle.verificationPackage.id,bundle.verificationPackage.version,workflowDefinitionId)})}
  async function decideItem(itemId:Id){if(!bundle)return;await work(async()=>{await controlApi.decideVerification(context.project.id,bundle.verificationPackage.id,{version:bundle.verificationPackage.version,itemId,actorOrganizationId:context.consultant.id,decision,acceptedQuantity:['ACCEPTED','ACCEPTED_WITH_COMMENTS'].includes(decision)?Number(claimedQuantity):Number(acceptedQty),rejectedQuantity:['ACCEPTED','ACCEPTED_WITH_COMMENTS'].includes(decision)?0:Number(rejectedQty),unit,comments:'Decision from Project Control UI'})})}
  async function finalizePackage(){if(!bundle)return;await work(async()=>{await controlApi.decideVerification(context.project.id,bundle.verificationPackage.id,{version:bundle.verificationPackage.version,itemId:null,actorOrganizationId:context.consultant.id,decision,acceptedQuantity:null,rejectedQuantity:null,unit:null,comments:'Package decision from Project Control UI'})})}
  async function measure(decisionId:Id){if(!bundle)return;await work(async()=>{await controlApi.createMeasurement(context.project.id,bundle.verificationPackage.id,{decisionId,measuredQuantity:Number(measuredQty),periodFrom:monthStart(),periodTo:today()})})}
  async function openTrace(id:Id){setBusy(true);try{setTrace(await controlApi.measurementTrace(context.project.id,id))}catch(cause){setError(cause instanceof Error?cause.message:String(cause))}finally{setBusy(false)}}

  return <div className="screen-stack" data-testid="screen-verification"><div className="control-title"><div><p>VERIFICATION → MEASUREMENT → VALUATION</p><h1>Verification & Measurement</h1><span>Controlled evidence establishes accepted/rejected work truth. Quantity measurement is a typed input to quantity-rate valuation.</span></div><button className="button secondary" onClick={load} disabled={busy}><RefreshCw size={15}/> Refresh</button></div><LocalError value={error}/>
    <div className="control-toolbar"><label>Project scope<select value={scopeId} onChange={e=>setScopeId(e.target.value)}>{scopes.map(scope=><option key={scope.id} value={scope.id}>{scope.name}</option>)}</select></label><span>Scope must have VERIFICATION capability. Quantity measurement additionally requires QUANTITY_MEASUREMENT.</span></div>
    <div className="control-kpis"><Kpi label="Packages" value={packages.length} icon={<ClipboardCheck/>}/><Kpi label="Submitted" value={packages.filter(p=>p.status==='SUBMITTED').length} icon={<FileCheck2/>}/><Kpi label="Accepted" value={packages.filter(p=>p.status.startsWith('ACCEPTED')).length} icon={<CheckCircle2/>}/><Kpi label="Measurements" value={measurements.length} icon={<BadgeDollarSign/>}/></div>
    <div className="control-grid two"><section className="content-card"><PanelHeader title="Verification packages" action={<button className="button primary" onClick={createPackage} disabled={busy}><Plus size={15}/> New package</button>}/><div className="control-inline-form"><input value={packageNumber} onChange={e=>setPackageNumber(e.target.value.toUpperCase())}/></div><div className="control-list">{packages.map(item=><button key={item.id} className={item.id===packageId?'control-list-row active':'control-list-row'} onClick={()=>setPackageId(item.id)}><ClipboardCheck size={16}/><div><strong>{item.packageNumber}</strong><span>{item.subjectType}</span></div><span className={statusClass(item.status)}>{item.status}</span></button>)}{!packages.length&&<Empty>No verification packages on this scope.</Empty>}</div></section>
      <section className="content-card"><PanelHeader title="Controlled evidence" hint="Evidence must be an immutable project document revision with a content hash and matching primary scope."/><select className="control-wide-select" value={evidenceRevisionId} onChange={e=>setEvidenceRevisionId(e.target.value)}><option value="">Select revision…</option>{revisions.filter(({document})=>!document.primaryScopeId||document.primaryScopeId===scopeId).map(({document,revision})=><option key={revision.id} value={revision.id}>{document.documentNumber} · Rev {revision.revisionCode}</option>)}</select>{bundle?.verificationPackage.status==='DRAFT'&&<button className="button secondary" onClick={addEvidence} disabled={!evidenceRevisionId||busy}>Attach evidence</button>}</section></div>
    {bundle&&<section className="content-card"><PanelHeader title={`${bundle.verificationPackage.packageNumber} · ${bundle.verificationPackage.status}`} hint={bundle.workflowInstanceId?`Workflow ${bundle.workflowInstanceId}`:'Draft has not entered workflow yet.'}/>
      {bundle.verificationPackage.status==='DRAFT'&&<><div className="control-inline-form"><input value={subjectRef} onChange={e=>setSubjectRef(e.target.value)}/><input type="number" value={claimedQuantity} onChange={e=>setClaimedQuantity(e.target.value)}/><input value={unit} onChange={e=>setUnit(e.target.value)}/><button className="button secondary" onClick={addItem} disabled={busy}>Add item</button></div><div className="control-inline-form"><select value={workflowDefinitionId} onChange={e=>setWorkflowDefinitionId(e.target.value)}><option value="">Select VERIFICATION workflow…</option>{verificationDefinitions.map(def=><option key={def.id} value={def.id}>{def.code} v{def.version}</option>)}</select><button className="button primary" onClick={submitPackage} disabled={busy||!workflowDefinitionId||!bundle.items.length||!bundle.evidence.length}>Submit to workflow</button></div>{!verificationDefinitions.length&&<div className="control-warning">No ACTIVE workflow requiring VERIFICATION is configured on this project. Create/bind one in Workflow Designer first.</div>}</>}
      <div className="control-table wide"><div className="control-table-head six"><span>Subject</span><span>Claimed</span><span>Decision</span><span>Accepted</span><span>Rejected</span><span>Action</span></div>{bundle.items.map(item=>{const itemDecision=bundle.decisions.find(d=>d.itemId===item.id);return <div className="control-table-row six" key={item.id}><strong>{item.subjectResourceReference}</strong><span>{item.claimedQuantity?`${number(item.claimedQuantity)} ${item.unit??''}`:item.claimedProgress?`${item.claimedProgress}%`:'statement'}</span><span>{itemDecision?.decision??'—'}</span><span>{number(itemDecision?.acceptedQuantity)}</span><span>{number(itemDecision?.rejectedQuantity)}</span><span>{!itemDecision&&bundle.verificationPackage.status==='SUBMITTED'?<button className="text-button" onClick={()=>decideItem(item.id)}>Record decision</button>:itemDecision&&bundle.verificationPackage.status!=='DRAFT'&&!bundle.measurements.some(m=>m.decisionId===itemDecision.id)?<button className="text-button" onClick={()=>measure(itemDecision.id)}>Measure</button>:'—'}</span></div>})}</div>
      {bundle.verificationPackage.status==='SUBMITTED'&&<div className="control-decision-bar"><select value={decision} onChange={e=>setDecision(e.target.value)}><option>ACCEPTED</option><option>ACCEPTED_WITH_COMMENTS</option><option>PARTIALLY_ACCEPTED</option><option>REJECTED</option><option>RETURNED_FOR_REWORK</option><option>MORE_EVIDENCE_REQUESTED</option></select><input type="number" value={acceptedQty} onChange={e=>setAcceptedQty(e.target.value)} placeholder="Accepted qty"/><input type="number" value={rejectedQty} onChange={e=>setRejectedQty(e.target.value)} placeholder="Rejected qty"/><button className="button primary" onClick={finalizePackage} disabled={busy}>Finalize package decision</button></div>}
      <div className="evidence-chips">{bundle.evidence.map(e=><span key={e.id}><FileCheck2 size={14}/>{e.documentNumber} Rev {e.revisionCode} · {e.evidenceType}</span>)}</div>
    </section>}
    <section className="content-card"><PanelHeader title="Accepted measurement ledger" hint="Measurement keeps submitted, measured, accepted and rejected quantity separate."/><div className="control-inline-form"><label>Measured quantity<input type="number" value={measuredQty} onChange={e=>setMeasuredQty(e.target.value)}/></label></div><div className="control-table wide"><div className="control-table-head six"><span>Subject</span><span>Submitted</span><span>Measured</span><span>Accepted</span><span>Status</span><span>Trace</span></div>{measurements.map(m=><div className="control-table-row six" key={m.id}><strong>{m.subjectResourceReference}</strong><span>{number(m.submittedQuantity)} {m.unit}</span><span>{number(m.measuredQuantity)} {m.unit}</span><span>{number(m.acceptedQuantity)} {m.unit}</span><span className={statusClass(m.status)}>{m.status}</span><button className="text-button" onClick={()=>openTrace(m.id)}><Link2 size={14}/> Trace</button></div>)}</div>{trace&&<VerificationTracePanel trace={trace}/>}</section>
  </div>;
}

export function FinancialScreen({ context }: { context: DemoState }) {
  const [organizationId,setOrganizationId]=useState<Id>(context.contractor.id); const [data,setData]=useState<FinancialDrilldown|null>(null); const [cash,setCash]=useState<CashFlow|null>(null); const [from,setFrom]=useState(monthStart()); const [to,setTo]=useState(sixMonthsAhead()); const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null);
  async function load(){setBusy(true);setError(null);try{const [drill,flow]=await Promise.all([controlApi.financialDrilldown(context.project.id,organizationId),controlApi.cashFlow(context.project.id,organizationId,from,to)]);setData(drill);setCash(flow)}catch(cause){setError(cause instanceof Error?cause.message:String(cause));setData(null);setCash(null)}finally{setBusy(false)}}
  useEffect(()=>{void load();/* eslint-disable-next-line react-hooks/exhaustive-deps */},[context.project.id,organizationId]);
  const totals=useMemo(()=>data?.scopes.reduce((acc,row)=>({actual:acc.actual+row.directLedgerSummary.actual,open:acc.open+row.directLedgerSummary.openCommitment,forecast:acc.forecast+row.directLedgerSummary.remainingForecast,eac:acc.eac+row.directLedgerSummary.eac}),{actual:0,open:0,forecast:0,eac:0}),[data]);
  return <div className="screen-stack" data-testid="screen-financial"><div className="control-title"><div><p>DERIVED READ MODEL</p><h1>Financial & Cash Flow</h1><span>Organization-private internal cost, scope and CBS drilldown, contract perspective and actual/projected cash without double counting.</span></div><button className="button secondary" onClick={load} disabled={busy}><RefreshCw size={15}/> Refresh</button></div><div className="control-toolbar"><label>Organization perspective<select value={organizationId} onChange={e=>setOrganizationId(e.target.value)}>{orgOptions(context).map(org=><option key={org.id} value={org.id}>{org.displayName}</option>)}</select></label><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div><LocalError value={error}/>{data&&<><div className="control-kpis"><Kpi label="Posted actual" value={money(totals?.actual,data.currency)} icon={<Banknote/>}/><Kpi label="Open commitment" value={money(totals?.open,data.currency)} icon={<Coins/>}/><Kpi label="Remaining forecast" value={money(totals?.forecast,data.currency)} icon={<TrendingUp/>}/><Kpi label="Scope EAC" value={money(totals?.eac,data.currency)} icon={<CircleDollarSign/>}/></div>
    <section className="content-card"><PanelHeader title="Scope drilldown" hint={data.aggregationRule}/><div className="control-table wide"><div className="control-table-head six"><span>Scope</span><span>Actual</span><span>Commitment</span><span>Forecast</span><span>Verification</span><span>Measurements</span></div>{data.scopes.map(scope=><div className="control-table-row six" key={scope.scopeId}><strong>{scope.scopeCode} · {scope.scopeName}</strong><span>{money(scope.directLedgerSummary.actual,data.currency)}</span><span>{money(scope.directLedgerSummary.openCommitment,data.currency)}</span><span>{money(scope.directLedgerSummary.remainingForecast,data.currency)}</span><span>{scope.verificationSummary.acceptedPackageCount}/{scope.verificationSummary.packageCount} accepted</span><span>{scope.verificationSummary.measurementCount}</span></div>)}</div></section>
    <div className="control-grid two"><section className="content-card"><PanelHeader title="CBS financial position"/>{data.costStructures.map(structure=><div key={structure.structure.id} className="financial-group"><strong>{structure.structure.code} · {structure.structure.name}</strong>{structure.nodes.map(row=><div className="financial-line" key={row.node.id}><span>{row.node.code} · {row.node.name}</span><b>{money(row.financialSummary.currentBudget,data.currency)}</b><small>EAC {money(row.financialSummary.eac,data.currency)} · VAC {money(row.financialSummary.vac,data.currency)}</small></div>)}</div>)}{!data.costStructures.length&&<Empty>No visible cost structures.</Empty>}</section><section className="content-card"><PanelHeader title="Contract perspective" hint="Contract values remain separate from internal cost totals."/>{data.contracts.map(row=><div className="financial-contract" key={row.contract.id}><div><strong>{row.contract.contractNumber}</strong><span>{row.organizationRelationship} · {row.contract.contractType}</span></div><div><b>{money(row.commercialSummary.currentValue,row.contract.currency)}</b><small>{money(row.commercialSummary.outstandingCertified,row.contract.currency)} outstanding certified</small></div></div>)}{!data.contracts.length&&<Empty>No contract commercial truth visible for this organization.</Empty>}</section></div></>}
    {cash&&<section className="content-card"><PanelHeader title="Monthly cash flow" hint={cash.accountingRule}/><div className="cash-chart">{cash.periods.map(period=>{const max=Math.max(1,...cash.periods.map(item=>Math.max(Math.abs(item.actualCashIn),Math.abs(item.actualCashOut),Math.abs(item.projectedFutureNetCash))));return <div className="cash-month" key={String(period.month)}><div className="cash-bars"><i style={{height:`${Math.max(3,Math.abs(period.actualCashIn)/max*100)}%`}} title={`Cash in ${money(period.actualCashIn,cash.currency)}`}/><i className="out" style={{height:`${Math.max(3,Math.abs(period.actualCashOut)/max*100)}%`}} title={`Cash out ${money(period.actualCashOut,cash.currency)}`}/><i className="future" style={{height:`${Math.max(3,Math.abs(period.projectedFutureNetCash)/max*100)}%`}} title={`Projected ${money(period.projectedFutureNetCash,cash.currency)}`}/></div><strong>{String(period.month)}</strong><small>{money(period.netActualCash,cash.currency)} net</small></div>})}</div><div className="cash-legend"><span><i/> Cash in</span><span><i className="out"/> Cash out</span><span><i className="future"/> Projected future net</span></div></section>}
  </div>;
}

function Kpi({label,value,icon}:{label:string;value:string|number;icon:React.ReactNode}){return <div className="control-kpi"><div>{icon}</div><span>{label}</span><strong>{value}</strong></div>}
function Posting({title,value,onValue,extra,button,disabled,onClick}:{title:string;value:string;onValue:(value:string)=>void;extra?:React.ReactNode;button:string;disabled:boolean;onClick:()=>void}){return <div className="posting-card"><strong>{title}</strong>{extra}<input type="number" value={value} onChange={e=>onValue(e.target.value)}/><button className="button secondary" disabled={disabled} onClick={onClick}>{button}</button></div>}
function TracePanel({trace}:{trace:PaymentTrace}){return <div className="trace-panel"><PanelHeader title={`Payment trace · ${trace.payment.paymentReference}`} hint="Payment → IPC → valuation → contract item → controlled document or accepted verification measurement."/>{trace.lines.map(line=><div className="trace-chain" key={line.applicationLineId}><span>Payment {money(trace.payment.amount,trace.payment.currency)}</span><ChevronRight/><span>{trace.paymentApplication.applicationNumber}</span><ChevronRight/><span>{line.valuation.valuationNumber}</span><ChevronRight/><span>{line.contractItem.itemCode}</span><ChevronRight/><strong>{line.verificationMappingStatus==='ACCEPTED_MEASUREMENT_TYPED_TRACE_COMPLETE'?`Measurement ${line.measurementId?.slice(0,8)}`:line.controlledEvidence?`${line.controlledEvidence.documentNumber} Rev ${line.controlledEvidence.revisionCode}`:'Evidence unavailable'}</strong></div>)}</div>}
function VerificationTracePanel({trace}:{trace:VerificationTrace}){return <div className="trace-panel"><PanelHeader title="Measurement provenance" hint="Accepted quantity is traceable to package, item decision, evidence revision and workflow."/><div className="trace-chain"><span>{trace.measurement.subjectResourceReference}</span><ChevronRight/><span>{trace.verificationPackage.packageNumber}</span><ChevronRight/><span>{trace.decisions.find(d=>d.id===trace.measurement.decisionId)?.decision??'Decision'}</span><ChevronRight/><strong>{trace.evidence[0]?`${trace.evidence[0].documentNumber} Rev ${trace.evidence[0].revisionCode}`:'Evidence'}</strong></div></div>}
