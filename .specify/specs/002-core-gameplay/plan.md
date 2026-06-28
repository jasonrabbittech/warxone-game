# Implementation Plan: Core Gameplay System / 核心游戏玩法系统实现计划

**Branch**: `feat/core-gameplay-system` | **Date**: 2026-06-27 | **Spec**: `system/spec.md`

**Input**: Feature specification from `/specify/specs/002-core-gameplay/system/spec.md`

---

## Summary

Implement the core gameplay system for WarXone, a multiplayer strategy game featuring map-based territory conquest, card collection, resource management, and alliance systems. The feature includes:

1. **Map System**: Interactive SVG map with zoom/pan, Earth and Mars worlds
2. **Battle System**: Auto-battle with military strength comparison and randomness
3. **Resource Management**: Population (auto-grow), Gold (from chests/gifts), Food (consumed by military), Tokens (from quizzes/battles)
4. **Card System**: City-named cards with 6 rarities, permanent stat additions, infrastructure (airports/train stations/military units)
5. **Connection System**: Air/Train/Military routes between territories (requires infrastructure from cards)
6. **Alliance System** (Phase 2): Player alliances with shared vision and resource sharing
7. **Weapon System** (Phase 3): 4 categories (Sea/Land/Air/Cyber), evolution, trading

**Technical Approach**: Frontend-driven game logic with backend for authentication, data persistence, and multiplayer features. Use SCF serverless functions for API endpoints, TDSQL-C for persistent storage, Redis for ephemeral game state, and WebSocket for real-time features.

---

## Technical Context

**Language/Version**: JavaScript (ES2022+) / Node.js 22.x (SCF runtime)

**Primary Dependencies**:
- Frontend: Vanilla JS + Vite 6.x, GSAP/PixiJS (animation, lazy-loaded)
- Backend: `@cloudbase/node-sdk`, `mysql2`, `jsonwebtoken`, `ws` (WebSocket)
- Database: TDSQL-C Serverless MySQL 8.0
- Cache: Redis (Tencent Cloud)
- Real-Time: Tencent Cloud API Gateway (WebSocket)
- i18n: Custom lightweight i18n module with JSON resources

**Storage**:
- Persistent: TDSQL-C MySQL (`users`, `game_saves`, `cards`, `weapons`, `alliances` tables)
- Ephemeral: Redis (active battles, player sessions, WebSocket connections)
- Fallback: localStorage (client-side game state)

**Testing**:
- Frontend: Manual testing + browser DevTools (Phase 1)
- Backend: SCF CLI emulator + manual API testing
- Future: Automated unit/integration tests (Phase 2+)

**Target Platform**: Web (desktop + mobile via responsive design), deployed to EdgeOne CDN

**Project Type**: Web application (frontend + backend SCF functions)

**Performance Goals**:
- SCF cold start: <3 seconds
- API response time: <500ms (p50)
- Frontend bundle: <500KB gzipped (core), <2MB total (with lazy-loaded chunks)
- MySQL connection acquisition: <100ms
- Redis operation: <50ms
- AI API call timeout: 5 seconds

**Constraints**:
- Serverless-first (no long-running servers)
- Stateless game logic (state in DB/Redis)
- Real-time features require WebSocket infrastructure (Phase 2)
- Frontend responsible for game logic (Phase 1), backend for auth/persistence
- Gold cannot be auto-earned (only from chests/admin gifts)

**Scale/Scope**:
- Initial: Single-player vs AI
- Target: Multiplayer with 100+ concurrent players
- Maps: Earth (~200 territories) + Mars (~100 territories)
- Cards: 1000+ city-named cards across 6 rarities
- Weapons: 100+ weapons across 4 categories

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Serverless-First** | ✅ PASS | Backend uses SCF functions for all API endpoints. Local dev via SCF CLI emulator. Connection pooling in global scope (see research.md Section 1). |
| **II. Edge-First Frontend** | ✅ PASS | Frontend is static SPA (Vite), deployed to EdgeOne CDN with proper cache headers. |
| **III. Stateless Game Logic** | ✅ PASS | Frontend is authoritative source for game state (Clarification Decision 1). Backend only for persistence (every 30 seconds). Game state NOT stored in SCF memory (Constitution Principle III). Redis only for ephemeral state (active battles, player sessions). |
| **IV. Security by Default** | ✅ PASS | JWT validation for all API endpoints (see contracts/api-contracts.md). Input validation via `validator` library. SQL parameterized queries via `mysql2`. Secrets in SCF env vars (see quickstart.md Section 1.3). |
| **V. Multi-Language Support** | ✅ PASS | i18n resource files with lazy loading by language code. Default: English. |
| **VI. AI Integration** | ✅ PASS | AI features (opponent logic, advice) will use secure API integrations with keys in SCF env vars. |
| **VII. Real-Time Communication** | ✅ PASS | Phase 1 is single-player (no real-time needed). Phase 2 will use Tencent Cloud API Gateway (WebSocket) with Redis for connection state (see research.md Section 3). |

**GATE DECISION**: ✅ PASS - All principles passed. All NEEDS CLARIFICATION items resolved (see research.md Section 6). Ready to proceed to implementation.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-core-gameplay/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── main.js                 # Entry point (refactor from 44KB monolith)
│   ├── game/
│   │   ├── GameState.js       # Game state definition
│   │   ├── map.js            # Map rendering, zoom, pan
│   │   ├── battle.js         # Auto-battle logic
│   │   ├── resources.js      # Resource calculation loop
│   │   ├── cards.js         # Card collection + effects
│   │   ├── connections.js   # Connection building + bonuses
│   │   ├── chests.js        # Chest spawning + loot
│   │   ├── military.js       # Military training
│   │   └── weapons.js       # Weapon system (Phase 3)
│   ├── components/             # UI components
│   ├── pages/                  # Page components (quiz, admin)
│   ├── services/               # API services
│   ├── i18n/                  # Internationalization
│   └── styles/                # CSS styles
├── dist/                      # Build output (deploy to EdgeOne)
└── package.json

