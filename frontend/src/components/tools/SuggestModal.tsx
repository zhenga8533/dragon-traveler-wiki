import {
  ActionIcon,
  Button,
  Group,
  Image,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import {
  IoAdd,
  IoAddCircleOutline,
  IoClose,
  IoOpenOutline,
} from 'react-icons/io5';
import { FACTION_ICON_MAP } from '../../assets/faction';
import { GEAR_TYPE_ICON_MAP } from '../../assets/gear';
import { QUALITY_ICON_MAP } from '../../assets/quality';
import {
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
  buildEmptyIssueBody,
} from '../../constants/github';
import { showWarningToast } from '../../utils/toast';

export type FieldType = 'text' | 'textarea' | 'select' | 'boolean' | 'number';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  optionIcons?: Record<string, string>;
}

export interface ArrayFieldDef {
  name: string;
  label: string;
  fields: FieldDef[];
  minItems?: number;
  /** When set, outputs a dict keyed by `key` field with `value` field as the value instead of an array */
  toDict?: { key: string; value: string };
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

const AUTO_OPTION_ICON_MAP: Record<string, string> = {
  ...QUALITY_ICON_MAP,
  ...FACTION_ICON_MAP,
  ...GEAR_TYPE_ICON_MAP,
};

function getOptionIcon(field: FieldDef, option: string): string | undefined {
  return field.optionIcons?.[option] ?? AUTO_OPTION_ICON_MAP[option];
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

  const buildJsonData = (
    formValues: Record<string, string | boolean> = values,
    formArrayValues: Record<
      string,
      Record<string, string | boolean>[]
    > = arrayValues
  ) => {
    const excludeSet = new Set(excludeFromJson ?? []);
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (excludeSet.has(f.name)) continue;
      const val = formValues[f.name];
      if (f.type === 'boolean') {
        data[f.name] = val;
      } else if (val !== '') {
        data[f.name] = val;
      }
    }
    for (const af of arrayFields ?? []) {
      const filteredRows = formArrayValues[af.name].filter((row) =>
        af.fields.some((f) => row[f.name] !== '' && row[f.name] !== false)
      );

      if (af.toDict) {
        const dict: Record<string, unknown> = {};
        for (const row of filteredRows) {
          const k = row[af.toDict.key];
          const v = row[af.toDict.value];
          if (typeof k === 'string' && k) {
            const num = typeof v === 'string' && v !== '' ? Number(v) : NaN;
            dict[k] = Number.isNaN(num) ? v : num;
          }
        }
        data[af.name] = dict;
      } else {
        data[af.name] = filteredRows.map((row) => {
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
    }
    return data;
  };

  const handleSubmit = () => {
    if (!isValid()) return;
    const data = buildJsonData();
    const jsonStr = JSON.stringify(data, null, 2);
    const body = `**Paste your JSON below:**\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n`;
    const fullUrl = buildIssueUrl({ title: issueTitle, body });

    if (fullUrl.length > MAX_GITHUB_ISSUE_URL_LENGTH) {
      // URL too long, open issue with template but empty JSON
      const emptyUrl = buildIssueUrl({
        title: issueTitle,
        body: buildEmptyIssueBody(''),
      });
      window.open(emptyUrl, '_blank');
      showWarningToast({
        title: 'JSON is too large for URL',
        message:
          'Please use the Copy JSON button and paste it into the GitHub issue body.',
        autoClose: 8000,
      });
      // Keep modal open so user can copy JSON
      return;
    }

    window.open(fullUrl, '_blank');
    close();
  };

  const isValid = (
    formValues: Record<string, string | boolean> = values,
    formArrayValues: Record<
      string,
      Record<string, string | boolean>[]
    > = arrayValues
  ) => {
    for (const f of fields) {
      const value = formValues[f.name];
      if (f.required && isBlank(value)) return false;

      if (f.type === 'select' && typeof value === 'string' && value !== '') {
        if (f.options && f.options.length > 0 && !f.options.includes(value)) {
          return false;
        }
      }

      if (
        f.type === 'number' &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        Number.isNaN(Number(value))
      ) {
        return false;
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
      const rows = formArrayValues[af.name] ?? [];
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
          if (
            f.type === 'number' &&
            typeof value === 'string' &&
            value.trim() !== '' &&
            Number.isNaN(Number(value))
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const deferredValues = useDeferredValue(values);
  const deferredArrayValues = useDeferredValue(arrayValues);
  const isFormValid = useMemo(
    () => isValid(deferredValues, deferredArrayValues),
    [deferredValues, deferredArrayValues, fields, arrayFields]
  );

  const renderField = (
    f: FieldDef,
    value: string | boolean,
    onChange: (val: string | boolean) => void
  ) => {
    switch (f.type) {
      case 'select': {
        const selectedValue = (value as string) || '';
        const selectedIcon = selectedValue
          ? getOptionIcon(f, selectedValue)
          : undefined;
        return (
          <Select
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            data={(f.options ?? []).map((option) => ({
              value: option,
              label: option,
            }))}
            value={(value as string) || null}
            onChange={(v) => onChange(v ?? '')}
            clearable
            searchable={(f.options?.length ?? 0) >= 10}
            withAsterisk={f.required}
            leftSection={
              selectedIcon ? (
                <Image
                  src={selectedIcon}
                  alt={selectedValue}
                  w={16}
                  h={16}
                  fit="contain"
                />
              ) : undefined
            }
            renderOption={({ option }) => {
              const optionIcon = getOptionIcon(f, option.value);
              if (!optionIcon) return option.label;
              return (
                <Group gap="xs" wrap="nowrap">
                  <Image
                    src={optionIcon}
                    alt={option.label}
                    w={16}
                    h={16}
                    fit="contain"
                  />
                  <span>{option.label}</span>
                </Group>
              );
            }}
          />
        );
      }
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
      case 'number':
        return (
          <TextInput
            key={f.name}
            type="number"
            label={f.label}
            placeholder={f.placeholder}
            value={value as string}
            onChange={(e) => onChange(e.currentTarget.value)}
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
                  <Group gap="xs" style={{ flex: 1 }} grow wrap="wrap">
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
                      aria-label="Remove row"
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
              disabled={!isFormValid}
            >
              Submit Suggestion
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
