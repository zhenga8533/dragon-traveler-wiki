import JsonModal from '@/components/tools/JsonModal';
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { normalizeContentType } from '@/constants/content-types';
import { STORAGE_KEY, TRANSITION, Z_INDEX } from '@/constants/ui';
import type { CustomMantineAccent, GradientPalette } from '@/contexts';
import {
  BannerContext,
  CharacterOwnershipContext,
  LocaleContext,
  TierListReferenceContext,
  UiOpacityContext,
} from '@/contexts';
import { SUPPORTED_LOCALES } from '@/utils/data-paths';
import { useDarkMode, useGradientAccent, useIsMobile, useMobileTooltip } from '@/hooks';
import {
  ActionIcon,
  Badge,
  Button,
  ColorInput,
  Divider,
  Group,
  Paper,
  Popover,
  SegmentedControl,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  Tooltip,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IoDownload, IoFolderOpen, IoSettingsOutline } from 'react-icons/io5';

const LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'enUS', label: 'English (US)' },
  { value: 'zhCN', label: '简体中文' },
  { value: 'zhTW', label: '繁體中文' },
  { value: 'jaJP', label: '日本語' },
  { value: 'koKR', label: '한국어' },
  { value: 'thTH', label: 'ภาษาไทย' },
  { value: 'viVN', label: 'Tiếng Việt' },
].filter((opt) => (SUPPORTED_LOCALES as readonly string[]).includes(opt.value));

const CUSTOM_COLOR_FIELDS: {
  key: 'colorA' | 'colorB';
  label: string;
  swatches: string[];
}[] = [
  {
    key: 'colorA',
    label: 'Color A',
    swatches: ['#7c3aed', '#1d4ed8', '#0f766e', '#be123c', '#b45309', '#065f46', '#831843', '#38bdf8'],
  },
  {
    key: 'colorB',
    label: 'Color B',
    swatches: ['#9333ea', '#2563eb', '#0891b2', '#f43f5e', '#f97316', '#0f766e', '#db2777', '#7dd3fc'],
  },
];

const PALETTE_SWATCHES: {
  value: GradientPalette;
  label: string;
  gradient: string;
}[] = [
  {
    value: 'violet',
    label: 'Arcane',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #4338ca 100%)',
  },
  {
    value: 'ocean',
    label: 'Abyss',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%)',
  },
  {
    value: 'sunset',
    label: 'Golden Hour',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f97316 50%, #ca8a04 100%)',
  },
  {
    value: 'forest',
    label: 'Ancient Grove',
    gradient: 'linear-gradient(135deg, #065f46 0%, #0f766e 50%, #134e4a 100%)',
  },
  {
    value: 'ember',
    label: 'Dragon Fire',
    gradient: 'linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #c026d3 100%)',
  },
  {
    value: 'dusk',
    label: 'Northern Lights',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #7c3aed 50%, #312e81 100%)',
  },
  {
    value: 'frost',
    label: 'Glacial',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #7dd3fc 50%, #a5f3fc 100%)',
  },
  {
    value: 'blossom',
    label: 'Night Garden',
    gradient: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #6b21a8 100%)',
  },
];

