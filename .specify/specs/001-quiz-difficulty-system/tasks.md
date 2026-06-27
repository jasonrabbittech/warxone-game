# Tasks: Quiz Difficulty System / Quiz 难度系统

**Input**: Design documents from `/specs/001-quiz-difficulty-system/`

**Prerequisites**: plan.md, spec.md

**Tests**: Tests are NOT included (not explicitly requested in feature specification). Focus on implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

## Path Conventions

- Backend SCF functions: `backend/function/<function-name>/index.js`
- Backend shared modules: `backend/shared/<module>.js`
- Frontend pages: `frontend/src/pages/quiz/`
- Frontend components: `frontend/src/components/`
- Frontend admin: `frontend/admin/pages/quiz-management/`
- Database schema: `backend/game-content-schema.sql`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create feature branch `feat/quiz-difficulty-system` from `main`
- [X] T002 [P] Verify `.specify/memory/constitution.md` compliance (Serverless-First, Edge-First, Security by Default)
- [X] T003 [P] Confirm `backend/shared/adminAuth.js` exists and is reusable for quiz admin functions
- [X] T004 [P] Confirm `backend/shared/jwt.js` exists and is reusable for player auth

**Checkpoint**: Repository ready, branch created, shared modules confirmed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [ ] T005 Create `quiz_attempts` table DDL in `backend/game-content-schema.sql` (fields: id, user_id, difficulty, questions JSON, answers JSON, score, tokens_earned, started_at, completed_at)
- [ ] T006 Add `created_by` and `updated_by` fields to `quiz_questions` table in `backend/game-content-schema.sql`
- [ ] T007 [P] Create database migration script `scripts/migrate-quiz-attempts.js` to create `quiz_attempts` table
- [ ] T008 [P] Run migration script to apply `quiz_attempts` table and `quiz_questions` audit fields

### Shared Quiz Logic

- [ ] T009 Create `backend/shared/quiz.js` with token calculation function `calculateTokens(difficulty, correctCount, incorrectCount)` supporting negative balance
- [ ] T010 [P] Add `getTimerConfig(difficulty)` function in `backend/shared/quiz.js` (Easy:5s, Medium:10s, Hard:15s, SuperHard:10s, InvincibleHard:10s)
- [ ] T011 [P] Add `getDifficultyConfig(difficulty)` function in `backend/shared/quiz.js` (reward per correct, penalty per incorrect)
- [ ] T012 [P] Add `checkDailyLimit(userId, startedAt)` function in `backend/shared/quiz.js` (query `quiz_attempts` where `started_at` is on current Hong Kong day)

### Frontend Shared Components

- [ ] T013 Create `frontend/src/components/QuizTimer.js` with countdown timer, auto-submit on expire, reconnect resume from remaining time
- [ ] T014 [P] Create `frontend/src/components/QuizQuestion.js` for displaying question and options
- [ ] T015 [P] Create `frontend/src/components/QuizResults.js` with summary + collapsible per-question details
- [ ] T016 [P] Create `frontend/src/services/quizService.js` with API call wrappers (`startQuiz`, `submitAnswer`, `getResults`, `getDailyStatus`)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Player plays Easy difficulty (Priority: P1) 🎯 MVP

**Goal**: Player can select Easy difficulty, answer 5 questions, earn 1 token per correct answer, no penalty for wrong answers, 5-second timer per question.

**Independent Test**: Select Easy difficulty, answer 5 questions, verify token rewards = number of correct answers × 1, verify timer shows 5 seconds per question.

### Implementation for User Story 1

- [ ] T017 [US1] Update `backend/function/quiz-start/index.js` to check daily limit via `started_at` (Hong Kong time), return 5 random Easy questions without correct answers
- [ ] T018 [US1] Update `backend/function/quiz-submit/index.js` to validate answer, calculate tokens (allow negative balance), update `quiz_attempts`
- [ ] T019 [US1] Create `backend/function/quiz-results/index.js` to return quiz results by attempt ID
- [ ] T020 [US1] Create `backend/function/quiz-daily-status/index.js` to check if player can play today (return `canPlay` boolean + `nextAttemptIn` seconds)
- [ ] T021 [US1] Create `frontend/src/pages/quiz/select.js` for difficulty selection UI (Easy button visible)
- [ ] T022 [US1] Create `frontend/src/pages/quiz/play.js` for quiz play page (display question, timer, submit answer)
- [ ] T023 [US1] Update `frontend/src/components/QuizResults.js` to show Easy difficulty results (correct/total, tokens earned)
- [ ] T024 [US1] Add i18n strings for Easy difficulty in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (Easy difficulty only).

