# Implementation Plan: Quiz Difficulty System / Quiz 难度系统

**Branch**: `feat/quiz-difficulty-system` | **Date**: 2026-06-27 | **Spec**: [spec.md](../spec.md)

**Input**: Feature specification from `/specs/001-quiz-difficulty-system/spec.md`

**Note**: This plan follows the project constitution (`.specify/memory/constitution.md`) and uses Tencent Cloud SCF for backend, EdgeOne for frontend delivery.

---

## Summary

Implement a Quiz difficulty system with 5 difficulty levels (Easy, Medium, Hard, Super Hard, Invincible Hard). Players earn tokens by answering questions correctly, with penalties for incorrect answers (except Easy). **Clarified requirements**: (1) Daily limit (one quiz per natural day, Hong Kong time UTC+8, uses `started_at`), (2) Time limit per question (Easy:5s, Medium:10s, Hard:15s, Super/Invincible:10s) enforced by **frontend-only** (backend does NOT validate time), (3) Token balance CAN go negative, (4) Support reconnect resume from remaining time, (5) Results page with summary + collapsible per-question details, (6) Admin bulk import via CSV (MVP), (7) Audit fields (`created_by`, `updated_by`) for questions.

**Technical Approach**:
- Backend: Node.js 22.x SCF functions for quiz logic, daily limit check (via `started_at`, NO time limit enforcement, frontend-only), support negative token balance
- Frontend: Vanilla JS + Vite 6.x, countdown timer display (with enforcement & reconnect resume), difficulty selection UI, results page with summary + collapsible details
- Database: TDSQL-C Serverless MySQL 8.0, `quiz_questions` (with `created_by`/`updated_by` audit fields) and `quiz_attempts` tables
- Authentication: JWT (HS256) for player and admin auth
- Admin: Support single question create/edit/delete + CSV bulk import

---

## Technical Context

**Language/Version**: Node.js 22.x (backend SCF), Vanilla JS (frontend)

**Primary Dependencies**:
- Backend: `mysql2` (DB access), `jsonwebtoken` (JWT), `dayjs` (timezone conversion to Hong Kong time)
- Frontend: Vite 6.x (build), vanilla JS (no framework)

**Storage**: TDSQL-C Serverless MySQL 8.0
- `quiz_questions` table (from `game-content-schema.sql`, with audit fields)
- `quiz_attempts` table (new, for tracking attempts and enforcing daily limit)

**Testing**: Manual testing (SCF functions), frontend testing via browser

**Target Platform**: Web (EdgeOne CDN)

**Project Type**: Web application (frontend + backend SCF)

**Performance Goals**:
- SCF cold start < 3 seconds
- API response time < 500ms (p50)
- Frontend bundle size < 500KB gzipped (core bundle)

**Constraints**:
- Daily limit based on Hong Kong local time (UTC+8), uses `started_at` field
- Time limit enforced by frontend only (simplified implementation, does NOT prevent determined cheaters)
- Token balance CAN go negative (players can have negative balance and recover by earning tokens)

**Scale/Scope**:
- 5 difficulty levels
- 5 questions per quiz
- Daily limit: 1 quiz per user per day (based on `started_at`)

---

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Serverless-First | ✅ PASS | All backend logic implemented as SCF functions |
| II. Edge-First Frontend | ✅ PASS | Frontend deployed to EdgeOne CDN |
| III. Stateless Game Logic | ✅ PASS | Game state stored in MySQL, not SCF memory |
| IV. Security by Default | ✅ PASS | JWT validation, input validation, parameterized SQL |
| V. Multi-Language Support | ✅ PASS | Frontend text will be externalized to i18n (English + Chinese) |
| VI. AI Integration | ✅ N/A | No AI features in this module |
| VII. Real-Time Communication | ✅ N/A | No real-time features (quiz is turn-based) |

**Violations**: None

---

## Project Structure

### Documentation (this feature)

