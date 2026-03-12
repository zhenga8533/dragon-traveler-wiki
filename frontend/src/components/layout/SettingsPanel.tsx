import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { normalizeContentType } from '@/constants/content-types';
import { Z_INDEX } from '@/constants/ui';
import type { GradientPalette } from '@/contexts';
import {
  BannerContext,
  TierListReferenceContext,
  UiOpacityContext,
} from '@/contexts';
import { useDarkMode, useGradientAccent, useIsMobile } from '@/hooks';
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Popover,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';

export default function SettingsPanel() {
  const [opened, { toggle: toggleOpened, close: closeOpened }] =
    useDisclosure(false);
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const [isBannerDropdownOpen, setIsBannerDropdownOpen] = useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const { accent, palette, setPalette } = useGradientAccent();

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
    slowScrollEnabled,
    setSlowScrollEnabled,
  } = useContext(BannerContext);
  const {
    bannerMediaOpacity,
    setBannerMediaOpacity,
    bannerOverlayOpacity,
    setBannerOverlayOpacity,
    surfaceOpacity,
    setSurfaceOpacity,
    resetOpacitySettings,
  } = useContext(UiOpacityContext);

  useEffect(() => {
    if (isMobile || !opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, opened]);

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

  // On mobile, the searchable banner Select triggers the virtual keyboard, which shifts
  // the viewport and causes the portaled dropdown to appear off-center. Using withinPortal: false
  // positions the dropdown relative to its DOM parent instead of the viewport, so it's unaffected.
  const bannerComboboxProps = isMobile
    ? ({ withinPortal: false, zIndex: Z_INDEX.TOOLTIP } as const)
    : selectComboboxProps;

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

      <Paper
        p="sm"
        radius="md"
        withBorder
        style={
          isBannerDropdownOpen ? { position: 'relative', zIndex: 1 } : undefined
        }
      >
        <Group justify="space-between" align="center" mb={6}>
          <Text size="sm" fw={600}>
            Landing Banner
          </Text>
          <Badge
            size="sm"
            variant="light"
            color={
              !selectedBanner
                ? 'gray'
                : selectedBanner.type === 'video'
                  ? 'pink'
                  : 'blue'
            }
          >
            {!selectedBanner
              ? 'OFF'
              : selectedBanner.type === 'video'
                ? 'MP4'
                : 'PNG'}
          </Badge>
        </Group>
        <Select
          label="Character Illustration"
          size={controlSize}
          placeholder="Select a character illustration"
          data={bannerSelectData}
          value={bannerPreference}
          searchable
          comboboxProps={bannerComboboxProps}
          onDropdownOpen={() => {
            setIsSelectDropdownOpen(true);
            setIsBannerDropdownOpen(true);
          }}
          onDropdownClose={() => {
            setIsSelectDropdownOpen(false);
            setIsBannerDropdownOpen(false);
          }}
          nothingFoundMessage="No illustrations found"
          onChange={(value) => {
            setBannerPreference(value ?? defaultBannerValue);
          }}
        />
        <Switch
          mt="sm"
          size={isMobile ? 'sm' : 'xs'}
          color={accent.primary}
          label="Show banner on all pages"
          checked={showOnAllRoutes}
          onChange={(event) => setShowOnAllRoutes(event.currentTarget.checked)}
        />
        <Switch
          mt="xs"
          size={isMobile ? 'sm' : 'xs'}
          color={accent.primary}
          label="Slow scroll banner with page"
          checked={slowScrollEnabled}
          onChange={(event) =>
            setSlowScrollEnabled(event.currentTarget.checked)
          }
        />
      </Paper>

      <Paper
        p="sm"
        radius="md"
        withBorder
        style={isBannerDropdownOpen ? { isolation: 'isolate' } : undefined}
      >
        <Group justify="space-between" align="center" mb={6}>
          <Text size="sm" fw={600}>
            Opacity
          </Text>
          <Button
            variant="subtle"
            color={accent.primary}
            size="compact-xs"
            onClick={resetOpacitySettings}
          >
            Reset
          </Button>
        </Group>

        <Stack gap="sm">
          <Stack gap={4}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={500}>
                Banner Media
              </Text>
              <Text size="xs" c="dimmed">
                {Math.round(bannerMediaOpacity * 100)}%
              </Text>
            </Group>
            <Slider
              color={accent.primary}
              size={isMobile ? 'md' : 'sm'}
              min={0}
              max={100}
              step={1}
              value={Math.round(bannerMediaOpacity * 100)}
              onChange={(value) => setBannerMediaOpacity(value / 100)}
              label={(value) => `${value}%`}
            />
          </Stack>

          <Stack gap={4}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={500}>
                Banner Overlay
              </Text>
              <Text size="xs" c="dimmed">
                {Math.round(bannerOverlayOpacity * 100)}%
              </Text>
            </Group>
            <Slider
              color={accent.primary}
              size={isMobile ? 'md' : 'sm'}
              min={0}
              max={100}
              step={1}
              value={Math.round(bannerOverlayOpacity * 100)}
              onChange={(value) => setBannerOverlayOpacity(value / 100)}
              label={(value) => `${value}%`}
            />
          </Stack>

          <Stack gap={4}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={500}>
                UI Surfaces
              </Text>
              <Text size="xs" c="dimmed">
                {Math.round(surfaceOpacity * 100)}%
              </Text>
            </Group>
            <Slider
              color={accent.primary}
              size={isMobile ? 'md' : 'sm'}
              min={0}
              max={100}
              step={1}
              value={Math.round(surfaceOpacity * 100)}
              onChange={(value) => setSurfaceOpacity(value / 100)}
              label={(value) => `${value}%`}
            />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );

  if (isMobile) {
    return (
      <>
        <ActionIcon
          variant="default"
          color={accent.primary}
          size="xl"
          aria-label="Open settings panel"
          onClick={toggleOpened}
        >
          <IoSettingsOutline />
        </ActionIcon>

        <MobileBottomDrawer
          opened={opened}
          onClose={closeOpened}
          title="Settings"
          closeButtonProps={{ 'aria-label': 'Close settings panel' }}
          closeOnClickOutside={!isSelectDropdownOpen}
          // When the inline (non-portaled) banner dropdown is open, allow it to
          // visually escape the scrollable container instead of being clipped.
          bodyStyle={{ overflowY: isBannerDropdownOpen ? 'visible' : 'auto' }}
        >
          {settingsContent}
        </MobileBottomDrawer>
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
            color={accent.primary}
            size="lg"
            aria-label="Open settings panel"
            onClick={toggleOpened}
          >
            <IoSettingsOutline />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown
        p="md"
        style={{
          maxHeight: '70dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
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
