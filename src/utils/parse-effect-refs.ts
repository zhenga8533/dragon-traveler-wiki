export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'effectRef'; name: string }
  | { type: 'italic'; content: string };

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

  // Match [refs] and *italic*
  const re = /\[([^\]]+)\]|\*([^*]+)\*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1] != null) {
      segments.push({ type: 'effectRef', name: match[1] });
    } else {
      segments.push({ type: 'italic', content: match[2] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}
