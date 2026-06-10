# Admin Dashboard Audit Feedback

## Implementation Update

Updated after the production-grade admin refactor.

| Previous issue | Status | Files changed | Notes |
|---|---|---|---|
| Demo credentials visible on login | **Fixed** | `frontend/src/app/admin/login/page.tsx` | Login no longer renders seeded admin email/password. |
| JWT returned to JavaScript | **Fixed** | `backend/internal/handlers/auth_handler.go`, `frontend/src/lib/admin/api.ts` | Login now returns session admin + permissions only; auth token remains in httpOnly cookie. |
| Production config accepts unsafe defaults | **Fixed** | `backend/internal/config/config.go` | Production now fails fast for default JWT secret, admin password, dev DB URL, or insecure CORS origins. |
| Missing backend RBAC | **Fixed** | `backend/internal/auth/permissions.go`, `backend/internal/router/router.go` | Roles/capabilities added for super_admin, clinic_admin, receptionist, content_editor, viewer; API routes enforce permissions. |
| Frontend only checks cookie presence | **Partially fixed** | `frontend/src/components/admin/AdminShell.tsx`, `frontend/src/proxy.ts` | Proxy still does cheap cookie gating, but AdminShell now verifies `/auth/me` and redirects invalid/expired sessions. Backend remains source of truth. |
| No rate limiting | **Fixed for critical endpoints** | `backend/internal/router/security.go`, `backend/internal/router/router.go` | Login and public appointment creation now have in-memory rate limiting. Redis-backed limiter is still recommended for multi-instance production. |
| Missing CSRF/origin protection | **Partially fixed** | `backend/internal/router/security.go`, `backend/internal/router/router.go` | Mutation requests now enforce allowed Origin/Referer in production. A synchronizer CSRF token would be stronger for high-risk deployments. |
| Missing audit logs | **Fixed baseline** | `backend/internal/models/models.go`, `backend/internal/handlers/audit.go`, resource handlers | Sensitive create/update/delete/status/login events are written to `AuditLog`; `/admin/audit-logs` added. |
| Generic resource CRUD loads full lists | **Fixed baseline** | backend resource handlers, `frontend/src/lib/admin/api.ts`, `frontend/src/components/admin/CrudManager.tsx` | Resource lists now use server-side pagination/search/sort and `data/meta` responses. |
| Weak admin shell/navigation | **Fixed** | `frontend/src/components/admin/AdminShell.tsx`, `frontend/src/lib/admin/nav.ts` | Grouped navigation, topbar, breadcrumbs, profile menu, mobile drawer, permission-aware rendering. |
| Weak tables | **Partially fixed** | `frontend/src/components/admin/AdminDataGrid.tsx`, admin pages | TanStack-powered grid with server pagination/search/filter, column visibility, loading/error/empty states. Sorting UI and bulk actions remain future work. |
| Metadata-only forms | **Partially fixed** | `frontend/src/components/admin/CrudManager.tsx`, `frontend/src/lib/admin/schemas/*.schema.ts` | React Hook Form + Zod validation, field-level error mapping, dirty-state warning, submit loading. More domain-specific rich editors/upload fields remain future work. |
| Generic dashboard KPIs | **Fixed baseline** | `frontend/src/app/admin/(panel)/page.tsx`, `backend/internal/handlers/stats_handler.go` | Dashboard now prioritizes clinic operations: pending confirmation, today, overdue follow-up, busiest service, drafts, recent activity. |

Current readiness after fixes: **78%**

Production status after fixes: **UAT READY**

Remaining blockers before full production:

- Replace in-memory rate limiter with Redis/shared limiter for multi-instance deployment.
- Add a stronger CSRF token flow if admin will run on separate domains or high-risk environments.
- Add backend admin user management endpoints for users/roles UI.
- Add table sorting UI, bulk actions, and export permission workflow.
- Add domain-specific rich article editor and image upload controls.

## 1. Executive Summary

Overall readiness: **58%**

Production status: **INTERNAL ALPHA**

