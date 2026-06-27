# Feature Specification: Quiz Difficulty System / Quiz 难度系统

**Feature Branch**: `feat/quiz-difficulty-system`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "为quiz模块创建规范：1. 需要在后台系统可以发布quiz问题。2. 有难度选择，正常模式有三个难度等级，容易/中等/高级，另外，在根据用户等级，在高等级的时候，增加隐藏的两个难度等级：超级难/无敌难，不同难度等级对应不同的奖励，奖励不同数量的token，简单：需要回答5条简单问题，从简单问题库随机选择，1 token each question，答错问题不倒扣；中等：需要回答5条中等难度的问题，从中等难度问题库随机选择，2 token each question，每答错1题，倒扣1 token；高级：需要回答5条高级难度的问题，从高级难度问题库随机选择，3 token each question，每答错1题，倒扣2token；3. 每个用户每个自然日（香港本地时间）只能Quiz一次。4. 每条问题有限时，避免用户问AI：简单5秒、中等10秒、高级15秒、其他难度10秒。"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player plays Quiz at Easy difficulty (Priority: P1)

Player MUST be able to select Easy difficulty and answer 5 randomly selected questions from the easy question pool. Player earns 1 token per correct answer. Wrong answers have no penalty. **Each question has a 5-second time limit** to prevent using AI assistance. Player can see quiz results (correct/incorrect) after completing all 5 questions.

**Why this priority**: Easy difficulty is the entry point for all players. It introduces the quiz feature without penalty risk, encouraging engagement.

**Independent Test**: Can be fully tested by selecting Easy difficulty, answering 5 questions, and verifying token rewards are calculated correctly (1 token per correct answer, no deduction for wrong answers). Also verify timer shows 5 seconds per question.

**Acceptance Scenarios**:

1. **Given** player is on quiz selection screen, **When** player selects "Easy" difficulty, **Then** 5 random questions from easy pool are displayed one by one.
2. **Given** player is answering easy questions, **When** player answers correctly within 5 seconds, **Then** 1 token is added to pending reward.
3. **Given** player is answering easy questions, **When** player answers incorrectly, **Then** no token is deducted (0 penalty).
4. **Given** player is answering easy questions, **When** player does not answer within 5 seconds, **Then** question is marked as incorrect (no penalty).
5. **Given** player completed all 5 questions, **When** player views results, **Then** total tokens earned = number of correct answers × 1.

---

### User Story 2 - Player plays Quiz at Medium difficulty (Priority: P1)

Player MUST be able to select Medium difficulty and answer 5 randomly selected questions from the medium question pool. Player earns 2 tokens per correct answer. Each wrong answer deducts 1 token from the reward. **Each question has a 10-second time limit** to prevent using AI assistance.

**Why this priority**: Medium difficulty provides balanced challenge and reward. It's the core quiz experience for engaged players.

**Independent Test**: Can be fully tested by selecting Medium difficulty, answering 5 questions (mix of correct/incorrect), and verifying token rewards = (correct × 2) - (incorrect × 1). Also verify timer shows 10 seconds per question.

**Acceptance Scenarios**:

1. **Given** player is on quiz selection screen, **When** player selects "Medium" difficulty, **Then** 5 random questions from medium pool are displayed.
2. **Given** player answers 3 correct and 2 incorrect on medium, **When** player completes quiz, **Then** total tokens = (3 × 2) - (2 × 1) = 4 tokens.
3. **Given** player answers all 5 questions incorrectly, **When** player completes quiz, **Then** total tokens = -5 tokens (player loses tokens).
4. **Given** player is answering medium questions, **When** player does not answer within 10 seconds, **Then** question is marked as incorrect and 1 token is deducted.

---

### User Story 3 - Player plays Quiz at Hard difficulty (Priority: P2)

Player MUST be able to select Hard difficulty and answer 5 randomly selected questions from the hard question pool. Player earns 3 tokens per correct answer. Each wrong answer deducts 2 tokens from the reward. **Each question has a 15-second time limit** to prevent using AI assistance.

**Why this priority**: Hard difficulty is for advanced players seeking high rewards despite higher risk.

**Independent Test**: Can be fully tested by selecting Hard difficulty and verifying token calculation = (correct × 3) - (incorrect × 2). Also verify timer shows 15 seconds per question.

**Acceptance Scenarios**:

