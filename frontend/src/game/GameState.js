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
        currentWorld: "earth"
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

    getCurrentCountries() {
        if (this.player.marsUnlocked && this.player.currentWorld === "mars") {
            return this.marsCountries;
        }
        return this.countries;
    }
};
