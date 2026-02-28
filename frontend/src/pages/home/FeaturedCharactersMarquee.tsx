import {
  Badge,
  Box,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useContext } from 'react';
import { IoTrophy } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import CharacterCard from '../../components/character/CharacterCard';
import { TIER_COLOR } from '../../constants/colors';
import { normalizeContentType } from '../../constants/content-types';
import { TierListReferenceContext } from '../../contexts/tier-list-reference-context';
import { useDataFetch } from '../../hooks';
import type { Character } from '../../types/character';
import styles from './FeaturedCharactersMarquee.module.css';

export default function FeaturedCharactersMarquee() {
  const {
    tierLists,
    loading: loadingTiers,
    selectedTierListName,
  } = useContext(TierListReferenceContext);
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const loading = loadingTiers || loadingChars;

  if (loading) {
    return (
      <Group gap="md" justify="center" wrap="wrap">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={100} width={80} radius="md" />
        ))}
      </Group>
    );
  }

  const tierList =
    tierLists.find((t) => t.name === selectedTierListName) ?? tierLists[0];
  if (!tierList) return null;

  const charMap = new Map(characters.map((c) => [c.name, c]));
  const topEntries = tierList.entries.filter(
    (e) => e.tier === 'S+' || e.tier === 'S'
  );

  if (topEntries.length === 0) return null;

  const renderCharacters = (keyPrefix: string) =>
    topEntries.map((entry) => {
      const char = charMap.get(entry.character_name);
      return (
        <Stack
          key={`${keyPrefix}-${entry.character_name}`}
          className={styles.featuredItem}
          gap={2}
          align="center"
          style={{ flexShrink: 0, width: 90 }}
        >
          <CharacterCard
            name={entry.character_name}
            quality={char?.quality}
            size={64}
          />
          <Badge size="xs" variant="light" color={TIER_COLOR[entry.tier]}>
            {entry.tier}
          </Badge>
        </Stack>
      );
    });

  const duration = topEntries.length * 3;

  const tierListMeta = [
    tierList.name,
    normalizeContentType(tierList.content_type, 'All'),
    tierList.author ? `by ${tierList.author}` : null,
  ].filter(Boolean);

  return (
    <Stack gap="md">
      <Group gap="sm" justify="center">
        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
          <IoTrophy size={20} />
        </ThemeIcon>
        <Title order={4}>Featured Characters</Title>
      </Group>
      {tierListMeta.length > 0 && (
        <Text size="xs" c="dimmed" ta="center">
          {tierListMeta.join(' \u00b7 ')}
        </Text>
      )}
      <Box
        style={{
          overflowX: 'hidden',
          overflowY: 'visible',
          padding: '8px 0',
          width: '100%',
          contain: 'inline-size',
          maskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        <Group
          className={styles.marqueeTrack}
          gap="md"
          wrap="nowrap"
          style={{
            '--marquee-duration': `${duration}s`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = 'running';
          }}
        >
          {renderCharacters('a')}
          {renderCharacters('b')}
        </Group>
      </Box>
      <Group gap="md" justify="center">
        <Text
          component={Link}
          to="/tier-list"
          size="xs"
          c="dimmed"
          td="underline"
        >
          View full tier list
        </Text>
        <Text
          component={Link}
          to="/characters"
          size="xs"
          c="dimmed"
          td="underline"
        >
          Browse all characters
        </Text>
      </Group>
    </Stack>
  );
}
