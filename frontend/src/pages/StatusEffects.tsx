import {
  Title,
  Text,
  Container,
  Stack,
  Loader,
  Center,
  Paper,
  Group,
  Badge,
  Image,
  Tabs,
} from '@mantine/core';
import { STATE_COLOR, STATE_ORDER } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import RichText from '../components/RichText';
import type { StatusEffect, StatusEffectType } from '../types/status-effect';

export default function StatusEffects() {
  const { data: effects, loading } = useDataFetch<StatusEffect[]>('data/status-effects.json', []);

  const grouped = STATE_ORDER.reduce<Record<StatusEffectType, StatusEffect[]>>(
    (acc, state) => {
      acc[state] = effects.filter((e) => e.type === state);
      return acc;
    },
    { Buff: [], Debuff: [], Special: [], Control: [], Elemental: [], Blessing: [] },
  );

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Status Effects</Title>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && effects.length === 0 && (
          <Text c="dimmed">No status effect data available yet.</Text>
        )}

        {!loading && effects.length > 0 && (
          <Tabs defaultValue={STATE_ORDER[0]}>
            <Tabs.List>
              {STATE_ORDER.map((state) => (
                <Tabs.Tab key={state} value={state} color={STATE_COLOR[state]}>
                  {state} ({grouped[state].length})
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {STATE_ORDER.map((state) => (
              <Tabs.Panel key={state} value={state} pt="md">
                <Stack gap="sm">
                  {grouped[state].length === 0 && (
                    <Text c="dimmed" size="sm">No {state.toLowerCase()} effects.</Text>
                  )}
                  {grouped[state].map((effect) => (
                    <Paper key={effect.name} p="sm" radius="md" withBorder>
                      <Stack gap="xs">
                        <Group gap="sm" wrap="nowrap">
                          {effect.icon && (
                            <Image src={effect.icon} alt={effect.name} w={28} h={28} fit="contain" />
                          )}
                          <Text fw={600}>{effect.name}</Text>
                          <Badge variant="light" color={STATE_COLOR[effect.type]} size="sm">
                            {effect.type}
                          </Badge>
                        </Group>
                        <RichText text={effect.effect} statusEffects={effects} />
                        {effect.remark && (
                          <Text size="xs" c="dimmed" fs="italic">{effect.remark}</Text>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Tabs.Panel>
            ))}
          </Tabs>
        )}
      </Stack>
    </Container>
  );
}