export default function SettingsPanel({
  initiallyOpened = false,
}: {
  initiallyOpened?: boolean;
}) {
  const [opened, { toggle: toggleOpened, close: closeOpened }] =
    useDisclosure(initiallyOpened);
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const [isBannerDropdownOpen, setIsBannerDropdownOpen] = useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const mobileTooltip = useMobileTooltip();
  const { accent, palette, setPalette, customColors, setCustomColors } = useGradientAccent();

  const {
    tierLists,
    savedTierLists,
    loading,
    selectedTierListName,
    setSelectedTierListName,
  } = useContext(TierListReferenceContext);
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
  const { grayUnowned, setGrayUnowned, showCharacterTiers, setShowCharacterTiers } =
    useContext(CharacterOwnershipContext);
  const { locale, setLocale } = useContext(LocaleContext);

  useEffect(() => {
    if (isMobile || !opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, opened]);

  const tierListOptions = useMemo(() => {
    const toOption = (list: { name: string; content_type: string }) => ({
      value: list.name,
      label: `${list.name} (${normalizeContentType(list.content_type, 'All')})`,
    });
    const official = tierLists.map(toOption);
    const officialNames = new Set(tierLists.map((l) => l.name));
    const uniqueSaved = savedTierLists.filter((l) => !officialNames.has(l.name));
    if (uniqueSaved.length === 0) return official;
    return [
      { group: 'Official', items: official },
      { group: 'My Saved', items: uniqueSaved.map(toOption) },
    ];
  }, [tierLists, savedTierLists]);

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

  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [exportJson, setExportJson] = useState('');

  const EXPORT_EXCLUDE = new Set<string>([
    STORAGE_KEY.TEAMS_BUILDER_DRAFT,
    STORAGE_KEY.TEAMS_BUILDER_SLOTS,
    STORAGE_KEY.TIER_LIST_BUILDER_DRAFT,
    STORAGE_KEY.TIER_LIST_BUILDER_SLOTS,
  ]);

  const handleOpenExport = () => {
    const data: Record<string, string> = {};
    for (const key of Object.values(STORAGE_KEY)) {
      if (EXPORT_EXCLUDE.has(key)) continue;
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    }
    setExportJson(
      JSON.stringify({ version: 1, savedAt: new Date().toISOString(), data }, null, 2)
    );
    openExportModal();
  };

  const handleImport = (text: string): string | null => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed?.data || typeof parsed.data !== 'object')
        return 'Invalid settings file.';
      for (const [key, value] of Object.entries(parsed.data)) {
        if (typeof value === 'string') localStorage.setItem(key, value);
      }
      window.location.reload();
      return null;
    } catch {
      return 'Could not parse JSON. Make sure you pasted the full settings export.';
    }
  };

  const settingsContent = (
    <Stack gap="md">
      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Language
          </Text>
          <Select
            size={controlSize}
            data={LOCALE_OPTIONS}
            value={locale}
            onChange={(value) => value && setLocale(value as typeof locale)}
            comboboxProps={selectComboboxProps}
            onDropdownOpen={() => setIsSelectDropdownOpen(true)}
            onDropdownClose={() => setIsSelectDropdownOpen(false)}
            allowDeselect={false}
          />
          <Text size="xs" c="dimmed">
            Changes which localized data files are loaded. Reload the page after switching.
          </Text>
        </Stack>
      </Paper>

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

          <Stack gap={6}>
            <Text size={controlSize} fw={500}>
              Gradient Palette
            </Text>
            <SimpleGrid cols={4} spacing={6}>
              {PALETTE_SWATCHES.map((p) => (
                <Tooltip key={p.value} label={p.label} {...mobileTooltip}>
                  <UnstyledButton
                    onClick={() => setPalette(p.value)}
                    aria-label={`${p.label}${palette === p.value ? ' (selected)' : ''}`}
                    aria-pressed={palette === p.value}
                    style={{
                      height: 28,
                      borderRadius: 'var(--mantine-radius-sm)',
                      background: p.gradient,
                      border: `2px solid ${
                        palette === p.value
                          ? 'var(--mantine-primary-color-5)'
                          : 'transparent'
                      }`,
                      outline:
                        palette === p.value
                          ? '2px solid var(--mantine-primary-color-6)'
                          : 'none',
                      outlineOffset: 1,
                      cursor: 'pointer',
                      transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                    }}
                    onMouseEnter={(e) => {
                      if (palette !== p.value)
                        e.currentTarget.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </Tooltip>
              ))}
            </SimpleGrid>

            {/* Custom palette swatch */}
            <Tooltip label="Custom" {...mobileTooltip}>
              <UnstyledButton
                onClick={() => setPalette('custom')}
                aria-label={`Custom${palette === 'custom' ? ' (selected)' : ''}`}
                aria-pressed={palette === 'custom'}
                style={{
                  height: 28,
                  borderRadius: 'var(--mantine-radius-sm)',
                  background: `linear-gradient(135deg, ${customColors.colorA} 0%, ${customColors.colorB} 100%)`,
                  border: `2px solid ${
                    palette === 'custom'
                      ? 'var(--mantine-primary-color-5)'
                      : 'transparent'
                  }`,
                  outline:
                    palette === 'custom'
                      ? '2px solid var(--mantine-primary-color-6)'
                      : 'none',
                  outlineOffset: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                }}
                onMouseEnter={(e) => {
                  if (palette !== 'custom')
                    e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Text size="xs" fw={700} style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)', letterSpacing: '0.04em' }}>
                  Custom
                </Text>
              </UnstyledButton>
            </Tooltip>

            {/* Custom palette editor — shown when custom is selected */}
            {palette === 'custom' && (
              <Stack gap={8} mt={4}>
                <Group grow gap={8}>
                  {CUSTOM_COLOR_FIELDS.map(({ key, label, swatches }) => (
                    <ColorInput
                      key={key}
                      label={label}
                      size="xs"
                      format="hex"
                      value={customColors[key]}
                      onChange={(v) => setCustomColors({ ...customColors, [key]: v })}
                      popoverProps={{ withinPortal: false, zIndex: Z_INDEX.TOOLTIP }}
                      swatches={swatches}
                      swatchesPerRow={8}
                    />
                  ))}
                </Group>
                <Select
                  label="UI Accent"
                  size="xs"
                  value={customColors.mantineAccent}
                  onChange={(v) =>
                    v && setCustomColors({ ...customColors, mantineAccent: v as CustomMantineAccent })
                  }
                  onDropdownOpen={() => setIsSelectDropdownOpen(true)}
                  onDropdownClose={() => setIsSelectDropdownOpen(false)}
                  comboboxProps={selectComboboxProps}
                  data={[
                    { value: 'violet', label: 'Violet' },
                    { value: 'blue', label: 'Blue' },
                    { value: 'teal', label: 'Teal' },
                    { value: 'green', label: 'Green' },
                    { value: 'orange', label: 'Orange' },
                    { value: 'red', label: 'Red' },
                    { value: 'pink', label: 'Pink' },
                    { value: 'yellow', label: 'Yellow' },
                  ]}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Characters
          </Text>
          <Switch
            size={isMobile ? 'md' : 'sm'}
            color={accent.primary}
            label="Gray out unowned characters"
            checked={grayUnowned}
            onChange={(e) => setGrayUnowned(e.currentTarget.checked)}
          />
          <Switch
            size={isMobile ? 'md' : 'sm'}
            color={accent.primary}
            label="Show tier badges"
            checked={showCharacterTiers}
            onChange={(e) => setShowCharacterTiers(e.currentTarget.checked)}
          />
          {showCharacterTiers && (
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
          )}
        </Stack>
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
          size={isMobile ? 'md' : 'sm'}
          color={accent.primary}
          label="Show banner on all pages"
          checked={showOnAllRoutes}
          onChange={(event) => setShowOnAllRoutes(event.currentTarget.checked)}
        />
        <Switch
          mt="xs"
          size={isMobile ? 'md' : 'sm'}
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

      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Backup &amp; Restore
          </Text>
          <Text size="xs" c="dimmed">
            Export all settings and data, then import on another device.
          </Text>
          <Group grow gap="xs">
            <Button
              variant="light"
              color={accent.primary}
              size="xs"
              leftSection={<IoDownload size={14} />}
              onClick={() => { handleOpenExport(); closeOpened(); }}
            >
              Export
            </Button>
            <Button
              variant="light"
              color={accent.primary}
              size="xs"
              leftSection={<IoFolderOpen size={14} />}
              onClick={() => { openImportModal(); closeOpened(); }}
            >
              Import
            </Button>
          </Group>
        </Stack>
      </Paper>

      <JsonModal
        mode="copy"
        title="Export Settings"
        description="Copy the text below, or download it as a file. Paste it using Import on another device."
        value={exportJson}
        filename="dragon-wiki-settings.json"
        opened={exportModalOpened}
        onClose={closeExportModal}
      />
      <JsonModal
        mode="paste"
        title="Import Settings"
        description="Paste your previously exported settings JSON below. This will overwrite your current settings and reload the page."
        placeholder={'{\n  "version": 1,\n  "data": { ... }\n}'}
        opened={importModalOpened}
        onClose={closeImportModal}
        onApply={handleImport}
        applyLabel="Import & Reload"
      />
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
          aria-haspopup="dialog"
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
            aria-haspopup="dialog"
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
