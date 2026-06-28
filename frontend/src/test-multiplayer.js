/**
 * Multiplayer Battle System Test Script
 * 
 * This script can be loaded in the browser console to test the multiplayer integration.
 * It provides mock functions to simulate server responses without requiring a backend.
 */

// ==================== Mock BattleManager for Testing ====================

class MockBattleManager {
  constructor(token) {
    this.token = token;
    this.connected = false;
    this.currentBattle = null;
    console.log('[MockBattleManager] Created with token:', token ? '***' : 'none');
  }

  async connect() {
    console.log('[MockBattleManager] Connecting...');
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.connected = true;
    console.log('[MockBattleManager] Connected successfully');
    return { success: true };
  }

  disconnect() {
    this.connected = false;
    console.log('[MockBattleManager] Disconnected');
  }

  async startBattle(territoryId, defenderId) {
    console.log('[MockBattleManager] Starting battle:', { territoryId, defenderId });
    
    if (!this.connected) {
      throw new Error('Not connected');
    }

    // Simulate battle start
    const battleId = 'battle_' + Date.now();
    this.currentBattle = {
      battleId,
      territoryId,
      defenderId,
      status: 'ongoing',
      progress: 0
    };

    // Simulate server response
    setTimeout(() => {
      const event = new CustomEvent('battle-started', {
        detail: this.currentBattle
      });
      document.dispatchEvent(event);
      console.log('[MockBattleManager] Battle started:', this.currentBattle);
    }, 100);

    // Simulate battle updates
    this.startBattleUpdates();

    return { success: true, battleId };
  }

  startBattleUpdates() {
    if (!this.currentBattle) return;

    let progress = 0;
    const interval = setInterval(() => {
      if (!this.currentBattle) {
        clearInterval(interval);
        return;
      }

      progress += 10;
      this.currentBattle.progress = progress;

      // Send update event
      const updateEvent = new CustomEvent('battle-update', {
        detail: {
          battleId: this.currentBattle.battleId,
          progress,
          attackerProgress: progress,
          defenderProgress: 100 - progress,
          log: `Turn ${progress / 10}: Attackers advance!`
        }
      });
      document.dispatchEvent(updateEvent);

      console.log('[MockBattleManager] Battle update:', { progress });

      // End battle at 100%
      if (progress >= 100) {
        clearInterval(interval);
        this.endBattle('attacker_wins');
      }
    }, 1000);
  }

  endBattle(status) {
    if (!this.currentBattle) return;

    const result = {
      battleId: this.currentBattle.battleId,
      status,
      message: status === 'attacker_wins' ? 'Victory!' : 'Defeat!'
    };

    // Send result event
    const resultEvent = new CustomEvent('battle-result', {
      detail: result
    });
    document.dispatchEvent(resultEvent);

    console.log('[MockBattleManager] Battle ended:', result);
    this.currentBattle = null;
  }

  async retreatBattle() {
    console.log('[MockBattleManager] Retreating from battle');
    
    if (!this.currentBattle) {
      throw new Error('No active battle');
    }

    const result = {
      battleId: this.currentBattle.battleId,
      status: 'retreat',
      message: 'Retreated successfully'
    };

    // Send result event
    const resultEvent = new CustomEvent('battle-result', {
      detail: result
    });
    document.dispatchEvent(resultEvent);

    this.currentBattle = null;
    console.log('[MockBattleManager] Retreat successful');
    return { success: true, ...result };
  }

  getActiveBattle() {
    return this.currentBattle;
  }

  isInBattle() {
    return this.currentBattle !== null && this.currentBattle.status === 'ongoing';
  }
}

// ==================== Test Functions ====================

// Make mock available globally for testing
window.MockBattleManager = MockBattleManager;

/**
 * Initialize test mode
 * Replaces the real BattleManager with a mock for testing
 */
window.initMultiplayerTest = function() {
  console.log('[Test] Initializing multiplayer test mode...');
  
  // Get token
  const token = localStorage.getItem('warxone_token') || 'test_token_123';
  
  // Create mock BattleManager
  const mockBattleManager = new MockBattleManager(token);
  
  // Replace the real BattleManager
  window.battleManager = mockBattleManager;
  
  // Auto-connect
  mockBattleManager.connect().then(() => {
    console.log('[Test] Mock BattleManager connected and ready');
    console.log('[Test] You can now test multiplayer battles by clicking on adjacent enemy territories');
    console.log('[Test] Or use: window.battleManager.startBattle("USA", "ai") to test programmatically');
  });
  
  return mockBattleManager;
};

/**
 * Test multiplayer battle flow
 */
window.testMultiplayerBattle = async function(territoryId = 'USA', defenderId = 'ai') {
  console.log('[Test] Testing multiplayer battle flow...');
  
  if (!window.battleManager) {
    console.error('[Test] BattleManager not initialized. Call window.initMultiplayerTest() first.');
    return;
  }
  
  if (!window.battleManager.connected) {
    console.error('[Test] BattleManager not connected. Waiting for connection...');
    await window.battleManager.connect();
  }
  
  try {
    const result = await window.battleManager.startBattle(territoryId, defenderId);
    console.log('[Test] Battle started:', result);
  } catch (error) {
    console.error('[Test] Battle start failed:', error);
  }
};

/**
 * Test battle retreat
 */
window.testRetreat = async function() {
  console.log('[Test] Testing battle retreat...');
  
  if (!window.battleManager) {
    console.error('[Test] BattleManager not initialized.');
    return;
  }
  
  try {
    const result = await window.battleManager.retreatBattle();
    console.log('[Test] Retreat result:', result);
  } catch (error) {
    console.error('[Test] Retreat failed:', error);
  }
};

/**
 * Check current game state
 */
window.checkGameState = function() {
  console.log('[Test] Current Game State:');
  console.log('  - BattleManager:', window.battleManager ? 'Initialized' : 'Not initialized');
  console.log('  - BattleManager Connected:', window.battleManager?.connected ? 'Yes' : 'No');
  console.log('  - Active Battle:', window.battleManager?.currentBattle || 'None');
  console.log('  - GameState.player:', GameState.player);
  console.log('  - GameState.countries count:', Object.keys(GameState.countries || {}).length);
};

// ==================== Auto-Initialize in Test Mode ====================

// Check if we're in test mode (you can set this in browser console: localStorage.setItem('test_mode', 'true'))
if (localStorage.getItem('test_mode') === 'true') {
  console.log('[Test] Test mode detected, auto-initializing...');
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.initMultiplayerTest();
    }, 1000);
  });
}

console.log('[Test] Multiplayer test script loaded');
console.log('[Test] Available commands:');
console.log('  - window.initMultiplayerTest() - Initialize test mode');
console.log('  - window.testMultiplayerBattle() - Test battle flow');
console.log('  - window.testRetreat() - Test battle retreat');
console.log('  - window.checkGameState() - Check current state');
console.log('[Test] To enable auto-test mode, run: localStorage.setItem("test_mode", "true")');
