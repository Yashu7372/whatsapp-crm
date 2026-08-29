import { useEffect, useState } from 'react';
import { Banknote, ChevronRight, Coins, FileCheck2, Landmark, Link2, Plus, RefreshCw } from 'lucide-react';
import type { DemoState, DocumentView, Id, RevisionView, Scope } from './api';
import { controlApi, type Contract, type ContractItem, type ContractSummary, type Measurement, type Payment, type PaymentApplication, type PaymentApplicationLine, type PaymentTrace, type Valuation } from './controlApi';
import { Empty, Kpi, LocalError, PanelHeader, loadAllRevisions, money, monthStart, numberValue, scopeName, statusClass, today } from './ControlUi';
import './control-ui.css';

function TracePanel({ trace }: { trace: PaymentTrace }) {
  return <div className="trace-panel"><PanelHeader title={`Payment trace · ${trace.payment.paymentReference}`} hint="Payment → IPC → valuation → contract item → controlled document or accepted verification measurement."/>{trace.lines.map(line => <div className="trace-chain" key={line.applicationLineId}><span>Payment {money(trace.payment.amount, trace.payment.currency)}</span><ChevronRight/><span>{trace.paymentApplication.applicationNumber}</span><ChevronRight/><span>{line.valuation.valuationNumber}</span><ChevronRight/><span>{line.contractItem.itemCode}</span><ChevronRight/><strong>{line.verificationMappingStatus === 'ACCEPTED_MEASUREMENT_TYPED_TRACE_COMPLETE' ? `Measurement ${line.measurementId?.slice(0, 8)}` : line.controlledEvidence ? `${line.controlledEvidence.documentNumber} Rev ${line.controlledEvidence.revisionCode}` : 'Evidence unavailable'}</strong></div>)}</div>;
}

