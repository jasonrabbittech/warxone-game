<!--
SYNC IMPACT REPORT
Version change: 1.1.0 → 1.2.0 (MINOR: added AI/real-time principles, updated tech stack, relaxed constraints)
Modified principles: Principle I (added real-time exception), Principle III (allowed in-memory cache for game state), Performance Constraints (relaxed bundle size)
Added sections: Principle VI (AI Integration), Principle VII (Real-Time Communication), new tech stack items
Removed sections: None
Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check section exists, needs no update)
  - ✅ .specify/templates/spec-template.md (aligned with constitution)
  - ⚠ .specify/templates/tasks-template.md (not present, skipped)
TODOs: Ratification date is unknown, marked as TODO.
-->

# WarXOne Constitution / WarXOne 项目宪法

## Core Principles / 核心原则

### I. Serverless-First (NON-NEGOTIABLE) / I. 无服务器优先（不可协商）

**EN**: All backend logic MUST run on Tencent Cloud SCF (Serverless Cloud Function). No long-running servers or containers are permitted. Each API endpoint MUST be implemented as an independent SCF function. Local development MUST use SCF CLI emulator to match production behavior. Cold start optimization is MANDATORY: keep initialization code minimal, reuse database connections via global scope. **Real-time multiplayer features MAY use Tencent Cloud API Gateway with WebSocket support or other managed real-time services. SCF remains the primary compute platform for non-real-time logic.**

**中文**: 所有后端逻辑必须运行在腾讯云 SCF（Serverless Cloud Function）上。不允许使用长时间运行的服务器或容器。每个 API 端点必须实现为独立的 SCF 函数。本地开发必须使用 SCF CLI 模拟器以匹配生产行为。冷启动优化是强制性的：保持初始化代码最小化，通过全局作用域复用数据库连接。**实时多人功能可以使用腾讯云 API 网关（支持 WebSocket）或其他托管的实时服务。SCF 仍然是非实时逻辑的主要计算平台。**

---

### II. Edge-First Frontend Delivery / II. 边缘优先的前端交付

**EN**: All frontend assets MUST be deployed to EdgeOne CDN. No direct-to-user server rendering is allowed. The frontend MUST be a static SPA built with Vite. Cache headers MUST be configured for `/assets/*` with `max-age=31536000`. Index file MUST NOT be cached to allow immediate deployment of new versions. All API calls MUST go through EdgeOne origin pull or direct SCF Gateway URLs.

**中文**: 所有前端资源必须部署到 EdgeOne CDN。不允许直接向用户提供服务器端渲染。前端必须是使用 Vite 构建的静态 SPA。必须为 `/assets/*` 配置缓存头，设置 `max-age=31536000`。索引文件不得缓存，以便立即部署新版本。所有 API 调用必须通过 EdgeOne 回源或直接的 SCF Gateway URL。

---

### III. Stateless Game Logic / III. 无状态游戏逻辑

**EN**: Game state MUST NOT be stored in SCF function memory. All persistent state MUST persist in TDSQL-C Serverless MySQL. **Ephemeral game state (e.g., active battles, player sessions) MAY use in-memory caches (Redis) for performance.** Session state MUST use JWT tokens with server-side validation. Connection pooling to MySQL MUST be implemented via persistent connections in SCF global scope.

**中文**: 游戏状态不得存储在 SCF 函数内存中。所有持久状态必须持久化在 TDSQL-C Serverless MySQL 中。**临时游戏状态（如活跃对战、玩家会话）可以使用内存缓存（Redis）以提高性能。** 会话状态必须使用 JWT 令牌并进行服务器端验证。必须通过 SCF 全局作用域中的持久连接实现 MySQL 连接池。

---

### IV. Security by Default / IV. 默认安全

**EN**: All API endpoints MUST validate JWT tokens. No anonymous access to game logic is permitted. Input validation MUST be applied to all `req.body` and `req.query` parameters. SQL queries MUST use parameterized statements via `mysql2` prepared statements. CORS MUST be explicitly configured for allowed origins only. Secrets (JWT secret, DB password, AI API keys) MUST be stored in SCF environment variables, never in code.

**中文**: 所有 API 端点必须验证 JWT 令牌。不允许匿名访问游戏逻辑。必须对所有 `req.body` 和 `req.query` 参数进行输入验证。SQL 查询必须使用通过 `mysql2` 预处理语句的参数化语句。CORS 必须仅为允许的源显式配置。密钥（JWT 密钥、数据库密码、AI API 密钥）必须存储在 SCF 环境变量中，绝不能在代码中。

---

