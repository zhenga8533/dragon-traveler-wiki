import type { AssetManifest } from '@/types/asset-manifest';
import { useDataFetch } from './use-data-fetch';

const EMPTY_MANIFEST: AssetManifest = { version: 1, revision: '', assets: {} };

function parseAssetManifest(raw: unknown): AssetManifest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Asset manifest must be an object');
  }
  const manifest = raw as Partial<AssetManifest>;
  if (manifest.version !== 1) {
    throw new Error(`Unsupported asset manifest version: ${manifest.version}`);
  }
  if (!/^[a-f0-9]{64}$/.test(manifest.revision ?? '')) {
    throw new Error('Asset manifest has an invalid revision');
  }
  if (!manifest.assets || typeof manifest.assets !== 'object') {
    throw new Error('Asset manifest has no asset map');
  }
  return manifest as AssetManifest;
}

export function useAssetManifest() {
  return useDataFetch<AssetManifest>(
    'assets/manifest.json',
    EMPTY_MANIFEST,
    parseAssetManifest,
  );
}
