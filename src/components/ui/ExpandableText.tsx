import { Anchor, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface ExpandableTextProps {
  children: ReactNode;
  size?: string;
  ta?: React.CSSProperties['textAlign'];
}

export default function ExpandableText({
  children,
  size = 'sm',
  ta,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!expanded && ref.current) {
      setIsClamped(ref.current.scrollHeight > ref.current.clientHeight);
    }
  }, [children, expanded]);

  return (
    <Stack gap={2}>
      <Text
        ref={ref}
        size={size}
        c="dimmed"
        lineClamp={expanded ? undefined : 2}
        ta={ta}
      >
        {children}
      </Text>
      {(isClamped || expanded) && (
        <Anchor
          component="button"
          type="button"
          size="xs"
          ta={ta ?? 'left'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Anchor>
      )}
    </Stack>
  );
}
