import { useEffect, useState } from 'react';
import { BadgeDollarSign, CheckCircle2, ChevronRight, ClipboardCheck, FileCheck2, Link2, Plus, RefreshCw } from 'lucide-react';
import type { DemoState, DocumentView, Id, RevisionView, Scope, WorkflowDefinition } from './api';
import { controlApi, type Measurement, type VerificationBundle, type VerificationPackage, type VerificationTrace } from './controlApi';
import { Empty, Kpi, LocalError, PanelHeader, loadAllRevisions, monthStart, numberValue, statusClass, today } from './ControlUi';
import './control-ui.css';

function TracePanel({ trace }: { trace: VerificationTrace }) {
  const decision = trace.decisions.find(item => item.id === trace.measurement.decisionId);
  return <div className="trace-panel"><PanelHeader title="Measurement provenance" hint="Accepted quantity is traceable to package, item decision, controlled evidence and workflow."/><div className="trace-chain"><span>{trace.measurement.subjectResourceReference}</span><ChevronRight/><span>{trace.verificationPackage.packageNumber}</span><ChevronRight/><span>{decision?.decision ?? 'Decision'}</span><ChevronRight/><strong>{trace.evidence[0] ? `${trace.evidence[0].documentNumber} Rev ${trace.evidence[0].revisionCode}` : 'Evidence'}</strong></div></div>;
}

