import {
  Alert,
  Anchor,
  Badge,
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IoInformationCircleOutline } from 'react-icons/io5';
import ResourceBadge from '../components/ResourceBadge';

const TARGET_ROWS = [
  {
    target: '1,050 layers',
    recommendation: 'Recommended for almost all players',
    cost: '~5,600 Diamonds total',
    rewards: '2 Golden Slimes',
  },
  {
    target: '2,160 layers',
    recommendation: 'Push if you want Monster eggs / Weapon Chests',
    cost: 'Depends on efficiency + late top-ups',
    rewards: 'Select eggs + 1,740–2,160 weapon chest milestones',
  },
];

const EFFICIENCY_ROWS = [
  {
    metric: 'Progress Efficiency',
    value: 'Layers Reached ÷ Outside Shovels (Task + Bought)',
    note: '3.0+ is good; with guides/videos 4.0–5.0 is possible',
  },
  {
    metric: 'Guaranteed Outside Shovels',
    value: '210 (tasks) + 154 (daily pack + free) = 364',
    note: 'Use this baseline before deciding final-day top-ups',
  },
  {
    metric: 'If efficiency is around 3.0',
    value: '2,160 often needs 99-shovel packs on the final 3 days',
    note: 'Plus small top-ups if needed',
  },
];

export default function ShovelEventGuide() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Shovel Event Guide</Title>
          <Text c="dimmed">
            Practical strategy for the weekly shovel event: when to spend, how
            to measure efficiency, and when to stop.
          </Text>
        </Stack>

        <Alert
          variant="light"
          color="yellow"
          title="Translation note"
          icon={<IoInformationCircleOutline />}
        >
          This guide is translated/adapted from GameKee:{' '}
          <Anchor
            href="https://www.gamekee.com/lhlr/671116.html"
            target="_blank"
          >
            铲子活动
          </Anchor>
          . Source terms may contain typos or naming differences.
        </Alert>

        <Stack gap="sm">
          <Title order={2}>Main Conclusion &amp; Schedule</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text>
                • Daily buy: 800-
                <ResourceBadge name="Diamond" /> pack (20 shovels).
              </Text>
              <Text>• Hoard for days 1–4. Spend in bulk on day 5 onward.</Text>
              <Text>
                • Reason: bulk digging improves bomb/rocket efficiency and makes
                your progress-efficiency calculation much more accurate.
              </Text>
            </Stack>
          </Paper>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Event Targets</Title>
          <Paper p="md" radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Target</Table.Th>
                  <Table.Th>When to Aim</Table.Th>
                  <Table.Th>Diamond Cost</Table.Th>
                  <Table.Th>Notable Reward</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {TARGET_ROWS.map((row) => (
                  <Table.Tr key={row.target}>
                    <Table.Td>
                      <Text fw={600}>{row.target}</Text>
                    </Table.Td>
                    <Table.Td>{row.recommendation}</Table.Td>
                    <Table.Td>{row.cost}</Table.Td>
                    <Table.Td>{row.rewards}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          <Text size="sm" c="dimmed">
            Priority is layer push, not stars. Stars carry over to next event;
            layers do not.
          </Text>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Efficiency &amp; Investment Check</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text>
                Formula:{' '}
                <Badge variant="light" color="blue" size="lg">
                  Progress Efficiency = Layers Reached ÷ Outside Shovels
                </Badge>
              </Text>
              <Text size="sm" c="dimmed">
                Outside shovels = task rewards + purchased packs.
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Metric</Table.Th>
                  <Table.Th>Value</Table.Th>
                  <Table.Th>Interpretation</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {EFFICIENCY_ROWS.map((row) => (
                  <Table.Tr key={row.metric}>
                    <Table.Td>
                      <Text fw={600}>{row.metric}</Text>
                    </Table.Td>
                    <Table.Td>{row.value}</Table.Td>
                    <Table.Td>{row.note}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Pro Digging Tips</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text>
                1) Trade less for more: bombs/rockets/chests are worth ~2
                shovels. Use them only when they clear at least 2-shovel value
                (for example yellow dirt) or chain into another item.
              </Text>
              <Text>
                2) Ignore stars while digging. Do not spend bombs/rockets only
                to collect star clusters.
              </Text>
              <Text>
                3) Save utility items for expensive blocks. Avoid paying 2
                shovels for yellow dirt when an item can clear it.
              </Text>
              <Text>
                4) Mist trick: in the rightmost column, if a tile is covered by
                fog, digging the tile immediately to its left can still advance
                layer count.
              </Text>
            </Stack>
          </Paper>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={2}>Diamond Value Note</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Text>
                If you have surplus diamonds (roughly 20,000–30,000), pushing to
                2,160 for weapon chests can be worth it because specific weapons
                are very rare elsewhere.
              </Text>
              <Text size="sm" c="dimmed">
                Use your own measured efficiency before committing extra packs.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}
