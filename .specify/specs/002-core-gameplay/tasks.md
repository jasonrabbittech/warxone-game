# Tasks: Core Gameplay System / 核心游戏玩法系统

**Feature**: 002-core-gameplay | **Branch**: `feat/core-gameplay-system` | **Date**: 2026-07-01

**Input**: Design documents from `/specs/002-core-gameplay/` (plan.md, spec.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md (✅), spec.md (✅), data-model.md (✅), contracts/ (✅)

**Tests**: NOT requested in the feature spec — test tasks omitted per task-generation rules. Manual validation scenarios from `quickstart.md` are referenced in the Polish phase.

**Organization**: Tasks grouped by user story (US1–US7) so each story is independently implementable and testable. Priority order: P1 → P2 → P3 → P4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1–US7)
- Paths use actual repo layout: `frontend/src/...` and `backend/functions/<fn>/index.js`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the authoritative game-state container and backend SCF scaffolding that all stories depend on.

- [ ] T001 Establish `GameState.js` as the authoritative game-state container and move game initialization out of `frontend/src/main.js` into `frontend/src/game/GameState.js` (per CD-001: frontend is authoritative; backend is persistence only)
- [ ] T002 [P] Scaffold backend SCF functions for `game-save`, `game-load`, `game-saves-list` under `backend/functions/` following `contracts/game-api.md` request/response schemas
- [ ] T003 [P] Set up DB connection pooling (global scope) and `.env` config loading in `backend/shared/db.js` and `backend/.env` (per research.md Section 1: SCF pooling)

**Checkpoint**: GameState is the single source of truth; backend save/load functions are scaffolded.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Define core game balance config (resource rates, training costs, rarity distribution, chest probabilities) in `frontend/src/game/config.js` (per spec FR-003/FR-004/FR-006 and Assumptions)
- [ ] T005 [P] Implement JWT validation middleware in `backend/shared/auth.js` (per `contracts/auth-api.md`; validates signature + expiry on every protected endpoint)
- [ ] T006 Implement game save/load SCF functions (`game-save`, `game-load`, `game-saves-list`) in `backend/functions/` with JWT auth, ≤1MB size validation, and user isolation (per `contracts/game-api.md`)
- [ ] T007 [P] Implement card API SCF functions (`card-purchase`, `card-collection`, `card-definitions`) in `backend/functions/` with atomic token deduction (per `contracts/card-api.md`)
- [ ] T008 Implement frontend API client methods for save/load/card in `frontend/src/api/client.js` with silent-fail + 3-retry + localStorage fallback (per CD-005)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Map Exploration & Territory Conquest (Priority: P1) 🎯 MVP

**Goal**: Player views interactive SVG map (zoom/pan), selects adjacent territories, conquers them via battle, and unlocks Mars at 90% conquest.

**Independent Test**: Load map → zoom/pan works → click adjacent enemy territory → battle starts → on win, territory added to owned list +1 token; conquer 90% of Earth → Mars switch appears.

### Implementation for User Story 1

- [ ] T009 [US1] Implement territory conquest flow that calls the battle system and awards +1 token on victory in `frontend/src/game/map.js` (per spec US1 acceptance 4–5)
- [ ] T010 [US1] Implement Mars world unlock at 90% Earth conquest + world-switch button in `frontend/src/game/map.js` (per FR-010; quickstart Scenario 2)
- [ ] T011 [US1] Wire conquest result → `GameState` update + auto-save trigger in `frontend/src/main.js` (per FR-011)

**Checkpoint**: US1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Battle with Military Management (Priority: P1) 🎯 MVP

**Goal**: Player trains military to influence battle; battle outcome uses military-strength formula with randomness; global cooldown; retreat option; front-line visualization.

**Independent Test**: Train military (cost 1k pop + 5 tokens → +10 strength) → attack territory → outcome reflects military advantage → cooldown blocks re-attack → front line renders during battle.

### Implementation for User Story 2

