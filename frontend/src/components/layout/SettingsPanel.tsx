import {
  ActionIcon,
  Badge,
  Divider,
  Drawer,
  Group,
  Paper,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext, useMemo, useState } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { normalizeContentType } from '../../constants/content-types';
import { BREAKPOINTS, Z_INDEX } from '../../constants/ui';
import type { GradientPalette } from '../../contexts';
import {
  BannerContext,
  GradientThemeContext,
  TierListReferenceContext,
} from '../../contexts';

export default function SettingsPanel() {
  const [opened, { toggle: toggleOpened, close: closeOpened }] =
    useDisclosure(false);
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { palette, setPalette } = useContext(GradientThemeContext);

  const { tierLists, loading, selectedTierListName, setSelectedTierListName } =
    useContext(TierListReferenceContext);
  const {
    selectedBanner,
    bannerSelectData,
    bannerPreference,
    setBannerPreference,
    defaultBannerValue,
    showOnAllRoutes,
    setShowOnAllRoutes,
  } = useContext(BannerContext);

  const tierListOptions = useMemo(
    () =>
      tierLists.map((list) => ({
        value: list.name,
        label: `${list.name} (${normalizeContentType(list.content_type, 'All')})`,
      })),
    [tierLists]
  );

  const controlSize = isMobile ? 'md' : 'sm';
  const selectComboboxProps = {
    withinPortal: true,
    zIndex: Z_INDEX.TOOLTIP,
  } as const;

  const settingsContent = (
    <Stack gap="md">
      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={600}>
              Theme
            </Text>
            <Text size="xs" c="dimmed" fw={600}>
              {colorScheme === 'auto'
                ? `Auto (${isDark ? 'Dark' : 'Light'})`
                : isDark
                  ? 'Dark'
                  : 'Light'}
            </Text>
          </Group>

          <SegmentedControl
            fullWidth
            size={controlSize}
            value={colorScheme}
            onChange={(value) =>
              setColorScheme(value as 'auto' | 'dark' | 'light')
            }
            data={[
              { label: 'Auto', value: 'auto' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
            aria-label="Select theme"
          />

          <Select
            label="Gradient Palette"
            placeholder="Select gradient palette"
            data={[
              { value: 'violet', label: 'Classic Purple' },
              { value: 'ocean', label: 'Ocean Teal' },
              { value: 'sunset', label: 'Sunset Gold' },
              { value: 'forest', label: 'Emerald Forest' },
              { value: 'ember', label: 'Crimson Ember' },
              { value: 'dusk', label: 'Twilight Dusk' },
              { value: 'frost', label: 'Arctic Frost' },
              { value: 'blossom', label: 'Cherry Blossom' },
            ]}
            value={palette}
            onChange={(value) =>
              setPalette((value as GradientPalette) ?? 'violet')
            }
            size={controlSize}
            comboboxProps={selectComboboxProps}
            onDropdownOpen={() => setIsSelectDropdownOpen(true)}
            onDropdownClose={() => setIsSelectDropdownOpen(false)}
            allowDeselect={false}
          />
        </Stack>
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Select
          label="Tier List Reference"
          placeholder="Select tier list"
          data={tierListOptions}
          value={selectedTierListName || null}
          onChange={(value) => setSelectedTierListName(value ?? '')}
          comboboxProps={selectComboboxProps}
          onDropdownOpen={() => setIsSelectDropdownOpen(true)}
          onDropdownClose={() => setIsSelectDropdownOpen(false)}
          clearable
          size={controlSize}
          disabled={loading || tierListOptions.length === 0}
        />
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Group justify="space-between" align="center" mb={6}>
          <Text size="sm" fw={600}>
            Landing Banner
          </Text>
          <Badge
            size="sm"
            variant="light"
            color={selectedBanner?.type === 'video' ? 'pink' : 'blue'}
          >
            {selectedBanner?.type === 'video' ? 'MP4' : 'PNG'}
          </Badge>
        </Group>
        <Select
          label="Character Illustration"
          size={controlSize}
          placeholder="Select a character illustration"
          data={bannerSelectData}
          value={bannerPreference}
          searchable
          comboboxProps={selectComboboxProps}
          onDropdownOpen={() => setIsSelectDropdownOpen(true)}
          onDropdownClose={() => setIsSelectDropdownOpen(false)}
          nothingFoundMessage="No illustrations found"
          onChange={(value) => {
            setBannerPreference(value ?? defaultBannerValue);
          }}
        />
        <Switch
          mt="sm"
          size={isMobile ? 'sm' : 'xs'}
          label="Show banner on all pages"
          checked={showOnAllRoutes}
          onChange={(event) => setShowOnAllRoutes(event.currentTarget.checked)}
        />
      </Paper>
    </Stack>
  );

  if (isMobile) {
    return (
      <>
        <ActionIcon
          variant="default"
          size="xl"
          aria-label="Open settings panel"
          onClick={toggleOpened}
        >
          <IoSettingsOutline />
        </ActionIcon>

        <Drawer
          opened={opened}
          onClose={closeOpened}
          position="bottom"
          withCloseButton
          closeButtonProps={{ 'aria-label': 'Close settings panel' }}
          closeOnClickOutside={!isSelectDropdownOpen}
          closeOnEscape
          padding="md"
          title="Settings"
          radius="md"
          size="85%"
          styles={{
            body: {
              maxHeight: '75dvh',
              overflowY: 'auto',
              paddingBottom:
                'max(var(--mantine-spacing-lg), env(safe-area-inset-bottom))',
            },
          }}
        >
          {settingsContent}
        </Drawer>
      </>
    );
  }

  return (
    <Popover
      opened={opened}
      onDismiss={closeOpened}
      closeOnClickOutside={!isSelectDropdownOpen}
      width={380}
      position="bottom-end"
      keepMounted
      withArrow
      offset={8}
      shadow="md"
    >
      <Popover.Target>
        <Tooltip
          label="Settings"
          withArrow
          events={{ hover: true, focus: true, touch: false }}
        >
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Open settings panel"
            onClick={toggleOpened}
          >
            <IoSettingsOutline />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown p="md">
        <Stack gap="md">
          <Text size="sm" fw={700}>
            Settings
          </Text>
          <Divider />
          {settingsContent}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