The admin dashboard has a working foundation: protected admin routes, a reusable CRUD component, cookie-based API auth, appointment filtering, basic dashboard KPIs, loading skeletons, and destructive-action confirmations. It is not production-ready because it still exposes demo credentials in the login UI, relies on a weak frontend route gate that only checks cookie presence, returns the JWT in the login response body, lacks RBAC/permission enforcement, lacks production-grade form validation and field error mapping, and uses generic CRUD/table patterns that will break down with real operational data volume.

Top risks:

- **Security:** demo credentials are visible in `frontend/src/app/admin/login/page.tsx:102`, backend defaults include production-dangerous secrets in `backend/internal/config/config.go:27-37`, and auth has no rate limiting or CSRF protection.
- **Authorization:** backend protects `/api/admin/*` with authentication, but there is no role/permission model beyond storing `role`; no endpoint-level RBAC exists in `backend/internal/router/router.go:57-70`.
- **Data UX:** most CRUD resources load complete datasets client-side via `frontend/src/lib/admin/api.ts:82-90` and `frontend/src/components/admin/CrudManager.tsx:73-87`; only appointments are paginated server-side.
- **Form UX:** CRUD forms are generated from simple field metadata in `frontend/src/components/admin/CrudManager.tsx:207-236`, with no schema validation, no server field error rendering, no dirty-state warning, and weak domain-specific input controls.
- **Visual design:** the admin UI is usable but template-like. It leans on generic cards, rounded pills, icon blocks, gradients, and generic "manage everything from one place" copy rather than domain-specific clinical operations workflows.

## 2. Scorecard Table

| Area | Score | Status | Core issue | Priority |
|---|---:|---|---|---|
| Visual Design Quality | 6 | Needs polish | Clean but generic; gradients, icon cards, and broad CRUD layout feel template-like. | P2 |
| Admin Information Architecture | 5 | Weak | Navigation is resource-based only; no operational groupings, queues, triage, approvals, or content workflow. | P1 |
| Sidebar & Navigation UX | 6 | Functional | Sidebar exists and is stable, but lacks section grouping, role-aware items, counts, and current workflow context. | P2 |
| Dashboard KPI Quality | 6 | Basic | KPIs are real backend stats, but lack prioritization, trend deltas, SLA cues, and actionable operational states. | P1 |
| Data Table UX | 5 | Incomplete | Appointments have pagination/search; other resources are full client-side lists with no sort, URL filters, bulk actions, or robust mobile behavior. | P1 |
| CRUD/Form UX | 4 | Not ready | Forms are metadata-driven but have no schema validation, no field-level server errors, no dirty warning, weak domain controls. | P1 |
| RBAC & Authorization | 3 | High risk | Auth exists, but no role/permission enforcement is implemented for actions or routes. | P0 |
| API Integration | 6 | Serviceable | Central client exists, credentials included, errors normalized; but no timeout, retry strategy, abort handling, or field error usage. | P1 |
| Loading/Error/Empty States | 5 | Partial | Skeletons and toasts exist; error pages are generic, empty states are weak, and failed list loads do not expose retry UI. | P1 |
| Performance | 5 | Risky at scale | Admin is mostly client-rendered; generic CRUD loads full collections; Recharts is bundled directly into dashboard. | P1 |
| Accessibility | 6 | Partial | shadcn primitives help, labels exist, but icon-only buttons lack accessible names and filter buttons lack selected state semantics. | P2 |
| Animation Quality | 6 | Minimal | Admin avoids excessive motion, which is good; however animation tokens and reduced-motion conventions are not standardized. | P2 |
| Maintainability | 6 | Mixed | Reusable CRUD is helpful, but its generic abstraction blocks domain-specific UX and validation. | P1 |
| Production Readiness | 4 | Internal alpha | Security hardening, RBAC, forms, tables, and operational UX are incomplete. | P0 |

## 3. Detailed Findings

### P0 Critical

#### Demo credentials are exposed on the production login screen

Severity: **P0 Critical**

Location/file path: `frontend/src/app/admin/login/page.tsx:102-104`, `backend/README.md:27`, `backend/internal/config/config.go:36-37`

Problem: The login page renders `admin@sehatnusantara.id / Admin#12345`. The backend also defaults to the same seeded admin password when env variables are absent.

Why it matters: If this is deployed accidentally with defaults or visible demo text, an attacker has an immediate credential path. Even if the seeded password is changed, publishing example admin credentials on the real login screen trains users and attackers to test them.