---

## Phase 4: User Story 2 - Player plays Medium difficulty (Priority: P1)

**Goal**: Player can select Medium difficulty, answer 5 questions, earn 2 tokens per correct answer, -1 token per incorrect answer, 10-second timer per question.

**Independent Test**: Select Medium difficulty, answer 5 questions (mix correct/incorrect), verify token rewards = (correct × 2) - (incorrect × 1), verify timer shows 10 seconds.

### Implementation for User Story 2

- [ ] T025 [US2] Update `backend/shared/quiz.js` `calculateTokens()` to handle Medium difficulty (reward: 2, penalty: 1)
- [ ] T026 [US2] Update `frontend/src/pages/quiz/select.js` to show Medium difficulty button
- [ ] T027 [US2] Update `frontend/src/pages/quiz/play.js` to apply Medium timer (10 seconds)
- [ ] T028 [US2] Update `frontend/src/components/QuizResults.js` to show Medium difficulty results with penalties
- [ ] T029 [US2] Add i18n strings for Medium difficulty in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 8 - Player can only play once per day (Priority: P1) 🎯 MVP

**Goal**: Player can only play Quiz once per natural day (Hong Kong time UTC+8), enforced via `started_at` field.

**Independent Test**: Complete a quiz, try to start another on same day (should be blocked with message). Verify after 00:00 Hong Kong time, player can start new quiz. Verify cross-day scenario (start at 23:59, complete at 00:01).

### Implementation for User Story 8

- [ ] T030 [US8] Update `backend/function/quiz-start/index.js` to enforce daily limit using `started_at` (Hong Kong time conversion via `dayjs`)
- [ ] T031 [US8] Update `backend/function/quiz-daily-status/index.js` to return `canPlay: false` + countdown to next attempt when player already played today
- [ ] T032 [US8] Update `frontend/src/pages/quiz/select.js` to show daily limit message + countdown timer when player already played today
- [ ] T033 [US8] Add i18n strings for daily limit messages in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: Daily limit enforced correctly. Player cannot play twice in one day.

---

## Phase 6: User Story 4 - Admin publishes Quiz questions (Priority: P1) 🎯 MVP

**Goal**: Admin can create, edit, delete quiz questions from dashboard. Questions have difficulty level. Audit fields (`created_by`, `updated_by`) are tracked.

**Independent Test**: Login as admin, create a new question with difficulty="easy", verify it appears in easy question pool for players.

### Implementation for User Story 4

- [ ] T034 [US4] Update `backend/function/admin-quiz-list/index.js` to list quiz questions, filter by difficulty, include `created_by` and `updated_by` in response
- [ ] T035 [US4] Create `backend/function/admin-quiz-create/index.js` to create new quiz question, set `created_by` from JWT admin user ID
- [ ] T036 [US4] Create `backend/function/admin-quiz-update/index.js` to update quiz question, set `updated_by` from JWT admin user ID
- [ ] T037 [US4] Create `backend/function/admin-quiz-delete/index.js` to soft-delete quiz question (set `is_active = false`)
- [ ] T038 [US4] Create `frontend/admin/pages/quiz-management/list.js` for listing questions with difficulty filter
- [ ] T039 [US4] Create `frontend/admin/pages/quiz-management/create.js` for creating new question
- [ ] T040 [US4] Create `frontend/admin/pages/quiz-management/edit.js` for editing existing question
- [ ] T041 [US4] Add i18n strings for admin quiz management in `frontend/admin/i18n/en.json` and `frontend/admin/i18n/zh.json`

**Checkpoint**: Admin can manage quiz questions. Audit fields are tracked.

---

## Phase 7: User Story 3 - Player plays Hard difficulty (Priority: P2)

**Goal**: Player can select Hard difficulty, answer 5 questions, earn 3 tokens per correct answer, -2 tokens per incorrect answer, 15-second timer.

**Independent Test**: Select Hard difficulty, verify token calculation = (correct × 3) - (incorrect × 2), verify timer shows 15 seconds.

### Implementation for User Story 3

