import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthGuard from './components/AuthGuard';

/* Lazy-loaded pages for optimal code splitting */
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

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/platforms/callback" element={<OAuthCallback />} />

          {/* Protected dashboard layout */}
          <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/inbox"            element={<Inbox />} />
            <Route path="/contacts"         element={<Contacts />} />
            <Route path="/bookings"         element={<Bookings />} />
            <Route path="/campaigns"        element={<Campaigns />} />
            <Route path="/analytics"        element={<Analytics />} />
            <Route path="/documents"        element={<Documents />} />
            <Route path="/settings/bot"     element={<BotSettings />} />
            <Route path="/settings/team"    element={<TeamSettings />} />
            <Route path="/settings/billing" element={<BillingSettings />} />
            <Route path="/settings/webhook" element={<WebhookSetup />} />
            <Route path="/profile"          element={<ProfilePage />} />
            <Route path="/trends"           element={<TrendIntelligence />} />
            <Route path="/content-studio"   element={<ContentStudio />} />
            <Route path="/approvals"        element={<ApprovalQueue />} />
            <Route path="/calendar"         element={<ContentCalendar />} />
            <Route path="/leads"            element={<LeadIntelligence />} />
            <Route path="/platforms"        element={<PlatformIntegrations />} />
            <Route path="/learning"         element={<LearningInsights />} />
            <Route path="/products"         element={<Products />} />
            <Route path="/orders"           element={<Orders />} />
            <Route path="/video-generator"  element={<VideoGenerator />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
