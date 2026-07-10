export interface AssetManifestEntry {
  sha256: string;
  size: number;
  type: string;
}

export interface AssetManifest {
  version: number;
  revision: string;
  assets: Record<string, AssetManifestEntry>;
}
