import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthGuard from './components/AuthGuard';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { NavProvider } from './contexts/NavContext';

const Login=lazy(()=>import('./pages/Login'));const Documents=lazy(()=>import('./pages/Documents'));const Inbox=lazy(()=>import('./pages/Inbox'));const Contacts=lazy(()=>import('./pages/Contacts'));const Bookings=lazy(()=>import('./pages/Bookings'));const Analytics=lazy(()=>import('./pages/Analytics'));const BotSettings=lazy(()=>import('./pages/settings/BotSettings'));const TeamSettings=lazy(()=>import('./pages/settings/TeamSettings'));const BillingSettings=lazy(()=>import('./pages/settings/BillingSettings'));const ProfilePage=lazy(()=>import('./pages/settings/ProfilePage'));const WebhookSetup=lazy(()=>import('./pages/settings/WebhookSetup'));const Onboarding=lazy(()=>import('./pages/Onboarding'));const OAuthCallback=lazy(()=>import('./pages/OAuthCallback'));const StorageSettings=lazy(()=>import('./pages/settings/StorageSettings'));

const EnterpriseLayout=lazy(()=>import('./enterprise/EnterpriseLayout'));const ProjectPortfolio=lazy(()=>import('./enterprise/ProjectPortfolio'));const ProjectDelivery=lazy(()=>import('./enterprise/ProjectDelivery'));const EnterpriseDocuments=lazy(()=>import('./enterprise/DocumentRegister'));const BudgetIpc=lazy(()=>import('./enterprise/BudgetIpc'));const ProjectControls=lazy(()=>import('./enterprise/ProjectControls'));const ResourceCosts=lazy(()=>import('./enterprise/ResourceCosts'));const CommercialFacts=lazy(()=>import('./enterprise/CommercialFacts'));const ForecastIntelligence=lazy(()=>import('./enterprise/ForecastIntelligence'));const EnterpriseWorkflows=lazy(()=>import('./enterprise/WorkflowControl'));const EnterpriseTransmittals=lazy(()=>import('./enterprise/Transmittals'));const EnterpriseApprovals=lazy(()=>import('./enterprise/ApprovalInbox'));const EnterpriseSecurity=lazy(()=>import('./enterprise/SecurityAccess'));const EnterpriseInsights=lazy(()=>import('./enterprise/EnterprisePages').then(m=>({default:m.Insights})));const EnterpriseAudit=lazy(()=>import('./enterprise/EnterprisePages').then(m=>({default:m.Audit})));const EnterpriseNotifications=lazy(()=>import('./enterprise/NotificationCenter'));const EnterpriseUploadLinks=lazy(()=>import('./enterprise/UploadLinks'));const RolesPermissions=lazy(()=>import('./pages/settings/RolesPermissions'));const TimeLog=lazy(()=>import('./enterprise/TimeLog'));

const PublicUpload=lazy(()=>import('./public/PublicUpload'));

function PageLoader(){return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',gap:12}}><div style={{width:32,height:32,border:'3px solid #d8e1e8',borderTopColor:'#0f766e',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>}

export default function App(){return <BrowserRouter><FeaturesProvider><NavProvider><Suspense fallback={<PageLoader/>}><Routes>
<Route path="/login" element={<Login/>}/><Route path="/onboarding" element={<Onboarding/>}/><Route path="/platforms/callback" element={<OAuthCallback/>}/><Route path="/upload/:token" element={<PublicUpload/>}/>

{/* Enterprise delivery is the primary product. The original CRM/WhatsApp pages remain reachable
    while video/content-generation surfaces are intentionally dormant for this phase. */}
<Route path="/control" element={<AuthGuard><EnterpriseLayout/></AuthGuard>}>
  <Route index element={<ProjectPortfolio/>}/>
  <Route path="projects" element={<ProjectPortfolio/>}/>
  <Route path="projects/:projectId" element={<ProjectDelivery/>}/>
  <Route path="documents" element={<EnterpriseDocuments/>}/><Route path="upload-links" element={<EnterpriseUploadLinks/>}/>
  <Route path="project-controls" element={<ProjectControls/>}/><Route path="resource-costs" element={<ResourceCosts/>}/>
  <Route path="commercial-facts" element={<CommercialFacts/>}/><Route path="forecast-intelligence" element={<ForecastIntelligence/>}/>
  <Route path="commercial" element={<BudgetIpc/>}/><Route path="workflows" element={<EnterpriseWorkflows/>}/>
  <Route path="transmittals" element={<EnterpriseTransmittals/>}/><Route path="approvals" element={<EnterpriseApprovals/>}/>
  <Route path="security" element={<EnterpriseSecurity/>}/><Route path="roles" element={<RolesPermissions/>}/>
  <Route path="time-log" element={<TimeLog/>}/><Route path="insights" element={<EnterpriseInsights/>}/>
  <Route path="audit" element={<EnterpriseAudit/>}/><Route path="communications" element={<EnterpriseNotifications/>}/>
</Route>

{/* Existing CRM/WhatsApp operational pages are preserved as secondary utilities. */}
<Route element={<AuthGuard><DashboardLayout/></AuthGuard>}>
  <Route path="/inbox" element={<Inbox/>}/><Route path="/contacts" element={<Contacts/>}/><Route path="/bookings" element={<Bookings/>}/>
  <Route path="/analytics" element={<Analytics/>}/><Route path="/documents" element={<Documents/>}/>
  <Route path="/settings/bot" element={<BotSettings/>}/><Route path="/settings/team" element={<TeamSettings/>}/>
  <Route path="/settings/billing" element={<BillingSettings/>}/><Route path="/settings/webhook" element={<WebhookSetup/>}/>
  <Route path="/settings/storage" element={<StorageSettings/>}/><Route path="/profile" element={<ProfilePage/>}/>
</Route>

<Route path="/dashboard" element={<Navigate to="/control" replace/>}/>
<Route path="/content-studio" element={<Navigate to="/control" replace/>}/><Route path="/video-generator" element={<Navigate to="/control" replace/>}/>
<Route path="/campaigns" element={<Navigate to="/control" replace/>}/><Route path="/calendar" element={<Navigate to="/control" replace/>}/>
<Route path="/trends" element={<Navigate to="/control" replace/>}/><Route path="/media-library" element={<Navigate to="/control" replace/>}/>
<Route path="*" element={<Navigate to="/control" replace/>}/></Routes></Suspense></NavProvider></FeaturesProvider></BrowserRouter>}