- [ ] T042 [US3] Update `backend/shared/quiz.js` `calculateTokens()` to handle Hard difficulty (reward: 3, penalty: 2)
- [ ] T043 [US3] Update `frontend/src/pages/quiz/select.js` to show Hard difficulty button
- [ ] T044 [US3] Update `frontend/src/pages/quiz/play.js` to apply Hard timer (15 seconds)
- [ ] T045 [US3] Update `frontend/src/components/QuizResults.js` to show Hard difficulty results with higher penalties
- [ ] T046 [US3] Add i18n strings for Hard difficulty in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: Hard difficulty works. All P1 and P2 user stories (except hidden difficulties) are complete.

---

## Phase 8: User Story 5 - Player unlocks hidden difficulty levels (Priority: P2)

**Goal**: Super Hard unlocks at player level 10, Invincible Hard unlocks at player level 20. Hidden difficulties are not visible before unlock.

**Independent Test**: Create player at level 5 (should not see hidden), level 10 (should see Super Hard), level 20 (should see both).

### Implementation for User Story 5

- [ ] T047 [US5] Update `backend/shared/quiz.js` to add `getUnlockLevel(difficulty)` function (SuperHard: 10, InvincibleHard: 20)
- [ ] T048 [US5] Update `frontend/src/pages/quiz/select.js` to conditionally show/hide hidden difficulties based on player level (fetched from `users` table)
- [ ] T049 [US5] Add i18n strings for locked difficulty messages in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: Hidden difficulties only visible when player meets level requirement.

---

## Phase 9: User Story 6 - Player plays Super Hard difficulty (Priority: P2)

**Goal**: Player can select Super Hard (after unlocking at level 10), answer 5 questions, earn 5 tokens per correct answer, -3 tokens per incorrect answer, 10-second timer.

**Independent Test**: Select Super Hard, verify token calculation = (correct × 5) - (incorrect × 3), verify timer shows 10 seconds.

### Implementation for User Story 6

- [ ] T050 [US6] Update `backend/shared/quiz.js` `calculateTokens()` to handle Super Hard difficulty (reward: 5, penalty: 3)
- [ ] T051 [US6] Update `backend/function/quiz-start/index.js` to include Super Hard questions when difficulty = "super_hard"
- [ ] T052 [US6] Update `frontend/src/pages/quiz/play.js` to apply Super Hard timer (10 seconds)
- [ ] T053 [US6] Update `frontend/src/components/QuizResults.js` to show Super Hard results
- [ ] T054 [US6] Add i18n strings for Super Hard difficulty in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: Super Hard difficulty works. Requires level 10+.

---

## Phase 10: User Story 7 - Player plays Invincible Hard difficulty (Priority: P3)

**Goal**: Player can select Invincible Hard (after unlocking at level 20), answer 5 questions, earn 10 tokens per correct answer, -5 tokens per incorrect answer, 10-second timer.

**Independent Test**: Select Invincible Hard, verify token calculation = (correct × 10) - (incorrect × 5), verify timer shows 10 seconds.

### Implementation for User Story 7

- [ ] T055 [US7] Update `backend/shared/quiz.js` `calculateTokens()` to handle Invincible Hard difficulty (reward: 10, penalty: 5)
- [ ] T056 [US7] Update `backend/function/quiz-start/index.js` to include Invincible Hard questions when difficulty = "invincible_hard"
- [ ] T057 [US7] Update `frontend/src/pages/quiz/play.js` to apply Invincible Hard timer (10 seconds)
- [ ] T058 [US7] Update `frontend/src/components/QuizResults.js` to show Invincible Hard results
- [ ] T059 [US7] Add i18n strings for Invincible Hard difficulty in `frontend/src/i18n/en.json` and `frontend/src/i18n/zh.json`

**Checkpoint**: All user stories complete. Invincible Hard requires level 20+.

---

## Phase 11: Bulk Import & Polish (Cross-Cutting)

**Purpose**: Bulk import feature (MVP requirement from clarification) + cross-cutting improvements.

### Bulk Import (MVP - from Clarification Question 7)

- [ ] T060 Create `backend/function/admin-quiz-bulk-import/index.js` to parse CSV and bulk-insert quiz questions (validate format, return success/error count)
- [ ] T061 Create `frontend/admin/pages/quiz-management/bulk-import.js` with CSV file picker, drag-and-drop, progress indicator
- [ ] T062 [P] Add CSV template download endpoint in `backend/function/admin-quiz-bulk-import/index.js`
- [ ] T063 Add i18n strings for bulk import in `frontend/admin/i18n/en.json` and `frontend/admin/i18n/zh.json`

### Reconnect Support (from Clarification Question 4)

