export const SETTINGS_EXPORT_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function buildSettingsExport(
  storage: Pick<Storage, 'getItem'>,
  storageKeys: readonly string[],
  savedAt = new Date(),
): string {
  const data: Record<string, string> = {};
  for (const key of storageKeys) {
    const value = storage.getItem(key);
    if (value !== null) data[key] = value;
  }

  return JSON.stringify(
    {
      version: SETTINGS_EXPORT_VERSION,
      savedAt: savedAt.toISOString(),
      data,
    },
    null,
    2,
  );
}

export function importSettings(
  text: string,
  storage: Pick<Storage, 'setItem'>,
  storageKeys: readonly string[],
): string | null {
  const supportedKeys = new Set(storageKeys);
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      !isRecord(parsed) ||
      parsed.version !== SETTINGS_EXPORT_VERSION ||
      !isRecord(parsed.data)
    ) {
      return 'Invalid settings file.';
    }

    const entries = Object.entries(parsed.data);
    if (
      entries.some(
        ([key, value]) => !supportedKeys.has(key) || typeof value !== 'string',
      )
    ) {
      return 'Settings file contains unsupported keys or values.';
    }

    for (const [key, value] of entries) {
      storage.setItem(key, value as string);
    }
    return null;
  } catch {
    return 'Could not parse JSON. Make sure you pasted the full settings export.';
  }
}
