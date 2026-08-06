const BUILD_ID_PLACEHOLDER = '__DT_BUILD_ID__';
const APP_BASE_PLACEHOLDER = '__DT_APP_BASE__';

export const BUILD_VERSION_FILENAME = 'version.json';

export function resolveBuildId(env) {
  return (
    env.VITE_BUILD_ID?.trim() ||
    env.GITHUB_RUN_ID?.trim() ||
    env.GITHUB_SHA?.trim() ||
    'development'
  );
}

export function injectBuildMetadata(html, buildId, appBase) {
  return html
    .replaceAll(BUILD_ID_PLACEHOLDER, JSON.stringify(buildId))
    .replaceAll(APP_BASE_PLACEHOLDER, JSON.stringify(appBase));
}

export function buildVersionPlugin(buildId, appBase) {
  return {
    name: 'build-version',
    transformIndexHtml(html) {
      return injectBuildMetadata(html, buildId, appBase);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: BUILD_VERSION_FILENAME,
        source: `${JSON.stringify({ buildId })}\n`,
      });
    },
  };
}