1. **Given** player is on quiz selection screen, **When** player selects "Hard" difficulty, **Then** 5 random questions from hard pool are displayed.
2. **Given** player answers 4 correct and 1 incorrect on hard, **When** player completes quiz, **Then** total tokens = (4 × 3) - (1 × 2) = 10 tokens.
3. **Given** player is answering hard questions, **When** player does not answer within 15 seconds, **Then** question is marked as incorrect and 2 tokens are deducted.

---

### User Story 4 - Admin publishes Quiz questions from dashboard (Priority: P1)

Admin MUST be able to create, edit, delete quiz questions from the admin dashboard. Admin MUST be able to set difficulty level for each question. Admin MUST be able to view question pools by difficulty.

**Why this priority**: Content management is essential for live operations. Without admin ability to publish questions, the quiz feature cannot be maintained.

**Independent Test**: Can be fully tested by logging in as admin, creating a new question with difficulty="easy", and verifying it appears in the easy question pool for players.

**Acceptance Scenarios**:

1. **Given** admin is logged in, **When** admin creates a new question with difficulty="easy", **Then** question is saved to database and appears in easy question pool.
2. **Given** admin is viewing question list, **When** admin filters by difficulty="medium", **Then** only medium difficulty questions are displayed.
3. **Given** admin is editing a question, **When** admin changes difficulty from "easy" to "hard", **Then** question moves from easy pool to hard pool.

---

### User Story 5 - Player unlocks hidden difficulty levels at high level (Priority: P2)

Player MUST see "Super Hard" and "Invincible Hard" difficulty options only after reaching certain player levels. Super Hard unlocks at player level 10. Invincible Hard unlocks at player level 20. Hidden levels have higher rewards but also higher penalties.

**Why this priority**: Hidden levels provide long-term progression goals. They reward dedicated players with higher risk/reward challenges.

**Independent Test**: Can be fully tested by creating a player at level 5 (should not see hidden levels), level 10 (should see Super Hard), and level 20 (should see both hidden levels).

**Acceptance Scenarios**:

1. **Given** player is level 5, **When** player views quiz difficulties, **Then** only Easy/Medium/Hard are visible.
2. **Given** player is level 10, **When** player views quiz difficulties, **Then** Super Hard is now visible (Invincible Hard still hidden).
3. **Given** player is level 20, **When** player views quiz difficulties, **Then** both Super Hard and Invincible Hard are visible.

---

### User Story 6 - Player plays Super Hard difficulty (Priority: P2)

Player MUST be able to select Super Hard difficulty (after unlocking at level 10) and answer 5 randomly selected questions from the super hard question pool. Player earns 5 tokens per correct answer. Each wrong answer deducts 3 tokens. **Each question has a 10-second time limit** to prevent using AI assistance.

**Why this priority**: Super Hard is the first hidden level, providing significant reward for skilled players.

**Independent Test**: Can be fully tested by selecting Super Hard difficulty and verifying token calculation = (correct × 5) - (incorrect × 3). Also verify timer shows 10 seconds per question.

**Acceptance Scenarios**:

1. **Given** player is level 10, **When** player selects "Super Hard", **Then** 5 random questions from super hard pool are displayed.
2. **Given** player answers 5 correct on super hard, **When** player completes quiz, **Then** total tokens = 5 × 5 = 25 tokens.
3. **Given** player is answering super hard questions, **When** player does not answer within 10 seconds, **Then** question is marked as incorrect and 3 tokens are deducted.

---

### User Story 7 - Player plays Invincible Hard difficulty (Priority: P3)

Player MUST be able to select Invincible Hard difficulty (after unlocking at level 20) and answer 5 randomly selected questions from the invincible hard question pool. Player earns 10 tokens per correct answer. Each wrong answer deducts 5 tokens. **Each question has a 10-second time limit** to prevent using AI assistance.

**Why this priority**: Invincible Hard is the ultimate challenge for top players. It's the highest risk/reward tier.

**Independent Test**: Can be fully tested by selecting Invincible Hard difficulty and verifying token calculation = (correct × 10) - (incorrect × 5). Also verify timer shows 10 seconds per question.

**Acceptance Scenarios**:

1. **Given** player is level 20, **When** player selects "Invincible Hard", **Then** 5 random questions from invincible hard pool are displayed.
2. **Given** player answers 3 correct and 2 incorrect on invincible hard, **When** player completes quiz, **Then** total tokens = (3 × 10) - (2 × 5) = 20 tokens.
3. **Given** player is answering invincible hard questions, **When** player does not answer within 10 seconds, **Then** question is marked as incorrect and 5 tokens are deducted.

