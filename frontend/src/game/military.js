/**
 * Military Module
 * Handles military training system (T025)
 */

import { GameState } from './GameState.js';
import Resources from './resources.js';

export const Military = {
  trainingQueue: [],
  autoTrainInterval: null,

  /**
   * Train military units (T025)
   * Cost: 1k population + 5 tokens per 10 military
   * Training time: 30 seconds per 10 units
   */
  trainMilitary(count = 10) {
    const cost = this.getTrainingCost(count);

    // Check resources
    if (!Resources.hasResources(cost)) {
      return {
        success: false,
        error: 'Insufficient resources',
        required: cost,
      };
    }

    // Consume resources
    if (!Resources.consumeResources(cost)) {
      return {
        success: false,
        error: 'Failed to consume resources',
      };
    }

    // Add to training queue
    const trainingItem = {
      id: Date.now(),
      count: count,
      progress: 0,
      startTime: Date.now(),
      duration: 30000, // 30 seconds per 10 units
    };

    this.trainingQueue.push(trainingItem);

    // Start training progress if not already running
    if (!this.autoTrainInterval) {
      this.startTrainingProgress();
    }

    // Dispatch event
    const event = new CustomEvent('military-training-started', {
      detail: { count: count, queueLength: this.trainingQueue.length }
    });
    document.dispatchEvent(event);

    return {
      success: true,
      military: GameState.player.military || 0,
      cost: cost,
      queueLength: this.trainingQueue.length,
    };
  },

  /**
   * Start training progress monitoring
   */
  startTrainingProgress() {
    if (this.autoTrainInterval) {
      clearInterval(this.autoTrainInterval);
    }

    this.autoTrainInterval = setInterval(() => {
      this.updateTrainingProgress();
    }, 1000); // Update every second
  },

  /**
   * Update training progress
   */
  updateTrainingProgress() {
    const now = Date.now();
    let completed = false;

    this.trainingQueue = this.trainingQueue.filter(item => {
      const elapsed = now - item.startTime;
      item.progress = Math.min(100, (elapsed / item.duration) * 100);

      // Check if training complete
      if (item.progress >= 100) {
        // Add military to player
        if (!GameState.player.military) {
          GameState.player.military = 0;
        }
        GameState.player.military += item.count;

        // Dispatch event
        const event = new CustomEvent('military-trained', {
          detail: { count: item.count, total: GameState.player.military }
        });
        document.dispatchEvent(event);

        completed = true;
        return false; // Remove from queue
      }

      return true; // Keep in queue
    });

    // Stop interval if queue is empty
    if (this.trainingQueue.length === 0) {
      if (this.autoTrainInterval) {
        clearInterval(this.autoTrainInterval);
        this.autoTrainInterval = null;
      }
    }

    // Auto-train if enabled
    if (completed && GameState.player.autoTrain) {
      this.trainMilitary(10);
    }
  },

  /**
   * Toggle auto-train
   */
  toggleAutoTrain() {
    GameState.player.autoTrain = !GameState.player.autoTrain;

    if (GameState.player.autoTrain && this.trainingQueue.length === 0) {
      // Start training if auto-train enabled and queue is empty
      this.trainMilitary(10);
    }

    // Dispatch event
    const event = new CustomEvent('auto-train-toggled', {
      detail: { enabled: GameState.player.autoTrain }
    });
    document.dispatchEvent(event);

    return GameState.player.autoTrain;
  },

  /**
   * Get military strength (with card and infrastructure bonuses) (T025)
   */
  getMilitaryStrength() {
    let strength = GameState.player.military || 0;

    // Add card bonuses
    if (GameState.player.cards) {
      for (const card of GameState.player.cards) {
        strength += card.military || 0;
      }
    }

    // Add infrastructure bonuses (barracks, etc.)
    if (GameState.player.infrastructure) {
      const barracks = GameState.player.infrastructure.barracks || 0;
      strength += barracks * 10; // +10 military per barracks
    }

    return strength;
  },

  /**
   * Calculate military advantage in battle (T025)
   */
  calculateAdvantage(enemyMilitary) {
    const myStrength = this.getMilitaryStrength();
    const ratio = myStrength / (enemyMilitary || 1);
    return ratio - 1; // -1 to infinity, 0 = equal, >0 = advantage, <0 = disadvantage
  },

  /**
   * Get training cost for display (T025)
   */
  getTrainingCost(count = 10) {
    return {
      population: 1000 * (count / 10),
      tokens: 5 * (count / 10),
    };
  },

  /**
   * Get training queue status (T025)
   */
  getTrainingQueue() {
    return this.trainingQueue.map(item => ({
      count: item.count,
      progress: Math.round(item.progress),
      remainingTime: Math.max(0, item.duration - (Date.now() - item.startTime)),
    }));
  },

  /**
   * Cancel training (T025)
   */
  cancelTraining(index) {
    if (index >= 0 && index < this.trainingQueue.length) {
      const item = this.trainingQueue[index];
      // Refund resources
      const refund = this.getTrainingCost(item.count);
      if (GameState.player.resources) {
        GameState.player.resources.population = (GameState.player.resources.population || 0) + refund.population;
        GameState.player.resources.tokens = (GameState.player.resources.tokens || 0) + refund.tokens;
      }

      this.trainingQueue.splice(index, 1);

      // Dispatch event
      const event = new CustomEvent('military-training-cancelled', {
        detail: { index: index, refunded: refund }
      });
      document.dispatchEvent(event);

      return true;
    }
    return false;
  },

  /**
   * Get military details for display
   */
  getMilitaryDetails() {
    const base = GameState.player.military || 0;
    let cardBonus = 0;
    let infrastructureBonus = 0;

    // Calculate card bonus
    if (GameState.player.cards) {
      for (const card of GameState.player.cards) {
        cardBonus += card.military || 0;
      }
    }

    // Calculate infrastructure bonus
    if (GameState.player.infrastructure) {
      const barracks = GameState.player.infrastructure.barracks || 0;
      infrastructureBonus = barracks * 10;
    }

    return {
      base: base,
      cardBonus: cardBonus,
      infrastructureBonus: infrastructureBonus,
      total: base + cardBonus + infrastructureBonus,
    };
  }
};

export default Military;
