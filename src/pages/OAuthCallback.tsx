import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  const status = params.get('status');
  const platform = params.get('platform') ?? '';
  const name = params.get('name') ?? '';
  const error = params.get('error') ?? '';
  const success = status === 'success';

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate('/platforms');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-primary)',
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
        {success ? (
          <>
            <CheckCircle size={48} color="var(--accent)" style={{ marginBottom: 16 }} />
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>{platform} Connected!</h2>
            {name && <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{name}</p>}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Redirecting in {countdown}s…
            </p>
          </>
        ) : (
          <>
            <XCircle size={48} color="var(--red)" style={{ marginBottom: 16 }} />
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Connection Failed</h2>
            {error && (
              <p style={{
                color: 'var(--text-muted)', fontSize: '0.82rem',
                background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, marginBottom: 16
              }}>
                {decodeURIComponent(error)}
              </p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Redirecting in {countdown}s…
            </p>
          </>
        )}
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/platforms')}>
          Go to Platforms
        </button>
      </div>
    </div>
  );
}