### V. Multi-Language Support (i18n) / V. 多语言支持 (i18n)

**EN**: All user-facing text MUST be externalized to i18n resource files. No hardcoded strings in components. Default language is English (`en`). Language detection MUST use `navigator.language` with manual override via settings. Translation files MUST be loaded lazily by language code.

**中文**: 所有面向用户的文本必须外部化到 i18n 资源文件中。组件中不得有硬编码字符串。默认语言是英语（`en`）。语言检测必须使用 `navigator.language`，并允许通过设置手动覆盖。翻译文件必须按语言代码延迟加载。

---

### VI. AI Integration (AI 集成)

**EN**: AI features (opponent logic, story generation, advice) MUST use secure API integrations. API keys MUST be stored in SCF environment variables. AI-generated content MUST be validated before display. Rate limiting MUST be applied to AI API calls. AI services MAY be external (OpenAI, etc.) or internal (Tencent Cloud AI). All AI interactions MUST be logged for debugging and audit.

**中文**: AI 功能（对手逻辑、故事生成、建议）必须使用安全的 API 集成。API 密钥必须存储在 SCF 环境变量中。AI 生成的内容在显示前必须经过验证。必须对 AI API 调用应用速率限制。AI 服务可以是外部的（OpenAI 等）或内部的（腾讯云 AI）。所有 AI 交互必须记录日志以进行调试和审计。

---

### VII. Real-Time Communication (实时通信)

**EN**: Real-time features (multiplayer, chat) MUST use managed WebSocket services (e.g., Tencent Cloud API Gateway). Connection state MUST be stored externally (not in SCF memory), preferably in Redis. Message validation MUST be applied to all real-time messages. Real-time messages MUST be encrypted in transit (WSS). Room/hall management for multiplayer games MUST be implemented as SCF functions.

**中文**: 实时功能（多人游戏、聊天）必须使用托管的 WebSocket 服务（如腾讯云 API 网关）。连接状态必须外部存储（不在 SCF 内存中），最好存储在 Redis 中。必须对所有实时消息进行消息验证。实时消息在传输过程中必须加密（WSS）。多人游戏的房间/大厅管理必须实现为 SCF 函数。

---

## Technical Standards / 技术标准

### Technology Stack / 技术栈

| Item / 项目 | Description / 描述 |
|-------------|-------------------|
| **Frontend** | Vanilla JS + Vite 6.x, deployed to EdgeOne |
| **前端** | 原生 JS + Vite 6.x，部署到 EdgeOne |
| **Backend** | Node.js 22.x SCF functions, `mysql2` for DB access |
| **后端** | Node.js 22.x SCF 函数，使用 `mysql2` 访问数据库 |
| **Database** | TDSQL-C Serverless MySQL 8.0 |
| **数据库** | TDSQL-C Serverless MySQL 8.0 |
| **In-Memory Cache** | Redis for ephemeral game state (active battles, sessions) |
| **内存缓存** | Redis，用于临时游戏状态（活跃对战、会话） |
| **Real-Time Communication** | Tencent Cloud API Gateway (WebSocket) or managed pub/sub service |
| **实时通信** | 腾讯云 API 网关 (WebSocket) 或托管发布/订阅服务 |
| **Authentication** | JWT (HS256), 24h expiry |
| **认证** | JWT (HS256)，24小时过期 |
| **API Style** | REST for standard operations, WebSocket for real-time features |
| **API 风格** | REST 用于标准操作，WebSocket 用于实时功能 |
| **AI Services** | Tencent Cloud AI or external AI APIs (OpenAI, etc.) with secure key management |
| **AI 服务** | 腾讯云 AI 或外部 AI API（OpenAI 等），安全密钥管理 |
| **Animation** | Lightweight animation library (e.g., GSAP, PixiJS) loaded lazily |
| **动画** | 轻量级动画库（如 GSAP、PixiJS），延迟加载 |
| **i18n** | Custom lightweight i18n module, JSON resource files |
| **国际化** | 自定义轻量级 i18n 模块，JSON 资源文件 |

---

### Code Quality Rules / 代码质量规则

**EN**:
- No `any` type in JavaScript (use JSDoc `@type` instead).
- All SCF functions MUST export `handler` with signature `(event, context) => Promise<Response>`.
- All DB queries MUST use `mysql2` prepared statements, no string interpolation.
- Frontend MUST use ES Modules (`type: "module"`), no CommonJS.
- All user input MUST be sanitized before rendering (no XSS).
- All AI API responses MUST be validated before use.
- All real-time messages MUST be validated before processing.

