import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { DemoState, DocumentView, Id, RevisionView, Scope } from './api';
import { api } from './api';

export const money = (value: number | null | undefined, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value ?? 0);
export const numberValue = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-AE', { maximumFractionDigits: 4 }).format(value ?? 0);
export const today = () => new Date().toISOString().slice(0, 10);
export const monthStart = () => `${today().slice(0, 7)}-01`;
export const sixMonthsAhead = () => { const date = new Date(); date.setMonth(date.getMonth() + 6); return date.toISOString().slice(0, 10); };
export const scopeName = (scopes: Scope[], scopeId?: Id | null) => scopes.find(scope => scope.id === scopeId)?.name ?? '—';
export const orgOptions = (context: DemoState) => [context.contractor, context.consultant];

export function statusClass(value?: string | null) {
  const normalized = (value ?? '').toUpperCase();
  if (['APPROVED','ACCEPTED','CERTIFIED','PAID','ACTIVE','COMPLETED','ALLOW'].includes(normalized)) return 'control-status good';
  if (['REJECTED','BLOCK','CANCELLED','VOID'].includes(normalized)) return 'control-status bad';
  if (['SUBMITTED','PARTIALLY_ACCEPTED','ACCEPTED_WITH_COMMENTS','DRAFT'].includes(normalized)) return 'control-status warn';
  return 'control-status neutral';
}

export function PanelHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return <div className="control-panel-head"><div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>{action}</div>;
}
export function LocalError({ value }: { value: string | null }) {
  return value ? <div className="control-error"><ShieldAlert size={16}/><span>{value}</span></div> : null;
}
export function Empty({ children }: { children: ReactNode }) { return <div className="control-empty">{children}</div>; }
export function Kpi({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return <div className="control-kpi"><div>{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}
export async function loadAllRevisions(documents: DocumentView[]): Promise<Array<{ document: DocumentView; revision: RevisionView }>> {
  const groups = await Promise.all(documents.map(async document => ({ document, revisions: await api.listRevisions(document.id) })));
  return groups.flatMap(group => group.revisions.map(revision => ({ document: group.document, revision })));
}