---

### User Story 8 - Player can only play Quiz once per day (Priority: P1)

Player MUST only be allowed to play Quiz once per natural day (based on Hong Kong local time, UTC+8). If player has already completed a quiz today, they MUST NOT be allowed to start a new quiz until the next day (00:00 Hong Kong time).

**Why this priority**: Daily limit prevents players from farming unlimited tokens. It ensures fair play and encourages daily engagement rather than spamming.

**Independent Test**: Can be fully tested by completing a quiz, then trying to start another quiz on the same day (should be blocked with message "You have already completed today's quiz. Come back tomorrow!"). Also verify that after 00:00 Hong Kong time, player can start a new quiz.

**Acceptance Scenarios**:

1. **Given** player has NOT completed any quiz today, **When** player selects any difficulty, **Then** quiz starts normally.
2. **Given** player has already completed a quiz today, **When** player tries to select any difficulty, **Then** a message is shown: "You have already completed today's quiz. Come back tomorrow!" and quiz cannot start.
3. **Given** player completed a quiz at 23:59 Hong Kong time, **When** player tries to start a new quiz at 00:01 Hong Kong time (next day), **Then** quiz starts normally (new day, new attempt allowed).
4. **Given** player is viewing quiz selection screen, **When** player has already completed today's quiz, **Then** a countdown timer shows time remaining until next attempt (until 00:00 Hong Kong time).

---

### Edge Cases

- What happens when player's token balance is insufficient to pay penalty? (**Clarified**: Token balance CAN go negative. If player has 3 tokens and gets -5 penalty, balance becomes -2. Player can continue playing and earn tokens to bring balance back to positive.)
- What happens when question pool has fewer than 5 questions? (**Clarified**: Show error message "Not enough questions in pool. Please contact admin.")
- What happens when player disconnects mid-quiz? (**Clarified**: Player can reconnect and resume current question. Timer remaining time + current question index are stored in `quiz_attempts` table (backend). If player disconnects and does not reconnect within 1 hour, quiz attempt is marked as abandoned and daily limit slot is released.)
- What happens when admin deletes a question that's currently in a player's active quiz? (**Clarified**: Should not happen. Soft delete questions instead of hard delete.)
- What happens when player tries to start a quiz at 23:59 Hong Kong time and completes it at 00:01 next day? (**Clarified**: Quiz counts for the day it was started. Player cannot start another quiz until the next day after completion.)
- What happens when player answers a question correctly but time expires before submitting? (**Clarified**: Frontend sends answer with `timeout: true` flag. Backend records but does not count the answer as correct or incorrect (no token change).)
- What happens when player has slow internet and timer expires before frontend receives question? (**Clarified**: Only frontend enforces time limit. Backend does NOT validate time. If frontend sends answer after timer expires, backend still accepts it.)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow players to select quiz difficulty (Easy/Medium/Hard always visible; Super Hard/Invincible Hard conditionally visible based on player level).
- **FR-002**: System MUST display 5 randomly selected questions from the selected difficulty's question pool.
- **FR-003**: System MUST calculate token rewards based on difficulty:
  - Easy: +1 token per correct, 0 penalty per incorrect
  - Medium: +2 tokens per correct, -1 token per incorrect
  - Hard: +3 tokens per correct, -2 tokens per incorrect
  - Super Hard: +5 tokens per correct, -3 tokens per incorrect
  - Invincible Hard: +10 tokens per correct, -5 tokens per incorrect
