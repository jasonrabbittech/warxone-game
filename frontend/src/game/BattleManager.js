/**
 * Battle Manager for Multiplayer System
 * Handles WebSocket communication for real-time PvP battles
 * Integrates with existing BattleModule for UI updates
 */

import { GameState } from './GameState.js';
import { MapModule } from './map.js';
import { Military } from './military.js';

/**
 * @typedef {Object} BattleState
 * @property {string} battleId - Unique battle ID
 * @property {string} attackerId - Attacker player ID
 * @property {string} defenderId - Defender player ID
 * @property {string} territoryId - Territory being attacked
 * @property {number} startTime - Battle start timestamp
 * @property {string} status - Battle status ('ongoing', 'attacker_wins', 'defender_wins', 'retreat')
 * @property {number} progress - Battle progress (0-100)
 * @property {number} attackerCasualties - Attacker casualties
 * @property {number} defenderCasualties - Defender casualties
 * @property {number} currentTurn - Current turn number
 */

/**
 * Battle Manager class
 */
export class BattleManager {
  /**
   * @private
   * @type {WebSocket|null}
   */
  #ws = null;

  /**
   * @private
   * @type {string|null}
   */
  #token = null;

  /**
   * @private
   * @type {BattleState|null}
   */
  #activeBattle = null;

  /**
   * @private
   * @type {number}
   */
  #reconnectAttempts = 0;

  /**
   * @private
   * @type {number}
   */
  #maxReconnectAttempts = 5;

  /**
   * @private
   * @type {number}
   */
  #heartbeatInterval = null;

  /**
   * Create a BattleManager instance
   * @param {string} token - JWT token for authentication
   */
  constructor(token) {
    this.#token = token;
    this.#initializeEventListeners();
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
        console.log('[BattleManager] Already connected');
        return;
      }

      // Get WebSocket URL from environment or use default
      const wsUrl = import.meta.env.VITE_WS_URL || 'wss://your-api-gateway-url/prod';
      const url = `${wsUrl}?token=${this.#token}`;

      console.log('[BattleManager] Connecting to:', url);

      this.#ws = new WebSocket(url);

