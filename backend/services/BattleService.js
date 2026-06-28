/**
 * Battle Service for Multiplayer System
 * Provides authoritative battle calculation and management
 * All battle logic is calculated on the server to prevent cheating
 */

import { query, execute, queryOne } from '../functions/_common/db.js';
import { 
  setBattle, 
  getBattle, 
  removeBattle, 
  updateLeaderboard,
  setPlayerOnline 
} from './RedisService.js';
import { sendToPlayer, sendToChannel } from './WebSocketService.js';

/**
 * Start a PvP battle
 * @param {string} attackerId - Attacker player ID
 * @param {string} defenderId - Defender player ID
 * @param {string} territoryId - Territory being attacked
 * @returns {Promise<object>} - Battle data
 */
export async function startBattle(attackerId, defenderId, territoryId) {
  try {
    console.log(`[BattleService] Starting battle: ${attackerId} vs ${defenderId} for territory ${territoryId}`);

    // Validate attack is legal
    const validationError = await validateAttack(attackerId, defenderId, territoryId);
    if (validationError) {
      throw new Error(validationError);
    }

    // Generate battle ID
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get attacker and defender data
    const attackerData = await getPlayerGameData(attackerId);
    const defenderData = await getPlayerGameData(defenderId);

    // Calculate initial battle state
    const battleState = {
      battleId,
      attackerId,
      defenderId,
      territoryId,
      startTime: Date.now(),
      status: 'ongoing',
      progress: 0,
      attackerCasualties: 0,
      defenderCasualties: 0,
      attackerStrength: calculateMilitaryStrength(attackerData),
      defenderStrength: calculateMilitaryStrength(defenderData),
      turns: [],
      currentTurn: 0
    };

    // Store battle state in Redis
    await setBattle(battleId, battleState);

    // Store battle record in MySQL
    await execute(
      `INSERT INTO battles (id, attacker_id, defender_id, territory_id, start_time, status) 
       VALUES (?, ?, ?, ?, NOW(), 'ongoing')`,
      [battleId, attackerId, defenderId, territoryId]
    );

    // Notify both players
    await notifyBattleStarted(battleState);

    // Start battle simulation (async)
    simulateBattle(battleId).catch(error => {
      console.error(`[BattleService] Battle simulation error for ${battleId}:`, error);
    });

    return battleState;
  } catch (error) {
    console.error('[BattleService] Error starting battle:', error);
    throw error;
  }
}

/**
 * Calculate authoritative battle result
 * @param {string} attackerId - Attacker player ID
 * @param {string} defenderId - Defender player ID
 * @param {string} territoryId - Territory being attacked
 * @returns {Promise<object>} - Battle calculation result
 */
export async function calculateBattle(attackerId, defenderId, territoryId) {
  try {
    // Get player data
    const attackerData = await getPlayerGameData(attackerId);
    const defenderData = await getPlayerGameData(defenderId);

    // Calculate military strengths
    const attackerStrength = calculateMilitaryStrength(attackerData);
    const defenderStrength = calculateMilitaryStrength(defenderData);

    // Calculate win probability (base 50% + advantage)
    let attackerWinChance = 50;
    
    // Strength advantage
    if (attackerStrength > defenderStrength) {
      attackerWinChance += 10;
    } else if (attackerStrength < defenderStrength) {
      attackerWinChance -= 10;
    }

    // Territory bonus for defender
    const territoryData = await getTerritoryData(territoryId);
    if (territoryData && territoryData.owner_type === 'player') {
      attackerWinChance -= 5; // Defender advantage
    }

    // Random variance
    attackerWinChance += (Math.random() * 20 - 10); // -10 to +10

    // Clamp to 10-90%
    attackerWinChance = Math.max(10, Math.min(90, attackerWinChance));

    // Determine winner
    const random = Math.random() * 100;
    const attackerWins = random < attackerWinChance;

    // Calculate casualties
    const totalMilitary = attackerStrength + defenderStrength;
    const attackerCasualties = attackerWins 
      ? Math.floor(attackerStrength * (0.2 + Math.random() * 0.3)) // 20-50% losses
      : Math.floor(attackerStrength * (0.5 + Math.random() * 0.5)); // 50-100% losses
    
    const defenderCasualties = attackerWins
      ? Math.floor(defenderStrength * (0.5 + Math.random() * 0.5)) // 50-100% losses
      : Math.floor(defenderStrength * (0.2 + Math.random() * 0.3)); // 20-50% losses

    // Calculate rewards
    const rewards = {
      tokens: attackerWins ? 1 : 0,
      population: attackerWins ? Math.floor(territoryData?.population || 0 * 0.1) : 0
    };

    return {
      attackerWins,
      attackerWinChance,
      attackerCasualties,
      defenderCasualties,
      rewards,
      territoryId,
      newOwnerId: attackerWins ? attackerId : defenderId
    };
  } catch (error) {
    console.error('[BattleService] Error calculating battle:', error);
    throw error;
  }
}

