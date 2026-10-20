import catalog from './releases.json';
export interface Release {
  version: string;
  channel: 'beta' | 'stable';
  date: string;
  sha256: string;
  size: number;
  sourceCommit: string;
  notes: string;
  downloadURL: string;
  manifestPath?: string;
  versionCode?: number;
  minSdk?: number;
  board?: string;
}
export const releases = catalog as { repository: string; ink: Release | null; frame: Release | null };
export const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