export default function CommercialScreen({ context, scopes, documents }: { context: DemoState; scopes: Scope[]; documents: DocumentView[] }) {
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contractNumber, setContractNumber] = useState('SUBCONTRACT-001');
  const [contractValue, setContractValue] = useState('1000000');
  const [itemCode, setItemCode] = useState('CHW-001');
  const [itemValue, setItemValue] = useState('250000');
  const [valuationMethod, setValuationMethod] = useState('LUMP_SUM');
  const [itemScopeId, setItemScopeId] = useState<Id>(context.mepScope.id);
  const [quantity, setQuantity] = useState('100');
  const [rate, setRate] = useState('1000');
  const [valuationValue, setValuationValue] = useState('50000');
  const [measurementId, setMeasurementId] = useState<Id>('');
  const [revisionId, setRevisionId] = useState<Id>('');
  const [applicationNumber, setApplicationNumber] = useState('IPC-001');
  const [paymentAmount, setPaymentAmount] = useState('10000');

  async function load() {
    setBusy(true); setError(null);
    try {
      const [nextContracts, nextMeasurements, nextRevisions] = await Promise.all([
        controlApi.listContracts(context.project.id), controlApi.listMeasurements(context.project.id), loadAllRevisions(documents),
      ]);
      setContracts(nextContracts); setMeasurements(nextMeasurements); setRevisions(nextRevisions);
      setContractId(current => nextContracts.some(item => item.id === current) ? current : nextContracts[0]?.id ?? '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  async function loadContract(id: Id) {
    if (!id) { setItems([]); setValuations([]); setPayments([]); setSummary(null); setApplication(null); setApplicationLines([]); return; }
    try {
      const [nextItems, nextValuations, nextPayments, nextSummary] = await Promise.all([
        controlApi.listContractItems(context.project.id, id), controlApi.listValuations(context.project.id, id),
        controlApi.listPayments(context.project.id, id), controlApi.contractSummary(context.project.id, id),
      ]);
      setItems(nextItems); setValuations(nextValuations); setPayments(nextPayments); setSummary(nextSummary);
      const cached = localStorage.getItem(`pc-ipc:${context.project.id}:${id}`);
      if (cached) {
        try {
          const app = await controlApi.getPaymentApplication(context.project.id, cached);
          setApplication(app); setApplicationLines(await controlApi.listPaymentApplicationLines(context.project.id, cached));
        } catch { setApplication(null); setApplicationLines([]); }
      } else { setApplication(null); setApplicationLines([]); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [context.project.id]);
  useEffect(() => { void loadContract(contractId); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [contractId]);

  async function work(action: () => Promise<void>) { setBusy(true); setError(null); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); } }

  async function createContract() {
    await work(async () => {
      const created = await controlApi.createContract(context.project.id, {
        payerParticipantId: context.consultantParticipant.id, payeeParticipantId: context.contractorParticipant.id,
        contractNumber, contractType: 'SUBCONTRACT', currency: context.project.currency,
        originalValue: Number(contractValue), visibilityPolicy: 'CONTRACT_SHARED',
      });
      await load(); setContractId(created.id);
    });
  }

  async function createItem() {
    if (!contractId) return;
    await work(async () => {
      await controlApi.createContractItem(context.project.id, contractId, {
        scopeId: itemScopeId, itemCode, description: 'Commercial item from Project Control UI', valuationMethod,
        unit: valuationMethod === 'QUANTITY_RATE' ? 'm' : null,
        plannedQuantity: valuationMethod === 'QUANTITY_RATE' ? Number(quantity) : null,
        rate: valuationMethod === 'QUANTITY_RATE' ? Number(rate) : null,
        contractValue: valuationMethod === 'QUANTITY_RATE' ? Number(quantity) * Number(rate) : Number(itemValue), dueDate: null,
      });
      await loadContract(contractId);
    });
  }

  async function createValuation(item: ContractItem) {
    await work(async () => {
      const quantityBased = item.valuationMethod === 'QUANTITY_RATE';
      await controlApi.createValuation(context.project.id, {
        contractId, contractItemId: item.id, valuationNumber: `VAL-${Date.now().toString().slice(-6)}`,
        sourceType: quantityBased ? null : 'CONTROLLED_DOCUMENT', sourceReference: quantityBased ? null : 'ui://valuation',
        sourceDocumentRevisionId: quantityBased ? null : (revisionId || null), measurementId: quantityBased ? (measurementId || null) : null,
        currentValue: quantityBased ? null : Number(valuationValue), retention: 0, otherDeductions: 0,
      });
      await loadContract(contractId);
    });
  }

  async function createApplication() {
    if (!contractId) return;
    await work(async () => {
      const app = await controlApi.createPaymentApplication(context.project.id, {
        contractId, applicationNumber, periodFrom: monthStart(), periodTo: today(), dueDate: null,
        sourceDocumentRevisionId: revisionId || null,
      });
      localStorage.setItem(`pc-ipc:${context.project.id}:${contractId}`, app.id);
      setApplication(app); setApplicationLines([]);
    });
  }

  async function addAppLine(valuation: Valuation) {
    if (!application) return;
    await work(async () => {
      await controlApi.addPaymentApplicationLine(context.project.id, application.id, { valuationLineId: valuation.id, claimedValue: valuation.eligibleValue });
      setApplication(await controlApi.getPaymentApplication(context.project.id, application.id));
      setApplicationLines(await controlApi.listPaymentApplicationLines(context.project.id, application.id));
    });
  }

  async function submitApplication() {
    if (!application) return;
    await work(async () => setApplication(await controlApi.submitPaymentApplication(context.project.id, application.id, application.version)));
  }

  async function certifyApplication() {
    if (!application) return;
    await work(async () => {
      const lines = applicationLines.map(line => ({ valuationLineId: line.valuationLineId, certifiedValue: line.claimedValue, reason: 'Certified in Project Control UI' }));
      setApplication(await controlApi.certifyPaymentApplication(context.project.id, application.id, application.version, lines));
      setApplicationLines(await controlApi.listPaymentApplicationLines(context.project.id, application.id));
      await loadContract(contractId);
    });
  }

  async function recordPayment() {
    if (!application) return;
    await work(async () => {
      await controlApi.recordPayment(context.project.id, {
        paymentApplicationId: application.id, paymentReference: `PAY-${Date.now().toString().slice(-6)}`,
        amount: Number(paymentAmount), paidAt: new Date().toISOString(), sourceDocumentRevisionId: revisionId || null,
      });
      await loadContract(contractId);
    });
  }

  async function openTrace(paymentId: Id) { await work(async () => setTrace(await controlApi.paymentTrace(context.project.id, paymentId))); }

  return <div className="screen-stack" data-testid="screen-commercial">
    <div className="control-title"><div><p>CONTRACT COMMERCIAL TRUTH</p><h1>Commercial & IPC</h1><span>Contracts, measurable items, valuations, applications, certification, payment and typed evidence trace.</span></div><button className="button secondary" onClick={load} disabled={busy}><RefreshCw size={15}/> Refresh</button></div>
    <LocalError value={error}/>
    <div className="control-kpis"><Kpi label="Contract value" value={money(summary?.currentValue, context.project.currency)} icon={<Landmark/>}/><Kpi label="Valued to date" value={money(summary?.valuedToDate, context.project.currency)} icon={<Coins/>}/><Kpi label="Certified" value={money(summary?.certifiedToDate, context.project.currency)} icon={<FileCheck2/>}/><Kpi label="Outstanding certified" value={money(summary?.outstandingCertified, context.project.currency)} icon={<Banknote/>}/></div>

    <div className="control-grid two">
      <section className="content-card"><PanelHeader title="Contracts" hint="Contract truth is visible only to authorized contract parties and project administration."/><div className="control-inline-form"><input aria-label="Contract number" value={contractNumber} onChange={event => setContractNumber(event.target.value.toUpperCase())}/><input aria-label="Original contract value" type="number" value={contractValue} onChange={event => setContractValue(event.target.value)}/><button className="button primary" disabled={busy} onClick={createContract}><Plus size={15}/> Contract</button></div><div className="control-list">{contracts.map(contract => <button key={contract.id} className={contract.id === contractId ? 'control-list-row active' : 'control-list-row'} onClick={() => setContractId(contract.id)}><Landmark size={16}/><div><strong>{contract.contractNumber}</strong><span>{contract.contractType} · {money(contract.originalValue, contract.currency)}</span></div><span className={statusClass(contract.status)}>{contract.status}</span></button>)}{!contracts.length && <Empty>No visible contracts.</Empty>}</div></section>
      <section className="content-card"><PanelHeader title="Valuation source" hint="Non-quantity valuations use controlled document evidence. Quantity-rate valuations derive value from accepted measurement truth."/><label className="control-field">Controlled revision<select aria-label="Commercial evidence revision" value={revisionId} onChange={event => setRevisionId(event.target.value)}><option value="">Select revision…</option>{revisions.map(({ document, revision }) => <option key={revision.id} value={revision.id}>{document.documentNumber} · Rev {revision.revisionCode}</option>)}</select></label><label className="control-field">Accepted measurement<select aria-label="Commercial accepted measurement" value={measurementId} onChange={event => setMeasurementId(event.target.value)}><option value="">Select measurement…</option>{measurements.filter(measurement => measurement.acceptedQuantity > 0).map(measurement => <option key={measurement.id} value={measurement.id}>{measurement.subjectResourceReference} · {numberValue(measurement.acceptedQuantity)} {measurement.unit}</option>)}</select></label></section>
    </div>

    {contractId && <section className="content-card"><PanelHeader title="Contract items & valuation"/><div className="control-inline-form"><input aria-label="Contract item code" value={itemCode} onChange={event => setItemCode(event.target.value.toUpperCase())}/><select aria-label="Contract item scope" value={itemScopeId} onChange={event => setItemScopeId(event.target.value)}>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select><select aria-label="Valuation method" value={valuationMethod} onChange={event => setValuationMethod(event.target.value)}><option value="LUMP_SUM">Lump sum</option><option value="QUANTITY_RATE">Quantity × rate</option><option value="MILESTONE">Milestone</option><option value="PERCENTAGE">Percentage</option><option value="TIME_BASED">Time based</option><option value="OTHER">Other</option></select>{valuationMethod === 'QUANTITY_RATE' ? <><input aria-label="Planned quantity" type="number" value={quantity} onChange={event => setQuantity(event.target.value)}/><input aria-label="Contract item rate" type="number" value={rate} onChange={event => setRate(event.target.value)}/></> : <input aria-label="Contract item value" type="number" value={itemValue} onChange={event => setItemValue(event.target.value)}/>}<button className="button secondary" onClick={createItem} disabled={busy}><Plus size={15}/> Item</button></div>
      <div className="control-table wide"><div className="control-table-head six"><span>Item</span><span>Scope</span><span>Method</span><span>Quantity</span><span>Value</span><span>Valuation</span></div>{items.map(item => <div className="control-table-row six" key={item.id}><strong>{item.itemCode}</strong><span>{scopeName(scopes, item.scopeId)}</span><span>{item.valuationMethod}</span><span>{item.plannedQuantity ? `${numberValue(item.plannedQuantity)} ${item.unit ?? ''}` : '—'}</span><span>{money(item.contractValue, context.project.currency)}</span><button className="text-button" onClick={() => createValuation(item)} disabled={busy}>{item.valuationMethod === 'QUANTITY_RATE' ? 'Value measurement' : 'Create valuation'}</button></div>)}</div>
      {items.some(item => item.valuationMethod !== 'QUANTITY_RATE') && <div className="control-inline-form"><label>Current valuation<input aria-label="Current valuation value" type="number" value={valuationValue} onChange={event => setValuationValue(event.target.value)}/></label></div>}
    </section>}

    <section className="content-card"><PanelHeader title="Valuations" hint="Quantity-rate valuations preserve the measurement ID that established accepted quantity."/><div className="control-table wide"><div className="control-table-head six"><span>Valuation</span><span>Source</span><span>Accepted qty</span><span>Current</span><span>Cumulative</span><span>Eligible</span></div>{valuations.map(valuation => <div className="control-table-row six" key={valuation.id}><strong>{valuation.valuationNumber}</strong><span>{valuation.measurementId ? 'ACCEPTED_MEASUREMENT' : valuation.sourceType}</span><span>{valuation.acceptedQuantity ? `${numberValue(valuation.acceptedQuantity)} ${valuation.unit ?? ''}` : '—'}</span><span>{money(valuation.currentValue, context.project.currency)}</span><span>{money(valuation.cumulativeValue, context.project.currency)}</span><span>{money(valuation.eligibleValue, context.project.currency)}</span></div>)}</div></section>

    <section className="content-card"><PanelHeader title="IPC / Payment application" hint="The selected application ID is cached only for navigation; lifecycle and amounts remain server-authoritative." action={!application ? <button className="button primary" onClick={createApplication} disabled={busy || !contractId}><Plus size={15}/> New IPC</button> : undefined}/>
      {!application ? <div className="control-inline-form"><input aria-label="IPC application number" value={applicationNumber} onChange={event => setApplicationNumber(event.target.value.toUpperCase())}/></div> : <><div className="control-record"><div><span>{application.applicationNumber}</span><strong>{application.periodFrom ?? '—'} → {application.periodTo ?? '—'}</strong></div><b className={statusClass(application.status)}>{application.status}</b></div>
        {application.status === 'DRAFT' && <div className="control-chip-row">{valuations.filter(valuation => !applicationLines.some(line => line.valuationLineId === valuation.id)).map(valuation => <button key={valuation.id} className="control-chip" onClick={() => addAppLine(valuation)}>+ {valuation.valuationNumber} · {money(valuation.eligibleValue, context.project.currency)}</button>)}</div>}
        <div className="control-table"><div className="control-table-head"><span>Valuation</span><span>Claimed</span><span>Certified</span></div>{applicationLines.map(line => <div className="control-table-row" key={line.id}><span>{valuations.find(valuation => valuation.id === line.valuationLineId)?.valuationNumber ?? line.valuationLineId.slice(0, 8)}</span><span>{money(line.claimedValue, context.project.currency)}</span><span>{money(line.certifiedValue, context.project.currency)}</span></div>)}</div>
        <div className="control-actions">{application.status === 'DRAFT' && <button className="button secondary" onClick={submitApplication} disabled={!applicationLines.length || busy}>Submit IPC</button>}{application.status === 'SUBMITTED' && <button className="button primary" onClick={certifyApplication} disabled={busy}>Certify all lines</button>}{application.status === 'CERTIFIED' && <><input aria-label="Payment amount" type="number" value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)}/><button className="button primary" onClick={recordPayment} disabled={busy}>Record payment</button></>}</div>
      </>}
    </section>

    <section className="content-card"><PanelHeader title="Payments & provenance"/><div className="control-table"><div className="control-table-head"><span>Payment</span><span>Amount</span><span>Trace</span></div>{payments.map(payment => <div className="control-table-row" key={payment.id}><strong>{payment.paymentReference}</strong><span>{money(payment.amount, payment.currency)}</span><button className="text-button" onClick={() => openTrace(payment.id)}><Link2 size={14}/> Trace</button></div>)}</div>{trace && <TracePanel trace={trace}/>}</section>
  </div>;
}
