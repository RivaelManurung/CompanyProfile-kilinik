# Admin Dashboard Guidelines

## Design Rules

- Use neutral surfaces, subtle borders, and compact spacing.
- Use primary color for active navigation and focused action only.
- Avoid gradients, decorative motion, glassmorphism, and generic SaaS card decoration.
- Prioritize operational queues over vanity metrics.

## Table Rules

- All admin list pages must use server-side pagination.
- Search/filter state should be reflected in the URL.
- Every table must include loading, empty, error, and retry states.
- Icon-only actions require `aria-label`.
- Destructive actions require confirmation and audit logging.

## Form Rules

- Every create/edit form needs a Zod schema.
- Server validation errors must map to field errors.
- Dirty forms must warn before closing.
- Toasts are for global success/failure, not field validation.
- Use domain-specific controls when fields become complex.

## Permission Rules

- Frontend permission hiding is UX only.
- Backend permission middleware is mandatory for every admin API action.
- Destructive and system actions require explicit capabilities.
- Add audit log entries for sensitive admin actions.

## Animation Rules

- Use motion only for drawer/dialog/menu transitions, toasts, and skeleton loading.
- Keep transitions under 300ms.
- Avoid parallax, floating cards, animated gradients, and bouncy hover effects.
- Respect `prefers-reduced-motion`.
