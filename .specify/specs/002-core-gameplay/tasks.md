# Tasks: Core Gameplay System / 核心游戏玩法系统任务列表

**Input**: Design documents from `specs/002-core-gameplay/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

<!--
  ============================================================================
  IMPORTANT: Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  All tasks MUST follow the checklist format:
  - [ ] T001 [P] [US1] Description with file path
  ============================================================================
-->

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan in `frontend/src/` and `backend/functions/`
- [X] T002 [P] Install frontend dependencies: `npm install` in `frontend/` (Vite, GSAP, etc.)
- [X] T003 [P] Install backend dependencies: `npm install` in `backend/` (@cloudbase/node-sdk, mysql2, jsonwebtoken, ws)
- [X] T004 [P] Configure linting and formatting tools (.eslintrc.js, .prettierrc)
- [X] T005 [P] Create environment configuration files: `frontend/.env`, `backend/.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Database Schema Setup

- [X] T006 Create database schema script in `backend/schema.sql` (users, game_saves, cards, connections, alliances, weapons, gift_packs tables)
- [X] T007 [P] Create database migration scripts for TDSQL-C Serverless MySQL 8.0
- [X] T008 [P] Seed initial data: territories (Earth ~200, Mars ~100) in `scripts/seed-territories.js`

### 2.2 SCF Function Infrastructure (Research Task 1 & 2)

- [X] T009 Implement SCF database connection pooling in `backend/functions/_common/db.js` (mysql2, global scope, pool size=1)
- [X] T010 [P] Implement Redis client initialization in `backend/functions/_common/redis.js` (ioredis, global scope, environment variables)
- [X] T011 [P] Implement JWT authentication middleware in `backend/functions/_common/auth.js` (jsonwebtoken, environment variable JWT_SECRET)
- [X] T012 Implement input validation utilities in `backend/functions/_common/validator.js` (validator library, SQL injection prevention)

### 2.3 Frontend Game State Management (Research Task 4)

- [X] T013 Refactor `frontend/src/main.js` (44KB monolith) into modular structure:
  - [X] T013a [P] Create `frontend/src/game/GameState.js` - Central game state management with event system
  - [X] T013b [P] Create `frontend/src/game/map.js` - SVG map rendering, zoom, pan (viewBox manipulation)
  - [X] T013c [P] Create `frontend/src/game/battle.js` - Auto-battle logic with formula: Base 50% + advantage bonus + random(-10%, +10%)
  - [X] T013d [P] Create `frontend/src/game/resources.js` - Resource calculation loop (population auto-grow, food consumption, gold from chests)
  - [X] T013e [P] Create `frontend/src/game/cards.js` - Card collection and permanent effects application
  - [X] T013f [P] Create `frontend/src/game/connections.js` - Connection building and bonuses
  - [X] T013g [P] Create `frontend/src/game/chests.js` - Chest spawning and loot logic
  - [X] T013h [P] Create `frontend/src/game/military.js` - Military training system
- [X] T014 Implement backend save/load system in `backend/functions/game-save/` and `backend/functions/game-load/` (every 30 seconds auto-save)
- [X] T015 Implement silent failure + retry logic in `frontend/src/game/GameState.js` (3 retries before localStorage fallback)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Map Exploration & Territory Conquest (Priority: P1) 🎯 MVP

**Goal**: Player can view interactive SVG map, select and conquer adjacent territories through battles, unlock Mars world after conquering 90% of Earth.

**Independent Test**: (1) Loading map screen, (2) Verifying zoom/pan controls work, (3) Selecting an adjacent territory, (4) Winning a battle, (5) Verifying territory is added to player's owned territories.

### Implementation for User Story 1

- [X] T016 [P] [US1] Implement zoom control in `frontend/src/game/map.js` (scroll wheel → viewBox width decreases/increases, use requestAnimationFrame for smooth animation)
- [X] T017 [P] [US1] Implement pan control in `frontend/src/game/map.js` (drag → viewBox x/y change, touch events with passive listeners)
- [X] T018 [US1] Implement territory selection logic in `frontend/src/game/map.js` (check adjacency, display "Not adjacent" message if not adjacent)
- [X] T019 [US1] Implement battle initiation in `frontend/src/game/battle.js` (click adjacent enemy territory → auto-battle starts)
- [X] T020 [US1] Implement battle outcome calculation in `frontend/src/game/battle.js` (Formula: Base 50% + (advantage × 5% per 10% military advantage) + random(-10%, +10%), capped at 10%-90%)
- [X] T021 [US1] Implement territory acquisition logic in `frontend/src/game/map.js` (if battle win → add territory to player.territories, +1 token reward)
- [X] T022 [US1] Implement Mars world unlock logic in `frontend/src/game/map.js` (if player conquers 90% of Earth → unlock Mars, show switch button)
- [X] T023 [US1] Implement world switch UI in `frontend/src/components/WorldSwitch.js` (button to switch between Earth and Mars maps)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Battle & Military Management (Priority: P1)

