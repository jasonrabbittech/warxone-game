# API Contract: Card System / 卡牌系统 API 接口

**Version**: 1.0.0 | **Date**: 2026-06-27 | **Phase**: 1 (Design)

---

## Overview

Card system endpoints for purchasing card packs and managing card collection. Requires JWT authentication.

**Base URL**: `https://api.warxone.com/cards`

**Authentication**: All endpoints require `Authorization: Bearer {JWT}` header.

---

## Endpoints

### 1. POST /cards/purchase

**Description**: Purchase a card pack (costs 5 tokens).

**Request**:
```json
{
  "packType": "string ('city' or 'weapon')"
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "string (UUID)",
      "name": "string (city name)",
      "rarity": "string (enum)",
      "population": "number",
      "military": "number",
      "resources": "number",
      "airports": "number",
      "trainStations": "number",
      "militaryUnits": "number"
    },
    "tokensRemaining": "number"
  },
  "message": "Card pack purchased successfully"
}
```

**Response** (Error 400):
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_TOKENS",
    "message": "Not enough tokens (need 5, have X)"
  }
}
```

**SCF Function**: `card-purchase`

---

### 2. GET /cards/collection

**Description**: Get user's card collection.

**Query Parameters**: None

**Request Headers**:
```
Authorization: Bearer {JWT}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "string (UUID)",
        "name": "string (city name)",
        "rarity": "string (enum)",
        "population": "number",
        "military": "number",
        "resources": "number",
        "airports": "number",
        "trainStations": "number",
        "militaryUnits": "number"
      }
    ],
    "totalCards": "number",
    "infrastructure": {
      "totalAirports": "number",
      "totalTrainStations": "number",
      "totalMilitaryUnits": "number"
    }
  },
  "message": "Collection retrieved successfully"
}
```

**SCF Function**: `card-collection`

---

### 3. GET /cards/definitions

**Description**: Get all card definitions (for frontend card database).

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rarity` | string | No | Filter by rarity (enum) |
| `limit` | number | No | Max results (default 100) |

**Request Headers**: None (public endpoint)

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "string",
        "name": "string",
        "rarity": "string",
        "minPopulation": "number",
        "maxPopulation": "number",
        "minMilitary": "number",
        "maxMilitary": "number",
        "minResources": "number",
        "maxResources": "number",
        "minAirports": "number",
        "maxAirports": "number",
        "minTrainStations": "number",
        "maxTrainStations": "number",
        "minMilitaryUnits": "number",
        "maxMilitaryUnits": "number"
      }
    ]
  },
  "message": "Card definitions retrieved successfully"
}
```

**SCF Function**: `card-definitions`

---

## Card Rarity Distribution

**City Card Packs** (from FR-006):
| Rarity | Probability | Population Range | Military Range | Resources Range |
|---------|--------------|-----------------|-----------------|-------------------|
| Common | 40% | 1,000 - 5,000 | 10 - 50 | 500 - 2,500 |
| Rare | 25% | 5,000 - 15,000 | 50 - 150 | 2,500 - 7,500 |
| Super Rare | 15% | 15,000 - 30,000 | 150 - 300 | 7,500 - 15,000 |
| Mythic | 10% | 30,000 - 50,000 | 300 - 500 | 15,000 - 25,000 |
| Legendary | 7% | 50,000 - 75,000 | 500 - 750 | 25,000 - 37,500 |
| Ultra Legendary | 3% | 75,000 - 100,000 | 750 - 1,000 | 37,500 - 50,000 |

**Weapon Card Packs** (from FR-013, FR-018):
- Only available from Fighter or Bomb card packs
- Contains weapons (not city cards)
- Rarity affects weapon power/effect

---

## Card Purchase Flow

```
[Client] → Check tokens (≥5) → POST /cards/purchase
                                              ↓
                                     Validate JWT → Check token balance
                                              ↓
                                     Deduct 5 tokens → Weighted random draw
                                              ↓
                                     Generate card (based on rarity)
                                              ↓
                                     Return card data to client
                                              ↓
[Client] → Add card to collection → Update infrastructure totals
                                              ↓
                                     Save game state (auto-save)
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|--------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired JWT |
| `INSUFFICIENT_TOKENS` | 400 | Not enough tokens (need 5) |
| `INVALID_PACK_TYPE` | 400 | Invalid packType (must be 'city' or 'weapon') |
| `INTERNAL_ERROR` | 500 | Database or server error |

---

## Performance Requirements

- **Purchase operation**: Must complete within 500ms (p50)
- **Collection retrieval**: Must complete within 300ms (p50)
- **Definitions retrieval**: Must complete within 200ms (p50, cached)

---

## Security Requirements

1. **JWT Validation**: All endpoints must validate JWT
2. **Token Deduction**: Atomic operation (prevent double-spending)
3. **Rate Limiting**: Purchase limited to 10 requests/minute per user
4. **Input Validation**: Validate packType parameter

---
