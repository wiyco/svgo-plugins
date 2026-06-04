# AGENTS

Scope: `apps/playground`

Design tokens

- `DESIGN.md` is the source of truth.
- `src/tokens.css` must mirror `DESIGN.md`. Keep names and values in sync.
- Use this order: primitives -> theme aliases -> component tokens.
- Prefer existing tokens before adding new ones.
- Promote only reused UI values: color, type, space, radius, shadow, blur, motion, shared component chrome.
- Do not tokenize one-off layout sizes or page-only geometry.
- In CSS, use semantic/component tokens instead of raw hex/rgba when the value is reusable.
- Light is the live baseline. Dark tokens may exist, but do not add theme switching unless asked.

Color meaning

- Blue: action, info, copied/share success.
- Red: failure, destructive states.
- Muted red: unsafe/warning states.
- `share-button` `unavailable` should match the copied blue family.

When changing tokens

- Update `DESIGN.md`, `src/tokens.css`, and `src/design-token-sync.test.ts` in the same change.
- Run `pnpm vitest run apps/playground/src/design-token-sync.test.ts` after token edits.