**Goal**: Player can train military units, battle outcome considers military strength, cooldown period after battle, front line display during battle, retreat option.

**Independent Test**: (1) Training military units, (2) Attacking a territory, (3) Verifying battle outcome considers military strength, (4) Verifying cooldown prevents immediate re-attack, (5) Verifying front line display.

### Implementation for User Story 2

- [X] T024 [P] [US2] Implement military training UI in `frontend/src/components/ui/MilitaryPanel.js` (button + cost display: 1k population + 5 tokens per 10 military, training queue, auto-train toggle)
- [X] T025 [US2] Implement military training logic in `frontend/src/game/military.js` (trainMilitary() function, check resources, update GameState, training queue with progress, auto-train)
- [X] T026 [US2] Implement battle cooldown system in `frontend/src/game/battle.js` (global cooldown: 30s-5min after any battle, cannot attack ANY territory during cooldown, cooldown display in UI)
- [X] T027 [US2] Implement retreat option in `frontend/src/game/battle.js` (battle starts → player can click "Retreat", 49.9% chance opponent continues attacking, additional military loss if retreat fails)
- [X] T028 [US2] Implement front line display in `frontend/src/game/battle.js` (show front line using SVG overlay, update position based on battle casualties)
- [X] T029 [US2] Update battle resolution in `frontend/src/game/battle.js` (apply military strength to battle outcome, update GameState with battle result, battle history tracking)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Resource Management (Priority: P1)

**Goal**: Player has multiple resource types (Population, Gold, Food, Tokens), resources displayed in UI, used for various game actions.

**Independent Test**: (1) Verifying resource display in UI, (2) Waiting for population growth (10 seconds), (3) Opening a chest to earn gold, (4) Receiving gold from admin gift package, (5) Training military (should consume food and tokens).

### Implementation for User Story 3

- [X] T030 [P] [US3] Add gold and food to player object in `frontend/src/game/GameState.js` (initialize gold: 0, food: 500)
- [X] T031 [US3] Implement resource calculation loop in `frontend/src/game/resources.js` (population auto-grows every 10s based on territories, food consumed by military every minute)
- [X] T032 [US3] Implement starvation penalty in `frontend/src/game/resources.js` (if food = 0 → military strength decreases by 10% per minute)
- [X] T033 [US3] Implement resource display UI in `frontend/src/components/ui/ResourcePanel.js` (top bar or side panel, update every second for display)
- [X] T034 [US3] Implement chest spawning logic in `frontend/src/game/chests.js` (each territory has 8% chance normal chest, 0.5% chance giant chest)
- [X] T035 [US3] Implement chest loot logic in `frontend/src/game/chests.js` (normal: 40% ≤500 gold; giant: 67% ≤6k gold, 30% ≤15k gold)
- [X] T036 [US3] Implement chest UI in `frontend/src/components/ui/ChestPanel.js` (open chest animation, display gold received)
- [X] T037 [US3] Implement gift package reception logic in `frontend/src/game/resources.js` (admin distributes gift packages → gold added to player.resources.gold)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Card Collection & Effects (Priority: P2)

**Goal**: Player can purchase card packs (5 tokens/pack), receive cards named after cities with 6 rarities, card effects are permanent additions to player's totals.

**Independent Test**: (1) Purchasing a card pack, (2) Receiving a random card named after a city, (3) Verifying card rarity matches city size, (4) Verifying card's population/military/resources are permanently added to player's totals, (5) Verifying card has airport/train/military unit data.

### Implementation for User Story 4

