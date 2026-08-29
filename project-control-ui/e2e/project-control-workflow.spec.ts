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

test('authenticated workflow permissions, responsibility execution and visual builder', async ({ page }) => {
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

  // Only Project Admin gets the workflow designer. The options come from live scope assignments/capabilities.
  await quickLogin(page, 'admin@local.demo');
  await expectPermission(page, 'WORKFLOW_CONFIGURE', true);
  await expect(page.getByTestId('workflow-builder')).toBeVisible();
  await expect(page.getByTestId('workflow-builder-locked')).toHaveCount(0);

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