- [ ] T012 [US2] Implement military training system (`trainMilitary`) in `frontend/src/game/military.js` (per FR-003: 1k pop + 5 tokens → +10 strength)
- [ ] T013 [US2] Implement battle outcome formula (base 50% + 5% per 10% advantage + random ±10%, capped 10%–90%) in `frontend/src/game/battle.js` (per CD-002, FR-002)
- [ ] T014 [US2] Implement global battle cooldown (30s–5min, based on intensity) in `frontend/src/game/battle.js` (per FR-009, quickstart Scenario 3)
- [ ] T015 [US2] Implement retreat option (49.9% chance defender continues invading) in `frontend/src/game/battle.js` (per spec US2 acceptance 4)
- [ ] T016 [US2] Implement front-line SVG visualization updated every 5s during battle in `frontend/src/game/BattleManager.js` + `frontend/src/styles/battlefield.css` (per FR-002)

**Checkpoint**: US1 AND US2 both work independently.

---

## Phase 5: User Story 3 - Resource Management (Priority: P1) 🎯 MVP

**Goal**: Player has Population (auto-grow), Gold (chests/gift only), Food (consumed by military), Tokens (battles/quiz); all displayed and updated in real-time.

**Independent Test**: Wait 10s → population grows; train military → food drops; food=0 → 10%/min starvation; open chest → may gain gold; resource panel shows all four.

### Implementation for User Story 3

- [ ] T017 [US3] Add `gold` and `food` to `GameState` player object in `frontend/src/game/GameState.js` (per FR-004)
- [ ] T018 [US3] Implement resource loop (pop auto-grow, food consumption, starvation penalty) in `frontend/src/game/resources.js` (per FR-004, Assumptions)
- [ ] T019 [US3] Implement chest spawn (8% normal / 0.5% giant) + loot logic in `frontend/src/game/chests.js` (per FR-004, Assumptions)
- [ ] T020 [US3] Implement resource display UI (population/gold/food/tokens, real-time) in `frontend/src/main.js` + `frontend/src/styles/components.css` (per FR-005)
- [ ] T021 [US3] Implement gift-pack admin API (`gift-pack-create`) in `backend/functions/` + player redemption in `frontend/src/pages/admin/` (per FR-004, CD-004; admin-only in Phase 1)

**Checkpoint**: All P1 stories (US1, US2, US3) independently functional — MVP complete.

---

## Phase 6: User Story 4 - Card Collection (Priority: P2)

**Goal**: Player buys card packs (5 tokens) for city-named cards of 6 rarities; card effects are permanent additions; infrastructure totals tracked.

**Independent Test**: Buy pack (5 tokens) → random city card → its population/military/gold/food/airports/train/militaryUnits permanently added; card in `cardCollection`; infrastructure totals updated.

### Implementation for User Story 4

- [ ] T022 [US4] Define/refine card rarity database with ranges per rarity in `frontend/src/game/cardRarities.js` (per FR-006, card-api.md rarity table)
- [ ] T023 [US4] Implement `acquireCard()` applying permanent effects + infrastructure totals in `frontend/src/game/cards.js` (per FR-006; cards NOT consumed on use)
- [ ] T024 [US4] Implement card purchase flow (5 tokens) + collection display UI in `frontend/src/main.js` + `frontend/src/styles/components.css` (per quickstart Scenario 5)

**Checkpoint**: US4 testable independently.

---

## Phase 7: User Story 6 - Connection Building (Priority: P2)

**Goal**: Player builds Air/Train/Military routes between owned adjacent territories using card infrastructure; each route gives cumulative bonus up to +100%.

**Independent Test**: Own 2 adjacent territories + cards with airports → build air route (100 gold) → airport indicator on map + transport bonus applied.

### Implementation for User Story 6

- [ ] T025 [US6] Implement `buildConnection()` requiring matching card infrastructure + 100 gold cost in `frontend/src/game/connections.js` (per FR-007)
- [ ] T026 [US6] Implement connection UI + bonus application (cumulative, +20% per route, cap +100%) in `frontend/src/main.js` + `frontend/src/styles/components.css` (per FR-007)

**Checkpoint**: US6 testable independently.

---

## Phase 8: User Story 5 - Alliance System (Priority: P3 · Phase 2)

**Goal**: Player sends alliance requests; allies get shared vision + resource sharing via WebSocket. **Deferred to Phase 2** (requires WebSocket infra).

**Independent Test**: Player A sends request → B accepts → both see each other's territories; A shares 100 gold → B receives immediately via WebSocket.

### Implementation for User Story 5

