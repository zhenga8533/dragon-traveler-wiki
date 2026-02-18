import { Badge, Group, Popover, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext } from 'react';
import { ResourcesContext } from '../contexts';
import type { Skill, Talent } from '../types/character';
import type { StatusEffect } from '../types/status-effect';
import { splitEffectRefs } from '../utils/parse-effect-refs';
import ResourceBadge from './ResourceBadge';
import StatusEffectBadge from './StatusEffectBadge';

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
  label: string;
  color: string;
  description?: string;
  lines?: string[];
}

function ReferenceBadge({
  name,
  label,
  color,
  description,
  lines,
}: ReferenceBadgeProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const hasDetails = Boolean(description) || (lines?.length ?? 0) > 0;

  if (!hasDetails) {
    return (
      <Badge variant="light" color={color} size="sm" component="span">
        {name}
      </Badge>
    );
  }

  return (
    <Popover opened={opened} position="top" withArrow shadow="md">
      <Popover.Target>
        <Badge
          variant="light"
          color={color}
          size="sm"
          component="span"
          style={{ cursor: 'pointer' }}
          onMouseEnter={open}
          onMouseLeave={close}
        >
          {name}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <Stack gap="xs" maw={320}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={600} size="sm">
              {name}
            </Text>
            <Badge variant="light" color={color} size="xs">
              {label}
            </Badge>
          </Group>
          {description && (
            <Text size="xs" style={{ whiteSpace: 'pre-line' }}>
              {description}
            </Text>
          )}
          {lines?.map((line, idx) => (
            <Text
              key={`${name}-line-${idx}`}
              size="xs"
              style={{ whiteSpace: 'pre-line' }}
            >
              {line}
            </Text>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

const normalizeName = (value: string) => value.trim().toLowerCase();

const findByName = <T extends { name: string }>(
  items: T[] | undefined,
  name: string
): T | undefined =>
  items?.find((item) => normalizeName(item.name) === normalizeName(name));

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

        // effectRef
        const statusEffect = findByName(statusEffects, seg.name);
        if (statusEffect) {
          return (
            <StatusEffectBadge
              key={i}
              name={statusEffect.name}
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
                color="grape"
                size="sm"
                component="span"
                style={{ cursor: 'pointer' }}
                onClick={() => onSkillClick(skill.name)}
              >
                {skill.name}
              </Badge>
            );
          }
          return (
            <ReferenceBadge
              key={i}
              name={skill.name}
              label="Skill"
              color="grape"
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
                color="indigo"
                size="sm"
                component="span"
                style={{ cursor: 'pointer' }}
                onClick={onTalentClick}
              >
                {talent.name}
              </Badge>
            );
          }
          return (
            <ReferenceBadge
              key={i}
              name={talent.name}
              label="Talent"
              color="indigo"
              lines={talentLines}
            />
          );
        }

        const resource = resources.find(
          (r) => normalizeName(r.name) === normalizeName(seg.name)
        );
        if (resource) {
          return <ResourceBadge key={i} name={resource.name} />;
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
