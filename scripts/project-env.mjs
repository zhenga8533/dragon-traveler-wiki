import path from 'node:path';
import { loadEnv } from 'vite';

const DEFAULT_DATA_DIR = 'data';
const DEFAULT_ASSETS_DIR = '../dragon-traveler-data/assets';

export function loadProjectEnv(mode, projectRoot) {
  const env = loadEnv(mode, projectRoot, '');

  return {
    env,
    dataDir: path.resolve(projectRoot, env.DATA_DIR || DEFAULT_DATA_DIR),
    assetsDir: path.resolve(projectRoot, env.ASSETS_DIR || DEFAULT_ASSETS_DIR),
  };
}
