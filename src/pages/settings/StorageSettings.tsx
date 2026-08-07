import { useState, useEffect } from 'react';
import { HardDrive, Upload, Trash2, Download, AlertCircle } from 'lucide-react';
import { storageApi, type MediaAsset } from '../../api/storageApi';
import { useFeatures } from '../../contexts/FeaturesContext';

export default function StorageSettings() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isEnabled, plan } = useFeatures();

  const hasStorage = isEnabled('MEDIA_LIBRARY') || isEnabled('DOCUMENT_CONTROL');

  useEffect(() => {
    if (!hasStorage) { setLoading(false); return; }
    storageApi.listAssets()
      .then(setAssets)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [hasStorage]);

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

  const totalBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
  const totalMb = (totalBytes / 1024 / 1024).toFixed(1);

  if (!hasStorage) {
    return (
      <div className="page-container">
        <div className="page-header">
          <HardDrive size={20} />
          <h1>Storage Settings</h1>
        </div>
        <div className="empty-state">
          <AlertCircle size={40} />
          <p>Storage features are not enabled on the <strong>{plan}</strong> plan.</p>
          <p>Upgrade to access media library and document storage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <HardDrive size={20} />
        <h1>Storage</h1>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
          {totalMb} MB used
        </span>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Loading assets…</p>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <Upload size={40} />
          <p>No assets stored yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id}>
                  <td>{asset.originalName}</td>
                  <td><span className="badge">{asset.assetType}</span></td>
                  <td>{asset.storageProvider}</td>
                  <td>{(asset.sizeBytes / 1024).toFixed(1)} KB</td>
                  <td><span className={`badge ${asset.status === 'UPLOADED' ? 'success' : ''}`}>{asset.status}</span></td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="icon-btn"
                      title="Download"
                      onClick={() => handleDownload(asset)}
                    >
                      <Download size={15} />
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
