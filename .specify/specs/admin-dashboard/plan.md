# Implementation Plan: Admin Dashboard / 后台管理系统

**Branch**: `feat/admin-dashboard`

**Date**: 2026-06-27

**Spec**: [.specify/specs/admin-dashboard/spec.md](.specify/specs/admin-dashboard/spec.md)

**Input**: Feature specification from `/specs/admin-dashboard/spec.md`

---

## Summary

Build a comprehensive admin dashboard for WarXOne game management. The dashboard will be a separate SPA (Single Page Application) deployed to EdgeOne, with dedicated SCF functions for admin APIs. Features include admin authentication, player management, game content management, analytics, and system configuration.

---

## Technical Context

**Language/Version**: Node.js 22.x (backend), Vanilla JS + Vite 6.x (frontend)

**Primary Dependencies**: 
- Backend: `mysql2`, `bcrypt`, `jsonwebtoken`
- Frontend: Vite 6.x, custom components (no framework)

**Storage**: TDSQL-C Serverless MySQL (admin tables added)

**Testing**: Manual testing + basic unit tests for critical functions

**Target Platform**: EdgeOne (frontend), SCF (backend)

**Project Type**: Web application (admin dashboard SPA + SCF APIs)

**Performance Goals**: 
- Admin login < 3 seconds
- Player search < 2 seconds
- Dashboard statistics load < 5 seconds

**Constraints**: 
- Admin dashboard must be separate from player game
- All admin APIs must validate admin JWT tokens
- Sensitive operations must be logged (audit trail)

**Scale/Scope**: 
- Initial version: 1 super admin + up to 5 moderators
- Player base: up to 10,000 players
- Concurrent admin users: up to 3

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. ✅ **Principle I (Serverless-First)**: All admin APIs will be SCF functions
2. ✅ **Principle II (Edge-First)**: Admin dashboard will be static SPA on EdgeOne
3. ✅ **Principle III (Stateless)**: Admin sessions use JWT tokens, no server-side session storage
4. ✅ **Principle IV (Security)**: All admin APIs validate JWT + audit log for sensitive actions
5. ✅ **Principle V (i18n)**: Admin dashboard will support English (initially), extensible to other languages
6. ✅ **Principle VI (AI Integration)**: Not applicable for v1 (no AI features in admin dashboard)
7. ✅ **Principle VII (Real-Time)**: Not applicable for v1 (no real-time features in admin dashboard)

**Result**: ✅ PASS - No constitution violations.

---

## Project Structure

### Documentation (this feature)

```
specs/admin-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (API design, security considerations)
├── data-model.md        # Phase 1 output (database schema, API contracts)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```
admin/                      # NEW: Admin dashboard SPA
├── src/
│   ├── main.js            # Entry point, router
│   ├── api/
│   │   └── client.js     # Admin API client (JWT auth, audit logging)
│   ├── components/
│   │   ├── LoginScreen.js
│   │   ├── DashboardHome.js
│   │   ├── PlayerManagement.js
│   │   ├── ContentManagement.js
│   │   ├── Analytics.js
│   │   └── SystemConfig.js
│   ├── styles/
│   │   ├── variables.css
│   │   ├── base.css
│   │   └── components.css
│   └── utils/
│       ├── auth.js        # Admin JWT management
│       └── audit.js      # Client-side audit logging
├── index.html
├── package.json
└── vite.config.js       # Proxy to admin SCF functions