Recommended fix: Remove demo credentials from the UI. Fail hard in production when `ADMIN_PASSWORD`, `JWT_SECRET`, or `DATABASE_URL` use default values. Seed demo credentials only in local/dev environments.

Example implementation:

```go
if cfg.IsProd() && cfg.JWTSecret == "change-me-in-production-please-32chars" {
  log.Fatal("JWT_SECRET must be set in production")
}
```

#### Route protection only checks cookie presence on the frontend

Severity: **P0 Critical**

Location/file path: `frontend/src/proxy.ts:8-27`

Problem: The Next proxy redirects based only on whether `ksn_token` exists. It does not verify expiry, signature, issuer, or role.

Why it matters: The backend correctly validates API requests, so this is not the final authorization layer. But an expired or forged cookie can still render the admin shell until API calls fail. That produces confusing UX and can leak dashboard structure/routes to unauthenticated users.

Recommended fix: Keep backend as the authority, but make frontend route protection call a lightweight session verification endpoint or validate the JWT server-side with a trusted secret only if the frontend runtime owns that secret. Do not rely on cookie presence as a security claim.

#### No RBAC or permission checks for admin actions

Severity: **P0 Critical**

Location/file path: `backend/internal/auth/auth.go:22-26`, `backend/internal/router/router.go:57-70`, `frontend/src/lib/admin/types.ts:8`

Problem: `role` exists in the JWT/admin model, but every authenticated admin can access every admin API route and destructive action. There is no backend permission middleware and no permission-aware action model in the frontend.

Why it matters: Real clinic admin systems often need separation between receptionist, doctor/admin, content editor, and super admin. Without backend RBAC, any compromised lower-privilege account can delete doctors, articles, locations, promotions, and appointments.

Recommended fix: Add backend permission middleware per route/action. Model roles and capabilities explicitly, then hide or disable frontend actions based on permissions as a UX layer only.

Example implementation:

```go
func RequireRole(roles ...string) gin.HandlerFunc {
  return func(c *gin.Context) {
    role := c.GetString("adminRole")
    if !slices.Contains(roles, role) {
      c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "FORBIDDEN"}})
      return
    }
    c.Next()
  }
}
```

Frontend permission hiding is not enough. Backend/API authorization must exist.

#### JWT is returned in the login response body

Severity: **P0 Critical**

Location/file path: `backend/internal/handlers/auth_handler.go:41-42`, `frontend/src/lib/admin/api.ts:49-53`

Problem: Login sets an httpOnly cookie but also returns `{ token }` in the JSON response.

Why it matters: Returning the bearer token to JavaScript defeats part of the benefit of using an httpOnly cookie. A future developer may store it in localStorage or expose it through logs/browser tooling.

Recommended fix: Return only the admin/session view after setting the cookie. Remove `token` from the response type in `frontend/src/lib/admin/api.ts`.

### P1 High

#### Authentication lacks rate limiting and lockout protection

Severity: **P1 High**

Location/file path: `backend/internal/router/router.go:40`, `backend/internal/handlers/auth_handler.go:17-43`

Problem: `/api/auth/login` has no rate limit, account lockout, IP throttling, CAPTCHA escalation, or audit logging.

Why it matters: Admin login is the highest-value endpoint. Without throttling, it is vulnerable to brute-force and credential stuffing attempts.

Recommended fix: Add IP + email rate limiting, failed-login audit logs, lockout/backoff policy, and monitoring. Consider `gin-contrib/limiter` or a Redis-backed limiter for multi-instance deployments.

#### Public appointment creation lacks abuse controls

Severity: **P1 High**

Location/file path: `backend/internal/router/router.go:45`, `backend/internal/handlers/appointment_handler.go:21-39`

Problem: `POST /api/appointments` is public and accepts appointment requests with basic validation only.

Why it matters: This can be spammed to fill the admin queue, inflate dashboard metrics, or create operational noise for clinic staff.

Recommended fix: Add rate limiting, honeypot/reCAPTCHA or Turnstile, source metadata, spam scoring, and admin-visible spam status. Store request IP/user agent carefully with privacy policy alignment.

#### Generic CRUD resources are not paginated server-side

Severity: **P1 High**

