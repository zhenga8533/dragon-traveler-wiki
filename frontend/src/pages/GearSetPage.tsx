import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMemo } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import { getGearIcon } from '../assets/gear';
import { QUALITY_ICON_MAP } from '../assets/quality';
import Breadcrumbs from '../components/Breadcrumbs';
import { DetailPageLoading } from '../components/PageLoadingSkeleton';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Gear, GearSet, GearType } from '../types/gear';

const GEAR_TYPE_ORDER: GearType[] = [
  'Headgear',
  'Chestplate',
  'Bracers',
  'Boots',
  'Weapon',
  'Accessory',
];

export default function GearSetPage() {
  const { setName } = useParams<{ setName: string }>();
  const navigate = useNavigate();
  const { data: gear, loading } = useDataFetch<Gear[]>('data/gear.json', []);
  const { data: gearSets } = useDataFetch<GearSet[]>('data/gear_sets.json', []);

  const decodedSetName = setName ? decodeURIComponent(setName) : '';

  const setItems = useMemo(() => {
    if (!decodedSetName) return [];
    return gear
      .filter((item) => item.set.toLowerCase() === decodedSetName.toLowerCase())
      .sort((a, b) => {
        const typeCmp =
          GEAR_TYPE_ORDER.indexOf(a.type) - GEAR_TYPE_ORDER.indexOf(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.name.localeCompare(b.name);
      });
  }, [decodedSetName, gear]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <DetailPageLoading />
      </Container>
    );
  }

  if (!decodedSetName || setItems.length === 0) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Text size="xl" fw={500}>
            Gear set not found
          </Text>
          <Button
            onClick={() => navigate('/gear')}
            leftSection={<IoArrowBack />}
          >
            Back to Gear
          </Button>
        </Stack>
      </Container>
    );
  }

  const setData = gearSets.find(
    (entry) => entry.name.toLowerCase() === decodedSetName.toLowerCase()
  );
  const setBonus = setData?.set_bonus ?? setItems[0]?.set_bonus;

  return (
    <Box>
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Breadcrumbs
            items={[
              { label: 'Gear', path: '/gear' },
              { label: decodedSetName },
            ]}
          />

          <Stack gap={6}>
            <Group gap="sm" align="center" wrap="wrap">
              <Title order={1}>{decodedSetName} Set</Title>
              <Badge variant="light" color="grape" size="lg">
                {setItems.length} item{setItems.length !== 1 ? 's' : ''}
              </Badge>
              <Tooltip label="SSR">
                <Image
                  src={QUALITY_ICON_MAP.SSR}
                  alt="SSR"
                  h={24}
                  w="auto"
                  fit="contain"
                />
              </Tooltip>
            </Group>
            {setBonus && (
              <Text c="dimmed" size="sm">
                {setBonus.quantity}-piece set bonus: {setBonus.description}
              </Text>
            )}
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {setItems.map((item) => {
              const iconSrc = getGearIcon(item.type, item.name);
              return (
                <Paper key={item.name} p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group gap="md" wrap="nowrap" align="flex-start">
                      {iconSrc && (
                        <Image
                          src={iconSrc}
                          alt={item.name}
                          w={64}
                          h={64}
                          fit="contain"
                          radius="sm"
                        />
                      )}
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text fw={700} size="lg" c="violet" lineClamp={1}>
                          {item.name}
                        </Text>
                        <Badge
                          variant="light"
                          color="blue"
                          size="sm"
                          w="fit-content"
                        >
                          {item.type}
                        </Badge>
                        <Text size="sm" c="dimmed" fs="italic" lineClamp={2}>
                          {item.lore}
                        </Text>
                      </Stack>
                    </Group>

                    <Stack gap={4}>
                      <Text fw={600} size="sm">
                        Stats
                      </Text>
                      {Object.entries(item.stats).map(
                        ([statName, statValue]) => (
                          <Group
                            key={statName}
                            justify="space-between"
                            gap="md"
                          >
                            <Text size="sm" c="dimmed">
                              {statName}
                            </Text>
                            <Text size="sm" fw={600}>
                              {String(statValue)}
                            </Text>
                          </Group>
                        )
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
