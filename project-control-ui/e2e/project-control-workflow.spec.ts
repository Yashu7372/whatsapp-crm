import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'Project123!';

async function quickLogin(page: Page, email: string) {
  const button = page.locator('button').filter({ hasText: email }).first();
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('.session-pill')).toContainText(email);
}

async function expectPermission(page: Page, action: string, allowed: boolean) {
  const permission = page.getByTestId(`permission-${action}`);
  await expect(permission).toBeVisible();
  await expect(permission).toHaveClass(new RegExp(allowed ? 'allow' : 'deny'));
  await expect(permission).toContainText(allowed ? '✓' : '×');
}

async function expectCurrentStep(page: Page, name: string) {
  await expect(page.locator('.action-box strong')).toHaveText(name);
}

async function completeStep(page: Page) {
  const button = page.getByRole('button', { name: /Complete step/i });
  await expect(button).toBeEnabled();
  await button.click();
}

test('authenticated workflow permissions, exact scope applicability and visual builder', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  await page.getByLabel('Email').fill('admin@local.demo');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /^Sign in$/ }).click();
  await expect(page.locator('.session-pill')).toContainText('admin@local.demo');

  await page.getByRole('button', { name: /Create fresh demo/i }).click();
  await expect(page.locator('.session-pill')).toContainText('site@local.demo');
  await expect(page.locator('.status')).toContainText('Demo created');

  // Site Team can execute its own step but cannot design the workflow.
  await expectPermission(page, 'WORKFLOW_CONFIGURE', false);
  await expectPermission(page, 'WORKFLOW_ACT', true);
  await expect(page.getByTestId('workflow-builder-locked')).toBeVisible();
  await expectCurrentStep(page, 'Site Team Raise');
  await completeStep(page);
  await expectCurrentStep(page, 'QCE Verification');

  // Coarse WORKFLOW_ACT is intentionally not enough: current-step responsibility must also match.
  await completeStep(page);
  await expect(page.locator('.status-error')).toContainText(/QCE|responsibility/i);
  await expectCurrentStep(page, 'QCE Verification');

  // This is the regression for the green WORKFLOW_CONFIGURE bug reported from the UI.
  await quickLogin(page, 'qce@local.demo');
  await expectPermission(page, 'WORKFLOW_CONFIGURE', false);
  await expectPermission(page, 'WORKFLOW_ACT', true);
  await expect(page.getByTestId('workflow-builder-locked')).toBeVisible();
  await expectCurrentStep(page, 'QCE Verification');
  await completeStep(page);
  await expectCurrentStep(page, 'QC/DC Receiving');

  await quickLogin(page, 'qcdc@local.demo');
  await expectPermission(page, 'WORKFLOW_CONFIGURE', false);
  await expectCurrentStep(page, 'QC/DC Receiving');
  await completeStep(page);
  await expectCurrentStep(page, 'Consultant Inspector Review');

  await quickLogin(page, 'inspector@local.demo');
  await expectPermission(page, 'WORKFLOW_CONFIGURE', false);
  await expectCurrentStep(page, 'Consultant Inspector Review');
  await completeStep(page);
  await expectCurrentStep(page, 'Consultant RE Final Approval');

  // Inspector has APPROVE-level operational access but is not the Consultant RE.
  await completeStep(page);
  await expect(page.locator('.status-error')).toContainText(/CONSULTANT_RE|responsibility/i);
  await expectCurrentStep(page, 'Consultant RE Final Approval');

  await quickLogin(page, 're@local.demo');
  await expectPermission(page, 'WORKFLOW_CONFIGURE', false);
  await expectCurrentStep(page, 'Consultant RE Final Approval');
  await completeStep(page);
  await expect(page.locator('.workflow-panel .panel-heading .badge')).toHaveText('COMPLETED');

  await quickLogin(page, 'viewer@local.demo');
  await expectPermission(page, 'DOCUMENT_VIEW', true);
  await expectPermission(page, 'DOCUMENT_SUBMIT', false);
  await expectPermission(page, 'WORKFLOW_CONFIGURE', false);
  await expectPermission(page, 'WORKFLOW_ACT', false);
  await expect(page.getByTestId('workflow-builder-locked')).toBeVisible();

  // Only Project Admin gets the designer. Scope choices come from actual project_scopes rows.
  await quickLogin(page, 'admin@local.demo');
  await expectPermission(page, 'WORKFLOW_CONFIGURE', true);
  await expect(page.getByTestId('workflow-builder')).toBeVisible();
  await expect(page.getByTestId('workflow-builder-locked')).toHaveCount(0);

  const scopeSelect = page.getByLabel('Apply workflow to Project Scope');
  await expect(scopeSelect).toBeVisible();
  await expect(scopeSelect.locator('option', { hasText: 'Construction / MEP' })).toHaveCount(1);
  await expect(scopeSelect.locator('option', { hasText: 'Construction / Civil' })).toHaveCount(1);
  await expect(page.getByTestId('selected-workflow-scope')).toContainText('Construction / MEP');
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('INSPECTION');
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('DOCUMENT_CONTROL');

  // Civil exists in this project but has no configured capabilities in the UI demo.
  // Selecting it must not infer MEP capabilities, responsibilities or workflow applicability.
  const civilValue = await scopeSelect.locator('option', { hasText: 'Construction / Civil' }).getAttribute('value');
  expect(civilValue).toBeTruthy();
  await scopeSelect.selectOption(civilValue!);
  await expect(page.getByTestId('selected-workflow-scope')).toContainText('Construction / Civil');
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('None configured');
  await expect(page.getByTestId('workflow-required-capability')).toBeDisabled();
  await expect(page.getByRole('button', { name: /Create, activate & bind/i })).toBeDisabled();

  const mepValue = await scopeSelect.locator('option', { hasText: 'Construction / MEP' }).getAttribute('value');
  expect(mepValue).toBeTruthy();
  await scopeSelect.selectOption(mepValue!);
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('INSPECTION');
  await expect(page.getByTestId('workflow-required-capability')).toBeEnabled();

  // Backend applicability is exact: the demo ITR is bound to MEP, not Civil.
  const applicability = await page.evaluate(async ({ projectId, mepScopeId, civilScopeId }) => {
    const [mep, civil] = await Promise.all([
      fetch(`/api/v1/projects/${projectId}/scopes/${mepScopeId}/available-workflow-definitions`, { credentials: 'include' }).then(response => response.json()),
      fetch(`/api/v1/projects/${projectId}/scopes/${civilScopeId}/available-workflow-definitions`, { credentials: 'include' }).then(response => response.json()),
    ]);
    return { mep, civil } as { mep: Array<{ code: string }>; civil: Array<{ code: string }> };
  }, {
    projectId: await page.locator('.metric').filter({ hasText: 'Project' }).locator('strong').innerText().then(async () => {
      // Project code is displayed, but API needs the UUID. Read it from locally persisted demo state.
      return await page.evaluate(() => {
        const key = Object.keys(localStorage).find(value => value.startsWith('project-control-foundation-demo-v'));
        if (!key) throw new Error('Demo state missing');
        return JSON.parse(localStorage.getItem(key)!).project.id as string;
      });
    }),
    mepScopeId: mepValue!,
    civilScopeId: civilValue!,
  });
  expect(applicability.mep.some(definition => definition.code === 'ITR_APPROVAL')).toBeTruthy();
  expect(applicability.civil).toHaveLength(0);

  const template = page.getByLabel('Reusable starter template');
  await template.selectOption('ITR_WORK_VERIFICATION');
  await page.getByRole('button', { name: /Apply template/i }).click();
  await expect(page.locator('[data-testid^="workflow-draft-step-"]')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /SITE_TEAM · SUBCONTRACTOR · CONTRIBUTE/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /QCE · SUBCONTRACTOR · APPROVE/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /CONSULTANT_RE · CONSULTANT · APPROVE/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /Add next step/i }).click();
  await expect(page.locator('[data-testid^="workflow-draft-step-"]')).toHaveCount(6);

  // A preset is only a starting point. Create a separate reusable generic definition from the same visual editor.
  await template.selectOption('SIMPLE_REVIEW');
  await page.getByRole('button', { name: /Apply template/i }).click();
  await expect(page.locator('[data-testid^="workflow-draft-step-"]')).toHaveCount(2);
  const uniqueCode = `E2E_REVIEW_${Date.now()}`;
  await page.getByLabel('Workflow code').fill(uniqueCode);
  await page.getByLabel('Workflow name').fill('E2E Reusable Document Review');
  await page.getByRole('button', { name: /Create, activate & bind/i }).click();
  await expect(page.locator('.status')).toContainText(`Workflow ${uniqueCode} created`);
  await expect(page.getByLabel('Reusable workflow definition').locator('option', { hasText: uniqueCode })).toHaveCount(1);
});