backend/                    # Existing backend, NEW admin functions
├── function/
│   ├── admin-login/      # NEW: Admin login
│   ├── admin-logout/     # NEW: Admin logout
│   ├── admin-refresh/    # NEW: Admin token refresh
│   ├── admin-dashboard-stats/  # NEW: Dashboard statistics
│   ├── admin-player-list/     # NEW: List/search players
│   ├── admin-player-detail/   # NEW: Player details + ban/delete
│   ├── admin-content-country/  # NEW: Manage countries
│   ├── admin-content-quiz/    # NEW: Manage quiz questions
│   ├── admin-content-giftcode/ # NEW: Generate/deactivate gift codes
│   ├── admin-config-get/       # NEW: Get system config
│   ├── admin-config-update/   # NEW: Update system config
│   └── admin-audit-logs/     # NEW: View audit logs
├── shared/
│   ├── db.js             # Existing: Database connection
│   ├── auth.js           # NEW: Admin authentication utilities
│   └── audit.js         # NEW: Audit logging utility
└── admin-schema.sql     # NEW: Admin database schema
```

**Structure Decision**: Admin dashboard will be a separate SPA (`admin/` directory) from the player game (`frontend/` directory). This ensures clean separation of concerns and security. Admin APIs will be separate SCF functions with `admin-` prefix.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

**Notes**: 
- Admin dashboard adds complexity but is necessary for game operations.
- Separate SPA ensures security (no admin code in player game).
- Audit logging adds overhead but is mandatory for admin actions.

---

## Implementation Phases (High-Level)

### Phase 0: Research & Design (estimated 2-3 days)
- Research admin dashboard best practices (security, UI patterns)
- Design API contracts for all admin SCF functions
- Design database schema (already drafted in `admin-schema.sql`)
- Design UI wireframes (simple, functional)

### Phase 1: Data Model & API Contracts (estimated 3-5 days)
- Create `admin-schema.sql` and run on TDSQL-C
- Implement admin authentication SCF functions (`admin-login`, `admin-logout`, `admin-refresh`)
- Implement admin authorization middleware (JWT validation + role check)
- Define API contracts (request/response formats) for all admin APIs

### Phase 2: Frontend Implementation (estimated 5-7 days)
- Set up `admin/` directory with Vite
- Implement admin login page
- Implement dashboard homepage (statistics cards)
- Implement player management page
- Implement game content management page
- Implement analytics page
- Implement system configuration page

### Phase 3: Backend Implementation (estimated 5-7 days)
- Implement all admin SCF functions (listed in Project Structure)
- Implement audit logging for all sensitive actions
- Implement role-based access control (super_admin vs. moderator)
- Add CSRF protection to all admin APIs

### Phase 4: Testing & Deployment (estimated 2-3 days)
- Manual testing of all admin features
- Security testing (JWT validation, CSRF, SQL injection)
- Deploy admin SCF functions to SCF
- Deploy admin SPA to EdgeOne (separate subdomain)
- Update `edgeone.json` to support admin subdomain (or use separate edgeone.json)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-------------|
| Admin account compromise | Strong password policy, 2FA (future), audit logging |
| CSRF attacks | CSRF tokens required for all admin POST/PUT/DELETE requests |
| SQL injection | Parameterized queries (mysql2 prepared statements) |
| JWT token theft | Short expiry (15 minutes), refresh token rotation |
| Accidental data deletion | Confirmation dialogs, soft delete (is_active flag) |

---

## Success Metrics

- ✅ Admin can log in and access dashboard within 5 seconds
- ✅ All player management operations work correctly (search, ban, delete)
- ✅ All content management operations work correctly (CRUD on countries, quiz, gift codes)
- ✅ Analytics data is accurate and exportable as CSV
- ✅ System configuration changes take effect immediately
- ✅ All admin actions are logged in audit_logs table
- ✅ Admin dashboard is responsive (desktop + tablet)

---

## Next Steps

1. **Review this plan**: Provide feedback or approval
2. **Start Phase 0**: Research admin dashboard best practices
3. **Create tasks.md**: Break down into smaller tasks (use `/speckit.tasks` command)
4. **Begin implementation**: Start with Phase 1 (Data Model & API Contracts)

---

**Estimated Total Time**: 17-25 days (approximately 3-5 weeks)

**Priority**: High (foundational for game operations)

**Dependencies**: None (can start immediately after plan approval)
