# Feature Specification: Admin Dashboard / 后台管理系统

**Feature Branch**: `003-admin-dashboard`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "定义admin-dashboard的后台管理功能"

---

## Clarifications

### Session 2026-06-27

- Q: 管理员账户创建方式？ → A: 仪表盘内创建 - 超级管理员可以在管理界面内创建新管理员账户，无需手动数据库操作。
- Q: 角色权限细分？ → A: 三层权限 - 超级管理员（所有权限）、管理员（内容 + 配置 + 查看）、版主（仅玩家管理 + 查看）。
- Q: 审计日志保留策略？ → A: 6 个月保留期 - 审计日志自动保留 6 个月，之后自动归档或删除，减少存储成本。
- Q: 内容审批流程？ → A: 无审批流程 - 管理员更改立即生效，简单直接，适合小型团队。
- Q: 管理员会话超时？ → A: 15 分钟空闲超时 - 更安全的短超时，符合高安全要求。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Login (Priority: P1)

Administrators must be able to securely log in to the admin dashboard using dedicated admin credentials. The admin login interface must be separate from the player login interface. Admin accounts must be managed with role-based permissions (super admin, moderator).

**Why this priority**: Admin login is the foundation of the entire admin system. Without secure authentication and authorization, no other admin features can be safely exposed.

**Independent Test**: Can be fully tested by attempting to log in with admin credentials and verifying access to admin dashboard, then attempting with non-admin credentials and verifying access is denied.

**Acceptance Scenarios**:

1. **Given** admin is on login page, **When** admin enters valid credentials, **Then** admin is redirected to dashboard homepage.
2. **Given** admin is on login page, **When** admin enters invalid credentials, **Then** error message is displayed and access is denied.
3. **Given** non-admin user tries to access admin page, **When** they enter player account credentials, **Then** access is denied with appropriate error.
4. **Given** admin is logged in, **When** session expires, **Then** admin is redirected to login page upon next action.

---

### User Story 2 - Dashboard Homepage with Key Metrics (Priority: P1)

Upon successful login, admin must see a dashboard homepage displaying key game metrics: total registered players, active players (last 7 days), total games played, total battles fought. Metrics must be visually organized as summary cards with clear labels.

**Why this priority**: Dashboard homepage provides immediate overview of game health and player engagement. Essential for daily monitoring and quick decision-making.

**Independent Test**: Can be fully tested by logging in as admin and verifying that metrics are displayed and values match database records.

**Acceptance Scenarios**:

1. **Given** admin is logged in, **When** admin visits dashboard homepage, **Then** summary cards are displayed with accurate data.
2. **Given** admin is viewing dashboard, **When** new player registers, **Then** total players count updates (on page refresh or automatic refresh).
3. **Given** admin is viewing dashboard, **When** a metric card is clicked, **Then** admin is navigated to detailed view (if applicable).

---

### User Story 3 - Player Management (Priority: P2)

Admin must be able to view, search, filter, and manage player accounts through a dedicated interface. Admin must be able to: view player details (email, registration date, last login, game progress), suspend/ban players, delete player accounts (with confirmation dialog), and send in-game notifications to players.

**Why this priority**: Player management is core to maintaining game community health. Allows administrators to handle inappropriate behavior and support players.

**Independent Test**: Can be fully tested by logging in as admin and performing search, view, suspend, and delete operations on player accounts.

**Acceptance Scenarios**:

1. **Given** admin is on player management page, **When** admin searches for a player by email or username, **Then** matching players are displayed in a list.
2. **Given** admin is viewing player details, **When** admin clicks "Suspend", **Then** player account is suspended and player cannot log in.
3. **Given** admin is viewing player list, **When** admin clicks "Delete" on a player, **Then** confirmation dialog appears, and upon confirmation with reason, player is deleted.
4. **Given** admin is viewing player list, **When** admin selects multiple players, **Then** bulk actions (suspend, send notification) become available.

---

### User Story 4 - Game Content Management (Priority: P2)

Admin must be able to manage game content through dedicated interfaces: countries/regions (add/edit/delete), quiz questions (add/edit/delete with categories), gift codes (generate/batch generate, activate/deactivate), and game items (adjust attributes). Content changes must take effect without requiring game redeployment.

