import { useGradientAccent, useIsMobile } from '@/hooks';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IoDownloadOutline } from 'react-icons/io5';

interface ExportButtonProps {
  data: unknown;
  filename: string;
}

export default function ExportButton({ data, filename }: ExportButtonProps) {
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = `Export ${filename}`;

  return isMobile ? (
    <Tooltip label={label}>
      <ActionIcon
        variant="light"
        color={accent.primary}
        size="lg"
        onClick={handleExport}
        aria-label={label}
      >
        <IoDownloadOutline size={16} />
      </ActionIcon>
    </Tooltip>
  ) : (
    <Button
      variant="light"
      color={accent.primary}
      size="xs"
      leftSection={<IoDownloadOutline size={16} />}
      onClick={handleExport}
    >
      Export
    </Button>
  );
}