```text
specs/001-quiz-difficulty-system/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Technical research (if needed)
├── data-model.md        # Database schema design
├── quickstart.md        # Setup instructions
├── contracts/           # API contracts (request/response schemas)
│   ├── quiz-start.md
│   ├── quiz-submit.md
│   └── quiz-results.md
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── function/
│   ├── quiz-start/              # SCF: Start a new quiz (check daily limit via started_at, get questions)
│   ├── quiz-submit/            # SCF: Submit answer (calculate tokens, NO time limit check)
│   ├── quiz-results/           # SCF: Get quiz results (with per-question breakdown)
│   ├── quiz-daily-status/      # SCF: Check if player can play today (for frontend)
│   ├── admin-quiz-list/       # SCF: Admin - list quiz questions
│   ├── admin-quiz-create/     # SCF: Admin - create quiz question (set created_by)
│   ├── admin-quiz-update/     # SCF: Admin - update quiz question (set updated_by)
│   ├── admin-quiz-delete/     # SCF: Admin - delete quiz question (soft delete)
│   └── admin-quiz-bulk-import/ # SCF: Admin - bulk import questions via CSV
├── shared/
│   ├── quiz.js                 # Shared quiz logic (token calculation, time limit config)
│   └── adminAuth.js           # Admin authentication middleware (already exists)
└── game-content-schema.sql     # Database schema for quiz_questions table (with audit fields)

frontend/
├── src/
│   ├── pages/
│   │   └── quiz/               # Quiz page (difficulty selection, question display, timer)
│   ├── components/
│   │   ├── QuizTimer.js        # Countdown timer component (with reconnect resume)
│   │   ├── QuizQuestion.js    # Question display component
│   │   └── QuizResults.js    # Results display component (summary + collapsible details)
│   └── services/
│       └── quizService.js      # API calls for quiz functions
└── admin/
    └── pages/
        └── quiz-management/    # Admin page for managing quiz questions (with CSV bulk import)
```

**Structure Decision**: Web application with separate frontend and backend (SCF functions). Frontend uses vanilla JS + Vite. Backend uses Node.js SCF.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Complexity is manageable:
- 10 SCF functions (6 player functions, 4 admin functions + 1 bulk import)
- 4 frontend pages (quiz selection, quiz play, quiz results, admin quiz management)
- 2 database tables (`quiz_questions` with audit fields, `quiz_attempts`)
- Frontend-only timer enforcement (simplified backend)

---

## Implementation Phases

### Phase 0: Research (if needed)

**Duration**: 0.5 day

Tasks:
- [ ] Research: How to handle timezone conversion in Node.js (Hong Kong time UTC+8)
- [ ] Research: How to handle frontend-only timer enforcement (no backend validation needed)
- [ ] Decision: Use `dayjs` or `moment-timezone` for timezone conversion (Recommend: `dayjs` for lightweight)
- [ ] Research: CSV parsing in Node.js for bulk import (Recommend: `csv-parser` or `papaparse`)

**Output**: `research.md` (if research is needed)

---

### Phase1: Design (1 day)

**Duration**: 1 day

Tasks:
- [ ] **Task 1.1**: Design database schema for `quiz_attempts` table (add `started_at` field)
- [ ] **Task 1.2**: Design API contracts for all SCF functions (request/response schemas)
- [ ] **Task 1.3**: Design frontend UI/UX flow (difficulty selection → question display → timer → results)
- [ ] **Task 1.4**: Design daily limit logic (check `quiz_attempts` table for attempts with `started_at` on current day, Hong Kong time)
- [ ] **Task 1.5**: Design frontend timer logic (countdown display, auto-submit on expire, reconnect resume from remaining time)
- [ ] **Task 1.6**: Design CSV bulk import format (columns: question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, explanation)

**Output**:
- `data-model.md`: Database schema design
- `quickstart.md`: Setup instructions
- `contracts/`: API contracts for each SCF function

---

### Phase2: Implementation (4-6 days)

**Duration**: 4-6 days

#### Phase2.1: Database Setup (0.5 day)

- [ ] **Task 2.1.1**: Create `quiz_attempts` table with `started_at` field (run migration script)
- [ ] **Task 2.1.2**: Update `quiz_questions` table (add `created_by`, `updated_by` audit fields)
- [ ] **Task 2.1.3**: Seed database with sample quiz questions (for testing)

#### Phase2.2: Backend SCF Functions - Player (1.5 days)

- [ ] **Task 2.2.1**: Implement `quiz-daily-status` SCF (check if player can play today, return time until next attempt)
- [ ] **Task 2.2.2**: Implement `quiz-start` SCF (check daily limit via `started_at`, get 5 random questions, return questions without correct answers)
- [ ] **Task 2.2.3**: Implement `quiz-submit` SCF (validate answer, calculate tokens allowing negative balance, update `quiz_attempts`)
- [ ] **Task 2.2.4**: Implement `quiz-results` SCF (get quiz results by attempt ID, with per-question breakdown)

#### Phase2.3: Backend SCF Functions - Admin (1.5 days)

