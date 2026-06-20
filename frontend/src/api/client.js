/**
 * WarXOne - API Client
 * HTTP client with automatic JWT token refresh
 *
 * Architecture: Each SCF function has its own Function URL.
 * URLs are configured via Vite env variables (VITE_AUTH_*_URL, VITE_GAME_*_URL).
 * In production, these are the full SCF Function URLs.
 * In development, these are relative paths proxied by Vite dev server.
 */

// SCF Function URL map — one URL per function
const API_URLS = {
  authLogin:    import.meta.env.VITE_AUTH_LOGIN_URL    || '/api/auth/login',
  authRegister: import.meta.env.VITE_AUTH_REGISTER_URL || '/api/auth/register',
  authGoogle:   import.meta.env.VITE_AUTH_GOOGLE_URL   || '/api/auth/google',
  authRefresh:  import.meta.env.VITE_AUTH_REFRESH_URL  || '/api/auth/refresh',
  authLogout:   import.meta.env.VITE_AUTH_LOGOUT_URL   || '/api/auth/logout',
  gameSave:     import.meta.env.VITE_GAME_SAVE_URL     || '/api/game/save',
  gameLoad:     import.meta.env.VITE_GAME_LOAD_URL     || '/api/game/load',
  gameDelete:   import.meta.env.VITE_GAME_DELETE_URL   || '/api/game/delete',
};

// Token storage keys
const ACCESS_TOKEN_KEY = 'warxone_access_token';
const REFRESH_TOKEN_KEY = 'warxone_refresh_token';
const USER_KEY = 'warxone_user';

// In-memory token cache (faster than localStorage reads)
let _accessToken = null;
let _refreshToken = null;
let _isRefreshing = false;
let _refreshPromise = null;

/**
 * Get stored access token
 */
export function getAccessToken() {
    if (_accessToken) return _accessToken;
    try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
}

/**
 * Get stored refresh token
 */
export function getRefreshToken() {
    if (_refreshToken) return _refreshToken;
    try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
}

/**
 * Get stored user info
 */
export function getStoredUser() {
    try {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
}

/**
 * Store tokens and user info
 */
export function setAuthData(accessToken, refreshToken, user) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.warn('Failed to persist auth data:', e);
    }
}

/**
 * Clear all auth data
 */
export function clearAuthData() {
    _accessToken = null;
    _refreshToken = null;
    try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch (e) {
        console.warn('Failed to clear auth data:', e);
    }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
    return !!getAccessToken();
}

/**
 * Try to refresh the access token using the refresh token
 * @returns {Promise<boolean>} true if refresh succeeded
 */
async function tryRefreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(API_URLS.authRefresh, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            clearAuthData();
            return false;
        }

        const result = await response.json();
        if (result.success && result.data) {
            setAuthData(result.data.accessToken, result.data.refreshToken, result.data.user);
            return true;
        }

        clearAuthData();
        return false;
    } catch {
        return false;
    }
}

/**
 * Ensure a valid access token (refresh if needed)
 * Used to coordinate multiple concurrent requests
 */
async function ensureValidToken() {
    if (_isRefreshing && _refreshPromise) {
        return _refreshPromise;
    }

    _isRefreshing = true;
    _refreshPromise = tryRefreshToken().finally(() => {
        _isRefreshing = false;
        _refreshPromise = null;
    });

    return _refreshPromise;
}

/**
 * Make an authenticated API request to an SCF function
 * Automatically adds Authorization header and handles token refresh
 *
 * @param {string} url - Full Function URL (from API_URLS)
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Parsed response
 */
export async function apiRequest(url, options = {}) {
    const accessToken = getAccessToken();

    // Add auth header if we have a token
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // If 401, try refreshing the token and retry once
    if (response.status === 401 && getRefreshToken()) {
        const refreshed = await ensureValidToken();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${getAccessToken()}`;
            response = await fetch(url, { ...options, headers });
        }
    }

    // Parse response
    try {
        const data = await response.json();
        return data;
    } catch {
        return { success: false, error: 'Invalid response from server' };
    }
}

/**
 * Auth API methods
 */
export const auth = {
    async register(email, password) {
        const response = await fetch(API_URLS.authRegister, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();

        if (result.success && result.data) {
            setAuthData(result.data.accessToken, result.data.refreshToken, result.data.user);
        }
        return result;
    },

    async login(email, password) {
        const response = await fetch(API_URLS.authLogin, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();

        if (result.success && result.data) {
            setAuthData(result.data.accessToken, result.data.refreshToken, result.data.user);
        }
        return result;
    },

    async logout() {
        try {
            await apiRequest(API_URLS.authLogout, { method: 'POST' });
        } catch {
            // Logout API call failed, still clear local data
        }
        clearAuthData();
    },

    async googleLogin(code, redirectUri) {
        const response = await fetch(API_URLS.authGoogle, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
        });
        const result = await response.json();

        if (result.success && result.data) {
            setAuthData(result.data.accessToken, result.data.refreshToken, result.data.user);
        }
        return result;
    },
};

/**
 * Game API methods
 */
export const game = {
    async save(gameState) {
        return apiRequest(API_URLS.gameSave, {
            method: 'PUT',
            body: JSON.stringify({ gameState }),
        });
    },

    async load() {
        return apiRequest(API_URLS.gameLoad, {
            method: 'GET',
        });
    },

    async deleteSave() {
        return apiRequest(API_URLS.gameDelete, {
            method: 'DELETE',
        });
    },
};
