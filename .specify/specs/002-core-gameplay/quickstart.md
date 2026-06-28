# Quickstart Guide: Core Gameplay System / 核心游戏玩法系统快速开始指南

**Date / 日期**: 2026-06-27
**Feature / 功能**: 002-core-gameplay
**Estimated Time / 预计时间**: 30 minutes

---

## 1. Prerequisites / 先决条件

### 1.1 Software Requirements / 软件要求

- **Node.js**: 22.x 或更高版本
- **npm**: 10.x 或更高版本
- **Git**: 最新版本
- **腾讯云账号**: 用于部署 SCF 函数和 TDSQL-C 数据库
- **EdgeOne CDN 账号**: 用于部署前端（可选，可本地测试）

### 1.2 Account Setup / 账户设置

1. 注册腾讯云账号：https://cloud.tencent.com/register
2. 创建 TDSQL-C Serverless MySQL 实例（选择 `ap-beijing-3` 可用区）
3. 创建腾讯云 Redis 实例（选择同一 VPC）
4. 获取 SCF 函数部署权限（API 密钥）

### 1.3 Environment Variables / 环境变量

创建 `backend/.env` 文件：

```bash
# Database / 数据库
DB_HOST=your-tdsqlc-host.rds.tencentcdb.com
DB_PORT=3306
DB_DATABASE=warxone_game
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis / Redis
REDIS_HOST=your-redis-host.redis.tencentcloud.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT / JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=7d

# Admin / 管理员
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password_here
ADMIN_EMAIL=admin@warxone.com
```

---

## 2. Setup Commands / 设置命令

### 2.1 Clone Repository / 克隆仓库

```bash
git clone https://github.com/your-org/warxone-game.git
cd warxone-game
git checkout feat/core-gameplay-system
```

### 2.2 Install Dependencies / 安装依赖

**Frontend / 前端**:
```bash
cd frontend
npm install
cd ..
```

**Backend / 后端**:
```bash
cd backend
npm install
cd ..
```

### 2.3 Deploy Backend (SCF Functions) / 部署后端（SCF 函数）

```bash
cd backend
# 部署所有 SCF 函数
npm run deploy:all
cd ..
```

**Note / 注意**: 首次部署需要配置 SCF CLI：
```bash
tccli configure set secretId YOUR_SECRET_ID
tccli configure set secretKey YOUR_SECRET_KEY
tccli configure set region ap-beijing
```

### 2.4 Deploy Frontend (EdgeOne CDN) / 部署前端（EdgeOne CDN）

```bash
cd frontend
npm run build
npm run deploy:edgeone
cd ..
```

**Or run frontend locally / 或本地运行前端**:
```bash
cd frontend
npm run dev  # 启动开发服务器（http://localhost:5173）
```

### 2.5 Seed Database / 种子数据库

```bash
cd scripts
node seed-cards.js  # 种子卡牌数据
node seed-territories.js  # 种子领土数据（可选）
cd ..
```

---

## 3. Validation Scenarios / 验证场景

### Scenario 1: User Registration and Login / 场景 1：用户注册和登录

**Objective / 目标**: 验证用户认证功能正常工作。

**Steps / 步骤**:

1. 打开前端应用（本地：`http://localhost:5173`，或部署 URL）
2. 点击"注册"按钮
3. 输入用户名、密码、邮箱
4. 点击"提交"
5. **Expected / 预期**: 注册成功，自动登录，跳转到地图界面
6. 注销
7. 点击"登录"按钮
8. 输入用户名和密码
9. 点击"提交"
10. **Expected / 预期**: 登录成功，跳转到地图界面

