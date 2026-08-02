import {
  ActionIcon,
  Alert,
  Button,
  Group,
  NumberInput,
  ScrollArea,
  Stack,
  Switch,
  Table,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IoAdd,
  IoInformationCircleOutline,
  IoTrashOutline,
  IoTrendingDown,
  IoTrendingUp,
} from 'react-icons/io5';
import { StaticSurface } from '@/components/ui/Surface';
import type {
  DiamondSourceRow,
  DiamondSourceType,
} from '@/features/calculators/diamond/types';
import { parseNumberInput } from '@/utils';

interface DiamondSourceTableProps {
  type: DiamondSourceType;
  sources: DiamondSourceRow[];
  accentColor: string;
  onUpdate: (
    type: DiamondSourceType,
    id: string,
    updater: (source: DiamondSourceRow) => DiamondSourceRow
  ) => void;
  onAdd: (type: DiamondSourceType) => void;
  onRemove: (type: DiamondSourceType, id: string) => void;
}

const COVERAGE_NOTES: Record<DiamondSourceType, string> = {
  gain:
    'This calculator does not include every possible diamond income source by default. Common extras include Level 8 affection date, Luminary codex, Wyrmbone Ruins, Lifetime achievements, and World Tree Covenant. Add missing entries as custom sources.',
  spend:
    'This calculator does not include every possible diamond spend source by default. Common extras include Shovel event, Fate treasure hunt items, Aurora Crystal, and Auction House. Add missing entries as custom sources.',
};

export default function DiamondSourceTable({
  type,
  sources,
  accentColor,
  onUpdate,
  onAdd,
  onRemove,
}: DiamondSourceTableProps) {
  const isGain = type === 'gain';
  const label = isGain ? 'Gain' : 'Spend';
  const customInputStyles = {
    input: { borderColor: 'var(--mantine-primary-color-6)' },
  };

  return (
    <StaticSurface p="lg">
      <Stack gap="md">
        <Title order={2} size="h3">
          <Group gap="xs">
            {isGain ? <IoTrendingUp /> : <IoTrendingDown />}
            {isGain ? 'Gains' : 'Spending'}
          </Group>
        </Title>
        <Alert
          variant="light"
          color={accentColor}
          title="Coverage Note"
          icon={<IoInformationCircleOutline />}
        >
          {COVERAGE_NOTES[type]}
        </Alert>
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder miw={480}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={48} />
                <Table.Th>Source</Table.Th>
                <Table.Th w={110}>Every (days)</Table.Th>
                <Table.Th w={110}>Amount</Table.Th>
                <Table.Th w={56}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sources.map((source) => (
                <Table.Tr
                  key={source.id}
                  style={{
                    opacity: source.enabled ? 1 : 0.4,
                    ...(source.isCustom
                      ? {
                          backgroundColor:
                            'var(--mantine-primary-color-light)',
                        }
                      : undefined),
                  }}
                >
                  <Table.Td w={48}>
                    <Switch
                      size="xs"
                      color={accentColor}
                      checked={source.enabled}
                      onChange={(event) => {
                        const enabled = event.currentTarget.checked;
                        onUpdate(type, source.id, (current) => ({
                          ...current,
                          enabled,
                        }));
                      }}
                      aria-label={
                        source.enabled ? 'Disable source' : 'Enable source'
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    {source.isCustom ? (
                      <TextInput
                        value={source.label}
                        onChange={(event) => {
                          const labelValue = event.currentTarget.value;
                          onUpdate(type, source.id, (current) => ({
                            ...current,
                            label: labelValue,
                          }));
                        }}
                        placeholder="Source name"
                        size="xs"
                        styles={customInputStyles}
                      />
                    ) : (
                      source.label
                    )}
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={source.cadenceDays ?? ''}
                      onChange={(value) =>
                        onUpdate(type, source.id, (current) => ({
                          ...current,
                          cadenceDays: parseNumberInput(value),
                        }))
                      }
                      min={1}
                      max={365}
                      size="xs"
                      placeholder="days"
                      styles={source.isCustom ? customInputStyles : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={source.amount ?? ''}
                      onChange={(value) =>
                        onUpdate(type, source.id, (current) => ({
                          ...current,
                          amount: parseNumberInput(value),
                        }))
                      }
                      min={0}
                      max={999999999}
                      size="xs"
                      thousandSeparator=","
                      styles={source.isCustom ? customInputStyles : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => onRemove(type, source.id)}
                      aria-label="Remove source"
                    >
                      <IoTrashOutline size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
        <Group justify="flex-end">
          <Button
            size="xs"
            color={accentColor}
            variant="light"
            leftSection={<IoAdd size={14} />}
            onClick={() => onAdd(type)}
          >
            Add {label} Source
          </Button>
        </Group>
      </Stack>
    </StaticSurface>
  );
}
