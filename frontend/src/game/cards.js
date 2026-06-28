/**
 * Cards Module
 * Handles card collection and permanent effects application
 */

import { GameState } from './GameState.js';

export const Cards = {
  /**
   * Acquire a card
   * Permanently add card effects to player's totals
   */
  acquireCard(card) {
    // Add to player's card collection
    if (!GameState.player.cards) {
      GameState.player.cards = [];
    }
    GameState.player.cards.push(card);

    // Apply permanent effects
    this.applyCardEffects(card);

    return {
      success: true,
      card: card,
      player: GameState.player,
    };
  },

  /**
   * Apply card effects to player's totals
   */
  applyCardEffects(card) {
    // Population
    if (card.population) {
      GameState.player.population += card.population;
    }

    // Military
    if (card.military) {
      if (!GameState.player.military) {
        GameState.player.military = 0;
      }
      GameState.player.military += card.military;
    }

    // Gold
    if (card.gold) {
      if (!GameState.player.gold) {
        GameState.player.gold = 0;
      }
      GameState.player.gold += card.gold;
    }

    // Food
    if (card.food) {
      if (!GameState.player.food) {
        GameState.player.food = 0;
      }
      GameState.player.food += card.food;
    }

    // Infrastructure
    this.applyInfrastructure(card);
  },

  /**
   * Apply infrastructure from card
   */
  applyInfrastructure(card) {
    if (!GameState.player.infrastructure) {
      GameState.player.infrastructure = {
        totalAirports: 0,
        totalTrainStations: 0,
        totalMilitaryUnits: 0,
      };
    }

    if (card.airports) {
      GameState.player.infrastructure.totalAirports += card.airports;
    }
    if (card.trainStations) {
      GameState.player.infrastructure.totalTrainStations += card.trainStations;
    }
    if (card.militaryUnits) {
      GameState.player.infrastructure.totalMilitaryUnits += card.militaryUnits;
    }
  },

  /**
   * Purchase a card pack
   * Cost: 5 tokens
   * Returns a random card based on rarity weight
   */
  purchaseCardPack() {
    const cost = { tokens: 5 };

    if (!GameState.player.tokens || GameState.player.tokens < cost.tokens) {
      return {
        success: false,
        error: 'Insufficient tokens',
        required: cost,
      };
    }

    // Deduct tokens
    GameState.player.tokens -= cost.tokens;

    // Get random card from database (in production, this would call backend API)
    const card = this.getRandomCard();
    
    // Acquire card
    this.acquireCard(card);

    return {
      success: true,
      card: card,
      tokensRemaining: GameState.player.tokens,
    };
  },

  /**
   * Get random card (mock implementation)
   * In production, this would fetch from backend
   */
  getRandomCard() {
    // Mock card database
    const mockCards = [
      { name: 'Beijing', rarity: 'legendary', population: 20000, military: 5000, gold: 1000, food: 500, airports: 2, trainStations: 5, militaryUnits: 10 },
      { name: 'Shanghai', rarity: 'legendary', population: 25000, military: 4000, gold: 2000, food: 600, airports: 2, trainStations: 4, militaryUnits: 8 },
      { name: 'Tianjin', rarity: 'rare', population: 5000, military: 2000, gold: 500, food: 200, airports: 1, trainStations: 2, militaryUnits: 3 },
    ];

    // Rarity weights: Common 40%, Rare 25%, Super Rare 15%, Mythic 10%, Legendary 7%, Ultra Legendary 3%
    const weights = {
      common: 40,
      rare: 25,
      super_rare: 15,
      mythic: 10,
      legendary: 7,
      ultra_legendary: 3,
    };

    // Simple random selection (in production, use proper weighted random)
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [rarity, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        // Return a card with this rarity
        const card = mockCards.find(c => c.rarity === rarity) || mockCards[0];
        return { ...card, rarity };
      }
    }

    return mockCards[0];
  },

  /**
   * Get card collection for display
   */
  getCollection() {
    return GameState.player.cards || [];
  },
};

export default Cards;