Location/file path: `frontend/src/lib/admin/api.ts:82-90`, `frontend/src/components/admin/CrudManager.tsx:73-87`

Problem: `doctors`, `articles`, `services`, `locations`, and `promotions` call `.list()` with no pagination/search params and then filter in the browser.

Why it matters: This is acceptable for seed data but fails with real content growth. It increases initial load time, memory usage, and makes URLs non-shareable.

Recommended fix: Convert resource list APIs to `?page=&limit=&q=&sort=&status=` and update `CrudManager` to accept server-driven state, debounced search, URL-synced filters, and total counts.

#### CRUD forms do not validate client-side or show field-level server errors

Severity: **P1 High**

Location/file path: `frontend/src/components/admin/CrudManager.tsx:104-122`, `frontend/src/components/admin/CrudManager.tsx:207-236`

Problem: Forms submit raw metadata values. Backend validation errors are reduced to a toast in `save()`, and `ApiError.details` from `frontend/src/lib/admin/api.ts:18-23` is never rendered near fields.

Why it matters: Admins cannot see which field failed. Invalid slugs, bad numbers, missing required fields, or duplicate slugs become trial-and-error.

Recommended fix: Use schema validation with Zod or Valibot per resource, display field errors under inputs, and map backend `details` to fields. Keep toast for form-level failures only.

#### Weak table controls for real admin work

Severity: **P1 High**

Location/file path: `frontend/src/components/admin/CrudManager.tsx:153-197`, `frontend/src/app/admin/(panel)/appointments/page.tsx:117-188`

Problem: Tables lack sorting, column visibility, bulk actions, row density controls, export, URL-synced state, and robust mobile layouts. Appointment filters are present but not reflected in the URL.

Why it matters: Admins lose context on refresh/share, cannot process queues efficiently, and cannot audit or triage large datasets.

Recommended fix: Build a reusable `DataTable` with TanStack Table, server state via URL params, row actions, bulk selection, and responsive card/table modes.

#### Dashboard KPIs are not operational enough

Severity: **P1 High**

Location/file path: `frontend/src/app/admin/(panel)/page.tsx:74-184`

Problem: Dashboard cards show totals, pending count, doctors, and articles. The 14-day appointment chart is useful but still generic. It lacks alerts such as unconfirmed appointments today, overdue callbacks, conversion from contact form to confirmed visit, and branch/service breakdown.

Why it matters: A clinic admin dashboard should help staff decide what to do next. Current KPIs inform, but do not drive action.

Recommended fix: Add operational cards: "Perlu dikonfirmasi", "Kunjungan hari ini", "Menunggu follow-up > 24 jam", "Cabang terpadat", "Layanan paling diminta". Link each card to filtered queues.

#### Login flow accepts arbitrary `next` path without same-area validation

Severity: **P1 High**

Location/file path: `frontend/src/app/admin/login/page.tsx:31-34`

Problem: `router.replace(params.get("next") || "/admin")` trusts the query parameter. Next's router will not navigate to a full external URL in normal usage, but it can still redirect to unexpected internal paths.

Why it matters: Admin login should return only to admin routes. A malicious link can bounce users to misleading internal pages after login.

Recommended fix: Validate `next` with `startsWith("/admin")` and block `/admin/login`.

#### API client has no timeout, abort, or retry policy

Severity: **P1 High**

Location/file path: `frontend/src/lib/admin/api.ts:27-42`

Problem: `fetch` calls have no timeout, no `AbortController`, no retry/backoff for idempotent GETs, and no global unauthorized handler.

Why it matters: Hanging requests degrade admin workflows. Expired sessions produce local toasts instead of a consistent re-login path.

Recommended fix: Wrap requests with timeout, typed error normalization, `401` redirect/session clear handling, and retry only for safe GETs.

### P2 Medium

#### Admin visual language is semi-professional but template-like

Severity: **P2 Medium**

Location/file path: `frontend/src/app/admin/login/page.tsx:44-63`, `frontend/src/app/admin/(panel)/page.tsx:31-45`, `frontend/src/components/admin/AdminShell.tsx`

Problem: The design uses common SaaS motifs: gradient icon logo, rounded cards, colored KPI icon blocks, generic resource sidebar, and broad "Kelola ..." copy.

