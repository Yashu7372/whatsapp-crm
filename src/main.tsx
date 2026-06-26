import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

async function bootstrap() {
  if (import.meta.env.VITE_MOCK === 'true' || import.meta.env.DEV) {
    // Seed a mock auth token so AuthGuard passes without a real login
    if (!localStorage.getItem('accessToken')) {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('refreshToken', 'mock-refresh');
      localStorage.setItem('tenantId', 'tenant-1');
    }
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