backend/
├── functions/                 # SCF functions
│   ├── auth-login/
│   ├── auth-register/
│   ├── game-save/
│   ├── game-load/
│   ├── quiz-get/
│   ├── quiz-submit/
│   ├── card-purchase/
│   ├── alliance-create/       # Phase 2
│   ├── alliance-accept/       # Phase 2
│   ├── weapon-release/        # Phase 3 (admin)
│   └── weapon-trade/         # Phase 3
├── schema.sql                 # Database schema
└── package.json

scripts/
├── deploy-frontend.sh         # Deploy to EdgeOne
├── deploy-backend.sh          # Deploy SCF functions
└── seed-cards.js             # Seed card database
```

**Structure Decision**: Web application with separate frontend (Vite SPA) and backend (SCF functions). Frontend drives game logic in Phase 1, backend handles auth, persistence, and multiplayer features in Phase 2+.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|-------------|--------------------------------------|
| Redis for ephemeral state | Active battle state, player sessions need fast access | Direct DB access would exceed 500ms API response goal |
| WebSocket (Phase 2) | Real-time alliance chat, battle notifications | Polling would waste resources and increase latency |
| Multiple SCF functions | Each API endpoint independent (serverless-first) | Monolithic function would increase cold start time |

---

## Research Tasks (Phase 0)

### 1. SCF Database Connection Pooling
**Unknown**: How to implement MySQL connection pooling in SCF global scope for TDSQL-C Serverless.
**Research Task**: Research best practices for `mysql2` connection pooling in SCF functions, including handling cold starts and connection reuse.

### 2. Redis Integration with SCF
**Unknown**: How to integrate Tencent Cloud Redis with SCF functions for ephemeral game state.
**Research Task**: Find Tencent Cloud Redis client libraries and patterns for SCF integration. Research connection management and error handling.

### 3. WebSocket with Tencent Cloud API Gateway
**Unknown**: How to implement WebSocket-based real-time communication using Tencent Cloud API Gateway.
**Research Task**: Research Tencent Cloud API Gateway WebSocket support, including connection management, message routing, and integration with SCF functions.

### 4. Frontend Game State Management
**Unknown**: Best practices for managing complex game state in vanilla JS without a framework.
**Research Task**: Research patterns for state management in vanilla JS applications, including event-driven updates and state persistence.

### 5. SVG Map Interaction Optimization
**Unknown**: How to optimize SVG map rendering for 200+ territories with smooth zoom/pan.
**Research Task**: Research SVG performance optimization techniques, including viewBox manipulation, layer caching, and touch event handling.

---

## Design Tasks (Phase 1)

### 1. Data Model
**Deliverable**: `data-model.md`
**Entities**: Territory, PlayerState, Card, Connection, Alliance (Phase 2), Weapon (Phase 3), Chest
**Tasks**:
- Define entity fields and relationships
- Define validation rules from requirements
- Define state transitions (if applicable)

### 2. Interface Contracts
**Deliverable**: `contracts/` directory
**Interfaces**: REST API endpoints for game operations, WebSocket message format (Phase 2)
**Tasks**:
- Define API endpoints for auth, game save/load, card purchase, etc.
- Define request/response schemas
- Define error codes and messages

### 3. Quickstart Validation Guide
**Deliverable**: `quickstart.md`
**Tasks**:
- Document runnable validation scenarios
- Include prerequisites, setup commands, test commands
- Reference contracts and data model (no duplication)

### 4. Agent Context Update
**Tasks**:
- Update CODEBUDDY.md to point to this plan file
- Ensure AI agent can reference plan during implementation

---

## Implementation Phases

### Phase 1: Single-Player Core Gameplay (Est. 19 hours)
1. Military Training System (2h)
2. Resource Management System (3h)
3. Chest System (3h)
4. Card Effects System (4h)
5. Connection System (3h)
6. Front Line Display (2h)
7. Testing (2h)

### Phase 2: Multiplayer + Alliances (Est. TBD)
- WebSocket infrastructure
- Alliance system
- PvP battles
- Chat system

### Phase 3: Weapon System + Economy (Est. 20+ hours)
- Weapon categories + types
- Weapon evolution
- Weapon trading
- Admin panel for weapon release

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| SCF cold start >3s | Minimize initialization code, use global scope for DB connections |
| Game state complexity | Refactor `main.js` into separate modules early |
| SVG performance | Use viewBox manipulation, avoid DOM updates during zoom/pan |
| Redis/WebSocket cost | Use free tier for initial testing, monitor usage |
| Multiplayer complexity | Phase 1 is single-player, add multiplayer in Phase 2 |

---

## Success Metrics

- [ ] Player can conquer 10 territories in <30 minutes (SC-001)
- [ ] Battle outcome determined within 3 seconds (SC-002)
- [ ] Resource display updates in real-time without degradation (SC-003)
- [ ] Card effects applied correctly (SC-004)
- [ ] Game state saves successfully every 30 seconds (SC-005)
- [ ] Earth/Mars world switch works seamlessly (SC-006)
- [ ] 90% gameplay actions complete without errors (SC-007)
- [ ] Weapon system allows attack/defense types (SC-008, Phase 3)
- [ ] Players can obtain weapons from card packs (SC-009, Phase 3)

---