Why it matters: It does not yet feel like a clinic operations tool. It feels like a starter dashboard adapted to healthcare.

Recommended fix: Replace generic cards with operational queues, branch/service filters, appointment triage states, and calmer neutral surfaces. Keep icons limited to navigation and status, not decoration.

#### Icon-only action buttons lack accessible names

Severity: **P2 Medium**

Location/file path: `frontend/src/components/admin/CrudManager.tsx:184-189`, `frontend/src/app/admin/(panel)/appointments/page.tsx:147-153`

Problem: Edit/delete/view/menu buttons render icons without `aria-label` or visible text.

Why it matters: Screen reader users hear ambiguous "button" controls. This is a concrete accessibility failure.

Recommended fix: Add `aria-label` and tooltips for icon-only buttons.

#### Filter buttons lack selected-state semantics

Severity: **P2 Medium**

Location/file path: `frontend/src/app/admin/(panel)/appointments/page.tsx:97-108`

Problem: Status filters are plain buttons with visual styling only.

Why it matters: Assistive tech cannot reliably announce which filter is active.

Recommended fix: Use tabs or add `aria-pressed={status === f.key}` and clear labels such as `Tampilkan janji temu: Menunggu`.

#### Destructive action confirmation is present but not stateful

Severity: **P2 Medium**

Location/file path: `frontend/src/components/admin/CrudManager.tsx:247-263`, `frontend/src/app/admin/(panel)/appointments/page.tsx:220-231`

Problem: Delete confirmations exist, which is good. But there is no deleting/loading state, no disabled confirm while pending, and no display of the exact record being deleted.

Why it matters: Double clicks can send duplicate requests, and admins may delete the wrong record when several dialogs feel identical.

Recommended fix: Track `deletingId`, disable confirm while pending, and include record name/title in the confirmation text.

#### Image handling bypasses Next image optimization in admin doctors table

Severity: **P2 Medium**

Location/file path: `frontend/src/app/admin/(panel)/doctors/page.tsx`

Problem: The doctors table uses a raw `<img>` and disables the Next lint rule.

Why it matters: Admin images can shift, load inefficiently, and miss optimized sizing.

Recommended fix: Use `next/image` with fixed dimensions or a reusable `AvatarImage` component with fallback initials.

#### Status and domain copy are too generic

Severity: **P2 Medium**

Location/file path: `frontend/src/components/admin/CrudManager.tsx:172-174`, `frontend/src/components/admin/CrudManager.tsx:202-204`

Problem: Empty state says "Belum ada data." Dialog copy says "Lengkapi data di bawah, lalu simpan." This is technically correct but not useful.

Why it matters: Production admin tools should guide the next action and explain operational impact.

Recommended fix: Make empty states per resource: "Belum ada artikel. Tambahkan edukasi kesehatan pertama untuk ditampilkan di situs." Make dialog copy resource-specific.

### P3 Low

#### Admin routes and components are grouped reasonably but need feature modules

Severity: **P3 Low**

Location/file path: `frontend/src/app/admin/(panel)/*`, `frontend/src/components/admin/*`, `frontend/src/lib/admin/*`

Problem: Current organization is understandable, but all admin primitives live in broad folders.

Why it matters: As features grow, cross-resource CRUD and resource-specific logic will become hard to maintain.

Recommended fix: Move toward feature modules: `features/admin/appointments`, `features/admin/content`, `features/admin/locations`, with shared `admin-shell`, `data-table`, and `forms`.

#### Some UI styling uses old landing-page visual tokens

Severity: **P3 Low**

Location/file path: `frontend/src/app/globals.css`, `frontend/src/app/admin/login/page.tsx:50`

Problem: Gradient logo and broad teal/emerald palette come from the marketing site.

Why it matters: Admin tools benefit from quieter color use and clearer semantic states.

Recommended fix: Define admin-specific tokens: neutral surfaces, compact radius, success/warning/error statuses, and restrained focus states.

## 4. Anti AI-Design Audit

Verdict: **Semi-professional but still template-like**

The dashboard does not look wildly AI-generated, but it still feels like a generic shadcn admin starter rather than a real clinic operations back office.

What is working:

