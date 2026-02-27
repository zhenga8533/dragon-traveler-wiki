import {
  Badge,
  Box,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import RichText from '../../components/common/RichText';
import type { Character } from '../../types/character';
import type { StatusEffect } from '../../types/status-effect';

interface CharacterPageSkillsSectionProps {
  character: Character;
  statusEffects: StatusEffect[];
  talentIcon: string | undefined;
  skillIcons: Map<string, string>;
  scrollToSkill: (skillName: string) => void;
  scrollToTalent: () => void;
}

export default function CharacterPageSkillsSection({
  character,
  statusEffects,
  talentIcon,
  skillIcons,
  scrollToSkill,
  scrollToTalent,
}: CharacterPageSkillsSectionProps) {
  const talent = character.talent;
  const talentLevels = talent?.talent_levels ?? [];

  return (
    <>
      {/* Talent Section */}
      {talentLevels.length > 0 && (
        <Paper id="talent-section" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="md">
              {talentIcon && (
                <Image
                  src={talentIcon}
                  alt="Talent"
                  w={54}
                  h={74}
                  fit="contain"
                  loading="lazy"
                />
              )}
              <Title order={3}>{talent?.name ?? 'Talent'}</Title>
            </Group>

            <Stack gap="sm">
              {talentLevels.map((talentLevel, idx) => (
                <Box key={talentLevel.level}>
                  <Group gap="xs" mb="xs">
                    <Badge variant="filled" color="blue">
                      Level {talentLevel.level}
                    </Badge>
                  </Group>
                  <RichText
                    text={talentLevel.effect}
                    statusEffects={statusEffects}
                    skills={character.skills}
                    talent={character.talent ?? null}
                    onSkillClick={scrollToSkill}
                    onTalentClick={scrollToTalent}
                  />
                  {idx < talentLevels.length - 1 && <Divider mt="sm" />}
                </Box>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Skills Section */}
      {character.skills.length > 0 && (
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Skills</Title>

            <Stack gap="md">
              {character.skills.map((skill) => {
                const skillIcon = skillIcons.get(skill.name);
                return (
                  <Paper
                    key={skill.name}
                    id={`skill-${skill.name}`}
                    p="md"
                    radius="md"
                    withBorder
                  >
                    <Stack gap="sm">
                      <Group gap="md" justify="space-between" wrap="nowrap">
                        <Group gap="md" style={{ flex: 1 }}>
                          {skillIcon && (
                            <Image
                              src={skillIcon}
                              alt={skill.name}
                              w={60}
                              h={60}
                              fit="contain"
                              loading="lazy"
                            />
                          )}
                          <Group gap="xs" align="center">
                            <Text fw={600} size="lg">
                              {skill.name}
                            </Text>
                            {skill.type && (
                              <Badge size="lg" variant="light" color="grape">
                                {skill.type}
                              </Badge>
                            )}
                          </Group>
                        </Group>
                        <Group gap="xs" style={{ flexShrink: 0 }}>
                          <Badge
                            size="lg"
                            variant={skill.cooldown === 0 ? 'light' : 'filled'}
                            color={skill.cooldown === 0 ? 'gray' : 'blue'}
                          >
                            {skill.cooldown === 0
                              ? 'Passive'
                              : `${skill.cooldown}s`}
                          </Badge>
                        </Group>
                      </Group>
                      <RichText
                        text={skill.description}
                        statusEffects={statusEffects}
                        skills={character.skills}
                        talent={character.talent ?? null}
                        onSkillClick={scrollToSkill}
                        onTalentClick={scrollToTalent}
                      />
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
