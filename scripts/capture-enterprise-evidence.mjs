import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const baseUrl = 'http://127.0.0.1:4173';
const outputDir = 'docs/screenshots';
mkdirSync(outputDir, { recursive: true });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const json = (route, body) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

function stage(id, code, name, sequenceNo, status, progressPercent, workPackages = []) {
  return {
    id, stageCode: code, name, stageType: code, sequenceNo, status, progressPercent,
    plannedStart: '2026-01-01', plannedEnd: '2027-12-31',
    budgetAmount: workPackages.reduce((s, p) => s + p.budgetAmount, 0),
    actualCost: workPackages.reduce((s, p) => s + p.actualCost, 0),
    openWorkItems: workPackages.reduce((s, p) => s + p.openWorkItems, 0),
    blockedWorkItems: workPackages.reduce((s, p) => s + p.blockedWorkItems, 0),
    workPackages,
  };
}

function projectDetail(restricted = false) {
  const mepItem = {
    id: 'wi-me-301', itemCode: 'ME-301', name: 'Level 05 HVAC duct installation and inspection',
    workType: 'CONSTRUCTION_ACTIVITY', status: 'BLOCKED', priority: 'HIGH', progressPercent: 62,
    responsibleOrganizationId: 'org-apex', responsibleOrganizationName: 'Apex MEP Services LLC',
    budgetLineId: 'mep-300', budgetAmount: restricted ? 0 : 2_800_000, actualCost: restricted ? 0 : 1_945_000,
    totalHours: 186.5, documentCount: 3, pendingDocumentCount: 1,
    blockedReason: 'Inspection IR-234 returned with comments because fire-damper access clearance must be corrected before reinspection.',
    plannedStart: '2026-08-01', plannedEnd: '2026-08-28', actualStart: '2026-08-02',
    commercialVisible: !restricted, hoursVisible: true,
    assignments: [
      { userId: 'u1', fullName: 'Sameer Ali', jobTitle: 'MEP Construction Manager', department: 'MEP', accessRole: 'MANAGER', organizationName: 'Apex MEP Services LLC', responsibility: 'CONSTRUCTION_MANAGER' },
      { userId: 'u2', fullName: 'Naveen Kumar', jobTitle: 'HVAC Supervisor', department: 'HVAC', accessRole: 'REVIEWER', organizationName: 'Apex MEP Services LLC', responsibility: 'SUPERVISOR' },
      { userId: 'u3', fullName: 'Imran Shah', jobTitle: 'HVAC Technician', department: 'HVAC', accessRole: 'VIEWER', organizationName: 'Apex MEP Services LLC', responsibility: 'TECHNICIAN' },
      { userId: 'u4', fullName: 'Hassan Nasser', jobTitle: 'Resident Engineer', department: 'Supervision', accessRole: 'REVIEWER', organizationName: 'Meridian Engineering Consultants', responsibility: 'TECHNICAL_REVIEWER' },
    ],
    documents: [
      { id: 'd-ir234', documentCode: 'IR-234', title: 'HVAC duct installation inspection - Level 05', docType: 'INSPECTION_REQUEST', status: 'IN_REVIEW', revisionCode: '02', reviewOutcome: 'RETURNED_WITH_COMMENTS', dueAt: '2026-08-17T15:00:00', approvedValue: 0 },
      { id: 'd-ms18', documentCode: 'MS-MEP-018', title: 'HVAC duct installation method statement', docType: 'METHOD_STATEMENT', status: 'APPROVED', revisionCode: '03', reviewOutcome: 'APPROVED', approvedValue: 0 },
      { id: 'd-sd91', documentCode: 'SD-MEP-091', title: 'Level 05 coordinated HVAC shop drawing', docType: 'SHOP_DRAWING', status: 'APPROVED', revisionCode: '05', reviewOutcome: 'APPROVED', approvedValue: 0 },
    ],
  };

  const mepPackage = {
    id: 'pkg-mep', packageCode: 'MEP-06', name: 'MEP Installation', discipline: 'MEP', status: 'IN_PROGRESS', progressPercent: 58,
    budgetAmount: restricted ? 0 : 44_000_000, actualCost: restricted ? 0 : 27_600_000, totalHours: 2450.5,
    openWorkItems: 5, blockedWorkItems: 1,
    workItems: [
      mepItem,
      { ...mepItem, id: 'wi-me-305', itemCode: 'ME-305', name: 'Level 05 fire-damper access rectification', status: 'IN_PROGRESS', progressPercent: 35, blockedReason: undefined, budgetAmount: restricted ? 0 : 650_000, actualCost: restricted ? 0 : 210_000, totalHours: 44, documentCount: 1, pendingDocumentCount: 0, assignments: mepItem.assignments.slice(0,2), documents: mepItem.documents.slice(0,1) },
    ],
  };

  const structurePackage = {
    id: 'pkg-str', packageCode: 'STR-08', name: 'Superstructure', discipline: 'Structural', status: 'IN_PROGRESS', progressPercent: 74,
    budgetAmount: restricted ? 0 : 92_000_000, actualCost: restricted ? 0 : 65_500_000, totalHours: 6180,
    openWorkItems: 2, blockedWorkItems: 0,
    workItems: [{ ...mepItem, id: 'wi-str-208', itemCode: 'STR-208', name: 'Level 08 slab reinforcement and concrete', status: 'IN_PROGRESS', progressPercent: 78, responsibleOrganizationName: 'GulfBuild Contracting LLC', budgetAmount: restricted ? 0 : 7_600_000, actualCost: restricted ? 0 : 5_900_000, totalHours: 810, blockedReason: undefined, documentCount: 2, pendingDocumentCount: 0, assignments: mepItem.assignments.slice(1,2), documents: mepItem.documents.slice(1) }],
  };

  const stages = [
    stage('stg-feas', 'FEAS', 'Feasibility', 1, 'COMPLETED', 100),
    stage('stg-concept', 'CON', 'Concept Design', 2, 'COMPLETED', 100),
    stage('stg-detail', 'DET', 'Detailed Design', 3, 'COMPLETED', 100),
    stage('stg-auth', 'AUTH', 'Authority Approvals', 4, 'IN_PROGRESS', 82),
    stage('stg-proc', 'PROC', 'Procurement', 5, 'COMPLETED', 100),
    stage('stg-const', 'CONST', 'Construction', 6, 'IN_PROGRESS', 61, [mepPackage, structurePackage]),
    stage('stg-tc', 'TC', 'Testing & Commissioning', 7, 'NOT_STARTED', 0),
    stage('stg-hand', 'HAND', 'Handover', 8, 'NOT_STARTED', 0),
  ];

  return {
    id: 'aur-crk', projectCode: 'AUR-CRK', name: 'Aurelia Creek Residences',
    description: 'Mixed-use waterfront residential development with integrated consultant, contractor and specialist-subcontractor delivery control.',
    status: 'ACTIVE', currency: 'AED', contractValue: restricted ? 0 : 420_000_000,
    commercialVisibility: restricted ? 'NONE' : 'PROJECT', startDate: '2025-09-01', endDate: '2028-02-29',
    kpis: { progressPercent: 57.8, actualCost: restricted ? 0 : 183_400_000, openWorkItems: 14, blockedWorkItems: 2, overdueDocuments: 3, pendingApprovals: 5, totalHours: 8630.5, stageCount: 8, completedStages: 4 },
    participants: [
      { id: 'p1', organizationId: 'org-aurelia', organizationName: 'Aurelia Developments PJSC', organizationCode: 'AUR', partyRole: 'CLIENT', staffCount: 8 },
      { id: 'p2', organizationId: 'org-meridian', organizationName: 'Meridian Engineering Consultants', organizationCode: 'MEC', partyRole: 'CONSULTANT', staffCount: 18 },
      { id: 'p3', organizationId: 'org-gulf', organizationName: 'GulfBuild Contracting LLC', organizationCode: 'GBC', partyRole: 'CONTRACTOR', staffCount: 46 },
      { id: 'p4', organizationId: 'org-apex', organizationName: 'Apex MEP Services LLC', organizationCode: 'APX', partyRole: 'SUBCONTRACTOR', staffCount: 24 },
      { id: 'p5', organizationId: 'org-skyline', organizationName: 'Skyline Facades LLC', organizationCode: 'SKY', partyRole: 'SUBCONTRACTOR', staffCount: 12 },
    ],
    stages,
  };
}

