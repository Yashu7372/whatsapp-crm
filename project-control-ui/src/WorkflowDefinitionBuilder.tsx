import { useMemo, useState } from 'react';
import { Copy, LockKeyhole, Plus, Save, Trash2 } from 'lucide-react';
import type { WorkflowConfigurationOptions } from './api';
import './workflow-builder.css';

export interface WorkflowBuilderStepInput {
  stepCode: string;
  name: string;
  action: string;
  actResponsibilities: string[];
  viewResponsibilities: string[];
}

export interface WorkflowBuilderInput {
  code: string;
  name: string;
  purposeCode: string;
  capabilityCode: string;
  steps: WorkflowBuilderStepInput[];
}

interface Props {
  disabled: boolean;
  busy: boolean;
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

export default function WorkflowDefinitionBuilder({ disabled, busy, options, onCreate }: Props) {
  const [code, setCode] = useState('DOC_REVIEW');
  const [name, setName] = useState('Document Review');
  const [purposeCode, setPurposeCode] = useState('DOCUMENT_REVIEW');
  const [capabilityCode, setCapabilityCode] = useState('DOCUMENT_CONTROL');
  const [template, setTemplate] = useState('SIMPLE_REVIEW');
  const [steps, setSteps] = useState<DraftStep[]>([
    { ...blankStep(1, 'SUBMIT'), stepCode: 'SUBMIT', name: 'Submit document' },
    { ...blankStep(2, 'REVIEW'), stepCode: 'REVIEW', name: 'Review document' },
  ]);

  const responsibilities = useMemo(() => {
    const seen = new Set<string>();
    return (options?.assignments ?? []).filter(item => {
      if (seen.has(item.responsibilityCode)) return false;
      seen.add(item.responsibilityCode);
      return true;
    });
  }, [options]);

  const responsibilityCodes = responsibilities.map(item => item.responsibilityCode);
  const actions = options?.completionActions?.length
    ? options.completionActions
    : ['SUBMIT', 'VERIFY', 'RECEIVE', 'REVIEW', 'APPROVE', 'ACCEPT', 'COMPLETE'];
  const capabilities = options?.enabledCapabilities ?? [];

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
    await onCreate({
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
        <p>This user may participate in workflows according to scope responsibility, but cannot change the process definition. Workflow configuration currently requires Project Admin.</p>
      </div>
    </div>;
  }

  return <div className="workflow-builder" data-testid="workflow-builder">
    <div className="workflow-template-row">
      <label>Reusable starter template
        <select value={template} onChange={event => setTemplate(event.target.value)}>
          <option value="SIMPLE_REVIEW">Simple document review</option>
          <option value="THREE_STAGE_APPROVAL">Three-stage approval</option>
          <option value="ITR_WORK_VERIFICATION">ITR / work verification</option>
        </select>
      </label>
      <button type="button" onClick={applyTemplate} disabled={busy}><Copy size={15}/> Apply template</button>
    </div>

    <div className="workflow-definition-grid">
      <label>Workflow code<input value={code} onChange={event => setCode(event.target.value.toUpperCase())}/></label>
      <label>Workflow name<input value={name} onChange={event => setName(event.target.value)}/></label>
      <label>Purpose code<input value={purposeCode} onChange={event => setPurposeCode(event.target.value.toUpperCase())}/></label>
      <label>Required scope capability
        <select value={capabilityCode} onChange={event => setCapabilityCode(event.target.value)}>
          {capabilities.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>

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
      <button type="button" className="add-workflow-step" onClick={addStep} disabled={busy}><Plus size={16}/> Add next step</button>
    </div>

    <div className="workflow-builder-footer">
      <small>Definitions are reusable project configuration. Creating here activates the definition and binds it to the current scope; no ITR-specific backend entity is created.</small>
      <button className="primary" type="button" disabled={busy || !code.trim() || !name.trim() || !capabilityCode || steps.some(step => !step.stepCode.trim() || !step.name.trim() || !step.action)} onClick={create}><Save size={15}/> Create, activate & bind</button>
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
      {responsibilities.length === 0 && <span className="assignment-empty">No active scope responsibilities found.</span>}
      {responsibilities.map(value => <button type="button" key={value} className={selected.includes(value) ? 'assignment-chip selected' : 'assignment-chip'} onClick={() => onToggle(value)} aria-pressed={selected.includes(value)}>{label(value)}</button>)}
    </div>
  </div>;
}
