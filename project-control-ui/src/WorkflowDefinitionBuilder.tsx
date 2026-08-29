import { useEffect, useMemo, useState } from 'react';
import { Copy, Layers3, LockKeyhole, Plus, Save, Trash2 } from 'lucide-react';
import { api, type Id, type Scope, type WorkflowConfigurationOptions } from './api';
import './workflow-builder.css';

export interface WorkflowBuilderStepInput {
  stepCode: string;
  name: string;
  action: string;
  actResponsibilities: string[];
  viewResponsibilities: string[];
}

export interface WorkflowBuilderInput {
  scopeId: Id;
  code: string;
  name: string;
  purposeCode: string;
  capabilityCode: string;
  steps: WorkflowBuilderStepInput[];
}

interface Props {
  disabled: boolean;
  busy: boolean;
  projectName?: string;
  options: WorkflowConfigurationOptions | null;
  onCreate: (input: WorkflowBuilderInput) => Promise<void>;
}

interface DraftStep extends WorkflowBuilderStepInput { key: string }

const key = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function blankStep(sequence: number, action = 'REVIEW'): DraftStep {
  return {
    key: key(),
    stepCode: `STEP_${sequence}`,
    name: `Step ${sequence}`,
    action,
    actResponsibilities: [],
    viewResponsibilities: [],
  };
}

function scopePath(scope: Scope, scopes: Scope[]) {
  const path: string[] = [];
  const visited = new Set<string>();
  let current: Scope | undefined = scope;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.name);
    current = current.parentScopeId
      ? scopes.find(candidate => candidate.id === current?.parentScopeId)
      : undefined;
  }
  return path.join(' / ');
}

