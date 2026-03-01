import {
  ActionIcon,
  Popover,
  Textarea,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { IoDocumentTextOutline } from 'react-icons/io5';

interface CharacterNoteButtonProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

function CharacterNoteButton({
  value,
  onCommit,
  placeholder = 'Add note...',
  style,
}: CharacterNoteButtonProps) {
  const [opened, setOpened] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  const hasNote = value.trim().length > 0;

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

  function commitAndClose() {
    if (draftValue !== value) {
      onCommit(draftValue);
    }
    setOpened(false);
  }

  return (
    <Popover
      opened={opened}
      onChange={(nextOpened) => {
        if (nextOpened) {
          setDraftValue(value);
        }
        setOpened(nextOpened);
      }}
      position="bottom-end"
      withArrow
      shadow="md"
      withinPortal
      zIndex={400}
      offset={6}
    >
      <Popover.Target>
        <div style={style}>
          <Tooltip
            label={value ? 'Edit note' : 'Add note'}
            withArrow
            position="left"
          >
            <ActionIcon
              size="sm"
              radius="md"
              variant="filled"
              color={hasNote ? 'violet' : 'grape'}
              styles={{
                root: {
                  background: hasNote
                    ? 'linear-gradient(135deg, var(--mantine-color-violet-6) 0%, var(--mantine-color-grape-6) 100%)'
                    : colorScheme === 'dark'
                      ? 'rgba(20, 21, 23, 0.84)'
                      : 'rgba(255, 255, 255, 0.86)',
                  color: hasNote
                    ? 'var(--mantine-color-white)'
                    : colorScheme === 'dark'
                      ? 'var(--mantine-color-violet-2)'
                      : 'var(--mantine-color-violet-7)',
                  border: hasNote
                    ? '1px solid var(--mantine-color-violet-4)'
                    : colorScheme === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.16)'
                      : '1px solid rgba(124, 58, 237, 0.28)',
                  boxShadow: hasNote
                    ? '0 4px 10px rgba(124, 58, 237, 0.28)'
                    : colorScheme === 'dark'
                      ? '0 3px 8px rgba(0, 0, 0, 0.32)'
                      : '0 3px 8px rgba(0, 0, 0, 0.12)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  opacity: opened ? 1 : 0.97,
                  transform: opened ? 'scale(1.04)' : 'scale(1)',
                  transition:
                    'background 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, opacity 140ms ease',
                  '&:hover': {
                    background: hasNote
                      ? 'linear-gradient(135deg, var(--mantine-color-violet-7) 0%, var(--mantine-color-grape-7) 100%)'
                      : colorScheme === 'dark'
                        ? 'rgba(34, 35, 39, 0.92)'
                        : 'rgba(255, 255, 255, 0.96)',
                    boxShadow: hasNote
                      ? '0 6px 14px rgba(124, 58, 237, 0.36)'
                      : colorScheme === 'dark'
                        ? '0 4px 11px rgba(0, 0, 0, 0.4)'
                        : '0 4px 11px rgba(0, 0, 0, 0.16)',
                    transform: 'scale(1.06)',
                  },
                },
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpened((prev) => !prev);
              }}
              aria-label={value ? 'Edit note' : 'Add note'}
            >
              <IoDocumentTextOutline size={12} />
            </ActionIcon>
          </Tooltip>
        </div>
      </Popover.Target>
      <Popover.Dropdown
        p="xs"
        style={{
          border: `1px solid ${
            colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(124, 58, 237, 0.2)'
          }`,
          background:
            colorScheme === 'dark'
              ? 'rgba(20, 21, 23, 0.94)'
              : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow:
            colorScheme === 'dark'
              ? '0 10px 28px rgba(0, 0, 0, 0.42)'
              : '0 8px 24px rgba(124, 58, 237, 0.16)',
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
              minWidth: 180,
              maxWidth: 220,
              lineHeight: 1.35,
              borderColor: hasNote
                ? 'var(--mantine-color-violet-4)'
                : undefined,
              backgroundColor:
                colorScheme === 'dark'
                  ? 'rgba(16, 17, 19, 0.86)'
                  : 'rgba(255, 255, 255, 0.92)',
              opacity: draftValue ? 1 : 0.9,
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

export default memo(CharacterNoteButton);
