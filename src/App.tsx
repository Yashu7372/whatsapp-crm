import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthGuard from './components/AuthGuard';
import { FeaturesProvider } from './contexts/FeaturesContext';

/* Existing CRM pages — intentionally unchanged. */
const Login = lazy(() => import('./pages/Login'));
const Documents = lazy(() => import('./pages/Documents'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Analytics = lazy(() => import('./pages/Analytics'));
const BotSettings = lazy(() => import('./pages/settings/BotSettings'));
const TeamSettings = lazy(() => import('./pages/settings/TeamSettings'));
const BillingSettings = lazy(() => import('./pages/settings/BillingSettings'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const WebhookSetup = lazy(() => import('./pages/settings/WebhookSetup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const TrendIntelligence = lazy(() => import('./pages/TrendIntelligence'));
const ContentStudio = lazy(() => import('./pages/ContentStudio'));
const ApprovalQueue = lazy(() => import('./pages/ApprovalQueue'));
const ContentCalendar = lazy(() => import('./pages/ContentCalendar'));
const LeadIntelligence = lazy(() => import('./pages/LeadIntelligence'));
const PlatformIntegrations = lazy(() => import('./pages/PlatformIntegrations'));
const LearningInsights = lazy(() => import('./pages/LearningInsights'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const VideoGenerator = lazy(() => import('./pages/VideoGenerator'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const StorageSettings = lazy(() => import('./pages/settings/StorageSettings'));
const SocialAccountSettings = lazy(() => import('./pages/settings/SocialAccountSettings'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));

/* New enterprise document-control area. It has its own layout and route namespace so the
   existing CRM UI can continue to evolve independently. */
const EnterpriseLayout = lazy(() => import('./enterprise/EnterpriseLayout'));
const EnterpriseDashboard = lazy(() => import('./enterprise/EnterpriseDashboard'));
const EnterpriseDocuments = lazy(() => import('./enterprise/DocumentRegister'));
const BudgetIpc = lazy(() => import('./enterprise/BudgetIpc'));
const EnterprisePages = lazy(() => import('./enterprise/EnterprisePages'));

function PageLoader() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',gap:12}}>
      <div style={{width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FeaturesProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/platforms/callback" element={<OAuthCallback />} />

          {/* Existing application — no route removed or renamed. */}
          <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings/bot" element={<BotSettings />} />
            <Route path="/settings/team" element={<TeamSettings />} />
            <Route path="/settings/billing" element={<BillingSettings />} />
            <Route path="/settings/webhook" element={<WebhookSetup />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/trends" element={<TrendIntelligence />} />
            <Route path="/content-studio" element={<ContentStudio />} />
            <Route path="/approvals" element={<ApprovalQueue />} />
            <Route path="/calendar" element={<ContentCalendar />} />
            <Route path="/leads" element={<LeadIntelligence />} />
            <Route path="/platforms" element={<PlatformIntegrations />} />
            <Route path="/learning" element={<LearningInsights />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/video-generator" element={<VideoGenerator />} />
            <Route path="/settings/storage" element={<StorageSettings />} />
            <Route path="/settings/social" element={<SocialAccountSettings />} />
            <Route path="/media-library" element={<MediaLibrary />} />
          </Route>

          {/* Enterprise document control — protected by the exact same authentication guard. */}
          <Route path="/control" element={<AuthGuard><EnterpriseLayout /></AuthGuard>}>
            <Route index element={<EnterpriseDashboard />} />
            <Route path="documents" element={<EnterpriseDocuments />} />
            <Route path="commercial" element={<BudgetIpc />} />
            <Route path="workflows" element={<EnterprisePages.Workflows />} />
            <Route path="transmittals" element={<EnterprisePages.Transmittals />} />
            <Route path="approvals" element={<EnterprisePages.Approvals />} />
            <Route path="insights" element={<EnterprisePages.Insights />} />
            <Route path="audit" element={<EnterprisePages.Audit />} />
            <Route path="communications" element={<EnterprisePages.Communications />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      </FeaturesProvider>
    </BrowserRouter>
  );
}
