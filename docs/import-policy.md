# Import and Barrel Policy

Imports should make module ownership visible while keeping stable shared APIs
convenient to consume.

## Feature-owned code

Import feature components, hooks, filters, types, and utilities directly from
their owning feature:

```ts
import CharacterList from '@/features/characters/components/CharacterList';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
```

Do not re-export feature modules from shared barrels such as `@/components`,
`@/hooks`, `@/utils`, or `@/contexts`. A shared re-export hides ownership and
can introduce dependencies from shared code back into a feature.

## Shared code

The root shared barrels may expose stable modules that are owned by their
matching shared directory. For example, `@/hooks` may expose hooks implemented
under `src/hooks`, while `@/components` may expose primitives implemented under
`src/components`.

Direct shared imports remain appropriate when they better communicate the
module category or avoid loading a broad entry point:

```ts
import SafeImage from '@/components/ui/SafeImage';
import { showErrorToast } from '@/utils/toast';
```

## Entry files

An `index.tsx` that implements a directory's primary component is an entry file,
not a general-purpose barrel, and may remain when the directory represents one
component with supporting modules. Avoid new barrels that aggregate feature
internals solely to shorten import paths.

Use `import type` for type-only dependencies, and avoid importing a barrel from
within the directory that defines it to prevent cycles.
