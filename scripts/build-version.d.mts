import type { Plugin } from 'vite';

export const BUILD_VERSION_FILENAME: string;

export function resolveBuildId(env: Record<string, string>): string;

export function injectBuildMetadata(
  html: string,
  buildId: string,
  appBase: string,
): string;

export function buildVersionPlugin(buildId: string, appBase: string): Plugin;
