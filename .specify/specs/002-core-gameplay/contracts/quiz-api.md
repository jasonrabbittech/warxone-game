# API Contract: Quiz System / 问答系统 API 接口

**Version**: 1.0.0 | **Date**: 2026-06-27 | **Phase**: 1 (Design)

---

## Overview

Quiz system endpoints for fetching questions and submitting answers. Quizzes reward tokens. Requires JWT authentication.

**Base URL**: `https://api.warxone.com/quiz`

**Authentication**: All endpoints require `Authorization: Bearer {JWT}` header.

---

## Endpoints

### 1. GET /quiz/questions

**Description**: Get quiz questions (filtered by difficulty).

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `difficulty` | string | No | Filter by difficulty ('easy', 'medium', 'hard') |
| `limit` | number | No | Max questions (default 10) |
| `category` | string | No | Filter by category (optional) |

**Request Headers**:
```
Authorization: Bearer {JWT}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "string (UUID)",
        "question": "string",
        "options": ["string"],
        "difficulty": "string (enum)",
        "category": "string",
        "timeLimit": "number (seconds)"
      }
    ],
    "totalTokens": "number (total tokens for completing all)"
  },
  "message": "Questions retrieved successfully"
}
```

**Notes**: Correct answers are NOT included in the response (prevent cheating).

**SCF Function**: `quiz-get`

---

### 2. POST /quiz/submit

**Description**: Submit quiz answers and receive token rewards.

**Request**:
```json
{
  "answers": [
    {
      "questionId": "string (UUID)",
      "selectedOption": "number (0-indexed)",
      "timeTaken": "number (seconds)"
    }
  ]
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "questionId": "string (UUID)",
        "correct": "boolean",
        "tokensEarned": "number"
      }
    ],
    "totalCorrect": "number",
    "totalTokens": "number",
    "userTokens": "number (updated balance)"
  },
  "message": "Quiz submitted successfully"
}
```

**Response** (Error 400):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ANSWERS",
    "message": "Invalid answer format or question ID not found"
  }
}
```

**SCF Function**: `quiz-submit`

---

### 3. GET /quiz/history

**Description**: Get user's quiz history (optional, for stats).

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max records (default 20) |
| `offset` | number | No | Pagination offset |

**Request Headers**:
```
Authorization: Bearer {JWT}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "string (UUID)",
        "difficulty": "string",
        "totalQuestions": "number",
        "correctAnswers": "number",
        "tokensEarned": "number",
        "completedAt": "string (ISO 8601)"
      }
    ],
    "total": "number"
  },
  "message": "History retrieved successfully"
}
```

**SCF Function**: `quiz-history`

---

## Quiz Flow

```
[Client] → GET /quiz/questions (Authorization: Bearer {token}) → [SCF Function]
                                                              ↓
                                                     Validate JWT → Query DB
                                                              ↓
                                                     Return questions (no answers)
                                                              ↓
[Client] → Display questions → User answers → POST /quiz/submit
                                                              ↓
                                                     Validate JWT → Check answers
                                                              ↓
                                                     Calculate tokens (based on difficulty + speed)
                                                              ↓
                                                     Update user tokens → Return results
```

---

## Token Calculation

**Formula**:
```
tokensEarned = baseTokens × difficultyMultiplier × speedBonus

Where:
- baseTokens = 1 (per question)
- difficultyMultiplier: easy=1, medium=2, hard=3
- speedBonus: <10s=1.5, <20s=1.2, <30s=1.0, >30s=0.8
```

**Example**:
- Easy question, answered in 15 seconds: `1 × 1 × 1.2 = 1.2 tokens`
- Hard question, answered in 5 seconds: `1 × 3 × 1.5 = 4.5 tokens`

---

## Error Codes

| Code | HTTP Status | Description |
|------|--------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired JWT |
| `INVALID_ANSWERS` | 400 | Invalid answer format or question ID |
| `QUIZ_COOLDOWN` | 429 | Quiz on cooldown (must wait) |
| `QUESTION_NOT_FOUND` | 404 | Question ID not found |
| `INTERNAL_ERROR` | 500 | Database or server error |

---

## Performance Requirements

- **Get questions**: Must complete within 300ms (p50)
- **Submit answers**: Must complete within 500ms (p50)

---

## Security Requirements

1. **JWT Validation**: All endpoints must validate JWT
2. **Answer Validation**: Server-side answer checking (no client-side)
3. **Rate Limiting**: Quiz submission limited to 20 requests/minute per user
4. **Cooldown Enforcement**: Prevent rapid re-submission (Redis-based cooldown)

---

## Database Schema (Quiz)

```sql
CREATE TABLE quiz_questions (
    id VARCHAR(50) PRIMARY KEY,
    question TEXT NOT NULL,
    options JSON NOT NULL,
    correct_answer INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    category VARCHAR(50),
    time_limit INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_attempts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    tokens_earned INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
```

---