export default function WorkflowDefinitionBuilder({ disabled, busy, projectName, options, onCreate }: Props) {
  const projectId = options?.projectId ?? null;
  const initialScopeId = options?.scopeId ?? null;

  const [scopes, setScopes] = useState<Scope[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState<Id | null>(initialScopeId);
  const [contextOptions, setContextOptions] = useState<WorkflowConfigurationOptions | null>(options);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const [code, setCode] = useState('DOC_REVIEW');
  const [name, setName] = useState('Document Review');
  const [purposeCode, setPurposeCode] = useState('DOCUMENT_REVIEW');
  const [capabilityCode, setCapabilityCode] = useState('DOCUMENT_CONTROL');
  const [template, setTemplate] = useState('SIMPLE_REVIEW');
  const [steps, setSteps] = useState<DraftStep[]>([
    { ...blankStep(1, 'SUBMIT'), stepCode: 'SUBMIT', name: 'Submit document' },
    { ...blankStep(2, 'REVIEW'), stepCode: 'REVIEW', name: 'Review document' },
  ]);

  useEffect(() => {
    if (disabled || !projectId) return;
    let cancelled = false;
    setContextLoading(true);
    setContextError(null);
    api.listScopes(projectId)
      .then(items => {
        if (cancelled) return;
        setScopes(items);
        setSelectedScopeId(current => {
          if (current && items.some(scope => scope.id === current)) return current;
          if (initialScopeId && items.some(scope => scope.id === initialScopeId)) return initialScopeId;
          return null;
        });
      })
      .catch(error => {
        if (!cancelled) setContextError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => { if (!cancelled) setContextLoading(false); });
    return () => { cancelled = true; };
  }, [disabled, projectId, initialScopeId]);

  useEffect(() => {
    if (disabled || !projectId || !selectedScopeId) return;
    let cancelled = false;
    setContextLoading(true);
    setContextError(null);
    api.getWorkflowOptions(projectId, selectedScopeId)
      .then(next => {
        if (!cancelled) setContextOptions(next);
      })
      .catch(error => {
        if (!cancelled) {
          setContextOptions(null);
          setContextError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => { if (!cancelled) setContextLoading(false); });
    return () => { cancelled = true; };
  }, [disabled, projectId, selectedScopeId]);

  const responsibilities = useMemo(() => {
    const seen = new Set<string>();
    return (contextOptions?.assignments ?? []).filter(item => {
      if (seen.has(item.responsibilityCode)) return false;
      seen.add(item.responsibilityCode);
      return true;
    });
  }, [contextOptions]);

  const responsibilityCodes = responsibilities.map(item => item.responsibilityCode);
  const actions = contextOptions?.completionActions?.length
    ? contextOptions.completionActions
    : ['SUBMIT', 'VERIFY', 'RECEIVE', 'REVIEW', 'APPROVE', 'ACCEPT', 'COMPLETE'];
  const capabilities = contextOptions?.enabledCapabilities ?? [];
  const selectedScope = scopes.find(scope => scope.id === selectedScopeId) ?? null;

  useEffect(() => {
    if (!capabilities.length) {
      setCapabilityCode('');
      return;
    }
    setCapabilityCode(current => capabilities.includes(current) ? current : capabilities[0]);
  }, [capabilities]);

  function responsibilityLabel(codeValue: string) {
    const item = responsibilities.find(value => value.responsibilityCode === codeValue);
    return item ? `${item.responsibilityCode} · ${item.partyRole} · ${item.accessLevel}` : codeValue;
  }

  function toggleResponsibility(stepKey: string, field: 'actResponsibilities' | 'viewResponsibilities', value: string) {
    setSteps(current => current.map(step => {
      if (step.key !== stepKey) return step;
      const selected = step[field].includes(value);
      return { ...step, [field]: selected ? step[field].filter(item => item !== value) : [...step[field], value] };
    }));
  }

  function updateStep(stepKey: string, patch: Partial<DraftStep>) {
    setSteps(current => current.map(step => step.key === stepKey ? { ...step, ...patch } : step));
  }

  function addStep() {
    setSteps(current => [...current, blankStep(current.length + 1)]);
  }

  function removeStep(stepKey: string) {
    setSteps(current => current.length <= 1 ? current : current.filter(step => step.key !== stepKey));
  }

  function applyTemplate() {
    const allViewers = responsibilityCodes;
    const preferred = (value: string, fallbackIndex: number) =>
      responsibilityCodes.includes(value) ? value : responsibilityCodes[fallbackIndex] ?? '';

    if (template === 'ITR_WORK_VERIFICATION') {
      setCode('ITR_APPROVAL');
      setName('Work Verification / ITR Approval');
      setPurposeCode('WORK_VERIFICATION');
      if (capabilities.includes('INSPECTION')) setCapabilityCode('INSPECTION');
      const definitions = [
        ['SITE_TEAM', 'Site Team Raise', 'SUBMIT', preferred('SITE_TEAM', 0)],
        ['QCE_VERIFY', 'QCE Verification', 'VERIFY', preferred('QCE', 1)],
        ['QC_DC_RECEIVE', 'QC/DC Receiving', 'RECEIVE', preferred('QC_DC', 2)],
        ['CONSULTANT_INSPECT', 'Consultant Inspector Review', 'REVIEW', preferred('CONSULTANT_INSPECTOR', 3)],
        ['RE_FINAL_APPROVAL', 'Consultant RE Final Approval', 'APPROVE', preferred('CONSULTANT_RE', 4)],
      ];
      setSteps(definitions.map(([stepCode, stepName, action, actor]) => ({
        key: key(), stepCode, name: stepName, action,
        actResponsibilities: actor ? [actor] : [],
        viewResponsibilities: allViewers,
      })));
      return;
    }

    if (template === 'THREE_STAGE_APPROVAL') {
      setCode('THREE_STAGE_APPROVAL');
      setName('Three-stage Approval');
      setPurposeCode('APPROVAL');
      setSteps([
        { ...blankStep(1, 'SUBMIT'), stepCode: 'SUBMIT', name: 'Submit', actResponsibilities: responsibilityCodes[0] ? [responsibilityCodes[0]] : [], viewResponsibilities: allViewers },
        { ...blankStep(2, 'REVIEW'), stepCode: 'REVIEW', name: 'Review', actResponsibilities: responsibilityCodes[1] ? [responsibilityCodes[1]] : [], viewResponsibilities: allViewers },
        { ...blankStep(3, 'APPROVE'), stepCode: 'APPROVE', name: 'Final approval', actResponsibilities: responsibilityCodes[2] ? [responsibilityCodes[2]] : [], viewResponsibilities: allViewers },
      ]);
      return;
    }

    setCode('DOC_REVIEW');
    setName('Document Review');
    setPurposeCode('DOCUMENT_REVIEW');
    if (capabilities.includes('DOCUMENT_CONTROL')) setCapabilityCode('DOCUMENT_CONTROL');
    setSteps([
      { ...blankStep(1, 'SUBMIT'), stepCode: 'SUBMIT', name: 'Submit document', actResponsibilities: responsibilityCodes[0] ? [responsibilityCodes[0]] : [], viewResponsibilities: allViewers },
      { ...blankStep(2, 'REVIEW'), stepCode: 'REVIEW', name: 'Review document', actResponsibilities: responsibilityCodes[1] ? [responsibilityCodes[1]] : [], viewResponsibilities: allViewers },
    ]);
  }

  async function create() {
    if (!selectedScopeId) return;
    await onCreate({
      scopeId: selectedScopeId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      purposeCode: purposeCode.trim().toUpperCase(),
      capabilityCode,
      steps: steps.map(({ key: _key, ...step }) => ({
        ...step,
        stepCode: step.stepCode.trim().toUpperCase(),
        name: step.name.trim(),
        action: step.action.trim().toUpperCase(),
      })),
    });
  }

  if (disabled) {
    return <div className="workflow-builder workflow-builder-locked" data-testid="workflow-builder-locked">
      <LockKeyhole size={22}/>
      <div>
        <strong>Workflow design is locked for this account</strong>
        <p>This user may participate in workflows according to scope responsibility, but cannot change process definitions or scope bindings. Workflow configuration currently requires Project Admin.</p>
      </div>
    </div>;
  }

  return <div className="workflow-builder" data-testid="workflow-builder">
    <section className="workflow-context" data-testid="workflow-context">
      <div className="workflow-context-heading">
        <Layers3 size={19}/>
        <div><strong>1. Context & applicability</strong><small>The selected scope is an actual node configured in this project. Binding applies only to this exact scope; child scopes do not inherit it automatically.</small></div>
      </div>
      <div className="workflow-context-grid">
        <label>Project
          <input value={projectName ?? projectId ?? ''} readOnly aria-label="Workflow project"/>
        </label>
        <label>Apply workflow to Project Scope
          <select data-testid="workflow-scope-select" aria-label="Apply workflow to Project Scope" value={selectedScopeId ?? ''} onChange={event => setSelectedScopeId(event.target.value || null)} disabled={busy || contextLoading}>
            <option value="" disabled>Select an actual project scope…</option>
            {scopes.map(scope => <option key={scope.id} value={scope.id}>{scopePath(scope, scopes)} · {scope.scopeType}</option>)}
          </select>
        </label>
      </div>
      {selectedScope && <div className="selected-scope-summary" data-testid="selected-workflow-scope">
        <strong>{scopePath(selectedScope, scopes)}</strong>
        <span>{selectedScope.scopeType} · {selectedScope.code}</span>
      </div>}
      <div className="scope-capabilities" data-testid="workflow-scope-capabilities">
        <span>Enabled capabilities on this exact scope:</span>
        {capabilities.length ? capabilities.map(value => <b key={value}>{value}</b>) : <em>None configured</em>}
      </div>
      {contextLoading && <small>Loading scope configuration…</small>}
      {contextError && <small className="workflow-context-error">{contextError}</small>}
      {selectedScopeId && !capabilities.length && !contextLoading && <small className="workflow-context-warning">This scope cannot receive a workflow until a required capability is enabled on it.</small>}
    </section>

    <div className="workflow-section-label"><strong>2. Process</strong><small>Start blank or use a reusable starter to populate the generic definition.</small></div>
    <div className="workflow-template-row">
      <label>Reusable starter template
        <select value={template} onChange={event => setTemplate(event.target.value)}>
          <option value="SIMPLE_REVIEW">Simple document review</option>
          <option value="THREE_STAGE_APPROVAL">Three-stage approval</option>
          <option value="ITR_WORK_VERIFICATION">ITR / work verification</option>
        </select>
      </label>
      <button type="button" onClick={applyTemplate} disabled={busy || contextLoading || !selectedScopeId}><Copy size={15}/> Apply template</button>
    </div>

    <div className="workflow-definition-grid">
      <label>Workflow code<input value={code} onChange={event => setCode(event.target.value.toUpperCase())}/></label>
      <label>Workflow name<input value={name} onChange={event => setName(event.target.value)}/></label>
      <label>Purpose code<input value={purposeCode} onChange={event => setPurposeCode(event.target.value.toUpperCase())}/></label>
      <label>Required scope capability
        <select data-testid="workflow-required-capability" value={capabilityCode} onChange={event => setCapabilityCode(event.target.value)} disabled={!capabilities.length}>
          {!capabilities.length && <option value="">No enabled capability</option>}
          {capabilities.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>

    <div className="workflow-section-label"><strong>3. Steps</strong><small>Actions and visibility use responsibilities actually assigned within the selected scope.</small></div>
    <div className="workflow-step-builder">
      {steps.map((step, index) => <div className="workflow-draft-step" key={step.key} data-testid={`workflow-draft-step-${index + 1}`}>
        <div className="workflow-draft-step-number">{index + 1}</div>
        <div className="workflow-draft-step-body">
          <div className="workflow-step-heading">
            <strong>Step {index + 1}</strong>
            <button type="button" className="icon-button" disabled={busy || steps.length === 1} onClick={() => removeStep(step.key)} title="Remove step"><Trash2 size={14}/></button>
          </div>
          <div className="workflow-definition-grid three">
            <label>Step code<input value={step.stepCode} onChange={event => updateStep(step.key, { stepCode: event.target.value.toUpperCase() })}/></label>
            <label>Step name<input value={step.name} onChange={event => updateStep(step.key, { name: event.target.value })}/></label>
            <label>Completion action
              <select value={step.action} onChange={event => updateStep(step.key, { action: event.target.value })}>
                {actions.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <AssignmentSelector
            title="Can act on this step"
            hint="No selection means any actor who already has WORKFLOW ACT permission."
            selected={step.actResponsibilities}
            responsibilities={responsibilityCodes}
            label={responsibilityLabel}
            onToggle={value => toggleResponsibility(step.key, 'actResponsibilities', value)}
          />
          <AssignmentSelector
            title="Can view while this step is active"
            hint="No selection means any user who can view this scope."
            selected={step.viewResponsibilities}
            responsibilities={responsibilityCodes}
            label={responsibilityLabel}
            onToggle={value => toggleResponsibility(step.key, 'viewResponsibilities', value)}
          />
        </div>
      </div>)}
      <button type="button" className="add-workflow-step" onClick={addStep} disabled={busy || !selectedScopeId}><Plus size={16}/> Add next step</button>
    </div>

    <div className="workflow-builder-footer">
      <small>{selectedScope ? `This creates a reusable project definition and an explicit binding to ${scopePath(selectedScope, scopes)} only.` : 'Select a project scope before creating the workflow.'}</small>
      <button className="primary" type="button" disabled={busy || contextLoading || !selectedScopeId || !code.trim() || !name.trim() || !capabilityCode || steps.some(step => !step.stepCode.trim() || !step.name.trim() || !step.action)} onClick={create}><Save size={15}/> Create, activate & bind</button>
    </div>
  </div>;
}

function AssignmentSelector({ title, hint, selected, responsibilities, label, onToggle }: {
  title: string;
  hint: string;
  selected: string[];
  responsibilities: string[];
  label: (value: string) => string;
  onToggle: (value: string) => void;
}) {
  return <div className="assignment-selector">
    <div><strong>{title}</strong><small>{hint}</small></div>
    <div className="assignment-options">
      {responsibilities.length === 0 && <span className="assignment-empty">No active responsibilities are assigned to this exact project scope.</span>}
      {responsibilities.map(value => <button type="button" key={value} className={selected.includes(value) ? 'assignment-chip selected' : 'assignment-chip'} onClick={() => onToggle(value)} aria-pressed={selected.includes(value)}>{label(value)}</button>)}
    </div>
  </div>;
}
