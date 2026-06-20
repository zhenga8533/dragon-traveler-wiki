import { useGradientAccent } from '@/hooks';
import { ActionIcon, Tooltip } from '@mantine/core';
import { lazy, Suspense, useState } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';

const SettingsPanel = lazy(() => import('./SettingsPanel'));

function SettingsTrigger({ onOpen }: { onOpen: () => void }) {
  const { accent } = useGradientAccent();
  return (
    <Tooltip
      label="Settings"
      withArrow
      events={{ hover: true, focus: true, touch: false }}
    >
      <ActionIcon
        variant="default"
        color={accent.primary}
        size="lg"
        aria-label="Open settings panel"
        aria-haspopup="dialog"
        onClick={onOpen}
      >
        <IoSettingsOutline />
      </ActionIcon>
    </Tooltip>
  );
}

export default function LazySettingsPanel() {
  const [requested, setRequested] = useState(false);

  if (!requested) {
    return <SettingsTrigger onOpen={() => setRequested(true)} />;
  }

  return (
    <Suspense fallback={<SettingsTrigger onOpen={() => undefined} />}>
      <SettingsPanel initiallyOpened />
    </Suspense>
  );
}
