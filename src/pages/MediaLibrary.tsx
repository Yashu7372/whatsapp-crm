import { useState, useEffect, useRef } from 'react';
import { Image, Upload, Trash2, Download, Search, AlertCircle } from 'lucide-react';
import { storageApi, MediaAsset } from '../api/storageApi';
import { useFeatures } from '../contexts/FeaturesContext';

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isEnabled } = useFeatures();

  const canUseLibrary = isEnabled('MEDIA_LIBRARY');

  useEffect(() => {
    if (!canUseLibrary) { setLoading(false); return; }
    storageApi.listAssets()
      .then(setAssets)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [canUseLibrary]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const asset = await storageApi.uploadDirect(file, 'REFERENCE_ASSET');
        setAssets(prev => [asset, ...prev]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try {
      await storageApi.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDownload = async (asset: MediaAsset) => {
    try {
      const { downloadUrl } = await storageApi.getDownloadUrl(asset.id);
      window.open(downloadUrl, '_blank');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = assets.filter(a =>
    a.originalName.toLowerCase().includes(search.toLowerCase()) ||
    a.assetType.toLowerCase().includes(search.toLowerCase()),
  );

  if (!canUseLibrary) {
    return (
      <div className="page-container">
        <div className="page-header"><Image size={20} /><h1>Media Library</h1></div>
        <div className="empty-state">
          <AlertCircle size={40} />
          <p>Media Library is not enabled on your current plan.</p>
          <p>Upgrade to access brand assets, templates, and generated media.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Image size={20} />
        <h1>Media Library</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search assets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {error && (
        <div className="error-banner"><AlertCircle size={16} /> {error}</div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Image size={40} />
          <p>{search ? 'No assets match your search.' : 'No media assets yet.'}</p>
          {!search && <p>Upload brand logos, product images, and templates.</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, padding: '1rem 0' }}>
          {filtered.map(asset => (
            <div key={asset.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{
                height: 100,
                background: 'var(--surface-elevated)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {asset.contentType?.startsWith('image/') ? (
                  <img
                    src={`/api/v1/media/${asset.id}/download`}
                    alt={asset.originalName}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Image size={32} style={{ opacity: 0.4 }} />
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {asset.originalName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {(asset.sizeBytes / 1024).toFixed(1)} KB · {asset.assetType}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="icon-btn" title="Download" onClick={() => handleDownload(asset)}>
                  <Download size={13} />
                </button>
                <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(asset.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
