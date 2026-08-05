import BuilderToolbar from '@/components/common/BuilderToolbar';
import { MAX_ROSTER_SIZE } from '@/features/teams/utils/team-builder';
import { useGradientAccent } from '@/hooks';
import { Badge } from '@mantine/core';
import { memo } from 'react';

interface TeamBuilderToolbarProps {
  json: string;
  teamSize: number;
  isCapturing: boolean;
  hasAnyBuilderData: boolean;
  onPasteOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

function TeamBuilderToolbarComponent({
  json,
  teamSize,
  isCapturing,
  hasAnyBuilderData,
  onPasteOpen,
  onSave,
  onExport,
  onSubmit,
  onClear,
}: TeamBuilderToolbarProps) {
  const { accent } = useGradientAccent();

  return (
    <BuilderToolbar
      json={json}
      hasContent={teamSize > 0}
      hasAnyBuilderData={hasAnyBuilderData}
      isCapturing={isCapturing}
      onPasteOpen={onPasteOpen}
      onSave={onSave}
      onExport={onExport}
      onSubmit={onSubmit}
      onClear={onClear}
      trailingContent={
        <Badge variant="light" color={accent.secondary} size="lg" radius="sm">
          {teamSize} / {MAX_ROSTER_SIZE}
        </Badge>
      }
    />
  );
}

const TeamBuilderToolbar = memo(TeamBuilderToolbarComponent);

export default TeamBuilderToolbar;
