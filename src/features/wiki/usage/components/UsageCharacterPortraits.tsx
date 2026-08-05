import { Badge, Group, Text } from '@mantine/core';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import {
  getCharacterRoutePath,
  getCharacterRouteSlug,
} from '@/features/characters/utils/character-route';
import { CURSOR_POINTER_STYLE } from '@/constants/styles';
import type { useMobileTooltip } from '@/hooks';

const DEFAULT_VISIBLE_COUNT = 6;

interface UsageCharacterPortraitsProps {
  itemSlug: string;
  characters: Character[];
  expanded: boolean;
  onToggleExpanded: () => void;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
  visibleCount?: number;
}

export default function UsageCharacterPortraits({
  itemSlug,
  characters,
  expanded,
  onToggleExpanded,
  tooltipProps,
  visibleCount = DEFAULT_VISIBLE_COUNT,
}: UsageCharacterPortraitsProps) {
  if (characters.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  const shownCharacters = expanded
    ? characters
    : characters.slice(0, visibleCount);
  const remaining = characters.length - visibleCount;

  return (
    <Group gap={4} wrap="wrap">
      {shownCharacters.map((character) => {
        const routeSlug = getCharacterRouteSlug(character);
        return (
          <CharacterPortrait
            key={`${itemSlug}-${routeSlug}`}
            name={character.name}
            size={32}
            quality={character.quality}
            assetKey={routeSlug}
            routePath={getCharacterRoutePath(character)}
            link
            tooltip={character.name}
            tooltipProps={tooltipProps}
          />
        );
      })}
      {remaining > 0 && (
        <Badge
          variant="light"
          color="gray"
          size="sm"
          style={CURSOR_POINTER_STYLE}
          onClick={onToggleExpanded}
        >
          {expanded ? 'Show less' : `+${remaining} more`}
        </Badge>
      )}
    </Group>
  );
}