- [ ] **Task 2.3.1**: Implement `admin-quiz-list` SCF (list quiz questions, filter by difficulty)
- [ ] **Task 2.3.2**: Implement `admin-quiz-create` SCF (create new quiz question, set `created_by`)
- [ ] **Task 2.3.3**: Implement `admin-quiz-update` SCF (update quiz question, set `updated_by`)
- [ ] **Task 2.3.4**: Implement `admin-quiz-delete` SCF (soft delete quiz question)
- [ ] **Task 2.3.5**: Implement `admin-quiz-bulk-import` SCF (bulk import questions via CSV upload)

#### Phase2.4: Frontend - Player (1.5 days)

- [ ] **Task 2.4.1**: Create quiz selection page (difficulty buttons, daily limit message, countdown timer if already played)
- [ ] **Task 2.4.2**: Create quiz play page (question display, countdown timer, submit answer)
- [ ] **Task 2.4.3**: Create quiz results page (summary: score + tokens, collapsible per-question details: question text, player's answer, correct answer, explanation, tokens)
- [ ] **Task 2.4.4**: Implement `QuizTimer.js` component (countdown timer, auto-submit on expire, reconnect resume from remaining time)

#### Phase2.5: Frontend - Admin (1 day)

- [ ] **Task 2.5.1**: Create quiz management page (list questions, create/edit/delete questions)
- [ ] **Task 2.5.2**: Create CSV bulk import UI (drag-and-drop or file picker, progress indicator)

#### Phase2.6: Integration Testing (1 day)

- [ ] **Task 2.6.1**: Test daily limit logic (play quiz, try to play again, verify blocked, cross-day scenario)
- [ ] **Task 2.6.2**: Test time limit logic (answer within time, answer after time expires, verify auto-submit)
- [ ] **Task 2.6.3**: Test token calculation (all difficulties, correct/incorrect answers, negative balance allowed)
- [ ] **Task 2.6.4**: Test admin functions (create/edit/delete questions, CSV bulk import)
- [ ] **Task 2.6.5**: Test reconnect scenario (disconnect mid-quiz, reconnect, resume from remaining time)
- [ ] **Task 2.6.6**: Test results page (summary display, expand/collapse per-question details)

---

### Phase3: Deployment (0.5 day)

**Duration**: 0.5 day

Tasks:
- [ ] **Task 3.1**: Deploy SCF functions to Tencent Cloud
- [ ] **Task 3.2**: Deploy frontend to EdgeOne CDN
- [ ] **Task 3.3**: Run smoke tests on production

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Time limit cheating (modified frontend) | Frontend-only enforcement (acceptable risk, goal is to discourage not fully prevent AI usage) |
| Daily limit timezone issues | Use `dayjs` with `utcOffset(8)` for Hong Kong time conversion |
| Question pool too small | Validate pool size before allowing quiz start (FR-009) |
| Token balance goes negative | Allow negative balance (player can recover by earning tokens) |
| Disconnect mid-quiz | Support reconnect, resume from remaining time, do NOT count as "completed" for daily limit |
| CSV import format errors | Validate CSV format before import, return detailed error messages |

---

## Success Criteria Validation

| Criterion | Validation Method |
|-----------|-------------------|
| SC-001: Complete quiz within time limit | Manual testing (Easy: 5s/q, Medium: 10s/q, etc.) |
| SC-002: Token rewards calculated correctly (allow negative) | Unit tests for token calculation logic (including negative balance) |
| SC-003: Admin can publish question in < 2 min | Manual testing (admin workflow) |
| SC-003-2: Admin can bulk import questions via CSV | Manual testing (CSV upload workflow) |
| SC-004: Hidden difficulties only visible at high level | Integration tests (mock player levels) |
| SC-005: 95% quiz attempts complete without errors | Analytics tracking (post-launch) |
| SC-006: Daily limit enforced correctly (using started_at) | Manual testing (attempt to play twice in one day, cross-day scenario) |
| SC-007: Timer displays correctly, auto-submits | Manual testing (let timer expire, verify auto-submit) |
| SC-008: Reconnect resumes quiz from remaining time | Manual testing (disconnect/reconnect during quiz) |
| SC-009: Results page shows summary + collapsible details | Manual testing (view results, expand details) |
| SC-010: Audit fields (created_by, updated_by) are tracked | Integration testing (verify fields are set correctly) |

---

## Next Steps

1. Review this plan and provide feedback
2. Approve plan → Execute `/speckit.tasks` to create detailed implementation tasks
3. Start implementation (Phase1: Design)

---

**Plan Status**: Draft (updated with clarifications 2026-06-27)

**Last Updated**: 2026-06-27
