import { Text } from '@mantine/core';
import { splitEffectRefs } from '../utils/parse-effect-refs';
import StatusEffectBadge from './StatusEffectBadge';
import type { StatusEffect } from '../types/status-effect';

export default function RichText({
  text,
  statusEffects,
}: {
  text: string;
  statusEffects: StatusEffect[];
}) {
  const segments = splitEffectRefs(text);

  return (
    <Text size="sm" component="span">
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.content}</span>
        ) : (
          <StatusEffectBadge key={i} name={seg.name} statusEffects={statusEffects} />
        )
      )}
    </Text>
  );
}
