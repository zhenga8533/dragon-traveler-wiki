import { Badge, Group } from '@mantine/core';
import type {
  CharacterAttackRange,
  CharacterAttackType,
} from '@/features/characters/types';

const ATTACK_TYPE_COLORS: Record<CharacterAttackType, string> = {
  physical: 'red',
  magical: 'violet',
};

const ATTACK_RANGE_COLORS: Record<CharacterAttackRange, string> = {
  melee: 'orange',
  ranged: 'blue',
};

interface CharacterCombatMetadataProps {
  attackRange?: CharacterAttackRange | null;
  attackType?: CharacterAttackType | null;
  combatTags?: string[];
}

function displayLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CharacterCombatMetadata({
  attackRange,
  attackType,
  combatTags = [],
}: CharacterCombatMetadataProps) {
  if (!attackRange && !attackType && combatTags.length === 0) return null;

  return (
    <Group gap="xs" wrap="wrap" aria-label="Combat attributes">
      {attackType && (
        <Badge variant="light" color={ATTACK_TYPE_COLORS[attackType]} size="md">
          {displayLabel(attackType)}
        </Badge>
      )}
      {attackRange && (
        <Badge
          variant="light"
          color={ATTACK_RANGE_COLORS[attackRange]}
          size="md"
        >
          {displayLabel(attackRange)}
        </Badge>
      )}
      {combatTags.map((tag) => (
        <Badge key={tag} variant="outline" color="gray" size="md" tt="none">
          {tag}
        </Badge>
      ))}
    </Group>
  );
}