/**
 * Retreat from battle
 * @param {string} battleId - Battle ID
 * @param {string} playerId - Player ID requesting retreat
 * @returns {Promise<object>} - Retreat result
 */
export async function retreatBattle(battleId, playerId) {
  try {
    console.log(`[BattleService] Player ${playerId} retreating from battle ${battleId}`);

    // Get battle state
    const battleState = await getBattle(battleId);
    if (!battleState) {
      throw new Error('Battle not found');
    }

    // Check if player is participant
    if (battleState.attackerId !== playerId && battleState.defenderId !== playerId) {
      throw new Error('Player is not a participant in this battle');
    }

    // Calculate retreat penalty (49.9% chance defender wins if attacker retreats)
    const isAttacker = battleState.attackerId === playerId;
    let retreatSuccess = false;

    if (isAttacker) {
      // Attacker retreating: 49.9% chance defender "wins" (gets bonus)
      const random = Math.random() * 100;
      retreatSuccess = random < 49.9;
    } else {
      // Defender retreating: always successful
      retreatSuccess = true;
    }

    // Update battle state
    battleState.status = 'retreat';
    battleState.endTime = Date.now();
    battleState.retreatPlayerId = playerId;
    battleState.retreatSuccess = retreatSuccess;

    // Apply retreat penalties
    if (!retreatSuccess) {
      // Retreat failed: 10% additional military loss
      if (isAttacker) {
        battleState.attackerCasualties += Math.floor(battleState.attackerStrength * 0.1);
      } else {
        battleState.defenderCasualties += Math.floor(battleState.defenderStrength * 0.1);
      }
    }

    // Update MySQL record
    await execute(
      `UPDATE battles SET status = 'retreat', end_time = NOW(), result = ? WHERE id = ?`,
      [JSON.stringify(battleState), battleId]
    );

    // Notify both players
    await notifyBattleResult(battleState);

    // Clean up battle state
    await removeBattle(battleId);

    return {
      success: true,
      retreatSuccess,
      battleState
    };
  } catch (error) {
    console.error('[BattleService] Error retreating from battle:', error);
    throw error;
  }
}

/**
 * Get battle status
 * @param {string} battleId - Battle ID
 * @returns {Promise<object|null>} - Battle state or null
 */
export async function getBattleStatus(battleId) {
  try {
    return await getBattle(battleId);
  } catch (error) {
    console.error('[BattleService] Error getting battle status:', error);
    throw error;
  }
}

/**
 * Validate if attack is legal
 * @param {string} attackerId - Attacker player ID
 * @param {string} defenderId - Defender player ID
 * @param {string} territoryId - Territory being attacked
 * @returns {Promise<string|null>} - Error message or null if valid
 */
async function validateAttack(attackerId, defenderId, territoryId) {
  try {
    // Check if players exist
    const attackerExists = await queryOne('SELECT id FROM users WHERE id = ?', [attackerId]);
    const defenderExists = await queryOne('SELECT id FROM users WHERE id = ?', [defenderId]);
    
    if (!attackerExists) return 'Attacker not found';
    if (!defenderExists) return 'Defender not found';

    // Check if territory exists
    const territory = await queryOne('SELECT * FROM territories WHERE id = ?', [territoryId]);
    if (!territory) return 'Territory not found';

    // Check if territory is adjacent to attacker's territory
    // TODO: Implement adjacency check using territory data
    // For now, assume valid

    // Check if attacker has military units
    const attackerData = await getPlayerGameData(attackerId);
    if (!attackerData || calculateMilitaryStrength(attackerData) <= 0) {
      return 'Attacker has no military units';
    }

    // Check if defender is online
    const defenderOnline = await setPlayerOnline(defenderId, null); // This is a stub
    // TODO: Implement proper online check

    return null; // Valid
  } catch (error) {
    console.error('[BattleService] Error validating attack:', error);
    return 'Validation error';
  }
}

