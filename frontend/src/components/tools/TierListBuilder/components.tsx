import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  Popover,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { memo, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  IoChevronDown,
  IoChevronUp,
  IoTrash,
} from 'react-icons/io5';
import {
  CONTENT_TYPE_OPTIONS,
  type ContentType,
} from '../../../constants/content-types';
import { getCardHoverProps } from '../../../constants/styles';
import {
  CHARACTER_GRID_SPACING,
  TRANSITION,
} from '../../../constants/ui';
import type { Character } from '../../../types/character';
import CharacterCard from '../../character/CharacterCard';
import CharacterNoteButton from '../CharacterNoteButton';
import { INPUT_COMMIT_DELAY_MS } from './utils';

export const TierListMetaFields = memo(function TierListMetaFields({
  name,
  author,
  categoryName,
  description,
  onNameCommit,
  onAuthorCommit,
  onCategoryChange,
  onDescriptionCommit,
}: {
  name: string;
  author: string;
  categoryName: ContentType;
  description: string;
  onNameCommit: (value: string) => void;
  onAuthorCommit: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onDescriptionCommit: (value: string) => void;
}) {
  const [nameInput, setNameInput] = useState(name);
  const [authorInput, setAuthorInput] = useState(author);
  const [descriptionInput, setDescriptionInput] = useState(description);

  useEffect(() => {
    setNameInput(name);
  }, [name]);

  useEffect(() => {
    setAuthorInput(author);
  }, [author]);

  useEffect(() => {
    setDescriptionInput(description);
  }, [description]);

  useEffect(() => {
    if (nameInput === name) return;
    const timer = setTimeout(() => {
      onNameCommit(nameInput);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [nameInput, name, onNameCommit]);

  useEffect(() => {
    if (authorInput === author) return;
    const timer = setTimeout(() => {
      onAuthorCommit(authorInput);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [authorInput, author, onAuthorCommit]);

  useEffect(() => {
    if (descriptionInput === description) return;
    const timer = setTimeout(() => {
      onDescriptionCommit(descriptionInput);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [descriptionInput, description, onDescriptionCommit]);

  return (
    <Group gap="sm" wrap="wrap">
      <TextInput
        placeholder="Tier list name..."
        value={nameInput}
        onChange={(e) => setNameInput(e.currentTarget.value)}
        style={{ flex: 1, minWidth: 150 }}
      />
      <TextInput
        placeholder="Author..."
        value={authorInput}
        onChange={(e) => setAuthorInput(e.currentTarget.value)}
        style={{ flex: 1, minWidth: 120 }}
      />
      <Select
        placeholder="Content type..."
        data={CONTENT_TYPE_OPTIONS.map((contentTypeOption) => ({
          value: contentTypeOption,
          label: contentTypeOption,
        }))}
        value={categoryName}
        onChange={onCategoryChange}
        allowDeselect={false}
        style={{ flex: 1, minWidth: 120 }}
      />
      <Textarea
        placeholder="Description (optional)..."
        value={descriptionInput}
        onChange={(e) => setDescriptionInput(e.currentTarget.value)}
        autosize
        minRows={1}
        maxRows={4}
        style={{ width: '100%' }}
      />
    </Group>
  );
});

export function DraggableCharCard({
  name,
  char,
  overlay,
  tier,
  size,
}: {
  name: string;
  char: Character | undefined;
  overlay?: boolean;
  tier?: string;
  size?: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: name,
    data: { tier },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `char-${name}`,
    data: { characterName: name, tier },
  });

  const style: CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        touchAction: 'none',
      };

  return (
    <div
      ref={(node) => {
        if (!overlay) {
          setNodeRef(node);
          setDropRef(node);
        }
      }}
      style={{
        ...style,
        outline:
          isOver && !overlay
            ? '2px solid var(--mantine-color-blue-5)'
            : undefined,
        borderRadius: 'var(--mantine-radius-xs)',
      }}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <CharacterCard
        name={name}
        quality={char?.quality}
        disableLink
        size={size}
      />
    </div>
  );
}

export function TierDropZone({
  id,
  label,
  color,
  note,
  onNoteChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  canDelete,
  children,
}: {
  id: string;
  label: string;
  color: string;
  note?: string;
  onNoteChange: (note: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderColor: isOver ? `var(--mantine-color-${color}-5)` : undefined,
          borderWidth: isOver ? 2 : undefined,
          transition: `border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        },
      })}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Badge variant="filled" color={color} size="lg" radius="sm">
              {label}
            </Badge>
            <TierNotePopover
              value={note || ''}
              onCommit={onNoteChange}
              placeholder="Add a tier note..."
              emptyLabel="Add a tier note..."
              editorMinWidth={200}
              editorMaxWidth={320}
              align="left"
            />
          </Stack>
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip
              label={isFirst ? 'Already at top tier' : 'Move tier up'}
              withArrow
              withinPortal
            >
              <ActionIcon
                size="sm"
                radius="md"
                variant="light"
                color="blue"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label="Move tier up"
              >
                <IoChevronUp size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={isLast ? 'Already at bottom tier' : 'Move tier down'}
              withArrow
              withinPortal
            >
              <ActionIcon
                size="sm"
                radius="md"
                variant="light"
                color="blue"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label="Move tier down"
              >
                <IoChevronDown size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={
                canDelete ? 'Delete tier' : 'At least one tier is required'
              }
              withArrow
              withinPortal
            >
              <ActionIcon
                size="sm"
                radius="md"
                variant="light"
                color="red"
                onClick={onDelete}
                disabled={!canDelete}
                aria-label="Delete tier"
              >
                <IoTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <SimpleGrid
          cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
          spacing={CHARACTER_GRID_SPACING}
          style={{ minHeight: 40 }}
        >
          {children}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export function TierNotePopover({
  value,
  onCommit,
  placeholder = 'Add a note...',
  emptyLabel = '+ note',
  editorMinWidth = 180,
  editorMaxWidth = 220,
  align = 'center',
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  editorMinWidth?: number;
  editorMaxWidth?: number;
  align?: 'left' | 'center';
}) {
  const [opened, setOpened] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function commitAndClose() {
    if (draftValue !== value) {
      onCommit(draftValue);
    }
    setOpened(false);
  }

  const isLeftAligned = align === 'left';

  useEffect(() => {
    if (!opened) return;
    const frameId = window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      try {
        textarea.focus({ preventScroll: true });
      } catch {
        textarea.focus();
      }
      const cursor = textarea.value.length;
      textarea.setSelectionRange(cursor, cursor);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [opened]);

  return (
    <Popover
      opened={opened}
      onChange={(nextOpened) => {
        if (nextOpened) {
          setDraftValue(value);
        }
        setOpened(nextOpened);
      }}
      position={isLeftAligned ? 'bottom-start' : 'bottom'}
      withArrow
      shadow="md"
      withinPortal
      zIndex={400}
      offset={6}
    >
      <Popover.Target>
        <div
          role="button"
          tabIndex={0}
          style={{
            cursor: 'pointer',
            padding: '2px 4px',
            textAlign: align,
            display: 'inline-block',
            width: 'fit-content',
            maxWidth: '100%',
            alignSelf: isLeftAligned ? 'flex-start' : 'center',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            if (!opened) {
              setDraftValue(value);
            }
            setOpened((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!opened) {
                setDraftValue(value);
              }
              setOpened((prev) => !prev);
            }
          }}
        >
          <Text
            size="xs"
            c={value ? 'violet' : 'dimmed'}
            lineClamp={1}
            style={{
              opacity: value ? 1 : 0.5,
              transition:
                'color 140ms ease, opacity 140ms ease, text-shadow 140ms ease',
              textShadow: value
                ? '0 0 0.5px var(--mantine-color-violet-outline)'
                : 'none',
            }}
          >
            {value || emptyLabel}
          </Text>
        </div>
      </Popover.Target>
      <Popover.Dropdown
        p="xs"
        style={{
          border: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-body)',
          boxShadow: 'var(--mantine-shadow-md)',
        }}
      >
        <Textarea
          ref={textareaRef}
          size="xs"
          placeholder={placeholder}
          value={draftValue}
          onChange={(e) => setDraftValue(e.currentTarget.value)}
          onBlur={commitAndClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraftValue(value);
              setOpened(false);
            }
          }}
          autosize
          minRows={1}
          maxRows={3}
          styles={{
            input: {
              minWidth: editorMinWidth,
              maxWidth: editorMaxWidth,
              lineHeight: 1.35,
              opacity: draftValue ? 1 : 0.9,
              backgroundColor: 'var(--mantine-color-body)',
              borderColor: draftValue
                ? 'var(--mantine-color-violet-4)'
                : 'var(--mantine-color-default-border)',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            },
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

export function UnrankedPool({
  children,
  filterHeader,
  paginationControl,
}: {
  children: React.ReactNode;
  filterHeader?: React.ReactNode;
  paginationControl?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unranked' });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderColor: isOver ? 'var(--mantine-color-blue-5)' : undefined,
          borderWidth: isOver ? 2 : undefined,
          transition: `border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        },
      })}
    >
      <Stack gap="sm">
        {filterHeader || (
          <Text size="sm" fw={600} c="dimmed">
            Unranked Characters
          </Text>
        )}
        <SimpleGrid
          cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
          spacing={CHARACTER_GRID_SPACING}
          style={{ minHeight: 40 }}
        >
          {children}
        </SimpleGrid>
        {paginationControl}
      </Stack>
    </Paper>
  );
}

