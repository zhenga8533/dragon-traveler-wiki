import {
  Alert,
  Anchor,
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { IoInformationCircleOutline } from 'react-icons/io5';
import ResourceBadge from '../components/common/ResourceBadge';
import { getGlassStyles } from '../constants/glass';
import { BRAND_TITLE_STYLE } from '../constants/styles';

const TARGET_ROWS = [
  {
    target: '1,050 layers',
    recommendation: 'F2P safe zone; recommended for almost all players',
    cost: '~5,600 Diamonds total',
    rewards: '2 Golden Slimes',
  },
  {
    target: '2,160 layers',
    recommendation: 'Whale/hoarder push if you have 20k–30k Diamonds saved',
    cost: 'Depends on efficiency + late top-ups',
    rewards: 'Selectable Monsters + Refinement Crystals + 2x Weapon Chests',
  },
];

const EFFICIENCY_ROWS = [
  {
    metric: 'Efficiency Score',
    value: 'Floors Advanced ÷ Base Shovels Used',
    note: 'Base shovels only; do not count extra shovels found on the map',
  },
  {
    metric: 'Guaranteed Base Shovels (7 days)',
    value: '210 (tasks) + 154 (daily pack + free) = 364',
    note: 'Use this fixed baseline after your Day 5 bulk dig to judge whether to push',
  },
  {
    metric: 'Score around 3.0',
    value:
      'Usually on track but 2,160 often needs expensive 120-Diamond shovel buys for final 3 days',
    note: 'Plan late top-ups and re-check score daily',
  },
  {
    metric: 'Score 4.0+',
    value: 'Very efficient routeing (often with maps/guides)',
    note: 'You can reach end milestones with far fewer expensive shovel buys',
  },
];

export default function ShovelEventGuide() {
  const isDark = useComputedColorScheme('dark') === 'dark';

  const sectionCardStyle = {
    ...getGlassStyles(isDark, true),
    boxShadow: isDark
      ? '0 10px 28px rgba(0, 0, 0, 0.28)'
      : '0 8px 24px rgba(124, 58, 237, 0.08)',
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Card
          withBorder
          radius="md"
          p="xl"
          style={{
            ...sectionCardStyle,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.2), transparent 55%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.2), transparent 50%)'
                : 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 55%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.14), transparent 50%)',
              pointerEvents: 'none',
            }}
          />

          <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                <IoInformationCircleOutline size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={1} style={BRAND_TITLE_STYLE}>
                  Shovel Event Guide
                </Title>
                <Text c="dimmed">
                  Practical strategy for weekly shovel events: spend timing,
                  efficiency checks, and stop points.
                </Text>
              </Stack>
            </Group>

            <Alert
              variant="light"
              color="yellow"
              title="Translation note"
              icon={<IoInformationCircleOutline />}
            >
              This section is translated and adapted from a Chinese community
              guide on GameKee:{' '}
              <Anchor
                href="https://www.gamekee.com/lhlr/671116.html"
                target="_blank"
              >
                铲子活动
              </Anchor>
              . Source terms may contain typos or naming differences.
            </Alert>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Main Conclusion &amp; Schedule</Title>
            <Paper p="md" radius="md" withBorder style={sectionCardStyle}>
              <Stack gap="xs">
                <Text>
                  • Daily buy: 800-
                  <ResourceBadge name="Diamond" /> pack (20 shovels).
                </Text>
                <Text>
                  • Hoard for days 1–4. Spend in bulk on day 5 onward.
                </Text>
                <Text>
                  • Reason: bulk digging improves bomb/rocket efficiency and
                  makes your progress-efficiency calculation much more accurate.
                </Text>
                <Text>
                  • Floor objective: expose any tile in the far-right column as
                  fast as possible to advance layers.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Card>

        <Divider />

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Event Targets</Title>
            <Paper p="md" radius="md" withBorder style={sectionCardStyle}>
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
        </Card>

        <Divider />

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Efficiency &amp; Investment Check</Title>
            <Paper p="md" radius="md" withBorder style={sectionCardStyle}>
              <Stack gap="xs">
                <Text>
                  Formula:{' '}
                  <Badge
                    variant="light"
                    color="blue"
                    size="lg"
                    component="span"
                  >
                    Efficiency Score = Floors Advanced ÷ Base Shovels Used
                  </Badge>
                </Text>
                <Text size="sm" c="dimmed">
                  Base shovels = guaranteed task rewards + daily pack/free
                  income only (364 total over 7 days).
                </Text>
              </Stack>
            </Paper>
            <Paper p="md" radius="md" withBorder style={sectionCardStyle}>
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
        </Card>

        <Divider />

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Pro Digging Tips</Title>
            <Paper p="md" radius="md" withBorder style={sectionCardStyle}>
              <Stack gap="xs">
                <Text>
                  1) Trade up, never waste explosives: bombs/rockets are worth
                  about 2 shovels. Use them to clear yellow dirt (2-for-2) or to
                  reveal multiple items at once.
                </Text>
                <Text>
                  2) Stars are a distraction during push. Your only objective is
                  far-right exposure for floor advancement.
                </Text>
                <Text>
                  3) After Day 5 bulk digging, calculate your Efficiency Score
                  before spending extra diamonds.
                </Text>
                <Text>
                  4) If your score is near 3.0, prepare late expensive shovel
                  buys. If 4.0+, you can often save thousands of diamonds.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Card>

        <Divider />

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Diamond Value Note</Title>
            <Paper p="md" radius="md" withBorder style={sectionCardStyle}>
              <Stack gap="xs">
                <Text>
                  If you have surplus diamonds (roughly 20,000–30,000), pushing
                  to 2,160 for weapon chests can be worth it because specific
                  weapons are very rare elsewhere.
                </Text>
                <Text size="sm" c="dimmed">
                  Use your own measured efficiency before committing extra
                  packs.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
