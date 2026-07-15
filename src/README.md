# Source Architecture

## Directory Structure

```
src/
├── assets/          # Image helper functions (getCharacterPortrait, getGearIcon, etc.)
├── components/
│   ├── common/      # Shared one-off components (ExpandableText, SafeImage, RichText, etc.)
│   ├── layout/      # Page-level shells (AppLayout, ListPageShell, FilteredListShell, etc.)
│   ├── tools/       # Floating tools (SearchModal, ExportButton, SuggestModal, etc.)
│   └── ui/          # Low-level UI primitives (ClassTag, SafeImage, etc.)
├── constants/       # App-wide constants (colors, styles, ui, accents, glass)
├── contexts/        # React contexts (SearchDataContext, gradient theme, UI opacity, etc.)
├── features/        # Feature modules — each is self-contained
│   ├── characters/
│   ├── teams/
│   ├── tier-list/
│   └── wiki/        # All wiki database features (artifacts, gear, relics, wyrms, etc.)
├── hooks/           # Shared generic hooks (useDataFetch, useFilters, usePagination, etc.)
├── pages/           # Route-focused components; reusable domain code belongs in features/
├── routes/          # AppRoutes.tsx — all React Router route definitions
├── styles/          # Global CSS
├── types/           # Shared TypeScript types not owned by a feature
└── utils/           # Shared utility functions
```

## Feature Modules

Each feature under `features/` is self-contained:

```
features/wiki/relics/
├── components/      # UI components specific to this feature
├── types.ts         # TypeScript types
├── form-fields.ts   # (optional) filter/form field definitions
└── utils.ts         # (optional) feature-specific utility functions
```

Data-fetching hooks for wiki entities live in `features/wiki/hooks/use-wiki-data.ts`. Hooks for other features live alongside their feature (e.g. `features/characters/hooks/use-characters-data.ts`).

## Data Layer

Game data is served from localized `data/<locale>/*.json` and shared
`data/global/*.json` files. The private data repository is read directly in
development and copied into the production artifact during deployment.

**`useDataFetch<T>(path, initial)`** — the core primitive. Fetches a JSON file, caches the result in a module-level `Map` so repeated calls (including across components) share one request, and returns `{ data, loading, error }`.

**Feature hooks** wrap `useDataFetch` with a fixed path and type, e.g.:

```ts
// features/wiki/hooks/use-wiki-data.ts
export function useRelics() {
  return useDataFetch<Relic[]>('data/relic.json', []);
}
```

**`SearchDataContext`** (`contexts/search-data-context.tsx`) fetches the datasets
needed by global search after the search UI is first requested. It consumes the
feature hooks, so data file paths remain defined in one place.

Fetched entity collections are checked at runtime for their expected top-level
shape before being exposed to components. The data pipeline remains responsible
for full schema validation.

## Adding a New Database Page

Checklist for adding a new dataset (e.g. "Mounts"):

1. **Types** — create `features/wiki/mounts/types.ts`
2. **Data hook** — add `useMounts()` to `features/wiki/hooks/use-wiki-data.ts`
3. **Components** — create `features/wiki/mounts/components/` with list card and detail components
4. **Pages** — create `pages/mounts/ListPage.tsx` (and `DetailPage.tsx` if needed), keeping reusable domain logic in the feature folder
5. **Route** — add `<Route path="/mounts" element={<Mounts />} />` in `src/routes/AppRoutes.tsx`; if the entity has detail pages, also add the pattern to `DETAIL_ROUTE_RE` in the same file
6. **Navigation** — add an entry to `NAV_ITEMS` in `src/components/layout/Navigation.tsx`
7. **Search** — add to `SearchDataContextValue` interface, call `useMounts()` in `SearchDataProvider`, and wire up a result type + renderer in `src/components/tools/SearchModal.tsx`

## Key Shared Hooks

| Hook | Purpose |
| --- | --- |
| `useDataFetch` | Fetch + cache a JSON file |
| `useFilteredPageData` | Filter, sort, paginate a dataset for list pages |
| `useFilters` | Filter state with localStorage persistence |
| `usePagination` | Page/offset state |
| `useSort` | Sort column/direction state |
| `useDarkMode` | Current color scheme |
| `useIsMobile` | Responsive breakpoint |

## Styling Conventions

- Use `var(--mantine-color-*)` for theme-aware colors; never hardcode hex values
- App content surfaces: prefer `StaticSurface` or `InteractiveSurface` from `components/ui/Surface`
- Plain bordered Mantine `Paper`/`Card` surfaces are also themed by global CSS, but the surface wrappers make intent clearer
- Non-`Paper` surfaces such as sticky toolbars or custom buttons should use the `dt-themed-surface` class
- Glass chrome/overlays: use `getGlassStyles(isDark)` from `constants/glass`
- Lore or translucent detail panels: use `getLoreGlassStyles(isDark)` from `constants/glass`
- The Settings > Opacity > UI Surfaces slider controls `--dt-surface-opacity`; semantic state colors, media overlays, status badges, and data-color encodings should not use that variable
- Palette-aware accent controls should use `useGradientAccent()` or Mantine primary-color variants rather than hard-coded color names
- Quality-tier border colors: `QUALITY_BORDER_COLOR[quality]` from `constants/colors`
- Row/position colors: red = Front, orange = Middle, blue = Back

Formatting conventions are defined in the repository `.editorconfig` and
enforced by `npm run format:check`. Run `npm run check` before opening a pull
request to execute formatting, lint, tests, and type checking together.

## Page Shells

Most list pages use one of two layout shells:

- **`ListPageShell`** — simple list with header and optional filter toolbar
- **`FilteredListShell`** — list with sidebar filter panel, search, sort, and pagination built in; powered by `useFilteredPageData`

Detail pages use `DetailPageHero` + `DetailPageNavigation` for the top section.