export default function VerificationScreen({ context, scopes, documents, definitions }: {
  context: DemoState; scopes: Scope[]; documents: DocumentView[]; definitions: WorkflowDefinition[];
}) {
  const [scopeId, setScopeId] = useState<Id>(context.mepScope.id);
  const [packages, setPackages] = useState<VerificationPackage[]>([]);
  const [packageId, setPackageId] = useState<Id>('');
  const [bundle, setBundle] = useState<VerificationBundle | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [trace, setTrace] = useState<VerificationTrace | null>(null);
  const [revisions, setRevisions] = useState<Array<{ document: DocumentView; revision: RevisionView }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [packageNumber, setPackageNumber] = useState('VER-001');
  const [subjectRef, setSubjectRef] = useState('WORK://MEP/CHW/ZONE-B');
  const [claimedQuantity, setClaimedQuantity] = useState('100');
  const [unit, setUnit] = useState('m');
  const [evidenceRevisionId, setEvidenceRevisionId] = useState<Id>('');
  const [workflowDefinitionId, setWorkflowDefinitionId] = useState<Id>('');
  const [decision, setDecision] = useState('ACCEPTED');
  const [acceptedQty, setAcceptedQty] = useState('100');
  const [rejectedQty, setRejectedQty] = useState('0');
  const [measuredQty, setMeasuredQty] = useState('100');

  const verificationDefinitions = definitions.filter(definition => definition.status === 'ACTIVE' && definition.requiredCapabilityCode === 'VERIFICATION');

  async function load() {
    setBusy(true); setError(null);
    try {
      const [nextPackages, nextMeasurements, nextRevisions] = await Promise.all([
        controlApi.listVerificationPackages(context.project.id, scopeId),
        controlApi.listMeasurements(context.project.id, scopeId),
        loadAllRevisions(documents),
      ]);
      setPackages(nextPackages); setMeasurements(nextMeasurements); setRevisions(nextRevisions);
      const nextId = nextPackages.some(item => item.id === packageId) ? packageId : nextPackages[0]?.id ?? '';
      setPackageId(nextId);
      setBundle(nextId ? await controlApi.getVerificationPackage(context.project.id, nextId) : null);
      setWorkflowDefinitionId(current => verificationDefinitions.some(definition => definition.id === current) ? current : verificationDefinitions[0]?.id ?? '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [context.project.id, scopeId]);
  useEffect(() => {
    if (!packageId) { setBundle(null); return; }
    controlApi.getVerificationPackage(context.project.id, packageId).then(setBundle).catch(cause => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [context.project.id, packageId]);

  async function work(action: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await action(); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  async function createPackage() {
    await work(async () => {
      const created = await controlApi.createVerificationPackage(context.project.id, {
        scopeId, packageNumber, subjectType: 'WORK_VERIFICATION', submittingOrganizationId: context.contractor.id, parentPackageId: null,
      });
      setPackageId(created.id);
    });
  }

  async function addItem() {
    if (!bundle) return;
    await work(async () => {
      await controlApi.addVerificationItem(context.project.id, bundle.verificationPackage.id, {
        version: bundle.verificationPackage.version, subjectResourceReference: subjectRef, claimedProgress: null,
        claimedQuantity: Number(claimedQuantity), unit, completionStatement: null,
      });
    });
  }

  async function addEvidence() {
    if (!bundle || !evidenceRevisionId) return;
    await work(async () => {
      await controlApi.addVerificationEvidence(context.project.id, bundle.verificationPackage.id, {
        version: bundle.verificationPackage.version, documentRevisionId: evidenceRevisionId,
        evidenceType: 'CONTROLLED_DOCUMENT', visibilityScope: 'PROJECT', required: true,
      });
    });
  }

  async function submitPackage() {
    if (!bundle || !workflowDefinitionId) return;
    await work(async () => controlApi.submitVerificationPackage(
      context.project.id, bundle.verificationPackage.id, bundle.verificationPackage.version, workflowDefinitionId,
    ).then(() => undefined));
  }

  function decisionQuantities(outcome: string) {
    if (['ACCEPTED', 'ACCEPTED_WITH_COMMENTS'].includes(outcome)) return { acceptedQuantity: Number(claimedQuantity), rejectedQuantity: 0 };
    if (outcome === 'REJECTED') return { acceptedQuantity: 0, rejectedQuantity: Number(claimedQuantity) };
    if (outcome === 'PARTIALLY_ACCEPTED') return { acceptedQuantity: Number(acceptedQty), rejectedQuantity: Number(rejectedQty) };
    return { acceptedQuantity: null, rejectedQuantity: null };
  }

  async function decideItem(itemId: Id) {
    if (!bundle) return;
    const quantities = decisionQuantities(decision);
    await work(async () => controlApi.decideVerification(context.project.id, bundle.verificationPackage.id, {
      version: bundle.verificationPackage.version, itemId, actorOrganizationId: context.consultant.id, decision,
      ...quantities, unit: quantities.acceptedQuantity === null ? null : unit, comments: 'Decision from Project Control UI',
    }).then(() => undefined));
  }

  async function finalizePackage() {
    if (!bundle) return;
    await work(async () => controlApi.decideVerification(context.project.id, bundle.verificationPackage.id, {
      version: bundle.verificationPackage.version, itemId: null, actorOrganizationId: context.consultant.id,
      decision, acceptedQuantity: null, rejectedQuantity: null, unit: null, comments: 'Package decision from Project Control UI',
    }).then(() => undefined));
  }

  async function measure(decisionId: Id) {
    if (!bundle) return;
    await work(async () => controlApi.createMeasurement(context.project.id, bundle.verificationPackage.id, {
      decisionId, measuredQuantity: Number(measuredQty), periodFrom: monthStart(), periodTo: today(),
    }).then(() => undefined));
  }

  async function openTrace(measurementId: Id) {
    setBusy(true); setError(null);
    try { setTrace(await controlApi.measurementTrace(context.project.id, measurementId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  return <div className="screen-stack" data-testid="screen-verification">
    <div className="control-title"><div><p>VERIFICATION → MEASUREMENT → VALUATION</p><h1>Verification & Measurement</h1><span>Controlled evidence establishes accepted/rejected work truth. Accepted quantity is a typed source for quantity-rate valuation.</span></div><button className="button secondary" onClick={load} disabled={busy}><RefreshCw size={15}/> Refresh</button></div>
    <LocalError value={error}/>
    <div className="control-toolbar"><label>Project scope<select aria-label="Verification project scope" value={scopeId} onChange={event => setScopeId(event.target.value)}>{scopes.map(scope => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select></label><span>Scope must have VERIFICATION capability. Measurement additionally requires QUANTITY_MEASUREMENT.</span></div>

    <div className="control-kpis"><Kpi label="Packages" value={packages.length} icon={<ClipboardCheck/>}/><Kpi label="Submitted" value={packages.filter(item => item.status === 'SUBMITTED').length} icon={<FileCheck2/>}/><Kpi label="Accepted" value={packages.filter(item => item.status.startsWith('ACCEPTED')).length} icon={<CheckCircle2/>}/><Kpi label="Measurements" value={measurements.length} icon={<BadgeDollarSign/>}/></div>

    <div className="control-grid two">
      <section className="content-card"><PanelHeader title="Verification packages" action={<button className="button primary" onClick={createPackage} disabled={busy}><Plus size={15}/> New package</button>}/><div className="control-inline-form"><input aria-label="Verification package number" value={packageNumber} onChange={event => setPackageNumber(event.target.value.toUpperCase())}/></div><div className="control-list">{packages.map(item => <button key={item.id} className={item.id === packageId ? 'control-list-row active' : 'control-list-row'} onClick={() => setPackageId(item.id)}><ClipboardCheck size={16}/><div><strong>{item.packageNumber}</strong><span>{item.subjectType}</span></div><span className={statusClass(item.status)}>{item.status}</span></button>)}{!packages.length && <Empty>No verification packages on this scope.</Empty>}</div></section>
      <section className="content-card"><PanelHeader title="Controlled evidence" hint="Evidence must be an immutable document revision with a content hash and matching primary scope."/><select className="control-wide-select" aria-label="Verification evidence revision" value={evidenceRevisionId} onChange={event => setEvidenceRevisionId(event.target.value)}><option value="">Select revision…</option>{revisions.filter(({ document }) => !document.primaryScopeId || document.primaryScopeId === scopeId).map(({ document, revision }) => <option key={revision.id} value={revision.id}>{document.documentNumber} · Rev {revision.revisionCode}</option>)}</select>{bundle?.verificationPackage.status === 'DRAFT' && <button className="button secondary" onClick={addEvidence} disabled={!evidenceRevisionId || busy}>Attach evidence</button>}</section>
    </div>

    {bundle && <section className="content-card"><PanelHeader title={`${bundle.verificationPackage.packageNumber} · ${bundle.verificationPackage.status}`} hint={bundle.workflowInstanceId ? `Workflow ${bundle.workflowInstanceId}` : 'Draft has not entered workflow yet.'}/>
      {bundle.verificationPackage.status === 'DRAFT' && <><div className="control-inline-form"><input aria-label="Verification subject reference" value={subjectRef} onChange={event => setSubjectRef(event.target.value)}/><input aria-label="Claimed quantity" type="number" value={claimedQuantity} onChange={event => setClaimedQuantity(event.target.value)}/><input aria-label="Claimed quantity unit" value={unit} onChange={event => setUnit(event.target.value)}/><button className="button secondary" onClick={addItem} disabled={busy}>Add item</button></div><div className="control-inline-form"><select aria-label="Verification workflow" value={workflowDefinitionId} onChange={event => setWorkflowDefinitionId(event.target.value)}><option value="">Select VERIFICATION workflow…</option>{verificationDefinitions.map(definition => <option key={definition.id} value={definition.id}>{definition.code} v{definition.version}</option>)}</select><button className="button primary" onClick={submitPackage} disabled={busy || !workflowDefinitionId || !bundle.items.length || !bundle.evidence.length}>Submit to workflow</button></div>{!verificationDefinitions.length && <div className="control-warning">No ACTIVE workflow requiring VERIFICATION exists. Create and bind one in Workflow Designer first.</div>}</>}

      <div className="control-table wide"><div className="control-table-head six"><span>Subject</span><span>Claimed</span><span>Decision</span><span>Accepted</span><span>Rejected</span><span>Action</span></div>{bundle.items.map(item => {
        const itemDecision = bundle.decisions.find(current => current.itemId === item.id);
        const measured = itemDecision && bundle.measurements.some(measurement => measurement.decisionId === itemDecision.id);
        return <div className="control-table-row six" key={item.id}><strong>{item.subjectResourceReference}</strong><span>{item.claimedQuantity != null ? `${numberValue(item.claimedQuantity)} ${item.unit ?? ''}` : item.claimedProgress != null ? `${item.claimedProgress}%` : 'statement'}</span><span>{itemDecision?.decision ?? '—'}</span><span>{numberValue(itemDecision?.acceptedQuantity)}</span><span>{numberValue(itemDecision?.rejectedQuantity)}</span><span>{!itemDecision && bundle.verificationPackage.status === 'SUBMITTED' ? <button className="text-button" onClick={() => decideItem(item.id)}>Record decision</button> : itemDecision && !measured && bundle.verificationPackage.status !== 'DRAFT' ? <button className="text-button" onClick={() => measure(itemDecision.id)}>Measure</button> : '—'}</span></div>;
      })}</div>

      {bundle.verificationPackage.status === 'SUBMITTED' && <div className="control-decision-bar"><select aria-label="Verification decision" value={decision} onChange={event => setDecision(event.target.value)}><option>ACCEPTED</option><option>ACCEPTED_WITH_COMMENTS</option><option>PARTIALLY_ACCEPTED</option><option>REJECTED</option><option>RETURNED_FOR_REWORK</option><option>MORE_EVIDENCE_REQUESTED</option></select><input aria-label="Accepted quantity" type="number" value={acceptedQty} onChange={event => setAcceptedQty(event.target.value)}/><input aria-label="Rejected quantity" type="number" value={rejectedQty} onChange={event => setRejectedQty(event.target.value)}/><button className="button primary" onClick={finalizePackage} disabled={busy}>Finalize package decision</button></div>}
      <div className="evidence-chips">{bundle.evidence.map(evidence => <span key={evidence.id}><FileCheck2 size={14}/>{evidence.documentNumber} Rev {evidence.revisionCode} · {evidence.evidenceType}</span>)}</div>
    </section>}

    <section className="content-card"><PanelHeader title="Accepted measurement ledger" hint="Submitted, measured, accepted and rejected quantities remain separately traceable."/><div className="control-inline-form"><label>Measured quantity<input aria-label="Measured quantity" type="number" value={measuredQty} onChange={event => setMeasuredQty(event.target.value)}/></label></div><div className="control-table wide"><div className="control-table-head six"><span>Subject</span><span>Submitted</span><span>Measured</span><span>Accepted</span><span>Status</span><span>Trace</span></div>{measurements.map(measurement => <div className="control-table-row six" key={measurement.id}><strong>{measurement.subjectResourceReference}</strong><span>{numberValue(measurement.submittedQuantity)} {measurement.unit}</span><span>{numberValue(measurement.measuredQuantity)} {measurement.unit}</span><span>{numberValue(measurement.acceptedQuantity)} {measurement.unit}</span><span className={statusClass(measurement.status)}>{measurement.status}</span><button className="text-button" onClick={() => openTrace(measurement.id)}><Link2 size={14}/> Trace</button></div>)}</div>{trace && <TracePanel trace={trace}/>}</section>
  </div>;
}
