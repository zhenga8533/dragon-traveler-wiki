export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'effectRef'; name: string }
  | { type: 'italic'; content: string }
  | { type: 'percentRange'; content: string }
  | { type: 'percent'; content: string }
  | { type: 'number'; content: string };

const EFFECT_REF_RE = /\[([^\]]+)\]/g;

/** Extract unique effect reference names from a string. */
export function parseEffectRefs(text: string): string[] {
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = EFFECT_REF_RE.exec(text)) !== null) {
    names.add(match[1]);
  }
  return [...names];
}

/** Split text into plain text, effect reference, and italic segments. */
export function splitEffectRefs(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Match [refs], *italic*, X-Y / X-Y%, X%, bare numbers in priority order.
  const re = /\[([^\]]+)\]|\*([^*]+)\*|(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(?:%)?|(\d+(?:\.\d+)?)%|\b(\d+(?:\.\d+)?)\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1] != null) {
      segments.push({ type: 'effectRef', name: match[1] });
    } else if (match[2] != null) {
      segments.push({ type: 'italic', content: match[2] });
    } else if (match[3] != null) {
      segments.push({ type: 'percentRange', content: match[0] });
    } else if (match[5] != null) {
      segments.push({ type: 'percent', content: match[0] });
    } else {
      segments.push({ type: 'number', content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}