- [ ] T064 Update `backend/function/quiz-start/index.js` to support reconnect (add `reconnect_state` JSON field to `quiz_attempts` table if not exists, restore state on reconnect: resume timer from `seconds_left`, restore current question index)
- [ ] T065 Update `frontend/src/pages/quiz/play.js` to handle reconnect: call `quiz-start` to restore state, resume timer from `seconds_left`, restore current question
- [ ] T073 Add abandoned quiz timeout logic (if `started_at` > 1 hour ago and `completed_at` is NULL, release daily limit slot and mark as abandoned)

### Results Page Details (from Clarification Question 5)

- [ ] T066 Update `backend/function/quiz-results/index.js` to return per-question breakdown (question text, player's answer, correct answer, explanation, tokens earned/deducted)
- [ ] T067 Update `frontend/src/components/QuizResults.js` to show collapsible per-question details

### Cross-Cutting Concerns

- [ ] T068 [P] Add input validation to all SCF functions (using `validator` or manual checks)
- [ ] T069 [P] Add error handling and logging to all SCF functions
- [ ] T070 [P] Configure CORS for all SCF functions (allowed origins only)
- [ ] T071 Run `quickstart.md` validation to verify all features work end-to-end
- [ ] T072 Update `CODEBUDDY.md` with Quiz module documentation

**Checkpoint**: All features complete, bulk import working, reconnect supported, results page shows details.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational (Phase 2) completion
  - US1 (Phase 3) → US2 (Phase 4) → US8 (Phase 5) → US4 (Phase 6) can run in parallel after Phase 2
  - US3 (Phase 7) depends on US1+US2 (needs difficulty UI pattern)
  - US5 (Phase 8) depends on US1+US2+US3 (needs difficulty UI pattern)
  - US6 (Phase 9) depends on US5 (needs unlock mechanism)
  - US7 (Phase 10) depends on US5 (needs unlock mechanism)
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US2 (P1)**: Can start after Foundational (Phase 2) — May share token calculation with US1 but independent
- **US8 (P1)**: Can start after Foundational (Phase 2) — Integrates with US1/US2 but testable independently
- **US4 (P1)**: Can start after Foundational (Phase 2) — Independent of player stories
- **US3 (P2)**: Can start after US1+US2 — Needs difficulty UI pattern
- **US5 (P2)**: Can start after US1+US2+US3 — Needs difficulty UI pattern
- **US6 (P2)**: Can start after US5 — Needs unlock mechanism
- **US7 (P3)**: Can start after US5 — Needs unlock mechanism

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1, US2, US8, US4 can start in parallel (if team capacity allows)
- US6 and US7 can run in parallel after US5 completes
- All i18n tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 (MVP)

```bash
# Launch all backend SCF functions for User Story 1 together:
Task: "Update quiz-start SCF in backend/function/quiz-start/index.js"
Task: "Update quiz-submit SCF in backend/function/quiz-submit/index.js"
Task: "Create quiz-results SCF in backend/function/quiz-results/index.js"
Task: "Create quiz-daily-status SCF in backend/function/quiz-daily-status/index.js"

# Launch all frontend components for User Story 1 together:
Task: "Create quiz/select.js in frontend/src/pages/quiz/"
Task: "Create quiz/play.js in frontend/src/pages/quiz/"
Task: "Update QuizResults.js in frontend/src/components/"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 8, 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Easy difficulty)
4. Complete Phase 4: User Story 2 (Medium difficulty)
5. Complete Phase 5: User Story 8 (Daily limit)
6. Complete Phase 6: User Story 4 (Admin CRUD)
7. **STOP and VALIDATE**: Test User Stories 1, 2, 8, 4 independently
8. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 8 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Stories 3, 5, 6, 7 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 → User Story 2
   - Developer B: User Story 8 (Daily Limit)
   - Developer C: User Story 4 (Admin CRUD)
3. After P1 stories complete:
   - Developer A: User Story 3 → User Story 5
   - Developer B: User Story 6
   - Developer C: User Story 7
4. All developers: Phase 11 (Bulk Import & Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests are added later)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 73 |
| **User Stories** | 8 (US1-US8) |
| **MVP Tasks** | 41 (Phases 1-6, plus bulk import in Phase 11) |
| **Post-MVP Tasks** | 32 (Phases 7-10, plus polish in Phase 11) |
| **Parallel Opportunities** | High (most [P] tasks can run in parallel) |
| **MVP Scope** | User Stories 1, 2, 8, 4 (Easy, Medium, Daily Limit, Admin CRUD) |
