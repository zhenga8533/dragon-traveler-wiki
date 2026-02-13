import {
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import ResourceBadge from '../components/ResourceBadge';

const ROTATION_SCHEDULE = [
  {
    cycle: '21-Day Rotation',
    detail: '7-day Howlkin > 7-day Horn > 7-day Invoc',
  },
  {
    cycle: '28-Day Rotation',
    detail: '7-day Howlkin > 7-day Horn > 7-day Invoc > 7-day Shovel',
  },
];

const HOWLKIN_ROWS = [
  {
    cycle: '21 Day',
    start: 'After Howlkin ends',
    end: 'Day 3 of Invoc',
    gems: '14,000',
    daily: '670',
  },
  {
    cycle: '28 Day',
    start: 'After Howlkin ends',
    end: 'Day 2 of Invoc',
    gems: '13,000',
    daily: '465',
  },
];

const HORN_ROWS = [
  {
    cycle: '21 Day',
    start: 'After Horn ends',
    end: 'Day 5 of Pot event',
    gems: '22,000',
    daily: '1,050',
  },
  {
    cycle: '28 Day',
    start: 'After Horn ends',
    end: 'Day 1 of Shovel',
    gems: '18,000',
    daily: '650',
  },
];

const INVOC_ROWS = [
  {
    cycle: '21 Day',
    start: 'After Invoc ends',
    end: 'Day 3 of Howlkin',
    gems: '15,300',
    daily: '730',
  },
  {
    cycle: '28 Day',
    start: 'After Invoc ends',
    end: 'See notes below',
    gems: '10,600',
    daily: '380',
  },
];

export default function RotationalEventHoarding() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>1 Round Rotational Event Hoarding Tips</Title>
          <Text c="dimmed">
            Rotation timing, resource targets, and gem planning for Howlkin,
            Horn, and Invoc events.
          </Text>
          <Text c="dimmed">
            Point target: each event requires 2,700 points.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={2}>Event Rotation Schedule</Title>
          <Paper p="md" radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cycle</Table.Th>
                  <Table.Th>Schedule</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ROTATION_SCHEDULE.map((row) => (
                  <Table.Tr key={row.cycle}>
                    <Table.Td>
                      <Text fw={600}>{row.cycle}</Text>
                    </Table.Td>
                    <Table.Td>{row.detail}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Howlkin (Pot) Strategy</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text size="sm">
                <ResourceBadge name="Mercury Potion" /> = 2 points
              </Text>
              <Text size="sm">
                <ResourceBadge name="Soul Elixir" /> = 10 points
              </Text>
              <Text size="sm">
                <ResourceBadge name="Fate Elixir" /> = 15 points
              </Text>
              <Text>
                <Text span fw={600}>
                  Goal:
                </Text>{' '}
                2,700 points.
              </Text>
              <Text>
                <Text span fw={600}>
                  Daily Sources:
                </Text>{' '}
                Mercury Potion (1x / 2h), Soul Elixir (10x / day), Event
                rewards/packs.
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cycle</Table.Th>
                  <Table.Th>Start Buying</Table.Th>
                  <Table.Th>End Buying</Table.Th>
                  <Table.Th>Gems Used</Table.Th>
                  <Table.Th>Daily Gem Req</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {HOWLKIN_ROWS.map((row) => (
                  <Table.Tr key={row.cycle}>
                    <Table.Td>{row.cycle}</Table.Td>
                    <Table.Td>{row.start}</Table.Td>
                    <Table.Td>{row.end}</Table.Td>
                    <Table.Td>{row.gems}</Table.Td>
                    <Table.Td>{row.daily}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          <Text size="sm" c="dimmed">
            Key action: Buy 20x Fate Elixir from the event; buy only 10x Soul
            Elixir daily.
          </Text>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Horn Strategy</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text size="sm">
                <ResourceBadge name="Golden Horn" /> = 10 points
              </Text>
              <Text size="sm">
                <ResourceBadge name="Fate Horn" /> = 15 points
              </Text>
              <Text>
                <Text span fw={600}>
                  Goal:
                </Text>{' '}
                2,700 points.
              </Text>
              <Text>
                <Text span fw={600}>
                  Daily Sources:
                </Text>{' '}
                Dungeon (5x / 2 days + 3x / week shop), 1000 gem Golden Horn (5x
                / day).
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cycle</Table.Th>
                  <Table.Th>Start Buying</Table.Th>
                  <Table.Th>End Buying</Table.Th>
                  <Table.Th>Gems Used</Table.Th>
                  <Table.Th>Daily Gem Req</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {HORN_ROWS.map((row) => (
                  <Table.Tr key={row.cycle}>
                    <Table.Td>{row.cycle}</Table.Td>
                    <Table.Td>{row.start}</Table.Td>
                    <Table.Td>{row.end}</Table.Td>
                    <Table.Td>{row.gems}</Table.Td>
                    <Table.Td>{row.daily}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          <Text size="sm" c="dimmed">
            Key action: Buy 40x Fate Horn from the event (calculated as 5
            pcs/day).
          </Text>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Invoc Strategy</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text size="sm">
                <ResourceBadge name="Legacy Dragon Crystal" /> = 3 points
              </Text>
              <Text size="sm">
                <ResourceBadge name="Fated Dragon Crystal" /> = 5 points
              </Text>
              <Text>
                <Text span fw={600}>
                  Goal:
                </Text>{' '}
                2,700 points.
              </Text>
              <Text>
                <Text span fw={600}>
                  Daily Sources:
                </Text>{' '}
                Free (10x / day), 300 Diamond (10x / day), 500 Diamond (10x /
                day).
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cycle</Table.Th>
                  <Table.Th>Start Buying</Table.Th>
                  <Table.Th>End Buying</Table.Th>
                  <Table.Th>Gems Used</Table.Th>
                  <Table.Th>Daily Gem Req</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {INVOC_ROWS.map((row) => (
                  <Table.Tr key={row.cycle}>
                    <Table.Td>{row.cycle}</Table.Td>
                    <Table.Td>{row.start}</Table.Td>
                    <Table.Td>{row.end}</Table.Td>
                    <Table.Td>{row.gems}</Table.Td>
                    <Table.Td>{row.daily}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Note (21 Day): Must buy 300-gem Invoc every day. Stop buying the
              500-gem Invoc after Day 3 of Howlkin.
            </Text>
            <Text size="sm" c="dimmed">
              Note (28 Day): Must buy 300-gem Invoc every day. Do not buy the
              500-gem Invoc. Buy exactly 33 red invocations from the event pack.
            </Text>
          </Stack>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Final Summary</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text>
                • Howlkin: Buy 20x Fate Elixir; limit Soul Elixir to 10/day.
              </Text>
              <Text>• Horn: Buy 40x Fate Horn from the event using gems.</Text>
              <Text>
                • Invoc: The 300-gem purchase is mandatory every day for both
                cycles. The 500-gem purchase is only used in the 21-day cycle to
                make up the point deficit.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}
