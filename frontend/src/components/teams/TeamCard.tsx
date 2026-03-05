import {
  Badge,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import React from 'react';
import { FACTION_WYRM_MAP } from '../../assets/wyrms';
import { FACTION_COLOR } from '../../constants/colors';
import { normalizeContentType } from '../../constants/content-types';
import {
  getCardHoverProps,
  LINK_BLOCK_RESET_STYLE,
} from '../../constants/styles';
import type { Character } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Team } from '../../types/team';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryQuality,
} from '../../utils/team-bench';
import FactionTag from '../common/FactionTag';
import TeamCharacterAvatars from './TeamCharacterAvatars';

interface TeamCardProps {
  team: Team;
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  onNavigate?: () => void;
  actions: React.ReactNode;
}

export default function TeamCard({
  team,
  charMap,
  characterByIdentity,
  onNavigate,
  actions,
}: TeamCardProps) {
  const isLargeTeamCardLayout = useMediaQuery('(min-width: 75em)');

  const borderTopStyle = `3px solid var(--mantine-color-${FACTION_COLOR[team.faction as FactionName] ?? 'violet'}-5)`;

  const interactiveProps = onNavigate
    ? {
        ...getCardHoverProps({
          interactive: true,
          style: {
            ...LINK_BLOCK_RESET_STYLE,
            borderTop: borderTopStyle,
          },
        }),
        onClick: onNavigate,
        role: 'link' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate();
          }
        },
      }
    : {
        style: { borderTop: borderTopStyle },
      };

  return (
    <Paper p="md" radius="md" withBorder {...interactiveProps}>
      <Stack gap="sm">
        {/* Header: whelp + name + actions */}
        <Group
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="xs"
        >
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            {FACTION_WYRM_MAP[team.faction as FactionName] && (
              <Image
                src={FACTION_WYRM_MAP[team.faction as FactionName]}
                alt={`${team.faction} Whelp`}
                w={32}
                h={32}
                fit="contain"
                style={{ flexShrink: 0 }}
              />
            )}
            <Text fw={700} size="md" c="violet" lineClamp={1}>
              {team.name || 'Untitled'}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            {actions}
          </Group>
        </Group>

        {/* Tags */}
        <Group gap="xs">
          {team.faction && (
            <FactionTag faction={team.faction as FactionName} size="sm" />
          )}
          {team.content_type && (
            <Badge variant="light" size="sm" color="gray">
              {normalizeContentType(team.content_type, 'All')}
            </Badge>
          )}
        </Group>

        {/* Author + description */}
        {(team.author || team.description) && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {team.author && (
              <>
                by{' '}
                <Text span c="violet" fw={500} inherit>
                  {team.author}
                </Text>
              </>
            )}
            {team.description && (
              <Text span inherit>
                {team.author ? ' · ' : ''}
                {team.description}
              </Text>
            )}
          </Text>
        )}

        {/* Member portraits */}
        <Paper p="xs" radius="sm" bg="var(--mantine-color-default-hover)">
          <Stack gap="xs">
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <Badge
                size="xs"
                variant="light"
                color="blue"
                style={{
                  minWidth: 66,
                  justifyContent: 'center',
                }}
              >
                Main {team.members.length}
              </Badge>
              <TeamCharacterAvatars
                refs={team.members.map((member) => ({
                  name: member.character_name,
                  quality: member.character_quality,
                }))}
                preferredByName={charMap}
                byIdentity={characterByIdentity}
                size={isLargeTeamCardLayout ? 64 : 56}
                layout="wrap"
                gap={isLargeTeamCardLayout ? 6 : 4}
                wrap={isLargeTeamCardLayout ? 'nowrap' : 'wrap'}
                maxVisible={isLargeTeamCardLayout ? 6 : 5}
              />
            </Group>
            {(team.bench?.length ?? 0) > 0 && (
              <>
                <Divider size="xs" />
                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <Badge
                    size="xs"
                    variant="light"
                    color="gray"
                    style={{
                      minWidth: 66,
                      justifyContent: 'center',
                    }}
                  >
                    Subs {team.bench!.length}
                  </Badge>
                  <TeamCharacterAvatars
                    refs={team.bench!.map((entry) => ({
                      name: getTeamBenchEntryName(entry),
                      quality: getTeamBenchEntryQuality(entry),
                    }))}
                    preferredByName={charMap}
                    byIdentity={characterByIdentity}
                    size={isLargeTeamCardLayout ? 52 : 44}
                    isSubstitute
                    layout="wrap"
                    gap={isLargeTeamCardLayout ? 6 : 4}
                    wrap={isLargeTeamCardLayout ? 'nowrap' : 'wrap'}
                    maxVisible={isLargeTeamCardLayout ? 6 : 5}
                  />
                </Group>
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
