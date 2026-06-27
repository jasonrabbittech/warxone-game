# Tasks: Admin Dashboard / 后台管理系统

**Branch**: `feat/admin-dashboard`

**Date**: 2026-06-27

**Plan**: [plan.md](./plan.md)

---

## Task Breakdown (Ordered by Dependency)

### Phase 0: Research & Design (2-3 days)

- [ ] **Task 0.1**: Research admin dashboard security best practices (JWT, CSRF, audit logging)
- [ ] **Task 0.2**: Design API contracts for all admin SCF functions (request/response formats)
- [ ] **Task 0.3**: Design database schema (review `admin-schema.sql` and adjust if needed)
- [ ] **Task 0.4**: Design UI wireframes (simple, functional admin interface)

### Phase 1: Database & Authentication (3-5 days)

- [x] **Task 1.1**: Create `admin_users` table (run `admin-schema.sql`) - DONE
- [x] **Task 1.2**: Implement `admin-login` SCF function (JWT generation, password validation) - DONE
- [x] **Task 1.3**: Implement `admin-logout` SCF function (token invalidation) - DONE
- [x] **Task 1.4**: Implement `admin-refresh` SCF function (token refresh) - DONE
- [x] **Task 1.5**: Implement admin authentication middleware (JWT validation + role check) - DONE
- [x] **Task 1.6**: Create default super admin account (secure password) - DONE

### Phase 2: Frontend Foundation (5-7 days)

- [ ] **Task 2.1**: Set up `admin/` directory with Vite (`npm create vite@latest`)
- [ ] **Task 2.2**: Create admin login page (`LoginScreen.js`)
- [ ] **Task 2.3**: Create admin API client (`admin/src/api/client.js`) with JWT handling
- [ ] **Task 2.4**: Create admin layout (sidebar navigation, header)
- [ ] **Task 2.5**: Create dashboard homepage (`DashboardHome.js`) with statistics cards
- [ ] **Task 2.6**: Add responsive styles for admin dashboard

### Phase 3: Player Management (3-4 days)

- [ ] **Task 3.1**: Implement `admin-player-list` SCF function (list/search/filter players)
- [ ] **Task 3.2**: Create player management page (`PlayerManagement.js`)
- [ ] **Task 3.3**: Implement player details view (email, registration date, game progress)
- [ ] **Task 3.4**: Implement player suspend/ban functionality
- [ ] **Task 3.5**: Implement player delete functionality (with confirmation dialog)
- [ ] **Task 3.6**: Implement in-game message sending to players

### Phase 4: Game Content Management (4-5 days)

- [ ] **Task 4.1**: Implement `admin-content-country` SCF function (CRUD on countries)
- [ ] **Task 4.2**: Create content management page (`ContentManagement.js`)
- [ ] **Task 4.3**: Implement country management (add/edit/delete countries)
- [ ] **Task 4.4**: Implement quiz question management (add/edit/delete questions)
- [ ] **Task 4.5**: Implement gift code generation (bulk generate, deactivate)
- [ ] **Task 4.6**: Implement card rarity management (adjust drop rates)

### Phase 5: Analytics & Reports (3-4 days)

- [ ] **Task 5.1**: Implement `admin-dashboard-stats` SCF function (calculate statistics)
- [ ] **Task 5.2**: Create analytics page (`Analytics.js`)
- [ ] **Task 5.3**: Implement player growth chart (daily/weekly/monthly)
- [ ] **Task 5.4**: Implement battle statistics (win/loss ratios)
- [ ] **Task 5.5**: Implement popular countries chart (most conquered)
- [ ] **Task 5.6**: Implement CSV export for all reports

### Phase 6: System Configuration (2-3 days)

- [ ] **Task 6.1**: Implement `admin-config-get` and `admin-config-update` SCF functions
- [ ] **Task 6.2**: Create system configuration page (`SystemConfig.js`)
- [ ] **Task 6.3**: Implement game balance parameters (population growth rate, battle damage)
- [ ] **Task 6.4**: Implement maintenance mode toggle
- [ ] **Task 6.5**: Implement feature flags (enable/disable features for testing)

### Phase 7: Audit & Security (2-3 days)

- [ ] **Task 7.1**: Implement audit logging utility (`backend/shared/audit.js`)
- [ ] **Task 7.2**: Add audit logging to all sensitive admin actions
- [ ] **Task 7.3**: Implement `admin-audit-logs` SCF function (view audit logs)
- [ ] **Task 7.4**: Create audit logs viewer in admin dashboard
- [ ] **Task 7.5**: Add CSRF protection to all admin APIs
- [ ] **Task 7.6**: Perform security testing (JWT validation, CSRF, SQL injection)

### Phase 8: Testing & Deployment (2-3 days)

- [ ] **Task 8.1**: Manual testing of all admin features
- [ ] **Task 8.2**: Write basic unit tests for critical functions (admin login, player ban)
- [ ] **Task 8.3**: Deploy admin SCF functions to SCF
- [ ] **Task 8.4**: Deploy admin SPA to EdgeOne (separate subdomain)
- [ ] **Task 8.5**: Update `edgeone.json` to support admin subdomain (or use separate config)
- [ ] **Task 8.6**: Document admin dashboard usage (README.md)

---

## Task Statistics

- **Total Tasks**: 42
- **Completed**: 0
- **Remaining**: 42
- **Estimated Total Time**: 17-25 days (approximately 3-5 weeks)

---

## Task Assignment (Optional)

If working with a team:

- **Frontend Developer**: Tasks 2.1-2.6, 3.2, 4.2, 5.2, 6.2, 7.4
- **Backend Developer**: Tasks 1.2-1.6, 3.1, 4.1, 5.1, 6.1, 7.1-7.3
- **Security Specialist**: Tasks 0.1, 7.5, 7.6
- **DevOps Engineer**: Tasks 8.3-8.5

---

## Next Steps

1. **Review tasks**: Provide feedback or adjust priorities
2. **Start with Task 0.1**: Research admin dashboard security best practices
3. **Work sequentially**: Complete tasks in order (respect dependencies)
4. **Test frequently**: Test each feature as soon as it's implemented
5. **Deploy early**: Deploy to SCF/EdgeOne frequently for testing

---

## Notes

- Tasks are ordered by dependency (Phase 0 → Phase 1 → ... → Phase 8)
- Some tasks can be parallelized (e.g., Task 2.x and Task 3.x can be worked on simultaneously after Phase 1 is complete)
- Audit logging (Phase 7) should be added as soon as Phase 1 is complete (admin auth works)
- Deployment (Phase 8) can be done incrementally (deploy after each phase, not just at the end)
