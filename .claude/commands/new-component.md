# Scaffold a new component

Create a new React component following the project conventions.

## Steps

1. Create `src/components/$ARGUMENTS.tsx` with this template:

```tsx
import { useTranslation } from 'react-i18next';

interface $ARGUMENTSProps {
    // add props here
}

export function $ARGUMENTS({ }: $ARGUMENTSProps) {
    const { t } = useTranslation();

    return (
        <div>
            {/* component content */}
        </div>
    );
}
```

2. Create `src/components/__tests__/$ARGUMENTS.test.tsx` with this template:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { $ARGUMENTS } from '../$ARGUMENTS';

vi.mock('@/store/task-store');

describe('$ARGUMENTS', () => {
    it('renders without crashing', () => {
        render(<$ARGUMENTS />);
        // add assertions
    });
});
```

3. Export the component from the file (named export, not default).
4. Add any new i18n keys to `src/i18n.ts` under both `en` and `fa` translations.

## Conventions

- Named exports only — no `export default`.
- Props interface named `<ComponentName>Props`.
- All user-visible strings via `t('key')`.
- ARIA labels for interactive elements.
- Multiline `if` blocks with braces on separate lines.
