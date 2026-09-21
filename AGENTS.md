# Student OS Engineering Rules

## Product Source Of Truth

Student OS is a modern student-focused academic productivity and management platform. The product must be built as one connected student workflow, not as isolated CRUD pages.

Before implementing or changing a major module, read the relevant documentation in `docs/`:

- `Student_OS_01_PRD.pdf` for product vision, scope, goals, non-goals and acceptance criteria.
- `02_SRS.pdf` for testable behavior and edge cases.
- `03_PRODUCT_ARCHITECTURE.pdf` for system layering and module boundaries.
- `04_UI_UX_SPEC.pdf` and `05_DESIGN_SYSTEM.pdf` for interface behavior and component rules.
- `06_FEATURE_SPEC.pdf` and `07_USER_FLOWS.pdf` for feature behavior and journeys.
- `08_DATABASE_SCHEMA.pdf` and `09_API_SPEC.pdf` for data and API contracts.
- `10_AUTH_SECURITY.pdf` for security rules.
- `11_ANALYTICS_CHARTS.pdf`, `12_NOTIFICATIONS.pdf` and `13_AI_FEATURES.pdf` for specialized modules.
- `14_TESTING_QA.pdf`, `15_DEPLOYMENT.pdf`, `16_ROADMAP.pdf` and `17_OPEN_SOURCE.pdf` for quality, delivery, sequencing and dependency policy.

Do not invent product requirements. If documentation is incomplete or conflicting, record the decision in `docs/IMPLEMENTATION_PLAN.md` or an ADR before implementation.

## Architecture Rules

- Keep frontend, backend, database, shared contracts and background services separated by clear boundaries.
- Do not put business-critical logic only in client components.
- Do not access the database directly from frontend UI code.
- Use typed request and response contracts for API communication.
- Keep third-party providers behind adapters, especially auth, file storage, notifications and AI.
- Centralize validation schemas and reuse them where possible across API and UI forms.
- Keep cross-module behavior in domain services or shared application logic, not duplicated inside pages.
- Document major architecture decisions before large implementation work.

## Security Rules

- Never commit secrets, API keys, database credentials, signing keys, tokens or private environment files.
- Use secure password hashing if direct password auth is implemented.
- Prefer secure httpOnly cookie sessions unless an explicit architecture decision chooses another strategy.
- Every protected API must verify authentication and resource ownership.
- Validate input on the server even when the client validates first.
- Protect against IDOR, injection, unsafe file uploads, brute force, unsafe CORS and secret leakage.
- AI providers must only receive user-authorized data and must never be treated as official academic data.
- Do not scrape, bypass authentication or imitate unauthorized college/ERP access.

## Product Integrity Rules

- Application data must drive dashboards, analytics, calendar views and reminders.
- Charts must use real application data and show empty states when data is insufficient.
- AI output must be clearly labeled and must never fabricate official dates, attendance, marks, faculty details or institutional announcements.
- Notifications must deep-link to relevant entities when possible and must avoid duplicate reminders.
- Deleting or completing records must update related views safely.
- Handle empty, loading, error, success and disabled states for all important workflows.

## Frontend Rules

- Build a polished SaaS interface that is calm, responsive and information-dense without feeling crowded.
- Use the approved dependency direction: React, Tailwind CSS, shadcn/ui, Lucide React, Recharts, React Hook Form, Zod, date-fns, React Day Picker, TanStack Table, Sonner and theme support.
- Use reusable components and documented variants instead of copy-pasted UI.
- Use semantic HTML, labels, visible focus states, keyboard access and readable contrast.
- Support light and dark themes using semantic tokens; avoid hard-coded page-specific colors.
- Use responsive patterns for tables, charts, dialogs and navigation.
- Use subtle motion only when it improves clarity.

## Backend Rules

- Organize backend modules around product domains: auth, users/profile, dashboard, timetable, tasks, calendar, attendance, exams, notes, notifications, analytics, AI and settings.
- Keep controllers thin; put business rules in services.
- Use consistent JSON success and error shapes.
- Return meaningful HTTP status codes: 400, 401, 403, 404, 409, 429 and 500 where appropriate.
- Use pagination/filtering for growing collections.
- Log useful operational events without logging passwords, tokens or unnecessary personal information.

## Database Rules

- Use a relational schema for structured academic relationships.
- Use versioned migrations.
- Index `userId`, date fields, status fields and other frequently filtered fields.
- Store timestamps in UTC or document a clear timezone strategy.
- Never store plaintext passwords.
- Mark seed/demo data clearly.
- Prefer hard deletion unless history, audit or product behavior requires soft deletion.

## Testing And Quality Rules

- Add tests proportional to risk and module blast radius.
- Cover domain utilities, API/database integration flows, important UI behavior and critical end-to-end journeys.
- Critical journeys include login/logout, create/complete task, Today view, timetable entry, calendar view, attendance, exam creation, note editing, notification read state and settings changes.
- Before completing a phase, run lint, typecheck, tests and build.
- Manually verify desktop, tablet and mobile layouts for major flows.
- Do not consider a feature complete if controls are visual-only unless documentation explicitly marks it as future scope.

## Dependency Rules

- Add dependencies only when they have a clear purpose.
- Avoid duplicate libraries for the same job.
- Prefer actively maintained open-source packages with compatible licenses.
- Document dependency purpose, version, license and usage for meaningful additions.
- Do not copy proprietary code or assets without permission.

## Implementation Discipline

- Implement one roadmap phase at a time.
- Keep changes scoped to the active phase.
- Preserve existing working behavior.
- Update documentation when a requirement or decision changes.
- Use meaningful commits and keep generated artifacts, build output and local environment files out of source control.