- [ ] T027 [US5] Implement alliance data model + state in `frontend/src/game/alliances.js` (per data-model §2.6)
- [ ] T028 [US5] Implement alliance SCF functions (`alliance-create`, `alliance-accept`, `alliance-share`) + WebSocket integration in `backend/functions/` (per FR-008)
- [ ] T029 [US5] Implement alliance UI (request/accept/shared vision/resource share) in `frontend/src/pages/` (per spec US5)

**Checkpoint**: US5 testable after WebSocket infra is in place.

---

## Phase 9: User Story 7 - Weapon System (Priority: P4 · Phase 3)

**Goal**: Player acquires 4-category weapons (attack/defense), evolves them, trades via tokens. **Deferred to Phase 3** (requires full multiplayer + admin tools).

**Independent Test**: Admin releases weapon → player meets territory/pop reqs → acquires weapon → evolves to L2 (more effect, more energy) → trades with custom token price.

### Implementation for User Story 7

- [ ] T030 [US7] Implement weapon data model + categories in `frontend/src/game/weapons.js` (per data-model §2.7, FR-013)
- [ ] T031 [US7] Implement weapon acquisition + evolution UI in `frontend/src/main.js` (per FR-014, FR-015)
- [ ] T032 [US7] Implement weapon SCF functions (`weapon-release`, `weapon-trade`, `weapon-transfer`) in `backend/functions/` (per FR-016, FR-017)

**Checkpoint**: All user stories complete.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories.

- [ ] T033 [P] Refactor `frontend/src/main.js` monolith — extract UI wiring into `frontend/src/components/` (per plan.md Implementation Notes)
- [ ] T034 [P] Add i18n keys for all new UI strings in `frontend/src/i18n/` (per Constitution Principle V)
- [ ] T035 [P] Performance optimization: SVG layer caching + batched state updates in `frontend/src/game/map.js` (per research.md Section 5)
- [ ] T036 Run `quickstart.md` validation scenarios 1–7 (map, military, resources, cards, connections, save/load) and fix any failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–9)**: All depend on Foundational (Phase 2)
  - Phase 1 (P1) stories: US1, US2, US3
  - Phase 2 (P2) stories: US4, US6
  - Phase 3 (P3) story: US5 (needs WebSocket)
  - Phase 4 (P4) story: US7 (needs multiplayer + admin)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on other stories
- **US2 (P1)**: After Foundational — integrates with US1 conquest flow
- **US3 (P1)**: After Foundational — consumed by US2 (food) and US1 (tokens)
- **US4 (P2)**: After Foundational — independent
- **US6 (P2)**: After Foundational — independent of US4
- **US5 (P3)**: After Foundational + WebSocket infra
- **US7 (P4)**: After Foundational + multiplayer/admin

### Within Each User Story

- Config/state before logic
- Logic before UI wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- All Foundational tasks marked [P] can run in parallel (T005, T007)
- Once Foundational completes, US1/US2/US3 can proceed in parallel (if staffed)
- US4 and US6 can run in parallel after P1
- All Polish tasks marked [P] can run in parallel (T033, T034, T035)

---

## Parallel Example: User Story 2 (Battle)

```bash
# Launch independent logic modules together:
Task T012: "Implement military training system in frontend/src/game/military.js"
Task T013: "Implement battle outcome formula in frontend/src/game/battle.js"
Task T014: "Implement global battle cooldown in frontend/src/game/battle.js"
# Then: T015 (retreat) and T016 (front line) build on T013
```

---

## Implementation Strategy

### MVP First (User Stories 1–3 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3–5: US1, US2, US3
4. **STOP and VALIDATE**: Test US1–US3 independently via quickstart scenarios 2–4
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → US2 → US3 → Test → MVP demo
3. Add US4 → US6 → Test → demo
4. (Phase 2) Add US5 (alliance) after WebSocket
5. (Phase 3) Add US7 (weapons) after multiplayer

### Parallel Team Strategy

1. Team completes Setup + Foundational
2. Once Foundational done:
   - Developer A: US1 → US2 → US3 (P1 core loop)
   - Developer B: US4 + US6 (P2 systems)
3. Stories integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- US5 (alliance) and US7 (weapons) are explicitly deferred to Phase 2 / Phase 3 per spec
- Chest + gift-pack logic lives under US3 (resources) per spec FR-004
- Save/load uses cloud API with localStorage fallback (CD-005)
- Commit after each task or logical group; stop at any checkpoint to validate independently
