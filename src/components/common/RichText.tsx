import { Badge, Group, Popover, Stack, Text } from '@mantine/core';
import { useContext } from 'react';
import { CURSOR_POINTER_STYLE, WHITE_SPACE_PRE_LINE_STYLE } from '@/constants/styles';
import { POPOVER_MAX_WIDTH } from '@/constants/ui';
import { ResourcesContext } from '@/contexts';
import type { Skill, Talent } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent } from '@/hooks';
import { normalizeName, splitEffectRefs } from '@/utils';
import ResourceBadge from '@/components/ui/ResourceBadge';
import StatusEffectBadge from '@/features/wiki/status-effects/components/StatusEffectBadge';

export interface RichTextProps {
  text: string;
  statusEffects: StatusEffect[];
  skills?: Skill[];
  talent?: Talent | null;
  onSkillClick?: (skillName: string) => void;
  onTalentClick?: () => void;
  italic?: boolean;
  lineHeight?: number;
  color?: string;
}

interface ReferenceBadgeProps {
  name: string;
  displayName?: string;
  label: string;
  color: string;
  description?: string;
  lines?: string[];
}

function ReferenceBadge({
  name,
  displayName,
  label,
  color,
  description,
  lines,
}: ReferenceBadgeProps) {
  const hasDetails = Boolean(description) || (lines?.length ?? 0) > 0;
  const badgeLabel = displayName ?? name;

  if (!hasDetails) {
    return (
      <Badge variant="light" color={color} size="sm" component="span">
        {badgeLabel}
      </Badge>
    );
  }

  return (
    <Popover position="top" withArrow shadow="md" closeOnClickOutside withinPortal>
      <Popover.Target>
        <Badge
          variant="light"
          color={color}
          size="sm"
          component="span"
          style={CURSOR_POINTER_STYLE}
        >
          {badgeLabel}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs" maw={POPOVER_MAX_WIDTH}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={600} size="sm">
              {name}
            </Text>
            <Badge variant="light" color={color} size="xs">
              {label}
            </Badge>
          </Group>
          {description && (
            <Text size="xs" style={WHITE_SPACE_PRE_LINE_STYLE}>
              {description}
            </Text>
          )}
          {lines?.map((line, idx) => (
            <Text
              key={`${name}-line-${idx}`}
              size="xs"
              style={WHITE_SPACE_PRE_LINE_STYLE}
            >
              {line}
            </Text>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

const fuzzyNames = (name: string): string[] => {
  const n = normalizeName(name);
  return n.endsWith('s') ? [n, n.slice(0, -1)] : [n, n + 's'];
};

const findByName = <T extends { name: string }>(
  items: T[] | undefined,
  name: string
): T | undefined => {
  const candidates = fuzzyNames(name);
  return items?.find((item) => candidates.includes(normalizeName(item.name)));
};

const findStatusEffect = (
  statusEffects: StatusEffect[],
  name: string
): StatusEffect | undefined => {
  const candidates = fuzzyNames(name);
  return statusEffects.find(
    (se) =>
      candidates.includes(normalizeName(se.name)) ||
      se.alts.some((alt) => candidates.includes(normalizeName(alt)))
  );
};

export default function RichText({
  text,
  statusEffects,
  skills,
  talent,
  onSkillClick,
  onTalentClick,
  italic = false,
  lineHeight,
  color,
}: RichTextProps) {
  const segments = splitEffectRefs(text);
  const { resources } = useContext(ResourcesContext);
  const { accent } = useGradientAccent();
  const talentLines = talent?.talent_levels.map(
    (level) => `Level ${level.level}: ${level.effect}`
  );

  return (
    <Text
      size="sm"
      c={color}
      fs={italic ? 'italic' : undefined}
      component="span"
      style={{ whiteSpace: 'pre-line', lineHeight }}
    >
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.content}</span>;
        }

        if (seg.type === 'italic') {
          return <em key={i}>{seg.content}</em>;
        }

        if (seg.type === 'percentRange') {
          return <Text key={i} component="span" size="sm" c="green" fw={600}>{seg.content}</Text>;
        }

        if (seg.type === 'percent') {
          return <Text key={i} component="span" size="sm" c="yellow" fw={600}>{seg.content}</Text>;
        }

        if (seg.type === 'number') {
          return <Text key={i} component="span" size="sm" c="blue" fw={600}>{seg.content}</Text>;
        }

        const statusEffect = findStatusEffect(statusEffects, seg.name);
        if (statusEffect) {
          return (
            <StatusEffectBadge
              key={i}
              name={statusEffect.name}
              displayName={seg.name}
              statusEffects={statusEffects}
            />
          );
        }

        const skill = findByName(skills, seg.name);
        if (skill) {
          if (onSkillClick) {
            return (
              <Badge
                key={i}
                variant="light"
                color={accent.secondary}
                size="sm"
                component="span"
                style={CURSOR_POINTER_STYLE}
                onClick={() => onSkillClick(skill.name)}
              >
                {seg.name}
              </Badge>
            );
          }
          return (
            <ReferenceBadge
              key={i}
              name={skill.name}
              displayName={seg.name}
              label="Skill"
              color={accent.secondary}
              description={skill.description}
            />
          );
        }

        if (talent && normalizeName(talent.name) === normalizeName(seg.name)) {
          if (onTalentClick) {
            return (
              <Badge
                key={i}
                variant="light"
                color={accent.tertiary}
                size="sm"
                component="span"
                style={CURSOR_POINTER_STYLE}
                onClick={onTalentClick}
              >
                {seg.name}
              </Badge>
            );
          }
          return (
            <ReferenceBadge
              key={i}
              name={talent.name}
              displayName={seg.name}
              label="Talent"
              color={accent.tertiary}
              lines={talentLines}
            />
          );
        }

        const resource = resources.find(
          (r) => normalizeName(r.name) === normalizeName(seg.name)
        );
        if (resource) {
          return <ResourceBadge key={i} name={resource.name} displayName={seg.name} />;
        }

        return (
          <Badge
            key={i}
            variant="light"
            color="gray"
            size="sm"
            component="span"
          >
            {seg.name}
          </Badge>
        );
      })}
    </Text>
  );
}
