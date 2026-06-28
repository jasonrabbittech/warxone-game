// Auto-battle logic with formula
// Implements: T019 (battle initiation), T020 (battle outcome calculation),
//            T026 (cooldown), T027 (retreat), T028 (front line display), T029 (resolution)

import { GameState } from './GameState.js';
import { MapModule } from './map.js';
import { Military } from './military.js';

/**
 * Battle module for auto-battle system
 */
export const BattleModule = {
  active: false,
  attacker: null,
  defender: null,
  turn: 0,
  interval: null,
  cooldownUntil: 0,
  battleLog: [],
  frontLinePosition: 0.5, // 0 = attacker territory, 1 = defender territory

  /**
   * Initiate battle (T019)
   * @param {string} defenderId - Defending territory ID
   * @returns {Object} - Battle result
   */
  initiateBattle(defenderId) {
    // Check cooldown (T026)
    if (this.isOnCooldown()) {
      const remaining = this.getRemainingCooldown();
      MapModule.showMessage(`Battle on cooldown. Please wait ${remaining} seconds.`);
      return null;
    }

    const player = GameState.player;
    const currentCountries = GameState.getCurrentCountries();

    // Validate defender
    if (!currentCountries[defenderId]) {
      MapModule.showMessage('Invalid territory');
      return null;
    }

    // Check adjacency
    if (!MapModule.isAdjacent(defenderId)) {
      MapModule.showMessage('Not adjacent');
      return null;
    }

    // Check if player has military
    if (!player.military || player.military < 10) {
      MapModule.showMessage('Insufficient military. Need at least 10 units.');
      return null;
    }

    // Start battle
    this.active = true;
    this.attacker = player.startingCountry;
    this.defender = defenderId;
    this.turn = 0;
    this.battleLog = [];
    this.frontLinePosition = 0.5;

    // Initialize battle state in GameState
    GameState.battle = {
      active: true,
      attacker: this.attacker,
      defender: this.defender,
      turn: 0,
      log: [],
      startTime: Date.now(),
    };

    // Add initial log entry
    this.addLogEntry('info', `Battle started: ${this.attacker} vs ${this.defender}`);

    // Dispatch battle start event
    const event = new CustomEvent('battle-start', {
      detail: {
        attacker: this.attacker,
        defender: this.defender,
        attackerMilitary: player.military,
        defenderMilitary: currentCountries[defenderId].military || 0,
      }
    });
    document.dispatchEvent(event);

    // Start battle simulation
    this.startBattleSimulation();

    return { active: true, attacker: this.attacker, defender: this.defender };
  },

  /**
   * Start battle simulation with turns
   */
  startBattleSimulation() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.battleTurn();
    }, 2000); // 2 seconds per turn
  },

  /**
   * Execute one battle turn
   */
  battleTurn() {
    if (!this.active) {
      this.stopBattleSimulation();
      return;
    }

    this.turn++;
    GameState.battle.turn = this.turn;

    const player = GameState.player;
    const currentCountries = GameState.getCurrentCountries();
    const defender = currentCountries[this.defender];

    // Calculate casualties for this turn
    const attackerStrength = Military.getMilitaryStrength();
    const defenderMilitary = defender.military || 10;

    // Attacker casualties (higher if disadvantage)
    const attackerAdvantage = Military.calculateAdvantage(defenderMilitary);
    const attackerCasualties = Math.max(1, Math.floor(10 / (1 + attackerAdvantage)));
    const defenderCasualties = Math.max(1, Math.floor(10 * (1 + attackerAdvantage * 0.5)));

    // Update military
    player.military = Math.max(0, player.military - attackerCasualties);
    defender.military = Math.max(0, defender.military - defenderCasualties);

    // Update front line position based on casualties
    const totalCasualties = attackerCasualties + defenderCasualties;
    if (totalCasualties > 0) {
      const shift = (defenderCasualties - attackerCasualties) / totalCasualties * 0.1;
      this.frontLinePosition = Math.max(0, Math.min(1, this.frontLinePosition + shift));
    }

    // Add log entries
    this.addLogEntry('casualties', `Turn ${this.turn}: Attacker -${attackerCasualties}, Defender -${defenderCasualties}`);

    // Check for battle end conditions
    if (player.military <= 0) {
      // Attacker defeated
      this.addLogEntry('defeat', 'Attacker military depleted. Defeat!');
      this.endBattle({ win: false, reason: 'Military depleted' });
      return;
    }

    if (defender.military <= 0) {
      // Defender defeated
      this.addLogEntry('victory', 'Defender military depleted. Victory!');
      this.endBattle({ win: true, reason: 'Defender defeated' });
      return;
    }

    if (this.turn >= 10) {
      // Battle timeout (10 turns max)
      const result = this.calculateOutcome(this.defender);
      this.addLogEntry('result', `Battle concluded after ${this.turn} turns. Result: ${result.win ? 'Victory' : 'Defeat'}`);
      this.endBattle(result);
      return;
    }

    // Update front line display
    this.displayFrontLine();

    // Dispatch battle update event
    const event = new CustomEvent('battle-update', {
      detail: {
        turn: this.turn,
        attackerMilitary: player.military,
        defenderMilitary: defender.military,
        frontLinePosition: this.frontLinePosition,
        log: this.battleLog.slice(-1)[0],
      }
    });
    document.dispatchEvent(event);
  },

  /**
   * Stop battle simulation
   */
  stopBattleSimulation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },

  /**
   * Add log entry
   */
  addLogEntry(type, message) {
    const entry = {
      type: type,
      message: message,
      timestamp: Date.now(),
      turn: this.turn,
    };

    this.battleLog.push(entry);
    GameState.battle.log = this.battleLog;

    return entry;
  },

  /**
   * Calculate battle outcome (T020)
   * Formula: Base 50% + (advantage × 5% per 10% military advantage) + random(-10%, +10%)
   * Capped at 10%-90%
   * @param {string} defenderId - Defending territory ID
   * @returns {Object} - Battle result { win: boolean, probability: number }
   */
  calculateOutcome(defenderId) {
    const player = GameState.player;
    const currentCountries = GameState.getCurrentCountries();
    const defender = currentCountries[defenderId];

    // Get military strengths
    const attackerMilitary = player.military || 0;
    const defenderMilitary = defender.military || 1;

    // Calculate advantage
    let advantage = 0;
    if (defenderMilitary > 0) {
      advantage = (attackerMilitary - defenderMilitary) / defenderMilitary;
    }

    // Calculate win probability
    let probability = 50; // Base 50%

    // Add advantage bonus (5% per 10% advantage)
    probability += advantage * 50; // advantage × 5% per 10% = advantage × 50%

    // Add random factor (-10% to +10%)
    const randomFactor = (Math.random() * 20) - 10;
    probability += randomFactor;

    // Cap at 10%-90% (T020)
    probability = Math.max(10, Math.min(90, probability));

    // Determine outcome
    const roll = Math.random() * 100;
    const win = roll < probability;

    return {
      win,
      probability: Math.round(probability * 100) / 100,
      attackerMilitary,
      defenderMilitary,
      advantage: Math.round(advantage * 100) / 100
    };
  },

  /**
   * Apply battle result (T029)
   * @param {Object} result - Battle result
   */
  applyResult(result) {
    const defenderId = this.defender;

    if (result.win) {
      // Victory: acquire territory (T021)
      MapModule.acquireTerritory(defenderId);

      // Add to battle history
      if (!GameState.player.battleHistory) {
        GameState.player.battleHistory = [];
      }
      GameState.player.battleHistory.push({
        territoryId: defenderId,
        territoryName: defenderId,
        won: true,
        timestamp: Date.now(),
        turns: this.turn,
      });

      // Show victory message
      MapModule.showMessage(`Victory! You conquered ${defenderId} in ${this.turn} turns.`);
    } else {
      // Defeat

      // Add to battle history
      if (!GameState.player.battleHistory) {
        GameState.player.battleHistory = [];
      }
      GameState.player.battleHistory.push({
        territoryId: defenderId,
        territoryName: defenderId,
        won: false,
        timestamp: Date.now(),
        turns: this.turn,
        reason: result.reason,
      });

      // Show defeat message
      MapModule.showMessage(`Defeat! You failed to conquer ${defenderId} after ${this.turn} turns.`);
    }

    // Set cooldown (T026)
    this.setCooldown();
  },

  /**
   * End battle (T029)
   * @param {Object} result - Battle result
   */
  endBattle(result) {
    this.active = false;
    this.stopBattleSimulation();

    // Apply result
    this.applyResult(result);

    // Update GameState
    GameState.battle.active = false;
    GameState.battle.endTime = Date.now();

    // Remove front line display
    this.removeFrontLine();

    // Dispatch battle end event
    const event = new CustomEvent('battle-end', {
      detail: {
        result: result,
        attacker: this.attacker,
        defender: this.defender,
        turns: this.turn,
        log: this.battleLog,
      }
    });
    document.dispatchEvent(event);
  },

  /**
   * Set battle cooldown (T026)
   * Cooldown: 30s-5min after any battle
   */
  setCooldown() {
    // Cooldown based on battle duration
    const battleDuration = GameState.battle.endTime - GameState.battle.startTime;
    const baseCooldown = 30; // 30 seconds base
    const durationBonus = Math.floor(battleDuration / 60000) * 10; // +10s per minute
    const cooldownSeconds = Math.min(300, baseCooldown + durationBonus); // Max 5 minutes

    this.cooldownUntil = Date.now() + (cooldownSeconds * 1000);

    // Update GameState
    GameState.cooldowns = GameState.cooldowns || {};
    GameState.cooldowns.global = this.cooldownUntil;
    GameState.cooldowns.battle = this.cooldownUntil;
  },

  /**
   * Check if on cooldown (T026)
   * @returns {boolean}
   */
  isOnCooldown() {
    return Date.now() < this.cooldownUntil;
  },

  /**
   * Get remaining cooldown time (T026)
   * @returns {number} - Remaining seconds
   */
  getRemainingCooldown() {
    const remaining = this.cooldownUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  },

  /**
   * Retreat from battle (T027)
   * @returns {Object} - Retreat result
   */
  retreat() {
    if (!this.active) {
      return { success: false, error: 'No active battle to retreat from' };
    }

    // 49.9% chance opponent continues attacking after retreat
    const opponentContinues = Math.random() < 0.499;

    if (opponentContinues) {
      // Opponent continues attacking - player loses additional military
      const additionalLoss = Math.floor(GameState.player.military * 0.1); // Lose 10% more
      GameState.player.military = Math.max(0, GameState.player.military - additionalLoss);

      this.addLogEntry('retreat', `Retreat failed! Opponent continues attacking. Lost additional ${additionalLoss} military.`);

      // Check if player still has military
      if (GameState.player.military <= 0) {
        this.endBattle({ win: false, reason: 'Retreat failed, military depleted' });
      }

      return { success: false, error: 'Opponent continues attacking', additionalLoss };
    } else {
      // Retreat successful
      this.addLogEntry('retreat', 'Retreat successful!');

      // End battle with retreat flag
      this.endBattle({ win: false, retreated: true, reason: 'Retreated' });

      return { success: true };
    }
  },

  /**
   * Display front line during battle (T028)
   * Uses SVG overlay to show front line
   */
  displayFrontLine() {
    if (!this.active) return;

    const svg = MapModule.svgElement;
    if (!svg) return;

    // Remove existing front line
    const existingLine = svg.querySelector('#front-line');
    if (existingLine) {
      existingLine.remove();
    }

    // Get attacker and defender paths
    const currentPaths = GameState.player.currentWorld === 'earth'
      ? window.countryPaths
      : window.marsCountryPaths;

    const attackerPath = currentPaths[this.attacker];
    const defenderPath = currentPaths[this.defender];

    if (!attackerPath || !defenderPath) return;

    // Create front line SVG element (simplified as a line across the defender territory)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', 'front-line');
    line.setAttribute('x1', defenderPath.x1 || 100);
    line.setAttribute('y1', defenderPath.y1 || 100);
    line.setAttribute('x2', defenderPath.x2 || 200);
    line.setAttribute('y2', defenderPath.y2 || 200);
    line.setAttribute('stroke', '#ff0000');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '10,5');
    line.setAttribute('opacity', '0.8');
    line.setAttribute('class', 'front-line');

    // Add tooltip
    line.setAttribute('title', `Front Line - Turn ${this.turn}`);

    // Add to SVG
    svg.appendChild(line);

    // Add CSS if not exists
    if (!document.getElementById('front-line-style')) {
      const style = document.createElement('style');
      style.id = 'front-line-style';
      style.textContent = `
        .front-line {
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `;
      document.head.appendChild(style);
    }

    // Dispatch event for front line update
    const event = new CustomEvent('front-line-update', {
      detail: {
        turn: this.turn,
        frontLinePosition: this.frontLinePosition,
        attackerCasualties: this.battleLog.filter(e => e.type === 'casualties').length,
        defenderCasualties: this.battleLog.filter(e => e.type === 'casualties').length,
      }
    });
    document.dispatchEvent(event);
  },

  /**
   * Remove front line display
   */
  removeFrontLine() {
    const svg = MapModule.svgElement;
    if (!svg) return;

    const existingLine = svg.querySelector('#front-line');
    if (existingLine) {
      existingLine.remove();
    }
  }
};

// Export battle initiation function
export function initiateBattle(defenderId) {
  return BattleModule.initiateBattle(defenderId);
}

// Export battle calculation function
export function calculateBattleOutcome(defenderId) {
  return BattleModule.calculateOutcome(defenderId);
}

// Export retreat function
export function retreatFromBattle() {
  return BattleModule.retreat();
}

// Export cooldown check function
export function isOnBattleCooldown() {
  return BattleModule.isOnCooldown();
}

// Export remaining cooldown function
export function getRemainingCooldown() {
  return BattleModule.getRemainingCooldown();
}
