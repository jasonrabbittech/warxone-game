# API Contract: Authentication / 认证 API 接口

**Version**: 1.0.0 | **Date**: 2026-06-27 | **Phase**: 1 (Design)

---

## Overview

Authentication endpoints for user registration and login. Uses JWT (HS256) with 24h expiry.

**Base URL**: `https://api.warxone.com/auth`

---

## Endpoints

### 1. POST /auth/register

**Description**: Register a new user account.

**Request**:
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)"
}
```

**Response** (Success 201):
```json
{
  "success": true,
  "data": {
    "userId": "string (UUID)",
    "username": "string",
    "email": "string",
    "token": "string (JWT)",
    "expiresIn": 86400
  },
  "message": "Registration successful"
}
```

**Response** (Error 400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "username", "message": "Must be 3-50 characters" }
    ]
  }
}
```

**Response** (Error 409):
```json
{
  "success": false,
  "error": {
    "code": "USER_EXISTS",
    "message": "Username or email already exists"
  }
}
```

**SCF Function**: `auth-register`

---

### 2. POST /auth/login

**Description**: Login with username/email and password.

**Request**:
```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "data": {
    "userId": "string (UUID)",
    "username": "string",
    "email": "string",
    "level": "number",
    "tokens": "number",
    "token": "string (JWT)",
    "expiresIn": 86400
  },
  "message": "Login successful"
}
```

**Response** (Error 401):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username/email or password"
  }
}
```

**SCF Function**: `auth-login`

---

### 3. POST /auth/logout

**Description**: Logout (client-side token discard).

**Request**:
```json
{
  "token": "string (JWT)"
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Notes**: JWT is stateless; logout is client-side (delete token). Optionally, add token blacklist in Redis.

**SCF Function**: `auth-logout` (optional, for token blacklist)

---

## Authentication Flow

```
[Client] → POST /auth/register (or /auth/login) → [SCF Function]
                                                   ↓
                                          Validate input → Hash password → Save to DB
                                                   ↓
                                          Generate JWT (HS256, 24h expiry)
                                                   ↓
                                          Return token to client
                                                   ↓
[Client] → Store token in localStorage → Include in Authorization header
                                                   ↓
[Client] → GET /game/load (Authorization: Bearer {token}) → [SCF Function]
                                                   ↓
                                          Validate JWT → Return game state
```

---

## Security Requirements

1. **Password Hashing**: Use `bcrypt` with salt rounds ≥10
2. **JWT Secret**: Store in SCF environment variable (per-user secret in DB)
3. **HTTPS Only**: All API calls must use HTTPS (EdgeOne enforces)
4. **Input Validation**: Validate all fields before processing
5. **Rate Limiting**: Limit login attempts to 5/minute per IP (Redis-based)

---

## Error Codes

| Code | HTTP Status | Description |
|------|--------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input fields |
| `USER_EXISTS` | 409 | Username or email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong username/email or password |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `TOKEN_INVALID` | 401 | JWT token invalid |
| `INTERNAL_ERROR` | 500 | Server error |

---