/**
 * Get player game data
 * @param {string} playerId - Player ID
 * @returns {Promise<object>} - Player game data
 */
async function getPlayerGameData(playerId) {
  try {
    // Get game save data
    const gameSave = await queryOne(
      'SELECT save_data FROM game_saves WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [playerId]
    );

    if (gameSave && gameSave.save_data) {
      return typeof gameSave.save_data === 'string' 
        ? JSON.parse(gameSave.save_data) 
        : gameSave.save_data;
    }

    // Return default data if no save found
    return {
      military: 0,
      territories: [],
      cards: [],
      resources: { population: 0, gold: 0, food: 0, tokens: 0 }
    };
  } catch (error) {
    console.error('[BattleService] Error getting player game data:', error);
    throw error;
  }
}

/**
 * Calculate military strength from game data
 * @param {object} gameData - Player game data
 * @returns {number} - Military strength
 */
function calculateMilitaryStrength(gameData) {
  try {
    let strength = 0;

    // Base military from game data
    if (gameData.military) {
      strength += gameData.military;
    }

    // Add military from cards
    if (gameData.cards && Array.isArray(gameData.cards)) {
      gameData.cards.forEach(card => {
        if (card.military_units) {
          strength += card.military_units;
        }
      });
    }

    // Add military from territories
    if (gameData.territories && Array.isArray(gameData.territories)) {
      strength += gameData.territories.length * 10; // 10 strength per territory
    }

    return strength;
  } catch (error) {
    console.error('[BattleService] Error calculating military strength:', error);
    return 0;
  }
}

/**
 * Get territory data
 * @param {string} territoryId - Territory ID
 * @returns {Promise<object|null>} - Territory data or null
 */
async function getTerritoryData(territoryId) {
  try {
    return await queryOne('SELECT * FROM territories WHERE id = ?', [territoryId]);
  } catch (error) {
    console.error('[BattleService] Error getting territory data:', error);
    return null;
  }
}

/**
 * Simulate battle (async)
 * @param {string} battleId - Battle ID
 */
async function simulateBattle(battleId) {
  try {
    console.log(`[BattleService] Starting battle simulation for ${battleId}`);

    const battleState = await getBattle(battleId);
    if (!battleState) {
      console.error(`[BattleService] Battle ${battleId} not found`);
      return;
    }

    // Battle simulation loop
    const updateInterval = 2000; // 2 seconds per update
    const maxTurns = 10; // Max 10 turns

    for (let turn = 1; turn <= maxTurns; turn++) {
      // Check if battle still ongoing
      const currentState = await getBattle(battleId);
      if (!currentState || currentState.status !== 'ongoing') {
        console.log(`[BattleService] Battle ${battleId} ended before turn ${turn}`);
        break;
      }

      // Calculate turn result
      const turnResult = await calculateTurnResult(battleState, turn);
      battleState.turns.push(turnResult);
      battleState.currentTurn = turn;
      battleState.progress = (turn / maxTurns) * 100;

      // Update casualties
      battleState.attackerCasualties += turnResult.attackerCasualties;
      battleState.defenderCasualties += turnResult.defenderCasualties;

      // Update battle state in Redis
      await setBattle(battleId, battleState);

      // Notify players of update
      await notifyBattleUpdate(battleState);

      // Check if battle should end
      if (turnResult.battleEnded) {
        await endBattle(battleId, turnResult);
        break;
      }

      // Wait for next update
      await sleep(updateInterval);
    }

    // If battle didn't end naturally, calculate final result
    const finalState = await getBattle(battleId);
    if (finalState && finalState.status === 'ongoing') {
      await endBattle(battleId, await calculateFinalResult(battleState));
    }
  } catch (error) {
    console.error(`[BattleService] Error in battle simulation for ${battleId}:`, error);
  }
}

/**
 * Calculate turn result
 * @param {object} battleState - Current battle state
 * @param {number} turn - Turn number
 * @returns {Promise<object>} - Turn result
 */
