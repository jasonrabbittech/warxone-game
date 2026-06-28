import { countries } from './countries.js';
import { marsCountries } from './marsCountries.js';
import { countryPaths } from './countryPaths.js';
import { marsCountryPaths } from './marsPaths.js';
import { cardRarities } from './cardRarities.js';
import { quizQuestions } from './quizQuestions.js';
import { giftCodes } from './giftCodes.js';

export const GameState = {
    player: {
        email: "",
        signedUp: false,
        countryName: "Ironhaven",
        capitalName: "Fortress",
        flag: "\u{1F1EB}\u{1F1F7}",
        startingCountry: "france",
        tokens: 10,
        population: 20000,
        level: 1,
        territories: [],
        cards: [],
        alliance: null,
        createdAt: null,
        quizTaken: false,
        language: "en",
        marsUnlocked: false,
        currentWorld: "earth",
        gold: 0,
        food: 500,
        military: 0,
        infrastructure: {
            totalAirports: 0,
            totalTrainStations: 0,
            totalMilitaryUnits: 0,
        }
    },
    countries,
    marsCountries,
    countryPaths,
    marsCountryPaths,
    cardRarities,
    quizQuestions,
    giftCodes,
    battle: { active: false, attacker: null, defender: null, turn: 0, interval: null },
    alliances: { nextId: 1, list: {} },
    cooldowns: { global: 0, targetImmunity: {} },
    connections: [],
    chests: {},
    usedGiftCodes: [],
    lastDailyCollect: null,
    gameTime: 0,
    lastTick: Date.now(),
    marsStoryShown: false,
    quizScore: 0,
    quizCurrentQuestion: 0,
    _saveRetries: 0,
    _maxRetries: 3,
    _autoSaveInterval: null,

    getCurrentCountries() {
        if (this.player.marsUnlocked && this.player.currentWorld === "mars") {
            return this.marsCountries;
        }
        return this.countries;
    },

    /**
     * Save game state with silent failure + retry logic
     * Retries up to 3 times, then falls back to localStorage
     */
    async save() {
        const state = JSON.parse(JSON.stringify(this.player)); // Deep clone

        for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
            try {
                // Try cloud save
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No auth token');
                }

                const response = await fetch('/api/game/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ gameState: state }),
                });

                if (response.ok) {
                    this._saveRetries = 0;
                    console.log('Game saved to cloud');
                    return { success: true, source: 'cloud' };
                }

                // If not last attempt, retry
                if (attempt < this._maxRetries) {
                    console.warn(`Save attempt ${attempt + 1} failed, retrying...`);
                    await this._delay(1000 * (attempt + 1)); // Exponential backoff
                }
            } catch (error) {
                console.warn(`Save attempt ${attempt + 1} failed:`, error.message);

                // If not last attempt, retry
                if (attempt < this._maxRetries) {
                    await this._delay(1000 * (attempt + 1));
                }
            }
        }

        // All retries failed, fallback to localStorage
        console.warn('Cloud save failed after 3 retries, falling back to localStorage');
        try {
            localStorage.setItem('warxone_save', JSON.stringify(state));
            return { success: true, source: 'localStorage' };
        } catch (error) {
            console.error('localStorage save failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Load game state with fallback
     */
    async load() {
        // Try cloud load first
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No auth token');
            }

            const response = await fetch('/api/game/load', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.player = { ...this.player, ...data.data.gameState };
                    console.log('Game loaded from cloud');
                    return { success: true, source: 'cloud', data: data.data };
                }
            }
        } catch (error) {
            console.warn('Cloud load failed, trying localStorage:', error.message);
        }

        // Fallback to localStorage
        try {
            const data = localStorage.getItem('warxone_save');
            if (data) {
                this.player = { ...this.player, ...JSON.parse(data) };
                console.log('Game loaded from localStorage');
                return { success: true, source: 'localStorage' };
            }
        } catch (error) {
            console.error('localStorage load failed:', error);
        }

        return { success: false, error: 'No save found' };
    },

    /**
     * Start auto-save (every 30 seconds)
     */
    startAutoSave() {
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
        }

        this._autoSaveInterval = setInterval(() => {
            this.save().catch(error => {
                console.error('Auto-save failed:', error);
            });
        }, 30000); // 30 seconds

        console.log('Auto-save started (every 30s)');
    },

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
            this._autoSaveInterval = null;
            console.log('Auto-save stopped');
        }
    },

    /**
     * Delay helper for retry backoff
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
