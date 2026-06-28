# Feature Specification: Admin Dashboard Bilingual Support / 后台管理系统双语支持

**Feature Branch**: `003-admin-dashboard-i18n`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "定义admin-dashboard的后台管理功能，要中英文对照"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Views Dashboard in Preferred Language (Priority: P1)

Administrators must be able to view the entire admin dashboard interface in their preferred language (Chinese or English). The system must detect the admin's browser language and automatically display the interface in the appropriate language. Admin must also be able to manually switch between Chinese and English via a language selector in the dashboard header.

**Why this priority**: Language accessibility is foundational to admin dashboard usability. Administrators who are more comfortable in their native language will be more efficient and make fewer errors. Auto-detection with manual override provides the best user experience.

**Independent Test**: Can be fully tested by logging in as admin with browser language set to Chinese, verifying all interface text appears in Chinese, then switching to English via language selector and verifying all text updates to English.

**Acceptance Scenarios**:

1. **Given** admin accesses dashboard with browser language set to Chinese (`zh-CN`), **When** dashboard loads, **Then** all interface text is displayed in Chinese.
2. **Given** admin is viewing dashboard in English, **When** admin clicks language selector and chooses "中文", **Then** all interface text updates to Chinese without page reload (or after reload).
3. **Given** admin is viewing dashboard in Chinese, **When** admin clicks language selector and chooses "English", **Then** all interface text updates to English.
4. **Given** admin has selected a language, **When** admin logs out and logs back in, **Then** dashboard displays in the previously selected language (preference persisted).

---

### User Story 2 - Complete Translation Coverage (Priority: P1)

All user-facing text in the admin dashboard must be translated and available in both Chinese and English. This includes: navigation menu items, page titles, form labels, buttons, error messages, success messages, table headers, status indicators, and help text. No hardcoded strings are allowed in any component.

**Why this priority**: Partial translation creates a confusing user experience and reduces trust in the system. Complete coverage ensures professional quality and usability for both language groups.

**Independent Test**: Can be fully tested by switching to each language and verifying that every visible text element on every page has a proper translation (no missing translation keys shown as raw keys like `admin.dashboard.title`).

**Acceptance Scenarios**:

1. **Given** admin is viewing any dashboard page in Chinese, **When** admin inspects all text elements, **Then** all text is in natural Chinese (no raw translation keys or mixed languages).
2. **Given** admin is viewing any dashboard page in English, **When** admin inspects all text elements, **Then** all text is in natural English (no raw translation keys or mixed languages).
3. **Given** a new feature is added to the dashboard, **When** developer adds UI text, **Then** text is externalized to i18n resource files for both languages before deployment.
4. **Given** admin triggers an error message, **When** error occurs, **Then** error message is displayed in the currently selected language.

---

### User Story 3 - Language Selector and Persistence (Priority: P2)

Admin must have a clearly visible language selector (flag icon + language name) in the dashboard header. The selector must show the current language and allow one-click switching. The admin's language preference must be persisted across sessions (via localStorage or server-side user preference).

**Why this priority**: Easy language switching is essential for administrators who work in multilingual environments or prefer a different language than their browser default. Persistence ensures consistent experience.

**Independent Test**: Can be fully tested by clicking the language selector, switching languages, logging out, logging back in, and verifying the language preference is remembered.

**Acceptance Scenarios**:

1. **Given** admin is logged in, **When** admin looks at the header, **Then** a language selector is visible showing the current language.
2. **Given** admin clicks the language selector, **When** dropdown opens, **Then** both "English" and "中文" options are visible and selectable.
3. **Given** admin selects a different language, **When** admin navigates to another page, **Then** the new language persists across all pages.
4. **Given** admin has selected Chinese, **When** admin closes browser and returns, **Then** dashboard loads in Chinese (preference persisted).

---

### User Story 4 - Translation Resource Management (Priority: P3)

Developers (or admin super users) must be able to manage translation resources easily. Translation files must be organized by module/feature (e.g., `common.json`, `dashboard.json`, `players.json`, `content.json`). The system must support lazy loading of translation files by language to minimize initial bundle size. Missing translations must be clearly indicated during development (e.g., showing the key name in brackets) but should never appear in production.

**Why this priority**: Maintainable translation resources are essential for long-term project health. Lazy loading ensures performance is not impacted by large translation files. Clear missing-key indicators help developers identify gaps during development.

**Independent Test**: Can be fully tested by inspecting the translation file structure, verifying lazy loading behavior, and intentionally removing a translation to verify missing-key handling.

**Acceptance Scenarios**:

