import { http } from './httpClient';

export interface CharacterReferenceAsset {
  id: string;
  originalName: string;
  contentType: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  visualStyle: string;
  references: CharacterReferenceAsset[];
  createdAt: string;
}

export interface StoryboardProviderStatus {
  available: boolean;
  localEnabled: boolean;
  geminiEnabled: boolean;
  flashEstimatedCostUsd: number;
  proEstimatedCostUsd: number;
  defaultShotBudgetUsd: number;
  defaultReelBudgetUsd: number;
  hardMaximumShotBudgetUsd: number;
  hardMaximumReelBudgetUsd: number;
}

export type StoryboardQualityMode = 'ECONOMY' | 'BALANCED' | 'QUALITY';
export type StoryboardImageStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface StoryboardImageJob {
  id: string;
  videoScriptId: string;
  characterProfileId: string | null;
  outputAssetId: string | null;
  shotIndex: number;
  prompt: string;
  qualityMode: StoryboardQualityMode;
  provider: string;
  status: StoryboardImageStatus;
  estimatedCostUsd: number;
  actualCostUsd: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface GenerateStoryboardImageInput {
  characterProfileId?: string;
  shotIndex: number;
  prompt: string;
  qualityMode: StoryboardQualityMode;
  maximumShotCostUsd: number;
  reelBudgetUsd: number;
}

export const storyboardApi = {
  listCharacters: () =>
    http.get<CharacterProfile[]>('/character-profiles'),

  createCharacter: (input: { name: string; description: string; visualStyle: string }) =>
    http.post<CharacterProfile>('/character-profiles', input),

  deactivateCharacter: (profileId: string) =>
    http.delete<void>(`/character-profiles/${profileId}`),

  uploadCharacterReference: (profileId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('assetType', 'CHARACTER_REFERENCE');
    form.append('refId', profileId);
    return http.upload<CharacterReferenceAsset>('/media/upload', form);
  },

  providerStatus: () =>
    http.get<StoryboardProviderStatus>('/storyboard-images/provider-status'),

  listImages: (scriptId: string) =>
    http.get<StoryboardImageJob[]>(`/video-scripts/${scriptId}/storyboard-images`),

  generateImage: (scriptId: string, input: GenerateStoryboardImageInput) =>
    http.post<StoryboardImageJob>(`/video-scripts/${scriptId}/storyboard-images`, input),

  getImageJob: (jobId: string) =>
    http.get<StoryboardImageJob>(`/storyboard-images/${jobId}`),

  getAsset: (assetId: string) =>
    http.blob(`/media/${assetId}/download`),
};