function portfolio(restricted = false) {
  const card = (id, projectCode, name, value, progressPercent, blockedWorkItems, overdueDocuments, pendingApprovals) => ({
    id, projectCode, name, status: 'ACTIVE', currency: 'AED', visibleContractValue: restricted ? 0 : value,
    commercialVisibility: restricted ? 'NONE' : 'PROJECT', startDate: '2025-09-01', endDate: '2028-02-29', progressPercent,
    actualCost: restricted ? 0 : Math.round(value * 0.42), openWorkItems: 9 + blockedWorkItems, blockedWorkItems, overdueDocuments,
    pendingApprovals, participantCount: 6, stageCount: 8, completedStages: progressPercent > 50 ? 4 : 3,
  });
  return {
    accountName: 'Aurelia Developments PJSC', activeProjects: 3,
    totalContractValue: restricted ? 0 : 1_410_000_000, totalActualCost: restricted ? 0 : 512_000_000,
    openWorkItems: 31, blockedWorkItems: 5, overdueDocuments: 7, commercialVisible: !restricted,
    projects: [
      card('aur-crk', 'AUR-CRK', 'Aurelia Creek Residences', 420_000_000, 57.8, 2, 3, 5),
      card('aur-bdt', 'AUR-BDT', 'Aurelia Business District Tower', 680_000_000, 41.2, 2, 2, 4),
      card('aur-mar', 'AUR-MAR', 'Aurelia Marina Hotel', 310_000_000, 66.5, 1, 2, 3),
    ],
  };
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error('Vite dev server did not become ready');
}

