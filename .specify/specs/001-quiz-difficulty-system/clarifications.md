# Clarification Questions: Quiz Difficulty System / Quiz 难度系统澄清问题

**Date**: 2026-06-27
**Feature**: [spec.md](../spec.md)
**Status**: ✅ All answered (2026-06-27)

---

## 🔴 Critical Contradictions (严重矛盾 - 已澄清)

### Question 1: Can token balance go negative? / 代币余额可以变为负数吗？

**Context / 上下文**:
- **User Story 2, Acceptance Scenario 3** (line 45): "total tokens = -5 tokens (player loses tokens)" → implies **allowed**
- **Edge Case #1** (line 149): "Token balance cannot go below 0" → says **NOT allowed**
- **FR-010** (line 177): "prevent token balance from going below 0" → says **NOT allowed**
- **Assumption #9** (line 221): "balance is set to 0 (no negative balance allowed)" → says **NOT allowed**

**Answer / 答案**:
✅ **Allow negative balance (Option A)**. Token balance CAN go negative. If player has 3 tokens and gets -5 penalty, balance becomes -2. Player can continue playing and earn tokens to bring balance back to positive.

✅ **允许负数余额**。代币余额可以低于 0。如果玩家有 3 代币但受到 -5 惩罚，余额变成 -2。玩家可以继续游戏并赚取代币使余额回到正数。

---

## 🟡 Ambiguous Mechanisms (模糊机制 - 已澄清)

### Question 2: How does backend enforce time limit? / 后端如何强制执行时间限制？

**Context / 上下文**:
- **FR-012** (lines 179-185): Backend MUST enforce time limit.
- **Assumption #7** (line 219): "Backend enforces time limit (to prevent cheating via modified frontend)."
- **Edge Case #7** (line 155): "Backend enforces time limit. If backend records answer after time limit, answer is rejected."

**Answer / 答案**:
✅ **Frontend-only enforcement (Option A modified)**. Frontend displays timer and auto-submits answer when time expires. Backend does NOT validate time (simplified implementation). This is acceptable because the primary goal is to discourage (not fully prevent) AI assistance.

✅ **仅前端判定**。前端显示计时器，时间到后自动提交答案。后端不校验时间（简化实现）。这是可接受的，因为主要目标是劝阻（而非完全防止）借助 AI 答题。

---

### Question 3: Daily limit check: `started_at` or `completed_at`? / 每日限制检查：使用 `started_at` 还是 `completed_at`？

**Context / 上下文**:
- **FR-011** (line 178): "check `quiz_attempts` table for any attempt with `completed_at` on the current day"
- **Edge Case #5** (line 153): "Quiz counts for the day it was started."
- **Key Entities** (line 192): `started_at` description says "used to enforce daily limit based on Hong Kong time"

**Answer / 答案**:
✅ **Use `started_at` (Option A)**. Quiz counts for the day it was started. If player starts quiz at 23:59 Hong Kong time, it counts for that day. Player cannot start another quiz until next day (even if completed after 00:00).

✅ **使用 `started_at`（选项 A）**。答题算开始那天。如果玩家在香港时间 23:59 开始答题，算那一天。玩家第二天才能开始新的答题（即使完成时间在 00:00 之后）。

---

### Question 4: Does disconnected quiz count as "completed"? / 断线的答题是否算"已完成"？

**Context / 上下文**:
- **Edge Case #3** (line 151): "Progress is lost. Player can retry quiz tomorrow if they haven't completed today's quiz."
- **User Story 8, Acceptance Scenario 2** (line 141): "player has already completed a quiz today"

**Answer / 答案**:
✅ **Does NOT count as "completed" + reconnect support**. If player disconnects mid-quiz, the session is NOT marked as "completed" for daily limit purposes. Player can reconnect and resume current question. Timer continues from remaining time before disconnection.

✅ **不算"已完成" + 支持重连**。如果玩家中途断线，该会话不计入每日限制的"已完成"。玩家可以重连并继续当前题目。计时器按断线前剩余时间继续。

---

## 🟢 Missing Details (缺少细节 - 已澄清)

### Question 5: What details to show on results page? / 结果页面应该显示哪些详细信息？

**Context / 上下文**:
- **User Story 1, Acceptance Scenario 5** (line 29): "total tokens earned = number of correct answers × 1"
- No details on what else to show

**Answer / 答案**:
✅ **Summary + Drilldown (Option C)**. Show summary (total score, correct/total, total tokens earned/deducted) + collapsible "View Details" button to view per-question breakdown (question text, player's answer, correct answer, explanation, tokens earned/deducted for each question).

✅ **摘要 + 可展开详情（选项 C）**。显示摘要（总分、正确/总数、总赚取/扣除代币）+ 可折叠的"查看详情"按钮，查看每题详细信息（题目文本、玩家答案、正确答案、解释、每题赚取/扣除的代币）。

---

### Question 6: Where is player level stored? / 玩家等级存储在哪里？

**Context / 上下文**:
- **FR-004, FR-005**: Mention "player level"
- **Assumption #1**: "Player level is stored in game state (users table or game_saves table)"

**Answer / 答案**:
✅ **`users` table (Option A)**. Player level is stored in `users` table as a global attribute (not per-game-save). Column name: `level`.

✅ **`users` 表（选项 A）**。玩家等级作为全局属性存储在 `users` 表中（不是每个游戏存档独立）。列名：`level`。

---

### Question 7: Do we need bulk import for questions? / 是否需要批量导入问题？

**Context / 上下文**:
- **FR-006**: Admin can create questions (single)
- No mention of bulk import

**Answer / 答案**:
✅ **Include bulk import in MVP (Option B)**. Admin dashboard MUST support CSV upload for bulk question import. This is essential for efficient content management.

✅ **MVP 包含批量导入（选项 B）**。管理员后台必须支持 CSV 上传批量导入题目。这对高效的内容管理至关重要。

---

### Question 8: Track question creator/editor? / 跟踪问题创建者/编辑者？

**Context / 上下文**:
- **FR-006**: Admin can create/edit/delete questions
- No mention of audit trail for who created/edited questions

**Answer / 答案**:
✅ **Yes, add audit fields (Option A)**. `quiz_questions` table MUST include `created_by` and `updated_by` fields (admin user ID) for audit purposes. This aligns with admin dashboard audit requirements.

✅ **是，添加审计字段（选项 A）**。`quiz_questions` 表必须包含 `created_by` 和 `updated_by` 字段（管理员用户 ID）以进行审计。这符合管理员仪表板审计要求。

---

## Summary of Answers / 答案汇总

| # | Question | Answer |
|---|---------|--------|
| 1 | Token balance can go negative? | ✅ Yes (allow negative) |
| 2 | Backend enforce time limit? | ✅ No (frontend-only) |
| 3 | Daily limit check field? | ✅ `started_at` |
| 4 | Disconnected quiz = completed? | ✅ No + reconnect support |
| 5 | Results page details? | ✅ Summary + drilldown |
| 6 | Player level storage? | ✅ `users` table |
| 7 | Bulk import in MVP? | ✅ Yes (CSV upload) |
| 8 | Track creator/editor? | ✅ Yes (audit fields) |

---

## Next Steps / 下一步

- [x] All clarification questions answered
- [x] `spec.md` updated with clarified requirements
- [ ] `plan.md` updated to reflect clarified requirements
- [ ] Implementation can proceed with clear requirements

**Status / 状态**: ✅ All answered (2026-06-27)
