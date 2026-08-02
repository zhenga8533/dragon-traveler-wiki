import ConfirmActionModal from '@/components/ui/ConfirmActionModal';

interface SavedBuilderOverwriteModalProps {
  entityLabel: string;
  pendingKey: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SavedBuilderOverwriteModal({
  entityLabel,
  pendingKey,
  onCancel,
  onConfirm,
}: SavedBuilderOverwriteModalProps) {
  return (
    <ConfirmActionModal
      opened={pendingKey !== null}
      onCancel={onCancel}
      title={`Overwrite saved ${entityLabel}?`}
      message={`A saved ${entityLabel} named "${pendingKey ?? ''}" already exists. Overwrite it?`}
      confirmLabel="Overwrite"
      onConfirm={onConfirm}
    />
  );
}
