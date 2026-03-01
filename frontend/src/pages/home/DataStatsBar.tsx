import {
  Box,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import {
  IoCube,
  IoDiamond,
  IoFlame,
  IoFlash,
  IoGrid,
  IoPaw,
  IoPeople,
  IoShield,
  IoSparkles,
  IoStatsChart,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import LastUpdated from '../../components/common/LastUpdated';
import { getCardHoverProps } from '../../constants/styles';
import { useDataFetch } from '../../hooks';
import type { Artifact } from '../../types/artifact';
import type { Character } from '../../types/character';
import type { Gear } from '../../types/gear';
import type { Howlkin } from '../../types/howlkin';
import type { NoblePhantasm } from '../../types/noble-phantasm';
import type { Resource } from '../../types/resource';
import type { StatusEffect } from '../../types/status-effect';
import type { Subclass } from '../../types/subclass';
import type { Wyrmspell } from '../../types/wyrmspell';

type StatItem = {
  label: string;
  to: string;
  color: string;
  icon: React.ComponentType<{ size?: number }>;
  count: number;
};

export default function DataStatsBar() {
  const { data: characters, loading: l1 } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: wyrmspells, loading: l2 } = useDataFetch<Wyrmspell[]>(
    'data/wyrmspells.json',
    []
  );
  const { data: statusEffects, loading: l3 } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );
  const { data: artifacts, loading: l4 } = useDataFetch<Artifact[]>(
    'data/artifacts.json',
    []
  );
  const { data: resources, loading: l5 } = useDataFetch<Resource[]>(
    'data/resources.json',
    []
  );
  const { data: noblePhantasms, loading: l6 } = useDataFetch<NoblePhantasm[]>(
    'data/noble_phantasm.json',
    []
  );
  const { data: howlkins, loading: l7 } = useDataFetch<Howlkin[]>(
    'data/howlkins.json',
    []
  );
  const { data: gear, loading: l8 } = useDataFetch<Gear[]>(
    'data/gear.json',
    []
  );
  const { data: subclasses, loading: l9 } = useDataFetch<Subclass[]>(
    'data/subclasses.json',
    []
  );

  const mostRecentUpdate = useMemo(() => {
    let latest = 0;
    const updateLists: Array<Array<{ last_updated?: number }>> = [
      characters,
      wyrmspells,
      statusEffects,
      artifacts,
      resources,
      noblePhantasms,
      howlkins,
      gear,
      subclasses,
    ];
    for (const list of updateLists) {
      for (const item of list) {
        const updatedAt = item.last_updated ?? 0;
        if (updatedAt > latest) latest = updatedAt;
      }
    }
    return latest;
  }, [
    artifacts,
    characters,
    howlkins,
    noblePhantasms,
    resources,
    statusEffects,
    wyrmspells,
    gear,
    subclasses,
  ]);

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9) {
    return (
      <Card padding="lg" radius="md" withBorder {...getCardHoverProps()}>
        <SimpleGrid cols={{ base: 3, sm: 5, lg: 9 }} spacing={0}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Stack key={i} gap={4} align="center" py="sm">
              <Skeleton height={28} width={28} radius="md" />
              <Skeleton height={12} width={30} radius="xs" />
              <Skeleton height={10} width={50} radius="xs" />
            </Stack>
          ))}
        </SimpleGrid>
      </Card>
    );
  }

  const stats: StatItem[] = [
    {
      label: 'Artifacts',
      count: artifacts.length,
      to: '/artifacts',
      color: 'teal',
      icon: IoDiamond,
    },
    {
      label: 'Characters',
      count: characters.length,
      to: '/characters',
      color: 'blue',
      icon: IoPeople,
    },
    {
      label: 'Gear',
      count: gear.length,
      to: '/gear',
      color: 'teal',
      icon: IoShield,
    },
    {
      label: 'Howlkins',
      count: howlkins.length,
      to: '/howlkins',
      color: 'orange',
      icon: IoPaw,
    },
    {
      label: 'Noble Phantasms',
      count: noblePhantasms.length,
      to: '/noble-phantasms',
      color: 'teal',
      icon: IoFlash,
    },
    {
      label: 'Resources',
      count: resources.length,
      to: '/resources',
      color: 'teal',
      icon: IoCube,
    },
    {
      label: 'Status Effects',
      count: statusEffects.length,
      to: '/status-effects',
      color: 'cyan',
      icon: IoSparkles,
    },
    {
      label: 'Subclasses',
      count: subclasses.length,
      to: '/subclasses',
      color: 'grape',
      icon: IoGrid,
    },
    {
      label: 'Wyrmspells',
      count: wyrmspells.length,
      to: '/wyrmspells',
      color: 'indigo',
      icon: IoFlame,
    },
  ];

  return (
    <Card padding="lg" radius="md" withBorder {...getCardHoverProps()}>
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon variant="light" color="grape" size="lg" radius="md">
            <IoStatsChart size={20} />
          </ThemeIcon>
          <Title order={2} size="h3">Wiki Database</Title>
        </Group>
        <SimpleGrid cols={{ base: 3, sm: 5, lg: 9 }} spacing={0}>
          {stats.map((stat) => (
            <Box
              key={stat.to}
              component={Link}
              to={stat.to}
              py="sm"
              px="xs"
              style={{ textDecoration: 'none' }}
            >
              <Stack gap={4} align="center">
                <ThemeIcon
                  variant="light"
                  color={stat.color}
                  size="lg"
                  radius="md"
                >
                  <stat.icon size={16} />
                </ThemeIcon>
                <Text fw={700} size="sm" ta="center" lh={1}>
                  {stat.count}
                </Text>
                <Text size="xs" c="dimmed" ta="center" lh={1.3}>
                  {stat.label}
                </Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
        <Group justify="center">
          <LastUpdated timestamp={mostRecentUpdate} />
        </Group>
      </Stack>
    </Card>
  );
}
