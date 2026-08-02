export interface ProjectEnvironment {
  env: Record<string, string>;
  dataDir: string;
  assetsDir: string;
}

export function loadProjectEnv(
  mode: string,
  projectRoot: string,
): ProjectEnvironment;
