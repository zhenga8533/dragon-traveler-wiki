import BuilderToolbar from '@/components/common/BuilderToolbar';
import { memo } from 'react';
import { IoSwapVertical } from 'react-icons/io5';

interface TierListBuilderToolbarProps {
  json: string;
  hasAnyPlaced: boolean;
  hasAnyBuilderData: boolean;
  isCapturing: boolean;
  onPasteOpen: () => void;
  onSave: () => void;
  onSort: () => void;
  onExport: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

function TierListBuilderToolbarComponent({
  json,
  hasAnyPlaced,
  hasAnyBuilderData,
  isCapturing,
  onPasteOpen,
  onSave,
  onSort,
  onExport,
  onSubmit,
  onClear,
}: TierListBuilderToolbarProps) {
  return (
    <BuilderToolbar
      json={json}
      hasContent={hasAnyPlaced}
      hasAnyBuilderData={hasAnyBuilderData}
      isCapturing={isCapturing}
      onPasteOpen={onPasteOpen}
      onSave={onSave}
      onExport={onExport}
      onSubmit={onSubmit}
      onClear={onClear}
      additionalPrimaryActions={[
        {
          label: 'Sort Tiers',
          icon: IoSwapVertical,
          onClick: onSort,
          disabled: !hasAnyPlaced,
        },
      ]}
    />
  );
}

const TierListBuilderToolbar = memo(TierListBuilderToolbarComponent);

export default TierListBuilderToolbar;
