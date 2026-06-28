/**
 * Resources Module
 * Handles resource calculation loop (T031-T032, T037)
 * Population auto-grow, food consumption, starvation penalty, gift packages
 */

import { GameState } from './GameState.js';

export const Resources = {
  populationInterval: null,
  foodInterval: null,

  /**
   * Initialize resources in player object (T030)
   */
  init() {
    if (!GameState.player.resources) {
      GameState.player.resources = {
        population: GameState.player.population || 20000,
        gold: GameState.player.gold || 0,
        food: GameState.player.food || 500,
        tokens: GameState.player.tokens || 10,
      };
    }

    // Start resource calculation loops (T031)
    this.startPopulationGrowth();
    this.startFoodConsumption();

    console.log('Resources module initialized');
  },

  /**
   * Start population growth loop (T031)
   * Population auto-grows every 10s based on territories
   */
  startPopulationGrowth() {
    if (this.populationInterval) {
      clearInterval(this.populationInterval);
    }

    this.populationInterval = setInterval(() => {
      this.calculatePopulationGrowth();
    }, 10000); // Every 10 seconds
  },

  /**
   * Calculate population growth (T031)
   * Population auto-grows every 10s based on territories
   */
  calculatePopulationGrowth() {
    const territoryCount = (GameState.player.territories || []).length;
    const growthRate = territoryCount * 100; // 100 population per territory per 10s

    if (growthRate > 0) {
      GameState.player.resources.population += growthRate;

      // Dispatch event
      const event = new CustomEvent('population-grown', {
        detail: { amount: growthRate, total: GameState.player.resources.population }
      });
      document.dispatchEvent(event);
    }

    return growthRate;
  },

  /**
   * Start food consumption loop (T031)
   * Food consumed by military every minute
   */
  startFoodConsumption() {
    if (this.foodInterval) {
      clearInterval(this.foodInterval);
    }

    this.foodInterval = setInterval(() => {
      this.calculateFoodConsumption();
    }, 60000); // Every minute
  },

  /**
   * Calculate food consumption (T031)
   * Food consumed by military every minute
   */
  calculateFoodConsumption() {
    const militaryCount = GameState.player.military || 0;
    const consumptionRate = Math.floor(militaryCount / 10); // 1 food per 10 military per minute

    if (consumptionRate > 0) {
      GameState.player.resources.food -= consumptionRate;

      // Starvation penalty (T032)
      if (GameState.player.resources.food <= 0) {
        GameState.player.resources.food = 0;
        this.applyStarvationPenalty();
      }

      // Dispatch event
      const event = new CustomEvent('food-consumed', {
        detail: { amount: consumptionRate, remaining: GameState.player.resources.food }
      });
      document.dispatchEvent(event);
    }

    return consumptionRate;
  },

  /**
   * Apply starvation penalty (T032)
   * If food = 0 → military strength decreases by 10% per minute
   */
  applyStarvationPenalty() {
    const militaryCount = GameState.player.military || 0;
    const penalty = Math.floor(militaryCount * 0.1); // 10% penalty per minute
    GameState.player.military = Math.max(0, militaryCount - penalty);

    // Dispatch event
    const event = new CustomEvent('starvation-penalty', {
      detail: { penalty: penalty, military: GameState.player.military }
    });
    document.dispatchEvent(event);

    console.warn(`Starvation penalty applied: -${penalty} military`);
  },

  /**
   * Add gold (from chests or admin gifts) (T037)
   */
  addGold(amount) {
    GameState.player.resources.gold += amount;

    // Dispatch event
    const event = new CustomEvent('gold-received', {
      detail: { amount: amount, total: GameState.player.resources.gold }
    });
    document.dispatchEvent(event);

    return GameState.player.resources.gold;
  },

  /**
   * Add resource (generic)
   */
  addResource(type, amount) {
    if (!GameState.player.resources[type]) {
      GameState.player.resources[type] = 0;
    }

    GameState.player.resources[type] += amount;

    // Dispatch event
    const event = new CustomEvent('resource-received', {
      detail: { type: type, amount: amount, total: GameState.player.resources[type] }
    });
    document.dispatchEvent(event);

    return GameState.player.resources[type];
  },

  /**
   * Consume resources (for training, building, etc.)
   */
  consumeResources(cost) {
    if (!this.hasResources(cost)) {
      return false;
    }

    if (cost.population) GameState.player.resources.population -= cost.population;
    if (cost.gold) GameState.player.resources.gold -= cost.gold;
    if (cost.food) GameState.player.resources.food -= cost.food;
    if (cost.tokens) GameState.player.resources.tokens -= cost.tokens;

    // Dispatch event
    const event = new CustomEvent('resources-consumed', {
      detail: { cost: cost }
    });
    document.dispatchEvent(event);

    return true;
  },

  /**
   * Check if player has resources (T025)
   */
  hasResources(cost) {
    if (cost.population && GameState.player.resources.population < cost.population) return false;
    if (cost.gold && GameState.player.resources.gold < cost.gold) return false;
    if (cost.food && GameState.player.resources.food < cost.food) return false;
    if (cost.tokens && GameState.player.resources.tokens < cost.tokens) return false;
    return true;
  },

  /**
   * Check if player can afford a cost
   * Alias for hasResources()
   */
  canAfford(cost) {
    return this.hasResources(cost);
  },

  /**
   * Receive gift package (T037)
   * Admin distributes gift packages → gold added to player.resources.gold
   */
  receiveGiftPackage(giftData) {
    if (!giftData || !giftData.resources) {
      return { success: false, error: 'Invalid gift data' };
    }

    // Add resources from gift
    for (const [resource, amount] of Object.entries(giftData.resources)) {
      this.addResource(resource, amount);
    }

    // Dispatch event
    const event = new CustomEvent('gift-package-received', {
      detail: { giftData: giftData }
    });
    document.dispatchEvent(event);

    return {
      success: true,
      resources: giftData.resources,
    };
  },

  /**
   * Get resource display data (T033)
   */
  getDisplayData() {
    return {
      population: GameState.player.resources.population || 0,
      gold: GameState.player.resources.gold || 0,
      food: GameState.player.resources.food || 0,
      tokens: GameState.player.resources.tokens || 0,
    };
  },

  /**
   * Stop resource loops
   */
  stop() {
    if (this.populationInterval) {
      clearInterval(this.populationInterval);
      this.populationInterval = null;
    }

    if (this.foodInterval) {
      clearInterval(this.foodInterval);
      this.foodInterval = null;
    }
  }
};

export default Resources;
