# Student OS Implementation Plan

## Current Repository Discovery

The current local workspace contains documentation only:

- `docs/Student_OS_01_PRD.pdf`
- `docs/02_SRS.pdf`
- `docs/03_PRODUCT_ARCHITECTURE.pdf`
- `docs/04_UI_UX_SPEC.pdf`
- `docs/05_DESIGN_SYSTEM.pdf`
- `docs/06_FEATURE_SPEC.pdf`
- `docs/07_USER_FLOWS.pdf`
- `docs/08_DATABASE_SCHEMA.pdf`
- `docs/09_API_SPEC.pdf`
- `docs/10_AUTH_SECURITY.pdf`
- `docs/11_ANALYTICS_CHARTS.pdf`
- `docs/12_NOTIFICATIONS.pdf`
- `docs/13_AI_FEATURES.pdf`
- `docs/14_TESTING_QA.pdf`
- `docs/15_DEPLOYMENT.pdf`
- `docs/16_ROADMAP.pdf`
- `docs/17_OPEN_SOURCE.pdf`
- `docs/README.pdf`
- `docs/Student_OS_Documentation_INDEX.pdf`

No application code, package files, local Git metadata or environment files are present in the inspected workspace.

The requested `01_PRD.pdf` is present under the name `Student_OS_01_PRD.pdf`. The documentation index also references `01_PRD.pdf`, so this is a naming mismatch to resolve before future automation depends on exact filenames.

## Product Understanding

Student OS is a student-focused academic productivity platform. It connects timetable, daily planning, tasks, calendar, attendance, exams, notes, notifications and analytics into one actionable workflow.

The core product question is: what is happening today, what is pending, what is coming next and what should the student do?

The initial version must support manual, seeded, mock, imported or authorized data. It must not scrape college systems, bypass authentication or present AI-generated content as official academic information.

## Requirement Conflicts And Gaps

### Conflicts

- The docs list `01_PRD.pdf`, but the actual local file is `Student_OS_01_PRD.pdf`.
- Notification delivery is required, but the exact delivery mechanism is intentionally not finalized.
- Authentication allows secure cookies or another documented secure strategy; the final session model is undecided.
- Timetable overlap behavior is described as configurable warning/prevention, but the default rule is not fixed.
- Notes mention attachments where implemented; file storage is required architecturally but no provider is selected.
- AI is described as future/controlled scope, while several AI modules are listed in the roadmap. AI must be phased later and not included in MVP unless explicitly authorized.

### Missing Information

- Final hosting provider for frontend, backend, database, object storage and background jobs.
- Whether this should be a monorepo with separate frontend/backend apps or a single full-stack framework.
- Whether direct email/password auth, OAuth or both are required for MVP.
- Exact notification channels: in-app only, web push, email or mobile push.
- Account deletion/data export requirements beyond high-level privacy guidance.
- File attachment limits, accepted MIME types and storage retention rules.
- Whether subjects are globally shared, per-user, or institution-scoped in MVP.
- Exact attendance input model: aggregate attended/total values, per-class records, or both.
- Exact study-session capture workflow for study-hours analytics.
- Licensing choice for the public repository.

## Recommended Technology Architecture

Use a TypeScript monorepo with separate frontend and backend apps. This matches the documentation requirement for a React frontend, Node.js backend, typed contracts, modular domain logic and a relational database.

### Recommended Stack

- Package manager: `pnpm`
- Monorepo tooling: `pnpm` workspaces
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui patterns with project-owned component wrappers
- Icons: Lucide React
- Forms and validation: React Hook Form + Zod
- Tables: TanStack Table
- Charts: Recharts
- Dates/calendar: date-fns + React Day Picker
- Toasts: Sonner
- Theme: next-themes equivalent for Vite, or a small project-owned theme provider
- Backend: Node.js + TypeScript + Express.js (REST API architecture)
- Database: PostgreSQL + Prisma ORM
- Auth: Session-based authentication with secure httpOnly cookies (`express-session` with Prisma/PostgreSQL session backing)
- Testing: Vitest, React Testing Library, Playwright, API integration tests
- Lint/format/typecheck: Prettier, TypeScript strict mode
- Background jobs: adapter-based scheduler, initially in-process for local/MVP, replaceable later with a queue/worker
- File storage: Local filesystem adapter for development; abstract interface ready for S3 / Cloudflare R2 in production
- AI: provider adapter behind backend service only, deferred until Phase 4

