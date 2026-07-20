import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const ContentStudio = lazy(() => import('./pages/ContentStudio'));
const Analytics = lazy(() => import('./pages/Analytics'));
const BotSettings = lazy(() => import('./pages/settings/BotSettings'));
const TeamSettings = lazy(() => import('./pages/settings/TeamSettings'));
const BillingSettings = lazy(() => import('./pages/settings/BillingSettings'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const WebhookSetup = lazy(() => import('./pages/settings/WebhookSetup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

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
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/content-studio" element={<ContentStudio />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings/bot" element={<BotSettings />} />
            <Route path="/settings/team" element={<TeamSettings />} />
            <Route path="/settings/billing" element={<BillingSettings />} />
            <Route path="/settings/webhook" element={<WebhookSetup />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
