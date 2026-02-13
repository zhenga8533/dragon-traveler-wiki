import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useState } from 'react';
import {
  IoAdd,
  IoAddCircleOutline,
  IoClose,
  IoOpenOutline,
} from 'react-icons/io5';
import { GITHUB_REPO_URL } from '../constants';

export type FieldType = 'text' | 'textarea' | 'select' | 'boolean';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ArrayFieldDef {
  name: string;
  label: string;
  fields: FieldDef[];
  minItems?: number;
}

export interface SuggestModalProps {
  buttonLabel: string;
  modalTitle: string;
  issueTitle: string;
  fields: FieldDef[];
  arrayFields?: ArrayFieldDef[];
  /** Fields to exclude from the JSON body sent to GitHub (e.g., informational-only fields) */
  excludeFromJson?: string[];
}

function buildIssueUrl(params: { title: string; body: string }): string {
  return `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

function buildInitialValues(
  fields: FieldDef[]
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const f of fields) {
    values[f.name] = f.type === 'boolean' ? true : '';
  }
  return values;
}

function buildInitialArrayRow(
  fields: FieldDef[]
): Record<string, string | boolean> {
  return buildInitialValues(fields);
}

function isBlank(value: string | boolean | undefined): boolean {
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return value === false || value == null;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SuggestModal({
  buttonLabel,
  modalTitle,
  issueTitle,
  fields,
  arrayFields,
  excludeFromJson,
}: SuggestModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    buildInitialValues(fields)
  );
  const [arrayValues, setArrayValues] = useState<
    Record<string, Record<string, string | boolean>[]>
  >(() => {
    const init: Record<string, Record<string, string | boolean>[]> = {};
    for (const af of arrayFields ?? []) {
      init[af.name] = [buildInitialArrayRow(af.fields)];
    }
    return init;
  });

  const reset = useCallback(() => {
    setValues(buildInitialValues(fields));
    const init: Record<string, Record<string, string | boolean>[]> = {};
    for (const af of arrayFields ?? []) {
      init[af.name] = [buildInitialArrayRow(af.fields)];
    }
    setArrayValues(init);
  }, [fields, arrayFields]);

  const handleOpen = () => {
    reset();
    open();
  };

  const setField = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const setArrayField = (
    arrayName: string,
    index: number,
    fieldName: string,
    value: string | boolean
  ) => {
    setArrayValues((prev) => {
      const rows = [...prev[arrayName]];
      rows[index] = { ...rows[index], [fieldName]: value };
      return { ...prev, [arrayName]: rows };
    });
  };

  const addArrayRow = (arrayName: string) => {
    const af = arrayFields?.find((a) => a.name === arrayName);
    if (!af) return;
    setArrayValues((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], buildInitialArrayRow(af.fields)],
    }));
  };

  const removeArrayRow = (arrayName: string, index: number) => {
    setArrayValues((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const buildJsonData = () => {
    const excludeSet = new Set(excludeFromJson ?? []);
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (excludeSet.has(f.name)) continue;
      const val = values[f.name];
      if (f.type === 'boolean') {
        data[f.name] = val;
      } else if (val !== '') {
        data[f.name] = val;
      }
    }
    for (const af of arrayFields ?? []) {
      data[af.name] = arrayValues[af.name]
        .filter((row) =>
          af.fields.some((f) => row[f.name] !== '' && row[f.name] !== false)
        )
        .map((row) => {
          const entry: Record<string, unknown> = {};
          for (const f of af.fields) {
            const val = row[f.name];
            if (f.type === 'boolean') {
              entry[f.name] = val;
            } else if (val !== '') {
              entry[f.name] = val;
            }
          }
          return entry;
        });
    }
    return data;
  };

  const handleSubmit = () => {
    if (!isValid()) return;
    const data = buildJsonData();
    const jsonStr = JSON.stringify(data, null, 2);
    const body = `**Paste your JSON below:**\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n`;
    const url = buildIssueUrl({ title: issueTitle, body });
    window.open(url, '_blank');
    close();
  };

  const isValid = () => {
    for (const f of fields) {
      const value = values[f.name];
      if (f.required && isBlank(value)) return false;

      if (f.type === 'select' && typeof value === 'string' && value !== '') {
        if (f.options && f.options.length > 0 && !f.options.includes(value)) {
          return false;
        }
      }

      if (
        (f.name === 'link' || f.name.toLowerCase().includes('url')) &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        !isValidUrl(value)
      ) {
        return false;
      }
    }

    for (const af of arrayFields ?? []) {
      const rows = arrayValues[af.name] ?? [];
      const filledRows = rows.filter((row) =>
        af.fields.some((f) => !isBlank(row[f.name]))
      );

      if ((af.minItems ?? 0) > 0 && filledRows.length < (af.minItems ?? 0)) {
        return false;
      }

      for (const row of filledRows) {
        for (const f of af.fields) {
          const value = row[f.name];
          if (f.required && isBlank(value)) return false;
          if (
            f.type === 'select' &&
            typeof value === 'string' &&
            value !== '' &&
            f.options &&
            f.options.length > 0 &&
            !f.options.includes(value)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const renderField = (
    f: FieldDef,
    value: string | boolean,
    onChange: (val: string | boolean) => void
  ) => {
    switch (f.type) {
      case 'select':
        return (
          <Select
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            data={f.options ?? []}
            value={(value as string) || null}
            onChange={(v) => onChange(v ?? '')}
            clearable
            withAsterisk={f.required}
          />
        );
      case 'boolean':
        return (
          <Switch
            key={f.name}
            label={f.label}
            checked={value as boolean}
            onChange={(e) => onChange(e.currentTarget.checked)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            value={value as string}
            onChange={(e) => onChange(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={6}
            withAsterisk={f.required}
          />
        );
      default:
        return (
          <TextInput
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            value={value as string}
            onChange={(e) => onChange(e.currentTarget.value)}
            withAsterisk={f.required}
          />
        );
    }
  };

  return (
    <>
      <Button
        variant="light"
        size="xs"
        leftSection={<IoAddCircleOutline size={16} />}
        onClick={handleOpen}
      >
        {buttonLabel}
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={modalTitle}
        size="lg"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Fill out the form below. This will open a GitHub issue with your
            suggestion.
          </Text>

          {fields.map((f) =>
            renderField(f, values[f.name], (val) => setField(f.name, val))
          )}

          {arrayFields?.map((af) => (
            <Stack key={af.name} gap="xs">
              <Group justify="space-between">
                <Text fw={500} size="sm">
                  {af.label}
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IoAdd size={14} />}
                  onClick={() => addArrayRow(af.name)}
                >
                  Add
                </Button>
              </Group>
              {arrayValues[af.name]?.map((row, idx) => (
                <Group key={idx} gap="xs" align="flex-end" wrap="nowrap">
                  <Group gap="xs" style={{ flex: 1 }} wrap="wrap">
                    {af.fields.map((f) =>
                      renderField(f, row[f.name], (val) =>
                        setArrayField(af.name, idx, f.name, val)
                      )
                    )}
                  </Group>
                  {arrayValues[af.name].length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeArrayRow(af.name, idx)}
                    >
                      <IoClose size={14} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>
          ))}

          <Group justify="flex-end" mt="md">
            <Button
              leftSection={<IoOpenOutline size={16} />}
              onClick={handleSubmit}
              disabled={!isValid()}
            >
              Submit Suggestion
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
