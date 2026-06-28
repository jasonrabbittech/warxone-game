# API Contract: Game State / 游戏状态 API 接口

**Version**: 1.0.0 | **Date**: 2026-06-27 | **Phase**: 1 (Design)

---

## Overview

Game state management endpoints for saving and loading game progress. Requires JWT authentication.

**Base URL**: `https://api.warxone.com/game`

**Authentication**: All endpoints require `Authorization: Bearer {JWT}` header.

---

## Endpoints

### 1. POST /game/save

**Description**: Save game state to cloud.

**Request**:
```json
{
  "saveName": "string (optional, default 'Default')",
  "gameState": "object (JSON)",
  "world": "string ('earth' or 'mars')",
  "isAutoSave": "boolean (default true)"
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "saveId": "string (UUID)",
    "saveName": "string",
    "world": "string",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  },
  "message": "Game saved successfully"
}
```

**Response** (Error 401):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Response** (Error 413):
```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "Game state exceeds 1MB limit"
  }
}
```

**SCF Function**: `game-save`

---

### 2. GET /game/load

**Description**: Load game state from cloud.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `saveId` | string | No | Specific save ID. If omitted, loads most recent save. |
| `world` | string | No | Filter by world ('earth' or 'mars'). |

**Request Headers**:
```
Authorization: Bearer {JWT}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "saveId": "string (UUID)",
    "saveName": "string",
    "gameState": "object (JSON)",
    "world": "string",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  },
  "message": "Game loaded successfully"
}
```

**Response** (Error 404):
```json
{
  "success": false,
  "error": {
    "code": "SAVE_NOT_FOUND",
    "message": "No saved game found"
  }
}
```

**SCF Function**: `game-load`

---

### 3. GET /game/saves

**Description**: List all saved games for the authenticated user.

**Query Parameters**: None

**Request Headers**:
```
Authorization: Bearer {JWT}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": [
    {
      "saveId": "string (UUID)",
      "saveName": "string",
      "world": "string",
      "isAutoSave": "boolean",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ],
  "message": "Saves retrieved successfully"
}
```

**SCF Function**: `game-saves-list`

---

### 4. DELETE /game/save/:saveId

**Description**: Delete a saved game.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `saveId` | string | Save ID to delete |

**Request Headers**:
```
Authorization: Bearer {JWT}
```

**Response** (Success 200):
```json
{
  "success": true,
  "message": "Save deleted successfully"
}
```

**Response** (Error 404):
```json
{
  "success": false,
  "error": {
    "code": "SAVE_NOT_FOUND",
    "message": "Save not found or not owned by user"
  }
}
```

**SCF Function**: `game-save-delete`

---

## Game State JSON Schema

**Note**: This is the structure stored in `GameSave.game_state` field.

```json
{
  "player": {
    "name": "string",
    "flag": "string",
    "level": "number (≥1)",
    "tokens": "number (≥0)"
  },
  "territories": ["string (territory IDs)"],
  "resources": {
    "population": "number (≥0)",
    "gold": "number (≥0)",
    "food": "number (≥0)",
    "tokens": "number (≥0)"
  },
  "military": "number (≥0)",
  "cards": [
    {
      "id": "string",
      "name": "string",
      "rarity": "string (enum)",
      "population": "number",
      "military": "number",
      "resources": "number",
      "airports": "number",
      "trainStations": "number",
      "militaryUnits": "number"
    }
  ],
  "cardCollection": ["same as cards"],
  "infrastructure": {
    "totalAirports": "number (≥0)",
    "totalTrainStations": "number (≥0)",
    "totalMilitaryUnits": "number (≥0)"
  },
  "connections": [
    {
      "id": "string",
      "territory1": "string",
      "territory2": "string",
      "type": "string (enum)",
      "bonus": "object",
      "cost": "number"
    }
  ],
  "weapons": ["Weapon object (Phase 3)"],
  "cooldowns": {
    "battle": "string (ISO 8601) or null",
    "quiz": "string (ISO 8601) or null"
  },
  "alliances": ["string (alliance IDs, Phase 2)"]
}
```

**Size Limit**: Max 1MB (enforced by SCF)

---

## Save/Load Flow

```
[Client] → GET /game/load (Authorization: Bearer {token}) → [SCF Function]
                                                              ↓
                                                     Validate JWT → Query DB
                                                              ↓
                                                     Return gameState JSON
                                                              ↓
[Client] → Load gameState into memory → Player plays game
                                                              ↓
[Client] → Auto-save every 30s → POST /game/save
                                                              ↓
                                                     Validate JWT → Serialize state
                                                              ↓
                                                     Validate size (≤1MB) → Save to DB
                                                              ↓
                                                     Return success response
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|--------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired JWT |
| `SAVE_NOT_FOUND` | 404 | Save ID not found or not owned by user |
| `PAYLOAD_TOO_LARGE` | 413 | Game state exceeds 1MB |
| `VALIDATION_ERROR` | 400 | Invalid game state JSON |
| `INTERNAL_ERROR` | 500 | Database or server error |

---

## Performance Requirements

- **Save operation**: Must complete within 500ms (p50)
- **Load operation**: Must complete within 500ms (p50)
- **List operation**: Must complete within 300ms (p50)

---

## Security Requirements

1. **JWT Validation**: All endpoints must validate JWT signature and expiry
2. **User Isolation**: Users can only access their own saves
3. **Input Sanitization**: Game state JSON must be validated (no malicious scripts)
4. **Rate Limiting**: Save endpoint limited to 10 requests/minute per user

---
