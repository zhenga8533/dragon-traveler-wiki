import { ActionIcon, Popover, Textarea, Tooltip } from '@mantine/core';
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
                    : 'var(--mantine-color-body)',
                  color: hasNote
                    ? 'var(--mantine-color-white)'
                    : 'var(--mantine-color-violet-filled)',
                  border: hasNote
                    ? '1px solid var(--mantine-color-violet-4)'
                    : '1px solid var(--mantine-color-default-border)',
                  boxShadow: hasNote
                    ? 'var(--mantine-shadow-sm)'
                    : 'var(--mantine-shadow-xs)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  opacity: opened ? 1 : 0.97,
                  transform: opened ? 'scale(1.04)' : 'scale(1)',
                  transition:
                    'background 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, opacity 140ms ease',
                  '&:hover': {
                    background: hasNote
                      ? 'linear-gradient(135deg, var(--mantine-color-violet-7) 0%, var(--mantine-color-grape-7) 100%)'
                      : 'var(--mantine-color-default-hover)',
                    boxShadow: hasNote
                      ? 'var(--mantine-shadow-md)'
                      : 'var(--mantine-shadow-sm)',
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
          border: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-body)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
              minWidth: 180,
              maxWidth: 220,
              lineHeight: 1.35,
              borderColor: hasNote
                ? 'var(--mantine-color-violet-4)'
                : undefined,
              backgroundColor: 'var(--mantine-color-body)',
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
