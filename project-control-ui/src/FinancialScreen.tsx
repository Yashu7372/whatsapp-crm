import { useEffect, useMemo, useState } from 'react';
import { Banknote, CircleDollarSign, Coins, RefreshCw, TrendingUp } from 'lucide-react';
import type { DemoState, Id } from './api';
import { controlApi, type CashFlow, type FinancialDrilldown } from './controlApi';
import { Empty, Kpi, LocalError, PanelHeader, money, monthStart, orgOptions, sixMonthsAhead } from './ControlUi';
import './control-ui.css';

export default function FinancialScreen({ context }: { context: DemoState }) {
  const [organizationId, setOrganizationId] = useState<Id>(context.contractor.id);
  const [data, setData] = useState<FinancialDrilldown | null>(null);
  const [cash, setCash] = useState<CashFlow | null>(null);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(sixMonthsAhead());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true); setError(null);
    try {
      const [drilldown, flow] = await Promise.all([
        controlApi.financialDrilldown(context.project.id, organizationId),
        controlApi.cashFlow(context.project.id, organizationId, from, to),
      ]);
      setData(drilldown); setCash(flow);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause)); setData(null); setCash(null);
    } finally { setBusy(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [context.project.id, organizationId]);

  const totals = useMemo(() => data?.scopes.reduce((accumulator, row) => ({
    actual: accumulator.actual + row.directLedgerSummary.actual,
    open: accumulator.open + row.directLedgerSummary.openCommitment,
    forecast: accumulator.forecast + row.directLedgerSummary.remainingForecast,
    eac: accumulator.eac + row.directLedgerSummary.eac,
  }), { actual: 0, open: 0, forecast: 0, eac: 0 }), [data]);

  return <div className="screen-stack" data-testid="screen-financial">
    <div className="control-title"><div><p>DERIVED READ MODEL</p><h1>Financial & Cash Flow</h1><span>Organization-private internal cost, Scope and CBS drilldown, contract perspective and actual/projected cash without double counting.</span></div><button className="button secondary" onClick={load} disabled={busy}><RefreshCw size={15}/> Refresh</button></div>
    <div className="control-toolbar"><label>Organization perspective<select aria-label="Financial organization perspective" value={organizationId} onChange={event => setOrganizationId(event.target.value)}>{orgOptions(context).map(org => <option key={org.id} value={org.id}>{org.displayName}</option>)}</select></label><label>From<input aria-label="Cash flow from" type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>To<input aria-label="Cash flow to" type="date" value={to} onChange={event => setTo(event.target.value)}/></label><button className="button secondary" onClick={load} disabled={busy}>Apply period</button></div>
    <LocalError value={error}/>

    {data && <>
      <div className="control-kpis"><Kpi label="Posted actual" value={money(totals?.actual, data.currency)} icon={<Banknote/>}/><Kpi label="Open commitment" value={money(totals?.open, data.currency)} icon={<Coins/>}/><Kpi label="Remaining forecast" value={money(totals?.forecast, data.currency)} icon={<TrendingUp/>}/><Kpi label="Scope EAC" value={money(totals?.eac, data.currency)} icon={<CircleDollarSign/>}/></div>

      <section className="content-card"><PanelHeader title="Scope drilldown" hint={data.aggregationRule}/><div className="control-table wide"><div className="control-table-head six"><span>Scope</span><span>Actual</span><span>Commitment</span><span>Forecast</span><span>Verification</span><span>Measurements</span></div>{data.scopes.map(scope => <div className="control-table-row six" key={scope.scopeId}><strong>{scope.scopeCode} · {scope.scopeName}</strong><span>{money(scope.directLedgerSummary.actual, data.currency)}</span><span>{money(scope.directLedgerSummary.openCommitment, data.currency)}</span><span>{money(scope.directLedgerSummary.remainingForecast, data.currency)}</span><span>{scope.verificationSummary.acceptedPackageCount}/{scope.verificationSummary.packageCount} accepted</span><span>{scope.verificationSummary.measurementCount}</span></div>)}</div></section>

      <div className="control-grid two">
        <section className="content-card"><PanelHeader title="CBS financial position" hint="Budget/current exposure is read from CBS; Scope stays a separate operational dimension."/>{data.costStructures.map(structure => <div key={structure.structure.id} className="financial-group"><strong>{structure.structure.code} · {structure.structure.name}</strong>{structure.nodes.map(row => <div className="financial-line" key={row.node.id}><span>{row.node.code} · {row.node.name}</span><b>{money(row.financialSummary.currentBudget, data.currency)}</b><small>EAC {money(row.financialSummary.eac, data.currency)} · VAC {money(row.financialSummary.vac, data.currency)}</small></div>)}</div>)}{!data.costStructures.length && <Empty>No visible cost structures.</Empty>}</section>
        <section className="content-card"><PanelHeader title="Contract perspective" hint="Contract values remain commercial truth and are not added into internal cost totals."/>{data.contracts.map(row => <div className="financial-contract" key={row.contract.id}><div><strong>{row.contract.contractNumber}</strong><span>{row.organizationRelationship} · {row.contract.contractType}</span></div><div><b>{money(row.commercialSummary.currentValue, row.contract.currency)}</b><small>{money(row.commercialSummary.outstandingCertified, row.contract.currency)} outstanding certified</small></div></div>)}{!data.contracts.length && <Empty>No contract commercial truth visible for this organization.</Empty>}</section>
      </div>
    </>}

    {cash && <section className="content-card"><PanelHeader title="Monthly cash flow" hint={cash.accountingRule}/><div className="cash-chart">{cash.periods.map(period => {
      const max = Math.max(1, ...cash.periods.map(item => Math.max(Math.abs(item.actualCashIn), Math.abs(item.actualCashOut), Math.abs(item.projectedFutureNetCash))));
      return <div className="cash-month" key={String(period.month)}><div className="cash-bars"><i style={{ height: `${Math.max(3, Math.abs(period.actualCashIn) / max * 100)}%` }} title={`Cash in ${money(period.actualCashIn, cash.currency)}`}/><i className="out" style={{ height: `${Math.max(3, Math.abs(period.actualCashOut) / max * 100)}%` }} title={`Cash out ${money(period.actualCashOut, cash.currency)}`}/><i className="future" style={{ height: `${Math.max(3, Math.abs(period.projectedFutureNetCash) / max * 100)}%` }} title={`Projected ${money(period.projectedFutureNetCash, cash.currency)}`}/></div><strong>{String(period.month)}</strong><small>{money(period.netActualCash, cash.currency)} net</small></div>;
    })}</div><div className="cash-legend"><span><i/> Cash in</span><span><i className="out"/> Cash out</span><span><i className="future"/> Projected future net</span></div></section>}
  </div>;
}