- The UI is calm and readable.
- It avoids excessive Framer Motion and decorative animation.
- Navigation covers actual domain resources: appointments, doctors, articles, services, locations, promotions.
- Appointment status handling and recent appointment list are real operational concepts.

What feels AI/template-like:

- Login panel uses generic gradient logo and abstract dot background in `frontend/src/app/admin/login/page.tsx:44-63`.
- Dashboard KPI cards use common icon-block cards in `frontend/src/app/admin/(panel)/page.tsx:31-45`.
- Resource pages use the same CRUD scaffold regardless of domain.
- Empty states and form copy are generic.
- There are no clinic-specific workflow patterns: appointment triage, branch assignment, doctor schedule conflict warnings, content publish workflow, or corporate MCU lead handling.

What must change:

- Reframe `/admin` around operational work: "Perlu konfirmasi", "Hari ini", "Follow-up", "Cabang", "Dokter", not just totals.
- Make appointments the primary workflow with status lanes, quick contact actions, and SLA indicators.
- Make content/resources secondary settings areas.
- Remove demo-looking gradients and use restrained admin tokens.
- Replace generic empty/form copy with resource-specific microcopy.

## 5. Animation Audit

Current usage:

- Admin dashboard itself does not use Framer Motion directly.
- CSS imports `tw-animate-css` and global keyframes exist in `frontend/src/app/globals.css`.
- Interactive motion is mostly hover shadows/transitions and spinner animations.

Assessment:

- Good: admin avoids landing-page-like bouncing, glowing, and reveal animations.
- Risk: there are no explicit admin animation tokens or shared variants, so future additions may become inconsistent.
- Reduced motion: global CSS contains a `prefers-reduced-motion` rule, which is good, but admin component conventions do not document where motion is allowed.

Recommended animation standard:

```ts
export const adminMotion = {
  duration: {
    fast: 0.12,
    normal: 0.18,
  },
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  variants: {
    fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    dialog: { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } },
  },
};
```

Where animation should exist:

- Dialog open/close.
- Sidebar mobile drawer.
- Toasts.
- Row hover/focus states.
- Small loading spinners/skeletons.

Where animation should be removed/avoided:

- KPI entrance reveals.
- Floating dashboard cards.
- Decorative gradients.
- Chart animation that delays data comprehension.

## 6. Security Audit

Positive findings:

- Backend protects `/api/admin/*` with auth middleware in `backend/internal/router/router.go:57-70`.
- JWT parser checks signing method in `backend/internal/auth/auth.go:59-63`.
- Password hashes use bcrypt in `backend/internal/auth/auth.go:29-37`.
- Cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production in `backend/internal/auth/auth.go:72-82`.
- CORS uses configured origins and credentials in `backend/internal/router/router.go:23-31`.

Risks:

- Frontend route protection in `frontend/src/proxy.ts:8-27` checks only cookie presence.
- Login returns token body in `backend/internal/handlers/auth_handler.go:42`.
- Demo credentials are visible in `frontend/src/app/admin/login/page.tsx:102-104`.
- Production-dangerous defaults exist in `backend/internal/config/config.go:27-37`.
- No RBAC or action-level authorization exists.
- No CSRF token or origin/referer check for cookie-authenticated mutations.
- No rate limiting on login or public appointment creation.
- No audit trail for destructive actions.
- `NEXT_PUBLIC_API_URL` in `frontend/src/lib/admin/api.ts:13` is expected to be public, but production must ensure it never points to a dev API.

Required security fixes before production:

- Remove demo credentials from UI and production defaults.
- Stop returning JWT token in JSON.
- Enforce strong env validation on boot.
- Add RBAC middleware and permission-aware UI.
- Add login and public form rate limiting.
- Add CSRF protection for cookie-based mutation endpoints.
- Add audit logs for create/update/delete/status changes.

## 7. Data Table Audit

Appointments table:

- Server-side pagination: present via `appointmentsApi.list` in `frontend/src/lib/admin/api.ts:64-72` and backend `ListAppointments`.
- Server-side search/filter: present for status and q.
- Debounced search: present at `frontend/src/app/admin/(panel)/appointments/page.tsx:64-67`.
- Sorting: missing.
- Column visibility: missing.
- Row actions: present.
- Bulk actions: missing.
- Empty state: present but generic.
- Error state: toast only, no inline retry.
- URL-synced filters: missing.
- Mobile behavior: hides columns, but does not provide a dedicated mobile card layout.

