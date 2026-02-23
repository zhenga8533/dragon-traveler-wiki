import {
  ActionIcon,
  Badge,
  Collapse,
  Divider,
  Group,
  Image,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { CLASS_ICON_MAP } from '../assets/class';
import type { CharacterClass } from '../types/character';
import type { TeamSynergyResult } from '../utils/team-synergy';

function getScoreColor(score: number): string {
  if (score >= 80) return 'teal';
  if (score >= 60) return 'yellow';
  return 'red';
}

interface TeamSynergyAssistantProps {
  synergy: TeamSynergyResult;
  defaultExpanded?: boolean;
}

export default function TeamSynergyAssistant({
  synergy,
  defaultExpanded = false,
}: TeamSynergyAssistantProps) {
  const [expanded, { toggle }] = useDisclosure(defaultExpanded);

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap">
          <Text size="sm" fw={600}>
            Synergy Assistant
          </Text>
          <Group gap="xs">
            <Badge variant="light" color="orange" size="sm">
              Overdrive: {synergy.overdriveCount}
            </Badge>
            <Badge
              variant="filled"
              color={getScoreColor(synergy.score)}
              size="sm"
            >
              {synergy.score}/100 • {synergy.grade}
            </Badge>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={toggle}
              aria-label={
                expanded ? 'Collapse synergy details' : 'Expand synergy details'
              }
            >
              {expanded ? (
                <IoChevronUp size={16} />
              ) : (
                <IoChevronDown size={16} />
              )}
            </ActionIcon>
          </Group>
        </Group>

        <Progress
          value={synergy.score}
          color={getScoreColor(synergy.score)}
          size="lg"
          radius="xl"
        />

        <Collapse in={expanded}>
          <Stack gap="sm" mt="xs">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {synergy.signals.map((signal) => (
                <Paper key={signal.label} p="xs" radius="sm" withBorder>
                  <Group justify="space-between" align="flex-start" gap="xs">
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size="xs" fw={600}>
                        {signal.label}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {signal.detail}
                      </Text>
                    </Stack>
                    <Badge variant="light" size="xs" color="gray">
                      {Math.round(signal.score)}/{signal.weight}
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>

            {synergy.classCounts.size > 0 && (
              <Group gap="xs" wrap="wrap">
                {Array.from(synergy.classCounts.entries()).map(
                  ([cls, count]) => (
                    <Badge key={cls} variant="outline" size="sm" color="blue">
                      <Group gap={4} wrap="nowrap">
                        <Image
                          src={CLASS_ICON_MAP[cls as CharacterClass]}
                          alt={cls}
                          w={12}
                          h={12}
                          fit="contain"
                        />
                        <Text size="xs" span>
                          {cls}: {count}
                        </Text>
                      </Group>
                    </Badge>
                  )
                )}
              </Group>
            )}

            {synergy.recommendations.length > 0 && (
              <>
                <Divider />
                <Stack gap={4}>
                  <Text size="xs" fw={600}>
                    Suggestions
                  </Text>
                  {synergy.recommendations.slice(0, 4).map((item) => (
                    <Text key={item} size="xs" c="dimmed">
                      • {item}
                    </Text>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