### Why Not Build As A Single Frontend-Only App

The docs require secure authentication, protected resources, server-side authorization, database relationships, background notification scheduling, AI provider protection and file upload restrictions. Those requirements need a real backend.

## Proposed Folder Structure

```text
.
├── AGENTS.md
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   └── *.pdf
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── routes/
│   │   │   ├── styles/
│   │   │   └── test/
│   │   └── package.json
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── dashboard/
│       │   │   ├── timetable/
│       │   │   ├── tasks/
│       │   │   ├── calendar/
│       │   │   ├── attendance/
│       │   │   ├── exams/
│       │   │   ├── notes/
│       │   │   ├── notifications/
│       │   │   ├── analytics/
│       │   │   ├── ai/
│       │   │   └── settings/
│       │   ├── plugins/
│       │   ├── shared/
│       │   ├── jobs/
│       │   └── test/
│       └── package.json
├── packages/
│   ├── contracts/
│   │   └── src/
│   ├── config/
│   ├── database/
│   │   ├── prisma/
│   │   └── seed/
│   └── ui/
│       └── src/
├── tests/
│   └── e2e/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Architecture Plan

### Frontend

The frontend should be organized by features with shared primitives in `packages/ui`. Route pages should compose feature components and call API clients. UI state should be local where possible and server state should be cached consistently.

Primary frontend areas:

- App shell: responsive sidebar, top header and mobile bottom navigation.
- Auth pages: register, login and session expiry handling.
- Home: connected dashboard summary.
- Today: date navigation, timeline, tasks and reminders.
- Timetable: weekly grid and entry management.
- Calendar: month view, event markers and date detail panel.
- Tasks: filters, search, CRUD, completion and reminders.
- Attendance: overall and subject views.
- Exams: upcoming exam list, countdown and progress.
- Notes: subject navigation, note list/editor and attachment/link surface.
- Notifications: unread state, filters, preferences.
- Profile and Settings: identity, preferences, appearance and notification settings.

### Backend

The backend should expose REST endpoints matching `09_API_SPEC.pdf`. Each module should have:

- route definitions
- request/response schemas
- controller/handler
- service/domain logic
- repository/database access
- tests

Shared backend concerns:

- auth/session plugin
- request validation
- ownership authorization
- consistent error responses
- rate limiting
- logging
- health endpoint
- upload validation
- scheduler abstraction

### Database

PostgreSQL with Prisma should model the documented entities and relationships. Ownership fields must be part of all user-specific records. Foreign keys should enforce subject/task/exam/note relationships where practical.

Use a seed dataset for local development and demos. Seed data must be clearly marked as demo data.

### Notifications

Implement in-app notifications first. Add a scheduler abstraction so future channels can be added without changing feature modules. Reminder rules should create scheduled notifications for tasks, timetable entries, exams, attendance warnings and daily summaries.

### AI

Do not implement AI in MVP phases. Create no provider-specific coupling in the frontend. When Phase 4 begins, implement AI behind a backend adapter with guardrails, labeling, failure handling and explicit user input boundaries.

## Database Implementation Order

1. Users, sessions/auth tables and StudentProfile.
2. Subject/Course.
3. TimetableEntry.
4. Task.
5. Event or unified calendar projection strategy.
6. AttendanceRecord.
7. Exam.
8. Note.
9. Notification and NotificationPreference.
10. StudySession.
11. Attachment.
12. AI-related persisted output only if Phase 4 requires it.

## API Implementation Order

1. Health and standardized error responses.
2. Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
3. Profile/settings endpoints needed by onboarding and app shell.
4. Subjects support if required by timetable/tasks/notes/exams.
5. Timetable: `GET`, `POST`, `PATCH`, `DELETE`.
6. Dashboard summary: `GET /dashboard/summary`.
7. Tasks: `GET`, `POST`, `GET /:id`, `PATCH`, `DELETE`, `POST /:id/complete`.
8. Calendar: `GET /calendar?from=&to=`.
9. Notifications and preferences.
10. Attendance endpoints.
11. Exams endpoints.
12. Notes endpoints.
13. Analytics endpoints.
14. AI endpoints, deferred to Phase 4.

## Frontend Implementation Order

1. Project shell, routing, theme provider and design tokens.
2. Shared UI primitives and form patterns.
3. Auth screens and protected-route handling.
4. Profile completion flow.
5. App layout: desktop sidebar, top header and mobile bottom navigation.
6. Home dashboard with real API data and empty states.
7. Today view.
8. Timetable view and forms.
9. Tasks view, filters and task form.
10. Calendar month view and date detail panel.
11. Notifications list and preferences.
12. Attendance views and charts.
13. Exams views and progress controls.
14. Notes list/editor and attachment/link UI.
15. Analytics polish.
16. AI screens only after backend AI boundaries are implemented.

## Development Phases

### Phase 0 - Repository Foundation

Scope:

- Initialize monorepo.
- Add package manager, TypeScript, linting, formatting and base scripts.
- Add environment examples and local setup docs.
- Add initial CI commands.
- Add database package with migration tooling.
- Add app shell skeleton only, not product features.

Completion criteria:

- `install`, `lint`, `typecheck`, `test` and `build` scripts exist.
- Local development setup is documented.
- No secrets are committed.
- Architecture decisions are documented.

### Phase 1 - Foundation

Scope:

- Authentication.
- Student profile.
- Design system foundations.
- Home.
- Today.
- Timetable.

Backend:

- Auth/session.
- User/profile.
- Subject basics.
- Timetable CRUD.
- Dashboard summary.

Frontend:

- Auth pages.
- Protected app layout.
- Profile completion.
- Home dashboard.
- Today timeline.
- Timetable grid and forms.

Completion criteria:

- A student can register/login/logout and reach a personalized dashboard.
- Protected routes reject unauthenticated access.
- Timetable entries can be created, edited and deleted.
- Home and Today use real data.
- Responsive desktop/mobile smoke checks pass.

### Phase 2 - Productivity

Scope:

- Tasks.
- Calendar.
- Notifications.
- Reminder infrastructure.

Backend:

- Task CRUD and completion.
- Calendar aggregation.
- Notification and preference storage.
- In-app notification scheduling.

Frontend:

- Task list, filters, search and create/edit flow.
- Calendar month view and date panel.
- Notification center and unread state.
- Reminder settings.

Completion criteria:

- Creating a task updates Tasks, Calendar, Home and Today where relevant.
- Completing a task updates statistics and pending/completed views.
- In-app reminders are created without duplicate active reminders.
- Calendar displays tasks, classes and exams when present.

### Phase 3 - Academic Tracking

Scope:

- Attendance.
- Exams.
- Notes.
- Analytics.

Backend:

- Attendance records and calculations.
- Exam CRUD and progress.
- Notes CRUD.
- Study sessions if needed for study-hour analytics.
- Analytics endpoints.

Frontend:

- Attendance overview and subject details.
- Exam cards/table, countdown and progress controls.
- Notes subject navigation, editor and search.
- Charts for attendance, tasks, study and exams.

Completion criteria:

- Attendance percentages are correct and never misleading when total is zero.
- Exams appear in Exams, Calendar, Home and reminders.
- Notes can be created, searched, edited and deleted.
- Charts show empty states when data is insufficient.

### Phase 4 - Intelligence

Scope:

- AI Study Planner.
- AI Doubt Assistant.
- AI Notes Summary.
- AI Exam Preparation.
- Smart recommendations.

Backend:

- AI provider abstraction.
- Prompt/data validation.
- Provider error handling.
- Optional persisted AI outputs where justified.

Frontend:

- AI-labeled screens and outputs.
- User inspection/edit/accept flows for generated plans.
- Failure and timeout states.

Completion criteria:

- AI never fabricates official academic data.
- AI output is clearly labeled.
- User can edit/accept generated plans.
- Provider keys remain server-side only.

### Phase 5 - Scale And Integration

Scope:

- Authorized institutional integrations.
- Advanced roles.
- Stronger analytics.
- Automation.
- Broader SaaS capabilities.

Completion criteria:

- Integration uses official authorized APIs only.
- RBAC is deny-by-default.
- Multi-role behavior is tested.
- Operational monitoring and rollback plans are production-ready.

## Dependencies

### Initial Dependencies

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-compatible component setup
- Lucide React
- React Hook Form
- Zod
- date-fns
- React Day Picker
- Recharts
- TanStack Table
- Sonner
- Fastify
- Prisma
- PostgreSQL driver
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier

### Deferred Dependencies

- Object storage SDK, selected after storage provider decision.
- Background queue/scheduler package, selected after deployment provider decision.
- AI SDK/provider client, selected when Phase 4 begins.
- Email/web-push provider SDK, selected if notifications expand beyond in-app.

## Testing Strategy

### Unit Tests

- Date/time utilities.
- Attendance percentage and warning calculations.
- Task status and overdue logic.
- Reminder timing calculations.
- Analytics calculations.

### Integration Tests

- Auth/session flows.
- Resource ownership checks.
- Task to calendar/dashboard propagation.
- Timetable overlap validation.
- Notification scheduling.
- Exam/calendar/dashboard propagation.

### Component Tests

- Auth forms.
- Task form and filters.
- Calendar date panel.
- Timetable grid interactions.
- Attendance chart empty and populated states.
- Notification read/unread interaction.

### End-To-End Tests

- Register/login/logout.
- Complete profile.
- Create timetable entry.
- View Today.
- Create and complete task.
- View calendar update.
- Create exam.
- View attendance.
- Create/edit note.
- Read notification.
- Change settings.

### Release Gate

- Lint passes.
- Typecheck passes.
- Unit/integration/component tests pass.
- Build passes.
- Critical E2E journeys pass.
- Responsive smoke test completed.
- Security-sensitive paths reviewed.

## Deployment Strategy

### Environments

- Local development.
- Staging/test.
- Production.

### Frontend

- Static production build deployed behind HTTPS.
- Environment configuration outside source control.
- Error monitoring before production launch.
- Cache static assets appropriately.

### Backend

- Node.js production runtime.
- Health endpoint.
- Structured logs.
- Secure environment variables.
- Safe CORS configuration.
- Rate limiting.
- Graceful error handling.

### Database

- Managed PostgreSQL preferred.
- Least-privilege database credentials.
- Versioned migrations.
- Backups before production.
- Index review before release.

### CI/CD

Recommended pipeline:

1. Install dependencies.
2. Lint.
3. Typecheck.
4. Test.
5. Build.
6. Run migration checks.
7. Deploy to staging.
8. Run smoke tests.
9. Promote to production.

## Known Risks

- Scope is broad for an MVP; strict phase discipline is required.
- Cross-module synchronization can become fragile if business logic is duplicated in the frontend.
- Notification scheduling can become complex once multiple channels and timezones are added.
- Attendance model is under-specified and could require schema changes if chosen poorly.
- Notes attachments require storage, upload validation and security work not fully specified.
- AI features can accidentally exceed product scope or leak sensitive context if not isolated.
- Mobile responsiveness for tables/charts needs early verification.
- Exact deployment provider affects auth cookies, background jobs, storage and scheduler choices.

## Architecture Decisions Log

- **Backend Framework**: Node.js + Express.js in pure JavaScript (ESM, REST API architecture) - *Confirmed by User*
- **Frontend Framework**: React.js + Vite + JavaScript (JSX) + Tailwind CSS + Lucide React - *Confirmed by User*
- **Database**: PostgreSQL with Prisma ORM - *Confirmed by User*
- **Authentication**: Session-based authentication with secure httpOnly cookies - *Confirmed by User*
- **File Storage**: Local filesystem adapter for development, cloud-ready (S3/Cloudflare R2) - *Confirmed by User*
- **Testing**: Vitest (Unit/Integration) and Playwright (E2E) - *Confirmed by User*
- **Timetable Overlap Policy**: Overlapping timetable entries are rejected with 409 Conflict status - *Implemented in Phase 1*
- **Task & Calendar Model**: Tasks are modeled with due dates, priorities, categories, and completion tracking; Calendar dynamically projects recurring classes, events, and tasks across date ranges - *Implemented in Phase 2*
- **Notification Model**: In-app notifications with user-configurable preferences per category and lead timing - *Implemented in Phase 2*
- **Technology Stack Migration**: Migrated 100% of codebase from TypeScript/Next.js to pure JavaScript (React + Vite + Express + Prisma) while strictly preserving all functionality and passing all unit, build, and E2E tests - *Migrated & Verified*

## Remaining Decisions For Later Phases

- Should attendance input in Phase 3 default to per-class session log or aggregate percentage update? (Phase 3)
- Which public license (e.g. MIT, Apache 2.0) should be included in the repository root? (Phase 5)

## Immediate Next Step

Phases 0, 1, and 2 are fully completed, verified, and migrated to pure JavaScript. All unit tests (40/40), production builds, and Playwright E2E suites pass cleanly. Awaiting user authorization before starting Phase 3.
