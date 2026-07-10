import { Box, type BoxProps } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import classes from './FullBleedSection.module.css';

type FullBleedSectionProps = PropsWithChildren<BoxProps>;

/** Offsets AppShell.Main padding for page sections intended to touch its edges. */
export default function FullBleedSection({
  className,
  ...props
}: FullBleedSectionProps) {
  const classNames = [classes.root, className].filter(Boolean).join(' ');
  return <Box className={classNames} {...props} />;
}
