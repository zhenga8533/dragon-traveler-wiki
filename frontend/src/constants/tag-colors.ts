const TAG_COLOR_CYCLE = [
  'blue',
  'teal',
  'grape',
  'indigo',
  'cyan',
  'lime',
  'orange',
  'yellow',
  'pink',
  'red',
];

export function getStableTagColor(tag: string): string {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return 'gray';

  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
  }

  return TAG_COLOR_CYCLE[Math.abs(hash) % TAG_COLOR_CYCLE.length];
}