**Why this priority**: Content management allows game operators to update game content dynamically. Essential for live operations and seasonal events.

**Independent Test**: Can be fully tested by logging in as admin and performing CRUD operations on each content type, then verifying changes appear in the game.

**Acceptance Scenarios**:

1. **Given** admin is on content management page, **When** admin edits a country name or attributes, **Then** change is saved and reflected in the game after next player data load.
2. **Given** admin is on gift code management page, **When** admin generates batch of gift codes with specified reward, **Then** unique codes are generated and displayed in a list with copy/export option.
3. **Given** admin is on quiz management page, **When** admin adds a new quiz question with correct answer and category, **Then** question is saved and appears in player's quiz game.
4. **Given** admin is managing content, **When** admin attempts to delete item in use, **Then** warning is displayed about dependencies.

---

### User Story 5 - Analytics & Reports (Priority: P3)

Admin must be able to view analytics dashboards and generate reports: player growth trends (daily/weekly/monthly), battle statistics (win/loss ratios, popular modes), geographic distribution, and retention rates. Reports must be exportable in common spreadsheet formats.

**Why this priority**: Analytics help game operators understand player behavior and make data-driven decisions. Important for long-term game success and monetization strategy.

**Independent Test**: Can be fully tested by logging in as admin and viewing analytics dashboards, applying date filters, and exporting reports.

**Acceptance Scenarios**:

1. **Given** admin is on analytics page, **When** admin selects "Player Growth" report for a date range, **Then** chart is displayed showing registration trend.
2. **Given** admin is viewing a report, **When** admin clicks "Export", **Then** file is downloaded in selected format (CSV or Excel).
3. **Given** admin is on analytics page, **When** admin applies filters (date range, player segment), **Then** charts and tables update to reflect filtered data.

---

### User Story 6 - System Configuration & Maintenance (Priority: P3)

Admin must be able to configure system settings and perform maintenance operations: game balance parameters (adjustable without code deployment), maintenance mode (enable/disable player access with message), feature flags (enable/disable features for testing or rollout), and cache management (clear caches to force data refresh).

**Why this priority**: System configuration allows game operators to tweak game balance and perform maintenance safely. Reduces dependency on developer deployment for operational changes.

**Independent Test**: Can be fully tested by logging in as admin and modifying system settings, then verifying changes take effect.

**Acceptance Scenarios**:

1. **Given** admin is on system configuration page, **When** admin changes a game balance parameter, **Then** change is saved and applied to all new game sessions.
2. **Given** admin is on system configuration page, **When** admin enables "Maintenance Mode" with message, **Then** players cannot log in and see the maintenance message.
3. **Given** admin is on system configuration page, **When** admin toggles a feature flag, **Then** feature is enabled/disabled for players based on flag settings.

---

### User Story 7 - Audit Log & Admin Activity (Priority: P3)

System must automatically log all administrative actions (login, player modifications, content changes, configuration updates) with admin identity, timestamp, action type, and details. Admin with appropriate permissions must be able to view and filter audit logs.

**Why this priority**: Audit logs are essential for security, compliance, and debugging. Allows tracing of any problematic changes back to responsible admin.

**Independent Test**: Can be fully tested by performing various admin actions and verifying they appear in audit log with correct details.

**Acceptance Scenarios**:

1. **Given** admin is on audit log page, **When** admin views logs, **Then** all administrative actions are listed with admin, action, target, and timestamp.
2. **Given** admin is on audit log page, **When** admin filters by admin user or action type or date range, **Then** log list updates to show matching entries.
3. **Given** an admin performs an action, **When** the action fails, **Then** failure is still logged with error details.

---

### Edge Cases

