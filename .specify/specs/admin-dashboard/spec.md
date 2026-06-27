# Feature Specification: Admin Dashboard / 后台管理系统

**Feature Branch**: `feat/admin-dashboard`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "增加后台界面，对游戏进行管理。包括对各个模块的管理功能。"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Login (Priority: P1)

Admin MUST be able to log in to the admin dashboard using a secure admin account. The admin login page MUST be separate from the player login page. Admin accounts MUST be stored in a separate `admin_users` table with roles and permissions.

**Why this priority**: Admin login is the foundation of the entire admin system. Without secure authentication, no other admin features can be safely exposed.

**Independent Test**: Can be fully tested by attempting to log in with admin credentials and verifying access to admin dashboard.

**Acceptance Scenarios**:

1. **Given** admin is on login page, **When** admin enters valid credentials, **Then** admin is redirected to dashboard homepage.
2. **Given** admin is on login page, **When** admin enters invalid credentials, **Then** error message is displayed and access is denied.
3. **Given** non-admin user tries to access admin page, **When** they enter a player account credentials, **Then** access is denied with appropriate error.

---

### User Story 2 - Dashboard Homepage with Statistics (Priority: P1)

Admin MUST see a dashboard homepage with key game statistics: total players, active players (last 7 days), total games played, total battles fought, revenue (if applicable). Statistics MUST be displayed as cards with icons. Data MUST be fetched from backend APIs (SCF functions).

**Why this priority**: Dashboard homepage provides immediate overview of game health and player engagement. Essential for daily monitoring.

**Independent Test**: Can be fully tested by logging in as admin and verifying statistics are displayed correctly.

**Acceptance Scenarios**:

1. **Given** admin is logged in, **When** admin visits dashboard homepage, **Then** statistics cards are displayed with accurate data.
2. **Given** admin is viewing statistics, **When** new player registers, **Then** total players count updates (on next page refresh or via polling).

---

### User Story 3 - Player Management (Priority: P2)

Admin MUST be able to view, search, filter, and manage player accounts. Admin MUST be able to: view player details (email, registration date, last login, game progress), suspend/ban players, delete player accounts (with confirmation), and send in-game messages to players.

**Why this priority**: Player management is core to maintaining game community. Allows moderators to handle inappropriate behavior.

**Independent Test**: Can be fully tested by logging in as admin and performing CRUD operations on player accounts.

**Acceptance Scenarios**:

1. **Given** admin is on player management page, **When** admin searches for a player by email, **Then** matching players are displayed in a table.
2. **Given** admin is viewing player details, **When** admin clicks "Suspend", **Then** player account is suspended and player cannot log in.
3. **Given** admin is viewing player list, **When** admin clicks "Delete" on a player, **Then** confirmation dialog appears, and upon confirmation, player is deleted from database.

---

### User Story 4 - Game Content Management (Priority: P2)

Admin MUST be able to manage game content: countries (add/edit/delete), quiz questions (add/edit/delete), gift codes (generate/ deactivate), and card rarities (adjust drop rates). Changes MUST take effect immediately (or after next player login).

**Why this priority**: Content management allows game operators to update game content without code deployment. Essential for live operations.

**Independent Test**: Can be fully tested by logging in as admin and performing CRUD operations on game content.

**Acceptance Scenarios**:

1. **Given** admin is on content management page, **When** admin edits a country name, **Then** change is saved to database and reflected in player's game after next load.
2. **Given** admin is on gift code management page, **When** admin generates 100 gift codes, **Then** 100 unique codes are generated and displayed in a list.
3. **Given** admin is on quiz management page, **When** admin adds a new quiz question, **Then** question is saved and appears in player's quiz game.

---

### User Story 5 - Analytics & Reports (Priority: P3)

Admin MUST be able to view analytics and generate reports: player growth (daily/weekly/monthly), battle statistics (win/loss ratios), popular countries (most conquered), and revenue reports (if applicable). Reports MUST be exportable as CSV.

**Why this priority**: Analytics help game operators understand player behavior and make data-driven decisions. Important for long-term game success.

**Independent Test**: Can be fully tested by logging in as admin and viewing/exporting reports.

**Acceptance Scenarios**:

1. **Given** admin is on analytics page, **When** admin selects "Player Growth" report for last 30 days, **Then** chart is displayed showing player registration trend.
2. **Given** admin is viewing a report, **When** admin clicks "Export CSV", **Then** CSV file is downloaded with report data.

---

### User Story 6 - System Configuration (Priority: P3)

Admin MUST be able to configure system settings: game balance parameters (population growth rate, battle damage multiplier), maintenance mode (enable/disable player logins), and feature flags (enable/disable certain features for testing).

**Why this priority**: System configuration allows game operators to tweak game balance and perform maintenance without code changes.

**Independent Test**: Can be fully tested by logging in as admin and modifying system settings.

**Acceptance Scenarios**:

1. **Given** admin is on system configuration page, **When** admin changes "Population Growth Rate" to 1.5x, **Then** change is saved and applied to all new games.
2. **Given** admin is on system configuration page, **When** admin enables "Maintenance Mode", **Then** players cannot log in and see maintenance message.

---

### Edge Cases

- What happens when admin session expires? (**Expected**: Admin is redirected to login page)
- How does system handle concurrent admin actions? (**Expected**: Last write wins, or implement optimistic locking)
- What happens when database query fails? (**Expected**: Error message displayed, no data corrupted)
- How to prevent CSRF attacks? (**Expected**: CSRF tokens required for all admin actions)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide admin login page separate from player login.
- **FR-002**: System MUST authenticate admin users via JWT tokens (same as player auth but with admin role).
- **FR-003**: System MUST provide dashboard homepage with key statistics (players, games, battles).
- **FR-004**: System MUST allow admin to view, search, filter, and manage player accounts.
- **FR-005**: System MUST allow admin to manage game content (countries, quiz, gift codes, cards).
- **FR-006**: System MUST allow admin to view analytics and export reports as CSV.
- **FR-007**: System MUST allow admin to configure system settings (game balance, maintenance mode).
- **FR-008**: System MUST log all admin actions (audit trail) for security and debugging.
- **FR-009**: System MUST support role-based access control (super admin vs. moderator).
- **FR-010**: System MUST prevent CSRF attacks on all admin actions.

### Key Entities *(include if feature involves data)*

- **AdminUser**: id, email, password_hash, role (super_admin, moderator), last_login, created_at
- **AuditLog**: id, admin_id, action, target_type, target_id, details, timestamp
- **GameConfig**: key, value, description, updated_at, updated_by
- **GiftCode**: id, code, reward_type, reward_amount, is_active, used_by, created_at, expires_at

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can log in within 5 seconds and see dashboard homepage.
- **SC-002**: Admin can search for a player and view their details within 3 seconds.
- **SC-003**: Admin can generate 100 gift codes in under 10 seconds.
- **SC-004**: All admin actions are logged and auditable.
- **SC-005**: Admin dashboard is accessible on desktop and tablet (responsive).

---

## Assumptions

- Admin dashboard will be a separate SPA (Single Page Application) from the player game.
- Admin dashboard will be deployed to a separate EdgeOne subdomain (e.g., `admin.warxone.com`).
- Admin users will be created manually via database insert (no public registration).
- Initial version will not include real-time updates (polling OK for v1).
- Analytics data will be calculated from database queries (no separate analytics DB).
