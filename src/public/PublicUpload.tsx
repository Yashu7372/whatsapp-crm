import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicUploadApi, type LinkMetadata } from './publicUploadApi';

type Stage = 'loading' | 'unavailable' | 'password' | 'ready' | 'sending' | 'done';

const card: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '40px',
  width: '100%',
  maxWidth: '440px',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  marginBottom: 14,
};

const button: React.CSSProperties = {
  width: '100%',
  padding: '11px',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 600,
  cursor: 'pointer',
};

export default function PublicUpload() {
  const { token = '' } = useParams();
  const [stage, setStage] = useState<Stage>('loading');
  const [meta, setMeta] = useState<LinkMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    publicUploadApi.metadata(token)
      .then(m => {
        setMeta(m);
        if (m.requiresPassword) {
          setStage('password');
        } else {
          publicUploadApi.startSession(token, '')
            .then(t => { setSessionToken(t); setStage('ready'); })
            .catch(e => { setError(String((e as Error).message)); setStage('unavailable'); });
        }
      })
      .catch(() => setStage('unavailable'));
  }, [token]);

  const submitPassword = async () => {
    setError('');
    try {
      const t = await publicUploadApi.startSession(token, password);
      setSessionToken(t);
      setStage('ready');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submitUpload = async () => {
    if (!file) return;
    setStage('sending');
    setError('');
    try {
      await publicUploadApi.upload(token, sessionToken, file, uploaderName, uploaderEmail);
      setStage('done');
    } catch (e) {
      setError((e as Error).message);
      setStage('ready');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={card}>
        {stage === 'loading' && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</p>}

        {stage === 'unavailable' && <>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>Link not available</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            This upload link has expired, been revoked, or doesn't exist. Please contact whoever sent it to you for a new one.
          </p>
        </>}

        {stage === 'password' && meta && <>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{meta.label}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>This link is password protected.</p>
          <input style={input} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && void submitPassword()} />
          {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 12 }}>{error}</p>}
          <button style={button} onClick={() => void submitPassword()}>Continue</button>
        </>}

        {(stage === 'ready' || stage === 'sending') && meta && <>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{meta.label}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
            Choose a file to submit. It's scanned for security before anything happens with it.
          </p>
          <input style={input} type="text" placeholder="Your name (optional)" value={uploaderName}
            onChange={e => setUploaderName(e.target.value)} />
          <input style={input} type="email" placeholder="Your email (optional)" value={uploaderEmail}
            onChange={e => setUploaderEmail(e.target.value)} />
          <input style={input} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 12 }}>{error}</p>}
          <button style={{ ...button, opacity: (!file || stage === 'sending') ? 0.6 : 1 }}
            disabled={!file || stage === 'sending'} onClick={() => void submitUpload()}>
            {stage === 'sending' ? 'Uploading…' : 'Submit document'}
          </button>
        </>}

        {stage === 'done' && <>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>Received</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Thanks — your document was received and will be reviewed shortly.
          </p>
        </>}
      </div>
    </div>
  );
}