- What happens when admin session expires while performing critical action? (**Expected**: Action is blocked, admin redirected to login, after re-login admin can retry)
- How does system handle concurrent admin edits on same resource? (**Expected**: Last write wins with warning, or optimistic locking with conflict message)
- What happens when database query fails during admin operation? (**Expected**: Error message displayed to admin, no partial data corruption, operation rolled back if transactional)
- How to prevent CSRF attacks on admin actions? (**Expected**: CSRF tokens required for all state-changing operations)
- What happens when admin attempts to delete own account? (**Expected**: Blocked with message "Cannot delete own account")
- How does system handle extremely large player dataset in admin views? (**Expected**: Pagination with configurable page size, search/filter to narrow results)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide dedicated admin login interface separate from player login.
- **FR-002**: System MUST authenticate admin users and maintain secure sessions with 15-minute idle timeout.
- **FR-003**: System MUST support role-based access control with three permission tiers: super admin (all permissions), admin (content + configuration + view), moderator (player management + view only).
- **FR-004**: System MUST provide dashboard homepage with key game metrics (players, activity, content counts).
- **FR-005**: System MUST allow admin to view, search, filter, and sort player accounts.
- **FR-006**: System MUST allow admin to perform player actions: view details, suspend/ban, delete (with confirmation), send notifications.
- **FR-007**: System MUST allow admin to manage game content: countries, quiz questions, gift codes, game items.
- **FR-008**: System MUST allow admin to view analytics dashboards with filters (date range, segments).
- **FR-009**: System MUST allow admin to export reports in common formats (CSV, Excel).
- **FR-010**: System MUST allow admin to configure system settings and feature flags.
- **FR-011**: System MUST allow admin to enable/disable maintenance mode with custom message.
- **FR-012**: System MUST automatically log all administrative actions for audit purposes. Audit logs MUST be retained for 6 months, after which they are automatically archived or deleted.
- **FR-013**: System MUST provide audit log viewer with filtering capabilities.
- **FR-014**: System MUST prevent CSRF attacks on all admin state-changing operations.
- **FR-015**: System MUST validate all admin input before processing to prevent data corruption.

### Key Entities *(include if feature involves data)*

- **AdminUser**: Represents an administrator account. Attributes: unique identifier, email, authentication credentials, role (super_admin, admin, moderator), status (active, suspended), last login timestamp, creation timestamp, created by (admin who created this account).
- **PlayerProfile**: Represents a player account managed by admin. Attributes: unique identifier, email, registration date, last login, account status, game progress summary.
- **GameContent**: Represents manageable game content items. Types: Country, QuizQuestion, GiftCode, GameItem. Attributes vary by type, but all have: unique identifier, name, status (active/inactive), last updated, updated by admin.
- **AuditLog**: Represents a recorded administrative action. Attributes: unique identifier, admin user reference, action type, target type, target identifier, details (before/after values), timestamp, IP address, retention date (6 months from creation).
- **SystemConfig**: Represents a system configuration parameter. Attributes: key, value, description, data type, last updated, updated by admin.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can log in and see dashboard homepage within 5 seconds of submitting credentials.
- **SC-002**: Admin can search for a player and view their full details within 3 seconds of initiating search.
- **SC-003**: Admin can generate batch of 100 gift codes in under 10 seconds.
- **SC-004**: All administrative actions (login, player changes, content edits, config updates) are recorded in audit log within 1 second of action completion.
- **SC-005**: Admin dashboard is fully functional on desktop browsers (Chrome, Firefox, Safari, Edge current versions).
- **SC-006**: Admin can export report data for 30-day period in under 15 seconds.
- **SC-007**: Role-based access control correctly prevents moderators from accessing super-admin-only features (100% effectiveness).
- **SC-008**: Maintenance mode activation takes effect for all new player login attempts within 1 minute.

---

## Assumptions

- Admin dashboard will be a web-based interface accessible via browser (not a desktop or mobile app).
- Admin users will be created by super admins (no public self-registration for admin accounts).
- Initial version will support English language only (i18n can be added later).
- Analytics data will be calculated from operational database (no separate data warehouse for v1).
- Dashboard will use periodic refresh or manual refresh for metrics (real-time streaming is out of scope for v1).
- File exports (CSV, Excel) will be generated server-side and downloaded by admin.
- Admin dashboard will be accessible only via secure HTTPS connection.
- Player suspension means player cannot log in; player ban means account is permanently disabled (configurable).
- Content management changes take effect immediately or on next player session (not real-time mid-session).