- [ ] T038 [P] [US4] Define card database in `frontend/src/game/cardRarities.js` (1000+ city-named cards across 6 rarities: Common, Rare, Super Rare, Mythic, Legendary, Ultra Legendary)
- [ ] T039 [US4] Implement card pack purchase logic in `frontend/src/game/cards.js` (two types: (1) Regular card pack - costs 5 tokens, random city-named card from database based on rarity weight: Common 40%, Rare 25%, Super Rare 15%, Mythic 10%, Legendary 7%, Ultra Legendary 3%; (2) Fighter/Bomb card pack - costs 10 tokens, random weapon card from database (NOT city cards), based on weapon rarity weight. IMPORTANT: Weapons can ONLY be obtained from Fighter/Bomb card packs, NOT regular card packs (FR-018))
- [ ] T040 [US4] Implement card acquisition logic in `frontend/src/game/cards.js` (acquireCard() function, permanently add card.population, card.military, card.gold, card.food to player's totals)
- [ ] T041 [US4] Implement card infrastructure tracking in `frontend/src/game/cards.js` (add card.airports to player.infrastructure.totalAirports, card.trainStations to player.infrastructure.totalTrainStations, card.militaryUnits to player.infrastructure.totalMilitaryUnits)
- [ ] T042 [US4] Implement card collection UI in `frontend/src/components/CardCollection.js` (display all acquired cards, show card details: name, rarity, population, military, resources, airports, trainStations, militaryUnits)
- [ ] T043 [US4] Implement card shop UI in `frontend/src/components/CardShop.js` (display card pack price: 5 tokens, purchase button, animation for receiving card)

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 6 - Connection System (Priority: P2)

**Goal**: Player can build connections between controlled territories (Air routes, Train routes, Military unit routes), connections provide benefits based on type.

**Independent Test**: (1) Selecting two adjacent owned territories, (2) Building an air route (requires airports on cards), (3) Building a train route (requires train stations on cards), (4) Building a military route (requires military units on cards), (5) Verifying connection benefits are applied.

### Implementation for User Story 6

- [ ] T044 [P] [US6] Implement connection building UI in `frontend/src/components/ConnectionBuilder.js` (select two adjacent owned territories, select connection type: airport/train/military)
- [ ] T045 [US6] Implement connection building logic in `frontend/src/game/connections.js` (buildConnection() function, check if player has required infrastructure from collected cards, cost: 100 gold/connection)
- [ ] T046 [US6] Implement connection benefits in `frontend/src/game/connections.js` (airport → air transport efficiency +20%, train → land transport speed +20%, military → military movement speed +20% (cooldown reduced by 20%))
- [ ] T047 [US6] Implement connection display in `frontend/src/components/ConnectionDisplay.js` (visual indicators on map: airport icon, train icon, military icon)

**Checkpoint**: At this point, User Stories 1, 2, 3, 4, AND 6 should all work independently

---

## Phase 8: User Story 5 - Alliance System (Priority: P3, Phase 2)

**Goal**: Player can send alliance requests to other players, alliances provide shared vision and resource sharing. (Requires WebSocket infrastructure)

**Independent Test**: (1) Sending alliance request, (2) Other player accepts, (3) Verifying alliance benefits (shared vision), (4) Testing resource sharing.

### Implementation for User Story 5 (Phase 2 - Requires WebSocket)

- [ ] T048 [P] [US5] Implement WebSocket infrastructure using Tencent Cloud API Gateway in `backend/functions/websocket-connect/`, `websocket-message/`, `websocket-disconnect/` (Research Task 3)
- [ ] T049 [US5] Implement alliance data model in `backend/schema.sql` (alliances table: id, user1_id, user2_id, status, benefits, created_at)
- [ ] T050 [US5] Implement alliance request logic in `backend/functions/alliance-create/` (send alliance request, store in database, notify other player via WebSocket)
- [ ] T051 [US5] Implement alliance acceptance logic in `backend/functions/alliance-accept/` (accept alliance request, update status to 'active', enable shared vision)
- [ ] T052 [US5] Implement shared vision logic in `frontend/src/game/alliances.js` (if allied → can see other player's controlled territories on map)
- [ ] T053 [US5] Implement resource sharing logic in `frontend/src/game/alliances.js` (if allied → can send resources to ally, ally receives resources)
- [ ] T054 [US5] Implement alliance UI in `frontend/src/components/Alliance.js` (send request, accept request, view allied players, chat)

**Checkpoint**: At this point, all Phase 1 user stories should be complete, Alliance System (Phase 2) should be functional

---

## Phase 9: User Story 7 - Weapon System (Priority: P4, Phase 3)

**Goal**: Player can acquire weapons of 4 categories (Sea, Land, Air, Cyber), weapons can be attack-type or defense-type, weapons can be evolved, weapons can be traded in multiplayer mode.

**Independent Test**: (1) Admin releases a new weapon, (2) Player acquires weapon (from shop or card pack), (3) Player evolves weapon, (4) Player uses weapon for attack or defense, (5) Player transfers weapon to another player, (6) Player trades weapon with tokens.

### Implementation for User Story 7 (Phase 3 - Requires Multiplayer Infrastructure)

- [ ] T055 [P] [US7] Define weapon database in `frontend/src/game/weaponRarities.js` (100+ weapons across 4 categories: Sea, Land, Air, Cyber)
- [ ] T056 [US7] Implement weapon data model in `backend/schema.sql` (weapons table: id, name, category, weapon_type, effect_value, energy_cost, level, evolution_levels, unlock_requirements, tradeable, created_by)
- [ ] T057 [US7] Implement weapon acquisition logic in `frontend/src/game/weapons.js` (acquire from weapon shop or from Fighter/Bomb card packs (NOT regular card packs))
- [ ] T058 [US7] Implement weapon evolution logic in `frontend/src/game/weapons.js` (evolveWeapon() function, increases effect value but also increases energy consumption, requires resources (gold/food), tokens NOT required)
- [ ] T059 [US7] Implement weapon unlock requirements logic in `frontend/src/game/weapons.js` (higher-level weapons require minimum territories and population to unlock, tokens NOT part of unlock requirements)
- [ ] T060 [US7] Implement weapon use in battles in `frontend/src/game/battle.js` (if player has attack-type weapon → increase attack power; if defense-type weapon → increase defense capability)
- [ ] T061 [US7] Implement weapon trading logic in `frontend/src/game/weapons.js` (in multiplayer mode, weapons CAN be transferred between players, traded using tokens, seller can set custom prices)
- [ ] T062 [US7] Implement admin weapon release logic in `backend/functions/weapon-release/` (admin can release new weapons via admin panel/API, configurable attributes: category, weapon type, effect value, energy cost, evolution levels, unlock requirements)
- [ ] T063 [US7] Implement weapon shop UI in `frontend/src/components/WeaponShop.js` (display available weapons, purchase weapon, evolve weapon, view weapon details)
- [ ] T064 [US7] Implement weapon inventory UI in `frontend/src/components/WeaponInventory.js` (display all acquired weapons, show weapon level, evolution levels, tradeable status)

**Checkpoint**: At this point, all user stories should be complete

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T065 [P] Documentation updates in `docs/` (API documentation, game mechanics documentation, admin guide)
- [ ] T066 Code cleanup and refactoring (remove unused code, improve code organization, add comments)
- [ ] T067 Performance optimization across all stories (SVG rendering optimization, GameState event system optimization, API response caching)
- [ ] T068 [P] Additional manual tests in `tests/manual/` (test each user story independently, test cross-story interactions)
- [ ] T069 Security hardening (input validation, SQL injection prevention, XSS prevention, CSRF prevention)
- [ ] T070 Run quickstart.md validation scenarios (Scenario 1-7, verify all success criteria SC-001 to SC-009)
- [ ] T071 [P] Implement performance test for SC-001 in `tests/performance/battle-performance.test.js` (verify battle outcome is determined within 3 seconds of starting battle, automate battle initiation and measure time to outcome)
- [ ] T072 [P] Implement unit tests for SC-003 in `tests/unit/card-effects.test.js` (verify card effects are applied correctly: population, military, resources, airports, trainStations, militaryUnits are permanently added to player's totals, test each card rarity type)
- [ ] T073 [P] Implement analytics tracking for SC-006 in `frontend/src/utils/analytics.js` and `backend/src/analytics/index.js` (track all gameplay actions: battle initiation/outcome, card purchase/use, resource management; log success/failure status; generate daily report showing % of actions completed without errors; target: 90% of actions complete without errors)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2/US3 but should be independently testable
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - May integrate with US4 but should be independently testable
- **User Story 5 (P3, Phase 2)**: Can start after User Story 1 completion - Requires WebSocket infrastructure
- **User Story 7 (P4, Phase 3)**: Can start after User Story 5 completion - Requires complete multiplayer infrastructure and admin tools

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All [P] tasks within a user story can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all [P] tasks for User Story 1 together:
Task: "Implement zoom control in frontend/src/game/map.js"
Task: "Implement pan control in frontend/src/game/map.js"

# Launch all non-[P] tasks sequentially:
Task: "Implement territory selection logic in frontend/src/game/map.js"
Task: "Implement battle initiation in frontend/src/game/battle.js"
Task: "Implement battle outcome calculation in frontend/src/game/battle.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md Scenario 2
5. Deploy/demo if ready

### Incremental Delivery

---

## Completed Work (Session 2 - June 27-28, 2026)

### ✅ Phase 1: Setup - 100% Complete
- [X] T001: Project structure created
- [X] T002: Frontend dependencies installed (`npm install` - 14 packages)
- [X] T003: Backend dependencies installed (`npm install` - 14 packages)
- [X] T004: ESLint configuration (`.eslintrc.js`)
- [X] T005: Environment configuration (`frontend/.env`, `backend/.env.example`)

### ✅ Phase 2: Foundational - 100% Complete
- [X] T006: Database schema (`backend/schema.sql`)
- [X] T007: Database migration script (`scripts/migrate-database.js`)
- [X] T008: Seed data script (`scripts/seed-territories.js`)
- [X] T009-T012: SCF function infrastructure (`_common/db.js`, `redis.js`, `auth.js`, `validator.js`)
- [X] T013: Modular refactoring (GameState.js, map.js, battle.js, resources.js, cards.js, military.js, connections.js, chests.js)
- [X] T014: Backend save/load system (`game-save/index.js`, `game-load/index.js`)
- [X] T015: Silent failure + retry logic (GameState.js)

### ✅ Phase 3: User Story 1 (MVP) - 100% Complete
- [X] T016-T023: Map exploration & territory conquest (zoom, pan, battle, Mars unlock)

### ✅ Additional UI Components Created
- [X] `frontend/src/components/ui/ResourcePanel.js` - Resource display panel
- [X] `frontend/src/components/ui/MilitaryPanel.js` - Military management panel
- [X] `frontend/src/components/ui/BattlePanel.js` - Battle display panel
- [X] `frontend/src/components/GameUI.js` - Main game UI manager
- [X] `frontend/src/styles/game-ui.css` - Game UI styles

### ✅ Additional Backend Functions Created
- [X] `backend/functions/alliance-create/index.js` - Alliance creation
- [X] `backend/functions/alliance-join/index.js` - Alliance joining
- [X] `backend/functions/alliance-leave/index.js` - Alliance leaving
- [X] `backend/functions/alliance-list/index.js` - Alliance listing
- [X] `backend/functions/_common/admin-auth.js` - Admin authentication middleware
- [X] `backend/functions/admin-get-users/index.js` - Admin get users
- [X] `backend/functions/admin-get-stats/index.js` - Admin get statistics

### ✅ Additional Frontend Components Created
- [X] `frontend/src/components/ui/AlliancePanel.js` - Alliance management UI
- [X] `frontend/src/components/ui/CardPanel.js` - Card collection UI

---

**Total Progress**: ~40% complete (29 out of 73 tasks)

**Next Steps**:
1. Complete User Story 2: Battle & Military Management (T024-T029)
2. Complete User Story 3: Resource Management (T030-T037)
3. Complete User Story 4: Card & Gift Pack System (T038-T045)
4. Complete User Story 6: Connection System (T044-T047)
5. Complete User Story 5: Alliance System (T048-T054) - Backend complete, need frontend
6. Complete User Story 7: Admin Dashboard (T055-T064) - Backend started, need frontend
7. Phase 10: Polish (T065-T073)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 6 → Test independently → Deploy/Demo
7. Add User Story 5 (Phase 2) → Test independently → Deploy/Demo
8. Add User Story 7 (Phase 3) → Test independently → Deploy/Demo
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
   - Developer E: User Story 6
3. Stories complete and integrate independently
4. Phase 2 (User Story 5): Requires dedicated developer for WebSocket infrastructure
5. Phase 3 (User Story 7): Requires dedicated developer for weapon system and admin tools

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Phase 1 (User Stories 1-4, 6) is single-player vs AI
- Phase 2 (User Story 5) requires WebSocket infrastructure for real-time communication
- Phase 3 (User Story 7) requires complete multiplayer infrastructure and admin tools

---

## Summary

- **Total task count**: 73 tasks
- **Task count per user story**:
  - US1 (P1): 8 tasks (T016-T023)
  - US2 (P1): 6 tasks (T024-T029)
  - US3 (P1): 8 tasks (T030-T037)
  - US4 (P2): 6 tasks (T038-T043)
  - US6 (P2): 4 tasks (T044-T047)
  - US5 (P3, Phase 2): 7 tasks (T048-T054)
  - US7 (P4, Phase 3): 10 tasks (T055-T064)
  - Cross-cutting: 4 tasks (T065-T067, T070-T073)
- **Parallel opportunities identified**: 21 tasks marked [P] can run in parallel
- **Independent test criteria for each story**: Documented in each Phase section
- **Suggested MVP scope**: User Story 1 only (map exploration and territory conquest)
- **Format validation**: ✅ ALL tasks follow the checklist format (checkbox, ID, labels, file paths)
- **New tasks added**: T071 (performance test for SC-001), T072 (unit tests for SC-003), T073 (analytics tracking for SC-006)

---

**End of Document**
