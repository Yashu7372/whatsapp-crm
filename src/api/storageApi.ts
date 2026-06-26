import { http } from './httpClient';

export interface SignedUploadUrl {
  uploadUrl: string;
  uploadToken: string;
  objectKey: string;
  expiresInSeconds: number;
}

export interface SignedDownloadUrl {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface ConfirmUploadRequest {
  originalName: string;
  contentType: string;
  sizeBytes: number;
  objectKey: string;
  assetType?: string;
  checksumSha256?: string;
}

export interface MediaAsset {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  assetType: string;
  refId: string | null;
  storageProvider: string;
  objectKey: string;
  status: string;
  createdAt: string;
}

export const storageApi = {
  requestUploadUrl: (fileName: string, contentType: string, sizeBytes: number) =>
    http.post<SignedUploadUrl>('/storage/upload-url', { fileName, contentType, sizeBytes }),

  confirmUpload: (req: ConfirmUploadRequest) =>
    http.post<MediaAsset>('/storage/confirm-upload', req),

  getDownloadUrl: (assetId: string) =>
    http.get<SignedDownloadUrl>(`/storage/download-url/${assetId}`),

  listAssets: () => http.get<MediaAsset[]>('/media'),

  deleteAsset: (id: string) => http.delete<void>(`/media/${id}`),

  uploadDirect: (file: File, assetType = 'DOCUMENT', refId?: string): Promise<MediaAsset> => {
    const form = new FormData();
    form.append('file', file);
    form.append('assetType', assetType);
    if (refId) form.append('refId', refId);
    return http.upload<MediaAsset>('/media/upload', form);
  },
};
