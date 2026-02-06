# Dragon Traveler Wiki - Frontend

A modern React + TypeScript frontend for the Dragon Traveler community wiki, built with Vite and Mantine UI.

## 🏗️ Architecture

### Tech Stack

- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2
- **UI Library**: Mantine 8.3 (comprehensive component library)
- **Routing**: React Router DOM 7.13
- **Drag & Drop**: @dnd-kit
- **Icons**: React Icons 5.5

### Project Structure

```
src/
├── assets/          # Static assets (images, icons)
│   ├── character/   # Character portraits and illustrations
│   ├── faction/     # Faction icons
│   ├── class/       # Class icons
│   └── ...
├── components/      # Reusable React components
│   ├── CharacterCard.tsx
│   ├── CharacterFilter.tsx
│   ├── CharacterList.tsx
│   └── index.ts     # Barrel exports
├── constants/       # Application constants
│   ├── colors.ts    # Color schemes and palettes
│   ├── ui.ts        # UI constants (sizes, transitions, etc.)
│   └── index.ts     # Barrel exports
├── hooks/           # Custom React hooks
│   ├── use-data-fetch.ts
│   ├── use-filters.ts
│   └── index.ts     # Barrel exports
├── pages/           # Route pages
│   ├── Home.tsx
│   ├── Characters.tsx
│   ├── CharacterPage.tsx
│   └── ...
├── types/           # TypeScript type definitions
│   ├── character.ts
│   ├── faction.ts
│   └── index.ts     # Barrel exports
├── utils/           # Utility functions
│   ├── filter-characters.ts
│   ├── parse-effect-refs.ts
│   └── index.ts     # Barrel exports
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── theme.ts         # Mantine theme configuration
```

## 🎨 Design System

### Theme

The application uses a custom Mantine theme with:

- **Primary Color**: Violet
- **Font Family**: Inter (with system fallbacks)
- **Spacing Scale**: xs (8px), sm (12px), md (16px), lg (24px), xl (32px)
- **Radius Scale**: xs (4px), sm (8px), md (12px), lg (16px), xl (24px)
- **Enhanced Shadows**: 5-level shadow system for depth

### Colors

Quality-based color system:

- **SSR EX**: Red
- **SSR+**: Orange
- **SSR**: Yellow
- **SR+**: Violet
- **R**: Blue
- **N**: Gray

Status effect types:

- **Buff**: Green
- **Debuff**: Red
- **Special**: Blue
- **Control**: Violet
- **Elemental**: Cyan
- **Blessing**: Yellow

### Components

All components follow these principles:

- **Responsive**: Mobile-first design with breakpoints
- **Accessible**: ARIA labels and semantic HTML
- **Consistent**: Shared constants for sizes, spacing, and transitions
- **Themeable**: Light/dark mode support

## 🔧 Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Organized by external → internal → relative
- **Props**: Interface definitions with clear JSDoc comments

### Best Practices

1. **Use Barrel Exports**: Import from `components/`, `hooks/`, etc.
2. **Extract Constants**: No magic numbers or hardcoded values
3. **Type Safety**: Explicit types, avoid `any`
4. **Custom Hooks**: Reusable logic in dedicated hooks
5. **Error Handling**: Graceful fallbacks and loading states
6. **Performance**: Memoization with `useMemo` and `useCallback`

## 📦 Key Features

### Data Fetching

Custom `useDataFetch` hook for JSON data:

- Automatic loading states
- Error handling
- Abort on unmount

### Filtering System

Reusable filter hooks and components:

- `useFilters` - Generic filter state management
- `useFilterPanel` - Panel toggle state
- `useViewMode` - Grid/list view with localStorage
- `useFilteredData` - Data filtering and sorting

### Asset Management

Lazy-loaded assets with fallbacks:

- Character portraits and illustrations
- Dynamic icon loading
- Placeholder generation

### Routing

Hash-based routing for GitHub Pages compatibility:

- Character detail pages: `/characters/:name`
- Guide pages: `/guides/*`
- Database pages: `/status-effects`, `/wyrmspells`

## 🚀 Deployment

The app is configured for static hosting:

- **Base URL**: Configured via `import.meta.env.BASE_URL`
- **Hash Router**: For GitHub Pages compatibility
- **Asset Optimization**: Vite image optimizer plugin
- **Code Splitting**: Automatic route-based splitting

## 📝 Contributing

When adding new features:

1. Create reusable components in `components/`
2. Add types to `types/`
3. Extract constants to `constants/`
4. Create custom hooks for complex logic
5. Update barrel exports (`index.ts` files)
6. Follow existing code patterns

## 🔍 Performance

Optimizations in place:

- Route-based code splitting
- Image optimization and lazy loading
- Memoized computations
- Virtual scrolling for large lists
- LocalStorage for user preferences

## 📚 Resources

- [React Documentation](https://react.dev)
- [Mantine UI](https://mantine.dev)
- [Vite](https://vitejs.dev)
- [TypeScript](https://www.typescriptlang.org)