Generic CRUD tables:

- Server-side pagination: missing.
- Server-side search/filter: missing.
- Client-side search: present in `frontend/src/components/admin/CrudManager.tsx:82-87`.
- Sorting: missing.
- Column visibility: missing.
- Row actions: edit/delete only.
- Bulk actions: missing.
- Loading skeleton: present.
- Empty state: generic.
- Error state: toast only.
- Large data behavior: weak; all rows are loaded into memory.

Recommended table direction:

- Build `AdminDataTable<T>` around TanStack Table.
- Use `searchParams` for page, q, status, sort, direction, and visible columns.
- Add server contracts for list endpoints:

```ts
type ListQuery = {
  page: number;
  limit: number;
  q?: string;
  sort?: string;
  direction?: "asc" | "desc";
  status?: string;
};
```

## 8. Form Audit

Current state:

- Basic labels exist.
- Submit loading state exists in `frontend/src/components/admin/CrudManager.tsx:238-242`.
- Double-submit is partially prevented by disabling save while `saving`.
- Delete confirmation exists.

Missing:

- Schema validation.
- Field-level server error mapping.
- Required/optional markers.
- Domain-specific controls for slug, image upload, rich article content, status, coordinates, and schedule.
- Dirty-state warning when closing a dialog with unsaved changes.
- Preview of public-facing content.
- Confirm-on-publish for articles/promotions.
- Accessibility descriptions for complex fields.

Recommended form architecture:

- Use `react-hook-form` + `zod`.
- One schema per resource.
- Map backend validation details to field errors.
- Add a shared `FormErrorSummary`.
- Add `useUnsavedChangesGuard`.

Example:

```tsx
const form = useForm<ArticleInput>({
  resolver: zodResolver(articleSchema),
});

catch (err) {
  if (err instanceof ApiError && err.details) {
    for (const detail of err.details) {
      form.setError(detail.field as keyof ArticleInput, { message: detail.message });
    }
  }
}
```

## 9. Performance Audit

Risks:

- Most admin routes are client components (`"use client"`), increasing JS footprint.
- `recharts` is imported directly in dashboard at `frontend/src/app/admin/(panel)/page.tsx:4-12`.
- Generic CRUD loads complete resource arrays.
- No virtualization for long tables.
- No abort handling; fast route changes can leave stale request updates.
- Doctors table uses raw `<img>`.

Recommended performance fixes:

- Dynamically import charts or isolate them in a client-only chart component.
- Keep route shells/server layouts server-rendered where possible.
- Paginate all list endpoints.
- Use request aborting for search/filter changes.
- Add virtualization only for high-volume tables after pagination requirements are clear.
- Use `next/image` or constrained avatar components for image cells.

## 10. Recommended Architecture

Target folder structure:

```text
frontend/src/features/admin/
  shell/
    AdminShell.tsx
    AdminSidebar.tsx
    AdminTopbar.tsx
    permissions.ts
  api/
    client.ts
    errors.ts
    session.ts
  components/
    AdminDataTable.tsx
    EmptyState.tsx
    ConfirmDeleteDialog.tsx
    MetricCard.tsx
    FormErrorSummary.tsx
  appointments/
    AppointmentQueue.tsx
    AppointmentDetailDialog.tsx
    appointment.schema.ts
    appointment.api.ts
  content/
    ArticleForm.tsx
    article.schema.ts
  resources/
    DoctorForm.tsx
    ServiceForm.tsx
    LocationForm.tsx
```

Admin shell:

- Keep `app/admin/(panel)/layout.tsx` small.
- Let `AdminShell` compose sidebar/topbar.
- Fetch/verify current admin session once.
- Pass permissions down via context.

Route protection:

- Frontend: verify session, redirect invalid sessions.
- Backend: enforce auth and permission middleware on every protected route.

Permission-aware actions:

```tsx
<Can permission="appointments.delete">
  <DeleteAppointmentButton appointment={row} />
</Can>
```

Reusable data table:

