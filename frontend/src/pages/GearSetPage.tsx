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
                        <Group gap="xs" wrap="wrap">
                          <Badge
                            variant="light"
                            color="blue"
                            size="sm"
                            w="fit-content"
                          >
                            {item.type}
                          </Badge>
                          {QUALITY_ICON_MAP[item.quality] && (
                            <Tooltip label={item.quality}>
                              <Image
                                src={QUALITY_ICON_MAP[item.quality]}
                                alt={item.quality}
                                h={18}
                                w="auto"
                                fit="contain"
                              />
                            </Tooltip>
                          )}
                          <Badge
                            variant="light"
                            color="grape"
                            size="sm"
                            w="fit-content"
                          >
                            {item.quality}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed" fs="italic" lineClamp={2}>
                          {item.lore}
                        </Text>
                      </Stack>
                    </Group>

                    <Stack gap="xs">
                      <Text fw={600} size="sm">
                        Stats
                      </Text>
                      <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="xs">
                        {Object.entries(item.stats).map(
                          ([statName, statValue]) => (
                            <Paper key={statName} withBorder radius="sm" p="xs">
                              <Stack gap={2}>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {statName}
                                </Text>
                                <Text size="sm" fw={700} lineClamp={1}>
                                  {String(statValue)}
                                </Text>
                              </Stack>
                            </Paper>
                          )
                        )}
                      </SimpleGrid>
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