      this.#ws.onopen = this.#handleOpen.bind(this);
      this.#ws.onmessage = this.#handleMessage.bind(this);
      this.#ws.onerror = this.#handleError.bind(this);
      this.#ws.onclose = this.#handleClose.bind(this);

    } catch (error) {
      console.error('[BattleManager] Connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.#ws) {
      this.#ws.close();
      this.#ws = null;
    }

    if (this.#heartbeatInterval) {
      clearInterval(this.#heartbeatInterval);
      this.#heartbeatInterval = null;
    }
  }

  /**
   * Start a PvP battle
   * @param {string} territoryId - Territory ID to attack
   * @param {string} defenderId - Defender player ID
   * @returns {Promise<BattleState>}
   */
  async startBattle(territoryId, defenderId) {
    try {
      if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      const message = {
        type: 'battle_attack',
        payload: {
          territoryId,
          defenderId
        },
        timestamp: Date.now()
      };

      this.#ws.send(JSON.stringify(message));
      console.log('[BattleManager] Sent battle attack:', message);

      // Return a promise that resolves when battle_started is received
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Battle start timeout'));
        }, 10000); // 10 second timeout

        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'battle_started') {
            clearTimeout(timeout);
            this.#ws.removeEventListener('message', handler);
            this.#activeBattle = data.payload;
            resolve(this.#activeBattle);
          }
        };

        this.#ws.addEventListener('message', handler);
      });
    } catch (error) {
      console.error('[BattleManager] Error starting battle:', error);
      throw error;
    }
  }

  /**
   * Retreat from current battle
   * @returns {Promise<Object>}
   */
  async retreatBattle() {
    try {
      if (!this.#activeBattle) {
        throw new Error('No active battle to retreat from');
      }

      if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      const message = {
        type: 'battle_retreat',
        payload: {
          battleId: this.#activeBattle.battleId
        },
        timestamp: Date.now()
      };

      this.#ws.send(JSON.stringify(message));
      console.log('[BattleManager] Sent battle retreat:', message);

      // Return a promise that resolves when battle_result is received
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Battle retreat timeout'));
        }, 10000);

        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'battle_result') {
            clearTimeout(timeout);
            this.#ws.removeEventListener('message', handler);
            this.#activeBattle = null;
            resolve(data.payload);
          }
        };

        this.#ws.addEventListener('message', handler);
      });
    } catch (error) {
      console.error('[BattleManager] Error retreating from battle:', error);
      throw error;
    }
  }

  /**
   * Get current active battle
   * @returns {BattleState|null}
   */
  getActiveBattle() {
    return this.#activeBattle;
  }

  /**
   * Check if in active battle
   * @returns {boolean}
   */
  isInBattle() {
    return this.#activeBattle !== null && this.#activeBattle.status === 'ongoing';
  }

  /**
   * Initialize event listeners for UI updates
   * @private
   */
  #initializeEventListeners() {
    // Listen for battle start events from server
    document.addEventListener('battle-started', (event) => {
      this.#handleBattleStarted(event.detail);
    });

    // Listen for battle update events from server
    document.addEventListener('battle-update', (event) => {
      this.#handleBattleUpdate(event.detail);
    });

    // Listen for battle result events from server
    document.addEventListener('battle-result', (event) => {
      this.#handleBattleResult(event.detail);
    });
  }

  /**
   * Handle WebSocket open
   * @private
   * @param {Event} event - WebSocket open event
   */
  #handleOpen(event) {
    console.log('[BattleManager] WebSocket connected');
    this.#reconnectAttempts = 0;

    // Start heartbeat
    this.#heartbeatInterval = setInterval(() => {
      if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
        const heartbeat = {
          type: 'heartbeat',
          payload: {},
          timestamp: Date.now()
        };
        this.#ws.send(JSON.stringify(heartbeat));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Handle WebSocket message
   * @private
   * @param {MessageEvent} event - WebSocket message event
   */
  #handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('[BattleManager] Received message:', data);

      // Dispatch events based on message type
      switch (data.type) {
        case 'battle_started':
          document.dispatchEvent(new CustomEvent('battle-started', { detail: data.payload }));
          break;

        case 'battle_update':
          document.dispatchEvent(new CustomEvent('battle-update', { detail: data.payload }));
          break;

        case 'battle_result':
          document.dispatchEvent(new CustomEvent('battle-result', { detail: data.payload }));
          break;

        case 'heartbeat_ack':
          console.log('[BattleManager] Heartbeat acknowledged');
          break;

        case 'error':
          console.error('[BattleManager] Error from server:', data.payload);
          break;

        default:
          console.warn('[BattleManager] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[BattleManager] Error handling message:', error);
    }
  }

  /**
   * Handle WebSocket error
   * @private
   * @param {Event} event - WebSocket error event
   */
  #handleError(event) {
    console.error('[BattleManager] WebSocket error:', event);
  }

  /**
   * Handle WebSocket close
   * @private
   * @param {CloseEvent} event - WebSocket close event
   */
  #handleClose(event) {
    console.log('[BattleManager] WebSocket closed:', event.code, event.reason);

    // Clear heartbeat interval
    if (this.#heartbeatInterval) {
      clearInterval(this.#heartbeatInterval);
      this.#heartbeatInterval = null;
    }

    // Attempt to reconnect
    if (this.#reconnectAttempts < this.#maxReconnectAttempts) {
      this.#reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.#reconnectAttempts), 30000); // Exponential backoff
      console.log(`[BattleManager] Reconnecting in ${delay}ms (attempt ${this.#reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('[BattleManager] Max reconnect attempts reached');
    }
  }

  /**
   * Handle battle started event
   * @private
   * @param {Object} payload - Battle started payload
   */
  #handleBattleStarted(payload) {
    console.log('[BattleManager] Battle started:', payload);
    this.#activeBattle = payload;

    // Update UI
    MapModule.showMessage(`Battle started: ${payload.attackerId} vs ${payload.defenderId}`);

    // Dispatch event for BattleModule to handle
    document.dispatchEvent(new CustomEvent('battle-start', {
      detail: {
        attacker: payload.attackerId,
        defender: payload.defenderId,
        territoryId: payload.territoryId
      }
    }));
  }

  /**
   * Handle battle update event
   * @private
   * @param {Object} payload - Battle update payload
   */
  #handleBattleUpdate(payload) {
    console.log('[BattleManager] Battle update:', payload);

    // Update active battle state
    if (this.#activeBattle) {
      this.#activeBattle.progress = payload.progress;
      this.#activeBattle.attackerCasualties = payload.attackerCasualties;
      this.#activeBattle.defenderCasualties = payload.defenderCasualties;
      this.#activeBattle.currentTurn = payload.currentTurn;
    }

    // Dispatch event for BattleModule to handle
    document.dispatchEvent(new CustomEvent('battle-update', { detail: payload }));
  }

  /**
   * Handle battle result event
   * @private
   * @param {Object} payload - Battle result payload
   */
  #handleBattleResult(payload) {
    console.log('[BattleManager] Battle result:', payload);

    // Update UI
    const resultText = payload.status === 'attacker_wins' ? 'Attacker wins!' : 
                      payload.status === 'defender_wins' ? 'Defender wins!' : 'Retreat!';
    MapModule.showMessage(`Battle ended: ${resultText}`);

    // Clear active battle
    this.#activeBattle = null;

    // Dispatch event for BattleModule to handle
    document.dispatchEvent(new CustomEvent('battle-end', { detail: payload }));
  }
}

/**
 * Create and initialize BattleManager instance
 * @param {string} token - JWT token
 * @returns {Promise<BattleManager>}
 */
export async function createBattleManager(token) {
  const manager = new BattleManager(token);
  await manager.connect();
  return manager;
}

/**
 * Get JWT token from storage
 * @returns {string|null}
 */
function getJwtToken() {
  try {
    return localStorage.getItem('warxone_access_token') || null;
  } catch {
    return null;
  }
}

// Create singleton instance
let battleManagerInstance = null;

/**
 * Get BattleManager instance (singleton)
 * @returns {Promise<BattleManager>}
 */
export async function getBattleManager() {
  if (!battleManagerInstance) {
    const token = getJwtToken();
    if (!token) {
      throw new Error('No JWT token available');
    }
    battleManagerInstance = await createBattleManager(token);
  }
  return battleManagerInstance;
}