- Server-driven state.
- URL-synced params.
- Sorting/filtering/pagination.
- Empty/error/retry slots.
- Mobile card renderer.

API client:

- One `request()` with timeout, abort, typed errors, 401 handling, and field-error support.

Error handler:

- Distinguish validation, unauthorized, forbidden, conflict, network, and unknown errors.

Animation variants:

- Centralize durations/easing.
- Use animation only for state transitions and drawer/dialog feedback.

Dashboard metric card:

- Include label, value, trend, priority, filtered destination, and last updated timestamp.

Empty state component:

- Resource-specific title, description, CTA, and optional setup checklist.

## 11. Action Plan

### Phase 1 — Critical production blockers

Tasks:

- Remove demo credentials from `frontend/src/app/admin/login/page.tsx`.
- Remove `token` from login response in `backend/internal/handlers/auth_handler.go` and `frontend/src/lib/admin/api.ts`.
- Add production env validation in `backend/internal/config/config.go`.
- Add login and public appointment rate limiting in `backend/internal/router/router.go`.
- Add CSRF protection or explicit origin enforcement for cookie-authenticated mutations.
- Add RBAC middleware and permission definitions in `backend/internal/auth` and route groups.

Files to change:

- `frontend/src/app/admin/login/page.tsx`
- `frontend/src/lib/admin/api.ts`
- `backend/internal/handlers/auth_handler.go`
- `backend/internal/config/config.go`
- `backend/internal/router/router.go`
- `backend/internal/auth/auth.go`

Expected result:

- Admin auth no longer exposes demo secrets.
- Backend rejects unsafe production config.
- Protected API routes enforce authentication and authorization.

### Phase 2 — UX/data table/form improvements

Tasks:

- Replace `CrudManager` with resource-aware forms plus shared `AdminDataTable`.
- Add server-side pagination/search/sort to all admin list endpoints.
- Add field-level validation and error mapping.
- Add URL-synced filters for appointments.
- Add loading/error/empty components with retry buttons.

Files to change:

- `frontend/src/components/admin/CrudManager.tsx`
- `frontend/src/app/admin/(panel)/*/page.tsx`
- `frontend/src/lib/admin/api.ts`
- `backend/internal/handlers/*_handler.go`

Expected result:

- Admins can work with large data sets, share filtered URLs, and fix form errors quickly.

### Phase 3 — visual polish and animation

Tasks:

- Introduce admin-specific design tokens.
- Remove login demo feel, gradients, and generic icon blocks.
- Rework dashboard into operational queues and branch/service views.
- Add accessible labels/tooltips for icon-only controls.
- Standardize animation tokens.

Files to change:

- `frontend/src/app/globals.css`
- `frontend/src/components/admin/AdminShell.tsx`
- `frontend/src/app/admin/login/page.tsx`
- `frontend/src/app/admin/(panel)/page.tsx`
- `frontend/src/components/admin/StatusBadge.tsx`

Expected result:

- Dashboard feels like a calm clinic operations product, not a generic template.

### Phase 4 — performance and maintainability

Tasks:

- Split admin into feature modules.
- Dynamically load chart components.
- Add abortable API requests.
- Add audit log tables/endpoints.
- Add tests for auth, RBAC, forms, and destructive actions.

Files to change:

- `frontend/src/features/admin/**`
- `frontend/src/lib/admin/api.ts`
- `backend/internal/models/models.go`
- `backend/internal/handlers/*`
- `backend/internal/router/router.go`

Expected result:

- Admin codebase scales as workflows grow and remains safer to modify.

## 12. Final Verdict

Current production readiness: **58%**

Biggest blocker: **Security and authorization hardening.** Demo credentials, weak production config defaults, no RBAC, token returned in response body, and missing rate limiting/CSRF controls must be fixed before any real deployment.

Is the admin dashboard acceptable for real users? **Only for internal alpha with trusted users and non-sensitive test data.** It is not acceptable for production clinic operations yet.

What must be fixed before deployment:

- Remove all demo credential exposure.
- Enforce backend RBAC.
- Add production config validation and rate limiting.
- Stop returning JWTs to JavaScript.
- Add form validation/error mapping.
- Paginate/search/sort all admin tables server-side.
- Rework dashboard UX around real clinic workflows instead of generic resource cards.
