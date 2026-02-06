import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Paper,
  Slider,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useState } from 'react';

type StarLevel = {
  label: string;
  stars: number;
  value: string;
  copies: number;
  fodder: number;
  divineCrystals: number;
  tier: 'base' | 'purple' | 'red' | 'legendary' | 'divine';
};

const STAR_LEVELS: StarLevel[] = [
  {
    label: '5 Star',
    stars: 5,
    value: '5',
    copies: 1,
    fodder: 0,
    divineCrystals: 0,
    tier: 'base',
  },
  {
    label: '6 Star',
    stars: 6,
    value: '6',
    copies: 2,
    fodder: 0,
    divineCrystals: 0,
    tier: 'base',
  },
  {
    label: 'Purple 1',
    stars: 1,
    value: 'p1',
    copies: 2,
    fodder: 1,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 2',
    stars: 2,
    value: 'p2',
    copies: 4,
    fodder: 2,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 3',
    stars: 3,
    value: 'p3',
    copies: 4,
    fodder: 4,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 4',
    stars: 4,
    value: 'p4',
    copies: 6,
    fodder: 6,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 5',
    stars: 5,
    value: 'p5',
    copies: 6,
    fodder: 9,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Purple 6',
    stars: 6,
    value: 'p6',
    copies: 8,
    fodder: 12,
    divineCrystals: 0,
    tier: 'purple',
  },
  {
    label: 'Red 1',
    stars: 1,
    value: 'r1',
    copies: 8,
    fodder: 16,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 2',
    stars: 2,
    value: 'r2',
    copies: 10,
    fodder: 20,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 3',
    stars: 3,
    value: 'r3',
    copies: 10,
    fodder: 24,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 4',
    stars: 4,
    value: 'r4',
    copies: 12,
    fodder: 27,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 5',
    stars: 5,
    value: 'r5',
    copies: 12,
    fodder: 30,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Red 6',
    stars: 6,
    value: 'r6',
    copies: 14,
    fodder: 34,
    divineCrystals: 0,
    tier: 'red',
  },
  {
    label: 'Legendary',
    stars: 0,
    value: 'legendary',
    copies: 18,
    fodder: 40,
    divineCrystals: 0,
    tier: 'legendary',
  },
  {
    label: 'Divine 1',
    stars: 1,
    value: 'd1',
    copies: 20,
    fodder: 40,
    divineCrystals: 2,
    tier: 'divine',
  },
  {
    label: 'Divine 2',
    stars: 2,
    value: 'd2',
    copies: 22,
    fodder: 40,
    divineCrystals: 5,
    tier: 'divine',
  },
  {
    label: 'Divine 3',
    stars: 3,
    value: 'd3',
    copies: 24,
    fodder: 40,
    divineCrystals: 8,
    tier: 'divine',
  },
  {
    label: 'Divine 4',
    stars: 4,
    value: 'd4',
    copies: 28,
    fodder: 40,
    divineCrystals: 12,
    tier: 'divine',
  },
  {
    label: 'Divine 5',
    stars: 5,
    value: 'd5',
    copies: 32,
    fodder: 40,
    divineCrystals: 17,
    tier: 'divine',
  },
];

const TIER_COLORS = {
  base: '#718096',
  purple: '#805AD5',
  red: '#E53E3E',
  legendary: '#06B6D4',
  divine: '#F59E0B',
} as const;

const TIER_BADGE_COLORS = {
  base: 'gray',
  purple: 'grape',
  red: 'red',
  legendary: 'cyan',
  divine: 'orange',
} as const;

type StarSelectorProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function StarSelector({ label, value, onChange }: StarSelectorProps) {
  const selectedLevel = STAR_LEVELS[value];

  const marks = STAR_LEVELS.map((level, index) => ({
    value: index,
    label: (
      <Box style={{ position: 'relative', display: 'inline-block' }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={TIER_COLORS[level.tier]}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {level.stars > 0 && (
          <Text
            size="xs"
            fw={700}
            style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textShadow: '0 0 3px rgba(0,0,0,0.5)',
              lineHeight: 1,
            }}
          >
            {level.stars}
          </Text>
        )}
      </Box>
    ),
  }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <Badge color={TIER_BADGE_COLORS[selectedLevel.tier]} size="lg">
          {selectedLevel.label}
        </Badge>
      </Group>
      <Box px="xs" pb="xl">
        <Slider
          value={value}
          onChange={onChange}
          min={0}
          max={STAR_LEVELS.length - 1}
          step={1}
          marks={marks}
          styles={{
            markLabel: { marginTop: 8 },
            mark: { display: 'none' },
          }}
          color={TIER_BADGE_COLORS[selectedLevel.tier]}
        />
      </Box>
    </Stack>
  );
}

export default function StarUpgradeCalculator() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [targetIndex, setTargetIndex] = useState<number>(
    STAR_LEVELS.length - 1
  );

  const currentLevel = STAR_LEVELS[currentIndex];
  const targetLevel = STAR_LEVELS[targetIndex];

  const isValidSelection = currentIndex < targetIndex;
  const copiesNeeded = isValidSelection
    ? targetLevel.copies - currentLevel.copies
    : 0;
  const fodderNeeded = isValidSelection
    ? targetLevel.fodder - currentLevel.fodder
    : 0;
  const divineCrystalsNeeded = isValidSelection
    ? targetLevel.divineCrystals - currentLevel.divineCrystals
    : 0;

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Star Upgrade Calculator</Title>
          <Text c="dimmed">
            Calculate resources needed for character star upgrades.
          </Text>
        </div>

        {/* Calculator Card */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={3}>Resource Calculator</Title>

            <StarSelector
              label="Current Star Level"
              value={currentIndex}
              onChange={setCurrentIndex}
            />

            <StarSelector
              label="Target Star Level"
              value={targetIndex}
              onChange={setTargetIndex}
            />

            {isValidSelection ? (
              <Paper p="md" withBorder bg="var(--mantine-color-blue-light)">
                <Stack gap="sm">
                  <Title order={4}>Resources Needed</Title>
                  <Group gap="xl">
                    <div>
                      <Text size="sm" c="dimmed">
                        5 Star Copies
                      </Text>
                      <Text size="xl" fw={700}>
                        {copiesNeeded}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" c="dimmed">
                        6 Star Fodder
                      </Text>
                      <Text size="xl" fw={700}>
                        {fodderNeeded}
                      </Text>
                    </div>
                    {divineCrystalsNeeded > 0 && (
                      <div>
                        <Text size="sm" c="dimmed">
                          Divine Crystals
                        </Text>
                        <Text size="xl" fw={700}>
                          {divineCrystalsNeeded}
                        </Text>
                      </div>
                    )}
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <Paper p="md" withBorder bg="var(--mantine-color-red-light)">
                <Text c="red" ta="center">
                  Target star level must be higher than current star level
                </Text>
              </Paper>
            )}
          </Stack>
        </Card>

        {/* Reference Table */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Star Upgrade Reference Table</Title>
            <Text size="sm" c="dimmed">
              All values are cumulative from 5 Star base
            </Text>

            <Table.ScrollContainer minWidth={400}>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Star Level</Table.Th>
                    <Table.Th ta="right">5 Star Copies</Table.Th>
                    <Table.Th ta="right">6 Star Fodder</Table.Th>
                    <Table.Th ta="right">Divine Crystals</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {STAR_LEVELS.map((star) => (
                    <Table.Tr key={star.value}>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge
                            color={TIER_BADGE_COLORS[star.tier]}
                            variant="light"
                          >
                            {star.label}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{star.copies}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{star.fodder}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{star.divineCrystals || '-'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
