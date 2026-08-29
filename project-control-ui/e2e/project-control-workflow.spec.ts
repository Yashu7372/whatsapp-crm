import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'Project123!';

async function login(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /^Sign in$/ }).click();
}

async function navigate(page: Page, testId: string, screenTestId: string) {
  await page.getByTestId(testId).click();
  await expect(page.getByTestId(screenTestId)).toBeVisible();
}

test('real Project Control shell exposes separate project screens and admin-only configuration', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  await login(page, 'admin@local.demo');
  await expect(page.getByRole('heading', { name: 'No project context selected' })).toBeVisible();
  await page.getByRole('button', { name: /Initialize local project/i }).click();

  await expect(page.getByTestId('screen-overview')).toBeVisible();
  await expect(page.getByTestId('nav-overview')).toBeVisible();
  await expect(page.getByTestId('nav-documents')).toBeVisible();
  await expect(page.getByTestId('nav-workflows')).toBeVisible();
  await expect(page.getByTestId('nav-designer')).toBeVisible();
  await expect(page.getByTestId('nav-admin')).toBeVisible();

  await navigate(page, 'nav-documents', 'screen-documents');
  await expect(page.getByRole('heading', { name: 'CHW Routing Shop Drawing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Document Register' })).toBeVisible();

  await navigate(page, 'nav-workflows', 'screen-workflows');
  await expect(page.getByText('Work Verification / ITR Approval').first()).toBeVisible();
  await expect(page.getByText('ITR_APPROVAL').first()).toBeVisible();

  await navigate(page, 'nav-designer', 'screen-designer');
  await expect(page.getByTestId('workflow-builder')).toBeVisible();
  const scopeSelect = page.getByLabel('Apply workflow to Project Scope');
  await expect(scopeSelect.locator('option', { hasText: 'Construction / MEP' })).toHaveCount(1);
  await expect(scopeSelect.locator('option', { hasText: 'Construction / Civil' })).toHaveCount(1);

  const mepOption = scopeSelect.locator('option', { hasText: 'Construction / MEP' });
  await scopeSelect.selectOption(await mepOption.getAttribute('value') ?? '');
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('DOCUMENT_CONTROL');
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('INSPECTION');

  const civilOption = scopeSelect.locator('option', { hasText: 'Construction / Civil' });
  await scopeSelect.selectOption(await civilOption.getAttribute('value') ?? '');
  await expect(page.getByTestId('workflow-scope-capabilities')).toContainText('None configured');
  await expect(page.getByTestId('workflow-required-capability')).toBeDisabled();

  await navigate(page, 'nav-admin', 'screen-admin');
  await expect(page.getByRole('heading', { name: 'Project Administration' })).toBeVisible();
  await expect(page.getByText('Project scopes')).toBeVisible();
  await expect(page.getByText('Document numbering')).toBeVisible();

  await page.getByRole('button', { name: /Sign out/i }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await login(page, 'site@local.demo');

  await expect(page.getByTestId('screen-overview')).toBeVisible();
  await expect(page.getByTestId('nav-documents')).toBeVisible();
  await expect(page.getByTestId('nav-workflows')).toBeVisible();
  await expect(page.getByTestId('nav-designer')).toHaveCount(0);
  await expect(page.getByTestId('nav-admin')).toHaveCount(0);

  await navigate(page, 'nav-workflows', 'screen-workflows');
  await expect(page.getByText('Site Team Raise').first()).toBeVisible();
});