async function assertVisible(page, text) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: 'visible', timeout: 15000 });
}

const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, VITE_API_BASE_URL: '/api/v1' },
});
vite.stdout.on('data', data => process.stdout.write(`[vite] ${data}`));
vite.stderr.on('data', data => process.stderr.write(`[vite] ${data}`));

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  let restricted = false;

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'visual-evidence-token');
    localStorage.setItem('refreshToken', 'visual-evidence-refresh');
    localStorage.setItem('tenantId', 'aurelia-demo');
  });

  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/me/features')) return json(route, { tenantId: 'aurelia-demo', plan: 'ENTERPRISE', subscriptionStatus: 'ACTIVE', features: { PROJECT_DELIVERY: true } });
    if (path.endsWith('/me/nav')) return json(route, []);
    if (path.endsWith('/project-delivery/portfolio')) return json(route, portfolio(restricted));
    if (path.includes('/project-delivery/projects/')) return json(route, projectDetail(restricted));
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"visual fixture endpoint not mocked"}' });
  });

  await page.goto(`${baseUrl}/control/projects`, { waitUntil: 'networkidle' });
  await assertVisible(page, 'Aurelia Developments PJSC');
  await assertVisible(page, 'Aurelia Creek Residences');
  await assertVisible(page, 'Projects');
  await assertVisible(page, 'WhatsApp inbox');
  await page.screenshot({ path: `${outputDir}/01-portfolio-admin.png`, fullPage: true });

  await page.getByRole('button', { name: /Aurelia Creek Residences/i }).click();
  await assertVisible(page, 'Construction');
  await assertVisible(page, 'MEP Installation');
  await assertVisible(page, 'Level 05 HVAC duct installation and inspection');
  await assertVisible(page, 'Inspection IR-234 returned with comments');
  await assertVisible(page, 'Sameer Ali');
  await assertVisible(page, 'Imran Shah');
  await assertVisible(page, 'IR-234');
  await page.screenshot({ path: `${outputDir}/02-project-drilldown-admin.png`, fullPage: true });
  await page.locator('.ec-work-detail').screenshot({ path: `${outputDir}/03-work-item-evidence-admin.png` });

  restricted = true;
  await page.reload({ waitUntil: 'networkidle' });
  await assertVisible(page, 'Commercial information');
  await assertVisible(page, 'Restricted');
  await assertVisible(page, 'Rates, budget and cost are restricted');
  await assertVisible(page, '186.5 h');
  await page.screenshot({ path: `${outputDir}/04-project-drilldown-worker-restricted.png`, fullPage: true });

  await page.goto(`${baseUrl}/video-generator`, { waitUntil: 'networkidle' });
  await assertVisible(page, 'Aurelia Developments PJSC');
  if (!page.url().includes('/control')) throw new Error('Dormant video route did not redirect to enterprise control');

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await assertVisible(page, 'Aurelia Developments PJSC');
  if (!page.url().includes('/control')) throw new Error('/dashboard did not redirect to enterprise control');

  console.log('Enterprise visual evidence verified and screenshots captured.');
} finally {
  if (browser) await browser.close();
  vite.kill('SIGTERM');
}