async function calculateTurnResult(battleState, turn) {
  // Simplified turn calculation
  const attackerLoss = Math.floor(battleState.attackerStrength * (0.05 + Math.random() * 0.1)); // 5-15% per turn
  const defenderLoss = Math.floor(battleState.defenderStrength * (0.05 + Math.random() * 0.1));

  // Random chance of battle ending early (10% per turn after turn 3)
  let battleEnded = false;
  if (turn > 3 && Math.random() < 0.1) {
    battleEnded = true;
  }

  return {
    turn,
    attackerCasualties: attackerLoss,
    defenderCasualties: defenderLoss,
    battleEnded,
    timestamp: Date.now()
  };
}

/**
 * Calculate final result
 * @param {object} battleState - Current battle state
 * @returns {Promise<object>} - Final result
 */
async function calculateFinalResult(battleState) {
  // Determine winner based on remaining strength
  const attackerRemaining = battleState.attackerStrength - battleState.attackerCasualties;
  const defenderRemaining = battleState.defenderStrength - battleState.defenderCasualties;

  const attackerWins = attackerRemaining > defenderRemaining;

  return {
    turn: battleState.currentTurn,
    attackerWins,
    battleEnded: true,
    finalResult: true,
    attackerRemaining,
    defenderRemaining
  };
}

/**
 * End battle
 * @param {string} battleId - Battle ID
 * @param {object} finalResult - Final battle result
 */
async function endBattle(battleId, finalResult) {
  try {
    const battleState = await getBattle(battleId);
    if (!battleState) return;

    // Update battle state
    battleState.status = finalResult.attackerWins ? 'attacker_wins' : 'defender_wins';
    battleState.endTime = Date.now();
    battleState.finalResult = finalResult;

    // Update MySQL record
    await execute(
      `UPDATE battles SET status = ?, end_time = NOW(), result = ? WHERE id = ?`,
      [battleState.status, JSON.stringify(battleState), battleId]
    );

    // Update leaderboard
    await updateLeaderboard('pvp_wins', 'daily', 
      finalResult.attackerWins ? battleState.attackerId : battleState.defenderId, 1);

    // Notify players of result
    await notifyBattleResult(battleState);

    // Clean up battle state after delay
    setTimeout(async () => {
      await removeBattle(battleId);
      console.log(`[BattleService] Cleaned up battle ${battleId}`);
    }, 60000); // 1 minute delay

  } catch (error) {
    console.error(`[BattleService] Error ending battle ${battleId}:`, error);
  }
}

/**
 * Notify players that battle started
 * @param {object} battleState - Battle state
 */
async function notifyBattleStarted(battleState) {
  try {
    const message = {
      type: 'battle_started',
      payload: {
        battleId: battleState.battleId,
        attackerId: battleState.attackerId,
        defenderId: battleState.defenderId,
        territoryId: battleState.territoryId,
        startTime: battleState.startTime
      },
      timestamp: Date.now()
    };

    await sendToPlayer(battleState.attackerId, message);
    await sendToPlayer(battleState.defenderId, message);
  } catch (error) {
    console.error('[BattleService] Error notifying battle started:', error);
  }
}

/**
 * Notify players of battle update
 * @param {object} battleState - Battle state
 */
async function notifyBattleUpdate(battleState) {
  try {
    const message = {
      type: 'battle_update',
      payload: {
        battleId: battleState.battleId,
        status: battleState.status,
        progress: battleState.progress,
        attackerCasualties: battleState.attackerCasualties,
        defenderCasualties: battleState.defenderCasualties,
        currentTurn: battleState.currentTurn
      },
      timestamp: Date.now()
    };

    await sendToPlayer(battleState.attackerId, message);
    await sendToPlayer(battleState.defenderId, message);
  } catch (error) {
    console.error('[BattleService] Error notifying battle update:', error);
  }
}

/**
 * Notify players of battle result
 * @param {object} battleState - Battle state
 */
async function notifyBattleResult(battleState) {
  try {
    const message = {
      type: 'battle_result',
      payload: {
        battleId: battleState.battleId,
        status: battleState.status,
        territoryId: battleState.territoryId,
        newOwnerId: battleState.status === 'attacker_wins' ? battleState.attackerId : battleState.defenderId,
        attackerCasualties: battleState.attackerCasualties,
        defenderCasualties: battleState.defenderCasualties,
        rewards: battleState.finalResult?.rewards || {}
      },
      timestamp: Date.now()
    };

    await sendToPlayer(battleState.attackerId, message);
    await sendToPlayer(battleState.defenderId, message);
  } catch (error) {
    console.error('[BattleService] Error notifying battle result:', error);
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