**中文**:
- JavaScript 中不允许使用 `any` 类型（改用 JSDoc `@type`）。
- 所有 SCF 函数必须导出 `handler`，签名为 `(event, context) => Promise<Response>`。
- 所有数据库查询必须使用 `mysql2` 预处理语句，不允许字符串插值。
- 前端必须使用 ES 模块（`type: "module"`），不允许使用 CommonJS。
- 所有用户输入必须在渲染前进行清理（防止 XSS）。
- 所有 AI API 响应在使用前必须经过验证。
- 所有实时消息在处理前必须经过验证。

---

### Performance Constraints / 性能约束

**EN**:
- SCF cold start MUST complete within 3 seconds.
- API response time MUST be under 500ms (p50).
- Frontend bundle size MUST NOT exceed 500KB gzipped **for core bundle**. Additional feature chunks (animations, AI interaction) MUST be loaded lazily and not exceed 2MB total.
- MySQL connection acquisition MUST complete within 100ms.
- Redis operation MUST complete within 50ms.
- AI API call timeout MUST be set to 5 seconds.

**中文**:
- SCF 冷启动必须在 3 秒内完成。
- API 响应时间必须在 500ms 以内（p50）。
- 前端打包大小**核心包**不得超过 500KB（gzipped）。额外的功能块（动画、AI 交互）必须延迟加载，总大小不得超过 2MB。
- MySQL 连接获取必须在 100ms 内完成。
- Redis 操作必须在 50ms 内完成。
- AI API 调用超时必须设置为 5 秒。

---

## Development Workflow / 开发工作流

### Branch Strategy / 分支策略

**EN**:
- `main`: Production-ready code only, protected branch.
- `feat/[feature-name]`: Feature branches, merged via PR.
- `fix/[issue-description]`: Bugfix branches.
- `ai/[feature-name]`: AI-related feature branches (e.g., `ai/story-generation`).

**中文**:
- `main`：仅包含生产就绪代码，受保护分支。
- `feat/[feature-name]`：功能分支，通过 PR 合并。
- `fix/[issue-description]`：Bug 修复分支。
- `ai/[feature-name]`：AI 相关功能分支（如 `ai/story-generation`）。

---

### Local Development / 本地开发

**EN**:
1. Frontend: `cd frontend && npm run dev` (Vite dev server on port 5173).
2. Backend: Use SCF CLI emulator or deploy to SCF for testing.
3. Database: Use TDSQL-C Serverless instance (no local MySQL).
4. Redis: Use Tencent Cloud Redis instance or local Redis for testing.
5. AI Services: Use mock AI responses or test API keys.

**中文**:
1. 前端：`cd frontend && npm run dev`（Vite 开发服务器，端口 5173）。
2. 后端：使用 SCF CLI 模拟器或部署到 SCF 进行测试。
3. 数据库：使用 TDSQL-C Serverless 实例（无本地 MySQL）。
4. Redis：使用腾讯云 Redis 实例或本地 Redis 进行测试。
5. AI 服务：使用模拟 AI 响应或测试 API 密钥。

---

### Deployment / 部署

**EN**:
1. Frontend: `cd frontend && npm run build`, then deploy `dist/` to EdgeOne.
2. Backend: Deploy SCF functions via Tencent Cloud CLI or console.
3. Database: Schema changes MUST be applied via migration scripts in `backend/schema.sql`.
4. Redis: Configure via Tencent Cloud console, use environment variables for connection info.
5. AI Services: Configure API keys via SCF environment variables.

**中文**:
1. 前端：`cd frontend && npm run build`，然后将 `dist/` 部署到 EdgeOne。
2. 后端：通过腾讯云 CLI 或控制台部署 SCF 函数。
3. 数据库：架构更改必须通过 `backend/schema.sql` 中的迁移脚本应用。
4. Redis：通过腾讯云控制台配置，使用环境变量存储连接信息。
5. AI 服务：通过 SCF 环境变量配置 API 密钥。

---

## Governance / 治理

**EN**: This constitution supersedes all ad-hoc development practices. Any PR that violates these principles MUST be rejected. Exceptions require a written amendment proposal with justification. AI-generated content and real-time communication features are subject to additional security review.

**中文**: 本宪法取代所有临时开发实践。任何违反这些原则的 PR 必须被拒绝。例外情况需要书面修改提案并附上理由。AI 生成的内容和实时通信功能需要额外的安全审查。

---

**Version / 版本**: 1.2.0 | **Ratified / 批准日期**: TODO(RATIFICATION_DATE): Set this date when the constitution is formally approved by the team. / 团队正式批准宪法时设置此日期。 | **Last Amended / 最后修改**: 2026-06-27
