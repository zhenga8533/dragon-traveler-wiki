import { getArtifactIcon } from '@/assets/artifacts';
import { FACTION_WYRM_MAP } from '@/assets/wyrms';
import LastUpdated from '@/components/common/LastUpdated';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import RichText from '@/components/ui/RichText';
import { FACTION_COLOR } from '@/constants/colors';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { GLASS_BORDER, getLoreGlassStyles } from '@/constants/glass';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getCardHoverProps,
  getDetailHeroGradient,
  getHeroIconBoxStyles,
} from '@/constants/styles';
import { IMAGE_SIZE } from '@/constants/ui';
import FactionTag from '@/features/characters/components/FactionTag';
import QualityIcon from '@/features/characters/components/QualityIcon';
import GlobalBadge from '@/components/ui/GlobalBadge';
import type { Team } from '@/features/teams/types';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import type { Faction } from '@/types/faction';
import { toEntitySlug } from '@/utils/entity-slug';
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
import { IoCreate, IoTrash } from 'react-icons/io5';
import { Link } from 'react-router-dom';

export function TeamHeroSection({
  team,
  factionInfo,
  artifactMap,
  statusEffects,
  isDark,
  tooltipProps,
  onRequestEdit,
  onRequestDelete,
}: {
  team: Team;
  factionInfo: Faction | null;
  artifactMap: Map<string, Artifact>;
  statusEffects: StatusEffect[];
  isDark: boolean;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
  onRequestEdit: () => void;
  onRequestDelete?: () => void;
}) {
  const { accent } = useGradientAccent();
  const factionColor = FACTION_COLOR[team.faction];

  return (
    <Box style={DETAIL_HERO_WRAPPER_STYLES}>
      <Box style={getDetailHeroGradient(isDark, factionColor)} />

      <Container
        size="lg"
        style={{ position: 'relative', zIndex: 1 }}
        py={{ base: 'lg', sm: 'xl' }}
      >
        <Stack gap="lg">
          <Group justify="space-between">
            <Breadcrumbs
              items={[{ label: 'Teams', path: '/teams' }, { label: team.name }]}
            />
            <Group gap="xs">
              <Button
                variant="light"
                color={accent.primary}
                leftSection={<IoCreate size={14} />}
                onClick={onRequestEdit}
              >
                Edit Team
              </Button>
              {onRequestDelete && (
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IoTrash size={14} />}
                  onClick={onRequestDelete}
                >
                  Delete
                </Button>
              )}
            </Group>
          </Group>

          <Group gap="lg" align="flex-start" wrap="nowrap">
            <Box style={getHeroIconBoxStyles(isDark, factionColor, true)}>
              <Image
                src={FACTION_WYRM_MAP[team.faction]}
                alt={`${team.faction} Whelp`}
                w={64}
                h={64}
                fit="contain"
              />
            </Box>

            <Stack gap={6} style={{ flex: 1 }}>
              <Title
                order={1}
                c={isDark ? 'white' : 'dark'}
                fz={{ base: '1.5rem', sm: '2.125rem' }}
                style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
              >
                {team.name}
              </Title>
              <Group gap="sm" align="center">
                <Text size="sm" c="dimmed">
                  by{' '}
                  <Text span c={`${accent.primary}.7`} inherit>
                    {team.author}
                  </Text>
                </Text>
                <LastUpdated timestamp={team.last_updated} />
              </Group>
              <Group gap="sm" mt={4}>
                <FactionTag faction={team.faction} size="lg" />
                <Badge
                  size="lg"
                  variant="outline"
                  color={getContentTypeColor(team.content_type, 'All')}
                >
                  {normalizeContentType(team.content_type, 'All')}
                </Badge>
              </Group>
            </Stack>
          </Group>

          {team.description && (
            <Paper
              p="md"
              radius="md"
              withBorder
              {...getCardHoverProps({
                style: getLoreGlassStyles(isDark),
              })}
            >
              <Text size="sm" lh={1.6}>
                {team.description}
              </Text>
            </Paper>
          )}

          {factionInfo && (
            <Paper
              p="md"
              radius="md"
              withBorder
              {...getCardHoverProps({
                style: getLoreGlassStyles(isDark),
              })}
            >
              <Stack gap="sm">
                <Title order={2} size="h3">
                  Faction Overview
                </Title>
                <RichText
                  text={factionInfo.description}
                  statusEffects={statusEffects}
                  lineHeight={1.6}
                />
                {factionInfo.recommended_artifacts.length > 0 && (
                  <Stack gap="xs" mt={4}>
                    <Text size="sm" fw={600}>
                      Recommended Artifacts
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                      {factionInfo.recommended_artifacts.map((artifactName) => {
                        const iconSrc = getArtifactIcon(artifactName);
                        const artifact = artifactMap.get(artifactName);
                        return (
                          <Tooltip
                            key={artifactName}
                            label={artifactName}
                            {...tooltipProps}
                          >
                            <Link
                              to={`/artifacts/${toEntitySlug(artifactName)}`}
                              style={{ textDecoration: 'none' }}
                            >
                              <Paper
                                p="sm"
                                radius="md"
                                withBorder
                                {...getCardHoverProps({ interactive: true })}
                              >
                                <Group
                                  gap="sm"
                                  wrap="nowrap"
                                  align="flex-start"
                                >
                                  <Box
                                    style={{
                                      width: 64,
                                      height: 64,
                                      borderRadius: 'var(--mantine-radius-md)',
                                      background: isDark
                                        ? 'rgba(0,0,0,0.3)'
                                        : 'rgba(255,255,255,0.6)',
                                      border: isDark
                                        ? GLASS_BORDER.dark
                                        : GLASS_BORDER.light,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {iconSrc && (
                                      <Image
                                        src={iconSrc}
                                        alt={artifactName}
                                        w={52}
                                        h={52}
                                        fit="contain"
                                        radius="sm"
                                        loading="lazy"
                                      />
                                    )}
                                  </Box>
                                  <Stack gap={4} style={{ minWidth: 0 }}>
                                    <Text size="sm" fw={600} lineClamp={1}>
                                      <Text
                                        span
                                        size="sm"
                                        fw={600}
                                        c={`${accent.primary}.7`}
                                      >
                                        {artifactName}
                                      </Text>
                                    </Text>
                                    <Group gap={6} align="center">
                                      {artifact?.quality && (
                                        <QualityIcon
                                          quality={artifact.quality}
                                          size={IMAGE_SIZE.ICON_LG}
                                        />
                                      )}
                                      {artifact && (
                                        <GlobalBadge
                                          isGlobal={artifact.is_global}
                                          size="xs"
                                        />
                                      )}
                                      {artifact && (
                                        <Badge
                                          variant="light"
                                          size="xs"
                                          color={accent.secondary}
                                        >
                                          {artifact.rows}x{artifact.columns}
                                        </Badge>
                                      )}
                                    </Group>
                                    {artifact && (
                                      <Text size="xs" c="dimmed" lineClamp={1}>
                                        {artifact.lore || 'No lore available.'}
                                      </Text>
                                    )}
                                  </Stack>
                                </Group>
                                {!artifact && (
                                  <Text size="xs" c="dimmed" mt={4}>
                                    Artifact info unavailable
                                  </Text>
                                )}
                              </Paper>
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </SimpleGrid>
                  </Stack>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