1. **Given** developer is adding a new feature, **When** developer adds translation keys, **Then** keys are organized in the appropriate module file for both languages.
2. **Given** admin loads the dashboard, **When** dashboard initializes, **Then** only the translation file for the current language is loaded (lazy loading).
3. **Given** a translation key is missing in the current language, **When** system renders the UI, **Then** during development a warning is shown (e.g., `[missing: key.name]`), but in production a fallback language value is used.
4. **Given** admin switches language, **When** switch occurs, **Then** the new language's translation file is loaded dynamically without full page reload.

---

### Edge Cases

- What happens when admin switches language while filling out a form? (**Expected**: Form data is preserved, only UI text updates to new language)
- How does system handle incomplete translations for a language? (**Expected**: Fallback to default language (English) for missing keys, with developer warning in development mode)
- What happens when admin's preferred language is neither Chinese nor English? (**Expected**: System defaults to English, but allows manual selection of available languages)
- How does system handle date/time formatting in different languages? (**Expected**: Dates/times are formatted according to the selected language's locale conventions (e.g., `YYYY-MM-DD` for Chinese, `MM/DD/YYYY` for English))
- What happens when translation files fail to load? (**Expected**: System shows error message in the currently selected language (or English if translation system fails), and retries loading or allows manual reload)
- How does system handle dynamic content (e.g., player names, country names) in different languages? (**Expected**: Dynamic content that is language-specific (like country names) must have translations; player names and other proper nouns are displayed as-is)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a language selector in the admin dashboard header that allows switching between Chinese and English.
- **FR-002**: System MUST automatically detect admin's preferred language from browser or system language settings on first visit.
- **FR-003**: System MUST persist admin's language preference across sessions (via browser storage or server-side user settings).
- **FR-004**: System MUST display all user-facing text in the selected language (no hardcoded strings allowed).
- **FR-005**: System MUST organize translation resources in structured files by module/feature for maintainability.
- **FR-006**: System MUST support lazy loading of translation files by language to minimize initial load time.
- **FR-007**: System MUST provide fallback to default language (English) for any missing translation keys.
- **FR-008**: System MUST format dates, times, and numbers according to the selected language's locale conventions.
- **FR-009**: System MUST clearly indicate missing translation keys during development, but never show raw keys in production.
- **FR-010**: System MUST ensure all error messages, success messages, and notifications are translated and displayed in the current language.
- **FR-011**: System MUST update all UI text when language is switched, with minimal disruption to admin's workflow.
- **FR-012**: System MUST support translation of dynamic content (e.g., status labels, role names) via resource files, not hardcoded in components.
- **FR-013**: System MUST validate that all translation keys are present in both language files during build process before deployment.
- **FR-014**: System MUST allow developers to easily add new languages by adding new resource files (no code changes required).

### Key Entities *(include if feature involves data)*

- **TranslationResource**: Represents a collection of translated strings for a specific language and module. Attributes: language code, module name, key-value pairs of translation strings. Stored as structured resource files in the frontend codebase.
- **AdminUserPreference**: Represents an admin user's language preference. Attributes: admin user ID, preferred language code, last updated timestamp. Persisted in browser storage and/or server-side user profile.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can switch between Chinese and English and see all UI text update correctly quickly (within a few seconds) after clicking the language selector.
- **SC-002**: 100% of user-facing text in the admin dashboard is available in both Chinese and English (no raw translation keys visible in production).
- **SC-003**: Admin's language preference persists across browser sessions (closing and reopening browser shows dashboard in previously selected language).
- **SC-004**: Translation files are loaded efficiently by language, with minimal impact on initial dashboard load time.
- **SC-005**: Admin dashboard correctly identifies the displayed language to assistive technologies (screen readers, browsers).
- **SC-006**: Build process successfully detects and reports any missing translation keys across both languages before deployment.
- **SC-007**: Admin can complete all core workflows (login, view dashboard, manage players, manage content) in their preferred language without confusion or errors caused by translation issues.
- **SC-008**: Date/time formatting automatically adjusts to appropriate format for the selected language.

---

## Assumptions

- Admin dashboard will use the project's standard i18n approach as specified in the project constitution.
- Translation files will be stored as structured resource files in the frontend codebase, organized by language and module.
- Initial supported languages are Chinese and English; additional languages can be added later by adding new resource files.
- Language detection will use browser or system language settings with fallback to English if the detected language is not supported.
- Language preference will be persisted in browser storage for immediate effect, and optionally synced to server-side user profile for cross-device consistency.
- The admin dashboard is web-based, so browser language detection is appropriate.
- Translation quality will be reviewed by native speakers of each language before deployment.
- Dynamic content that is language-specific (e.g., country names, role names) will have translation keys; proper nouns (player names) will be displayed as-is.
- The project constitution's Multi-Language Support principle applies to the admin dashboard as well as the player-facing frontend.