**API Validation / API 验证**（可选）:
```bash
# 注册
curl -X POST https://your-api-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123","email":"test@example.com"}'

# 登录
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

---

### Scenario 2: Map Exploration and Territory Conquest / 场景 2：地图探索和领土征服

**Objective / 目标**: 验证地图交互和战斗系统正常工作。

**Steps / 步骤**:

1. 登录后，查看地图界面
2. **验证缩放**: 滚动鼠标滚轮向上（放大），向下（缩小）
3. **验证平移**: 拖动地图
4. **验证领土选择**: 点击一个领土（应该是相邻的）
5. **验证战斗**: 点击"攻击"按钮
6. **Expected / 预期**: 战斗自动进行，3 秒内显示结果
7. **验证领土征服**: 如果战斗胜利，领土添加到玩家的拥有领土列表
8. **验证资源奖励**: 征服领土后，+1 代币

---

### Scenario 3: Military Training / 场景 3：军事训练

**Objective / 目标**: 验证军事训练系统正常工作。

**Steps / 步骤**:

1. 登录后，查看资源面板（应该有 1000 人口，10 代币）
2. 点击"训练军事"按钮
3. **Expected / 预期**: 军事力量 +10，人口 -1000，代币 -5
4. 重复训练多次
5. **验证战斗影响**: 攻击领土，验证军事力量影响战斗胜率

---

### Scenario 4: Resource Management / 场景 4：资源管理

**Objective / 目标**: 验证资源管理系统正常工作。

**Steps / 步骤**:

1. 登录后，等待 10 秒
2. **验证人口增长**: 人口应该自动增长（每领土 100 人口/10 秒）
3. **验证食物消耗**: 训练军事单位后，食物应该逐渐消耗
4. **验证饥饿惩罚**: 如果食物 = 0，军事力量应该每分钟减少 10%
5. **验证金币获取**: 打开宝箱（在领土中随机生成），可能获得金币

---

### Scenario 5: Card Purchase and Collection / 场景 5：卡牌购买和收集

**Objective / 目标**: 验证卡牌系统正常工作。

**Steps / 步骤**:

1. 登录后，确保有 ≥ 5 代币
2. 点击"卡牌商店"
3. 点击"购买卡包"（消耗 5 代币）
4. **Expected / 预期**: 收到一张随机卡牌（以城市命名）
5. **验证卡牌效果**: 卡牌's population, military, gold, food 应该永久添加到玩家总计
6. **验证卡牌收集**: 卡牌添加到 `cardCollection` 数组（不会移除）
7. **验证基础设施**: 卡牌's airports, trainStations, militaryUnits 应该添加到玩家's `infrastructure`

---

### Scenario 6: Connection Building / 场景 6：连接建设

**Objective / 目标**: 验证连接系统正常工作。

**Steps / 步骤**:

1. 征服至少 2 个相邻领土
2. 收集具有机场/火车站/军事单位的卡牌
3. 点击"建设连接"
4. 选择两个相邻领土
5. 选择连接类型（航空/火车/军事）
6. **Expected / 预期**: 连接建立，消耗 100 金币
7. **验证连接奖励**: 连接提供资源奖励（例如，航空路线提高航空运输效率）

---

### Scenario 7: Game Save and Load / 场景 7：游戏保存和加载

**Objective / 目标**: 验证保存/加载系统正常工作。

**Steps / 步骤**:

1. 玩游戏一段时间后（征服领土，训练军事，购买卡牌）
2. 等待 30 秒（自动保存）
3. **Expected / 预期**: 游戏状态保存到后端（检查浏览器控制台日志）
4. 刷新页面
5. **Expected / 预期**: 游戏状态从云端加载，恢复之前的进度
6. **验证本地后备**: 如果后端不可用，游戏状态应该从 localStorage 加载

---

## 4. Expected Outcomes / 预期结果

### 4.1 Success Criteria Validation / 成功标准验证

| Success Criteria / 成功标准 | Validation Method / 验证方法 | Status / 状态 |
|------------------------------|----------------------------|----------|
| SC-001: Battle outcome within 3s / 战斗结果在 3 秒内 | 手动测试：攻击领土，计时 | ✅ PASS |
| SC-002: Resource display real-time / 资源显示实时 | 浏览器 DevTools：检查 UI 更新 | ✅ PASS |
| SC-003: Card effects correct / 卡牌效果正确 | 单元测试：验证卡牌获取逻辑 | ✅ PASS |
| SC-004: Game state saves every 30s / 游戏状态每 30 秒保存 | 控制台日志：检查保存时间戳 | ✅ PASS |
| SC-005: Earth/Mars switch / 地球/火星切换 | 手动测试：征服 90% 地球领土 | ⏳ Pending |
| SC-006: 90% actions error-free / 90% 操作无错误 | 分析报告：跟踪错误率 | ⏳ Pending |

---

## 5. Troubleshooting / 故障排除

### 5.1 Backend Deployment Fails / 后端部署失败

**Problem / 问题**: SCF 函数部署失败。

**Solution / 解决方案**:
- 检查 `tccli` 配置：`tccli configure list`
- 检查环境变量：`cat backend/.env`
- 查看部署日志：`tccli scf InvokeFunction --FunctionName your-function-name`

### 5.2 Frontend Cannot Connect to Backend / 前端无法连接到后端

**Problem / 问题**: API 请求失败（CORS 错误或网络错误）。

**Solution / 解决方案**:
- 检查后端 URL：`cat frontend/.env`
- 检查 CORS 配置：确保 SCF 函数返回正确的 CORS headers
- 使用浏览器 DevTools Network 标签调试

### 5.3 Game State Not Saving / 游戏状态未保存

**Problem / 问题**: 游戏状态未保存到后端。

**Solution / 解决方案**:
- 检查 JWT token：`localStorage.getItem('token')`
- 检查网络连接
- 查看浏览器控制台错误
- 验证后端 `/api/game/save` 端点正常工作

---

## 6. Next Steps / 下一步

完成验证场景后：

1. **修复错误**: 如果任何验证场景失败，修复错误并重新测试
2. **优化性能**: 如果游戏运行缓慢，优化 SVG 渲染和状态管理
3. **添加功能**: 实现 Phase 2 功能（多人游戏、联盟系统）
4. **部署生产**: 部署到生产环境（EdgeOne CDN + SCF 函数）

---

**End of Document / 文档结束**
