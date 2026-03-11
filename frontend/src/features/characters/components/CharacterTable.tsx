import { Group, ScrollArea, Table, Text, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getMinWidthStyle } from '@/constants/styles';
import { useGradientAccent } from '@/hooks';
import type { Character } from '@/features/characters/types';
import {
  getCharacterIdentityKey,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import ClassTag from './ClassTag';
import FactionTag from './FactionTag';
import GlobalBadge from '@/features/teams/components/GlobalBadge';
import QualityIcon from './QualityIcon';
import SortableTh from '@/components/ui/SortableTh';
import TierBadge from '@/features/teams/components/TierBadge';
import CharacterPortrait from './CharacterPortrait';

interface CharacterTableProps {
  pageItems: Character[];
  characterNameCounts: Map<string, number>;
  sortCol: string | null;
  sortDir: 'asc' | 'desc';
  handleSort: (key: string) => void;
  selectedTierListName: string | null;
  getTierLabel: (char: Character) => string | undefined;
}

export default function CharacterTable({
  pageItems,
  characterNameCounts,
  sortCol,
  sortDir,
  handleSort,
  selectedTierListName,
  getTierLabel,
}: CharacterTableProps) {
  const { accent } = useGradientAccent();

  return (
    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
      <Table striped highlightOnHover style={getMinWidthStyle(560)}>
        <Table.Thead>
          <Table.Tr>
            <SortableTh
              sortKey="name"
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
            >
              Name
            </SortableTh>
            <SortableTh
              sortKey="quality"
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
            >
              Quality
            </SortableTh>
            <Table.Th>Class</Table.Th>
            <SortableTh
              sortKey="factions"
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
            >
              Factions
            </SortableTh>
            <SortableTh
              sortKey="global"
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
            >
              Global
            </SortableTh>
            {selectedTierListName && (
              <SortableTh
                sortKey="tier"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
              >
                Tier
              </SortableTh>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pageItems.map((char) => (
            <Table.Tr
              key={getCharacterIdentityKey(char)}
              style={{ cursor: 'pointer' }}
            >
              <Table.Td>
                <UnstyledButton
                  component={Link}
                  to={getCharacterRoutePath(char, characterNameCounts)}
                >
                  <Group gap="sm" wrap="nowrap">
                    <CharacterPortrait
                      name={char.name}
                      size={40}
                      quality={char.quality}
                      borderWidth={3}
                      style={{ flexShrink: 0 }}
                    />
                    <Text size="sm" fw={500} c={`${accent.primary}.7`}>
                      {char.name}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Table.Td>
              <Table.Td>
                <QualityIcon quality={char.quality} />
              </Table.Td>
              <Table.Td>
                <ClassTag characterClass={char.character_class} />
              </Table.Td>
              <Table.Td className="table-badge-cell">
                <Group gap={4} wrap="wrap" className="table-badge-list">
                  {char.factions.map((faction) => (
                    <FactionTag key={faction} faction={faction} size="xs" />
                  ))}
                </Group>
              </Table.Td>
              <Table.Td>
                <GlobalBadge isGlobal={char.is_global} size="sm" />
              </Table.Td>
              {selectedTierListName && (
                <Table.Td>
                  {(() => {
                    const tier = getTierLabel(char);
                    return tier ? <TierBadge tier={tier} size="sm" /> : null;
                  })()}
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