- **FR-004**: System MUST unlock Super Hard difficulty when player reaches level 10.
- **FR-005**: System MUST unlock Invincible Hard difficulty when player reaches level 20.
- **FR-006**: System MUST allow admin to create, edit, delete quiz questions from admin dashboard. System MUST also allow admin to bulk import quiz questions via CSV upload from admin dashboard (MVP feature). CSV format MUST include columns: `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer` (A/B/C/D), `difficulty` (easy/medium/hard/super_hard/invincible_hard), `explanation` (optional).
- **FR-007**: System MUST allow admin to set difficulty level for each question (easy/medium/hard/super_hard/invincible_hard).
- **FR-008**: System MUST store quiz questions in database (not hardcoded in frontend).
- **FR-009**: System MUST validate that question pools have at least 5 questions before allowing player to start quiz.
- **FR-010**: System MUST allow token balance to go negative. If penalty > current balance, balance becomes negative (e.g., 3 tokens - 5 penalty = -2 tokens).
- **FR-011**: System MUST enforce daily limit: each player can only play quiz once per natural day (based on Hong Kong local time, UTC+8). System MUST check `quiz_attempts` table for any attempt with `started_at` on the current day (Hong Kong time) before allowing a new quiz. Quiz counts for the day it was started (even if completed after 00:00 Hong Kong time).
- **FR-012**: System MUST display time limit per question based on difficulty (frontend-only enforcement, backend does NOT validate time):
  - Easy: 5 seconds per question
  - Medium: 10 seconds per question
  - Hard: 15 seconds per question
  - Super Hard: 10 seconds per question
  - Invincible Hard: 10 seconds per question
  - If player does not answer within the time limit, frontend sends answer with `timeout: true` flag. Backend records the answer (with `is_timeout: true`) but does not count it as correct or incorrect (no token change, no penalty). Frontend displays countdown timer and auto-advances to next question when timer expires.
- **FR-013**: System MUST display quiz results with summary (total score, correct/total, total tokens earned/deducted) and a collapsible "View Details" section showing per-question breakdown (question text, player's answer, correct answer, explanation, tokens earned/deducted for each question).

### Key Entities *(include if feature involves data)*

- **QuizQuestion**: id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, explanation, is_active, created_by, updated_by, created_at, updated_at
  - `created_by`: Admin user ID who created the question (for audit trail)
  - `updated_by`: Admin user ID who last updated the question (for audit trail)
- **QuizAttempt**: id, user_id, difficulty, questions (JSON array), answers (JSON array), score, tokens_earned, started_at, completed_at, reconnect_state (JSON)
  - `questions`: `[{"id": 1, "time_spent": 5}, ...]` (question IDs with time spent in seconds)
  - `answers`: `[{"question_id": 1, "selected": "A", "is_correct": true, "is_timeout": false, "tokens": 1}, ...]` (answer details, `is_timeout: true` means player did not answer in time)
  - `reconnect_state`: `{"current_question_index": 2, "seconds_left": 3, "disconnected_at": "2026-06-27T15:00:00Z"}` (for reconnect resume, cleared after reconnect)
  - `started_at`: Timestamp when quiz was started (used to enforce daily limit based on Hong Kong time).
  - `completed_at`: Timestamp when quiz was completed (NULL if abandoned after 1 hour).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Timer displays correct remaining time per question based on difficulty. When timer expires, frontend automatically advances to next question without waiting for user input. Verified via manual testing (Easy: 5s/q, Medium: 10s/q, Hard: 15s/q, Super Hard/Invincible Hard: 10s/q).
- **SC-002**: Token rewards are calculated correctly for all difficulty levels (tested via unit tests).
- **SC-003**: Admin can publish a new quiz question in under 2 minutes.
- **SC-004**: Hidden difficulty levels are only visible when player meets level requirement (tested via integration tests).
- **SC-005**: 95% of quiz attempts complete without errors (tracked via analytics).
- **SC-006**: Daily limit is enforced correctly: player cannot start a new quiz if they have already completed one today (Hong Kong time).
- **SC-007**: Timer displays correctly on frontend and auto-submits answer when time expires.

---

## Assumptions

- Player level is stored in `users` table (global attribute, not per-game-save).
- Token balance is stored in game state (users table or game_saves table).
- Quiz questions are stored in database table `quiz_questions` (created via `game-content-schema.sql`).
- Admin dashboard already has basic structure (from earlier Phase 1 implementation).
- **Player can only play quiz once per day (Hong Kong time).** This is a hard limit enforced by backend.
- Questions are multiple-choice with 4 options (A/B/C/D).
- Frontend timer is for display and enforcement only; backend does NOT enforce time limit (simplified implementation, relies on frontend-only validation).
- Hong Kong local time is UTC+8. System must convert server time to Hong Kong time for daily limit calculation.
- Token balance CAN go negative. If penalty > current balance, balance becomes negative (e.g., 3 tokens - 5 penalty = -2 tokens). Player can continue playing and earn tokens to recover to positive.
- Reconnect state (timer remaining time, current question index) is stored in `quiz_attempts` table (backend). Abandoned quiz attempts (disconnected > 1 hour) are automatically released (daily limit slot freed, `completed_at` remains NULL).
