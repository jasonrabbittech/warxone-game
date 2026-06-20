// WarXone - Main Entry Point
// Phase 1: Imports all modules and bootstraps the game

// Styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map.css';
import './styles/battlefield.css';
import './styles/responsive.css';

// Game data & state
import { GameState } from './game/GameState.js';

// Audio
import { SFX, playTone, getAudioCtx } from './audio/SoundEngine.js';

// i18n
import { t, setLanguage, getCurrentLanguage } from './i18n/index.js';

// API stub (localStorage for now, will be replaced with real API in Phase 3)
const api = {
    save(state) {
        try {
            localStorage.setItem('warxone_save', JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },
    load() {
        try {
            const data = localStorage.getItem('warxone_save');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    },
    delete() {
        localStorage.removeItem('warxone_save');
    }
};

// ==================== WARXONE GAME CLASS ====================
class WarXoneGame {
    constructor() {
        this.timers = [];
        this.init();
    }

    init() {
        this.setupEventDelegation();
        this.setupLanguageSelectors();
        this.checkAutoLogin();
    }

    // ---- Event Delegation ----
    setupEventDelegation() {
        document.getElementById('game-container').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            this.handleAction(action, btn, e);
        });
    }

    handleAction(action, btn, e) {
        SFX.buttonClick();
        switch (action) {
            case 'new-game': this.showScreen('signup-screen'); break;
            case 'load-game': this.loadGame(); break;
            case 'story': this.showStory(); break;
            case 'settings': this.showScreen('settings-screen'); break;
            case 'how-to-play': this.showTutorial(); break;
            case 'back-to-menu': this.showScreen('main-menu'); break;
            case 'signup': this.handleSignup(); break;
            case 'start-game': this.handleStartGame(); break;
            case 'switch-earth': this.switchWorld('earth'); break;
            case 'switch-mars': this.switchWorld('mars'); break;
            case 'zoom-in': this.zoomMap(1.2); break;
            case 'zoom-out': this.zoomMap(0.8); break;
            case 'zoom-reset': this.resetMapZoom(); break;
            case 'nav-map': this.showScreen('map-screen'); break;
            case 'nav-cards': this.showCardsScreen(); break;
            case 'nav-shop': this.showShopScreen(); break;
            case 'nav-alliance': this.showAllianceScreen(); break;
            case 'nav-quiz': this.showQuizScreen(); break;
            case 'nav-settings': this.showSettingsScreen(); break;
            case 'auto-battle': this.autoBattle(); break;
            case 'retreat': this.retreatBattle(); break;
            case 'save-game': this.saveGame(); break;
            case 'resume': this.togglePause(); break;
            case 'quit-to-menu': this.quitToMenu(); break;
            case 'close-tutorial': this.closeModal('tutorial-modal'); break;
            case 'close-story': this.closeModal('story-modal'); break;
            case 'mars-story-accept': this.acceptMars(); break;
            case 'mars-story-skip': this.skipMars(); break;
            case 'toggle-mobile-nav': this.toggleMobileNav(); break;
            default: break;
        }
    }

    // ---- Screen Management ----
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(id);
        if (screen) screen.classList.add('active');
    }

    // ---- Auth ----
    checkAutoLogin() {
        const saved = api.load();
        if (saved && saved.player && saved.player.signedUp) {
            // Auto-login is available
        }
    }

    handleSignup() {
        const email = document.getElementById('signup-email').value.trim();
        const pw = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm-password').value;
        if (!email || !pw) { this.notify('Error', 'Please fill all fields'); SFX.error(); return; }
        if (pw.length < 8) { this.notify('Error', 'Password must be at least 8 characters'); SFX.error(); return; }
        if (pw !== confirm) { this.notify('Error', 'Passwords do not match'); SFX.error(); return; }
        GameState.player.email = email;
        GameState.player.signedUp = true;
        GameState.player.createdAt = Date.now();
        this.showScreen('setup-screen');
        this.populateStartingCountries();
    }

    // ---- Game Setup ----
    populateStartingCountries() {
        const select = document.getElementById('starting-country');
        if (!select) return;
        select.innerHTML = '';
        for (const [id, c] of Object.entries(GameState.countries)) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = c.name;
            select.appendChild(opt);
        }
    }

    handleStartGame() {
        const name = document.getElementById('country-name').value.trim() || 'Ironhaven';
        const capital = document.getElementById('capital-name').value.trim() || 'Fortress';
        const flag = document.getElementById('flag-select').value;
        const startCountry = document.getElementById('starting-country').value;

        GameState.player.countryName = name;
        GameState.player.capitalName = capital;
        GameState.player.flag = flag;
        GameState.player.startingCountry = startCountry;

        // Conquer starting country
        if (GameState.countries[startCountry]) {
            GameState.countries[startCountry].owner = 'player';
            GameState.player.territories.push(startCountry);
        }

        // Assign chests to some countries
        this.assignChests();

        this.showScreen('map-screen');
        this.drawMap();
        this.updateUI();
        this.startGameLoop();
        this.saveGame();
    }

    assignChests() {
        const allCountries = Object.keys(GameState.countries);
        GameState.chests = {};
        // Place chests on ~8 random non-starting countries
        const others = allCountries.filter(c => c !== GameState.player.startingCountry);
        for (let i = 0; i < Math.min(8, others.length); i++) {
            const idx = Math.floor(Math.random() * others.length);
            GameState.chests[others[idx]] = true;
            others.splice(idx, 1);
        }
    }

    // ---- Map ----
    drawMap() {
        const svg = document.getElementById('map-svg');
        if (!svg) return;

        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;
        const paths = isMars ? GameState.marsPaths : GameState.countryPaths;

        svg.innerHTML = '';

        for (const [id, country] of Object.entries(countries)) {
            const pathData = paths[id];
            if (!pathData) continue;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('data-country', id);
            path.classList.add('country-path');

            if (country.owner === 'player') {
                path.classList.add(isMars ? 'mars-owned' : 'owned');
            } else if (this.isAdjacent(id)) {
                path.classList.add(isMars ? 'mars-adjacent' : 'adjacent');
            } else if (country.owner !== 'player') {
                path.classList.add(isMars ? 'mars-enemy' : 'enemy');
            }

            path.addEventListener('click', () => this.selectCountry(id));
            svg.appendChild(path);

            // Country label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.classList.add('country-label');
            const bbox = path.getBBox();
            label.setAttribute('x', bbox.x + bbox.width / 2);
            label.setAttribute('y', bbox.y + bbox.height / 2);
            label.textContent = country.name.substring(0, 6);
            svg.appendChild(label);

            // Chest icon
            if (GameState.chests[id] && country.owner !== 'player') {
                const chest = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                chest.classList.add('chest-icon');
                chest.setAttribute('x', bbox.x + bbox.width / 2);
                chest.setAttribute('y', bbox.y + 8);
                chest.textContent = '🧰';
                svg.appendChild(chest);
            }
        }
    }

    isAdjacent(countryId) {
        const owned = GameState.player.territories;
        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;
        const country = countries[countryId];
        if (!country || country.owner === 'player') return false;

        return owned.some(ownedId => {
            const ownedCountry = countries[ownedId];
            return ownedCountry && ownedCountry.adjacent && ownedCountry.adjacent.includes(countryId);
        });
    }

    selectCountry(id) {
        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;
        const country = countries[id];
        if (!country) return;

        if (country.owner === 'player') {
            // Show country info
            this.notify(country.name, `Pop: ${this.formatPop(country.pop)} | Military: ${country.military}`);
        } else if (this.isAdjacent(id)) {
            // Attack
            this.startBattle(id);
        } else {
            this.notify(country.name, 'Not adjacent to your territories');
        }
    }

    // ---- Battle ----
    startBattle(countryId) {
        if (GameState.cooldowns.global > Date.now()) {
            this.notify('Cooldown', 'Wait for the cooldown to finish');
            return;
        }

        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;
        const defender = countries[countryId];
        if (!defender) return;

        const attackerPop = GameState.player.population;
        const defenderPop = defender.pop;

        GameState.battle = {
            active: true,
            targetCountry: countryId,
            attacker: { name: GameState.player.countryName, pop: attackerPop, military: this.getTotalMilitary() },
            defender: { name: defender.name, pop: defenderPop, military: defender.military },
            turn: 0,
            interval: null
        };

        // Show battlefield
        const overlay = document.getElementById('battlefield-overlay');
        overlay.classList.add('active');
        document.getElementById('attacker-name').textContent = GameState.battle.attacker.name;
        document.getElementById('defender-name').textContent = GameState.battle.defender.name;
        document.getElementById('attacker-pop').textContent = this.formatPop(attackerPop);
        document.getElementById('defender-pop').textContent = this.formatPop(defenderPop);
        document.getElementById('battle-log').innerHTML = '';

        SFX.battleStart();
    }

    autoBattle() {
        if (!GameState.battle || !GameState.battle.active) return;

        const battle = GameState.battle;
        const attDmg = battle.defender.military * 1000;
        const defDmg = battle.attacker.military * 1000;

        if (attDmg > defDmg) {
            this.resolveBattle(true);
        } else {
            this.resolveBattle(false);
        }
    }

    retreatBattle() {
        if (GameState.battle) {
            GameState.battle.active = false;
            if (GameState.battle.interval) clearInterval(GameState.battle.interval);
        }
        document.getElementById('battlefield-overlay').classList.remove('active');
    }

    resolveBattle(victory) {
        const battle = GameState.battle;
        if (!battle) return;

        battle.active = false;
        if (battle.interval) clearInterval(battle.interval);

        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;

        if (victory) {
            SFX.victory();
            const countryId = battle.targetCountry;
            countries[countryId].owner = 'player';
            GameState.player.territories.push(countryId);

            // Rewards
            GameState.player.tokens += 2;

            // Check for chest
            if (GameState.chests[countryId]) {
                delete GameState.chests[countryId];
                this.notify('Victory!', `Conquered ${countries[countryId].name}! Found a chest! +2 tokens`);
            } else {
                this.notify('Victory!', `Conquered ${countries[countryId].name}! +2 tokens`);
            }

            // Check Mars unlock (90% of Earth)
            if (!isMars && !GameState.player.marsUnlocked) {
                const total = Object.keys(GameState.countries).length;
                const owned = GameState.player.territories.filter(t => GameState.countries[t]).length;
                if (owned / total >= 0.9) {
                    GameState.player.marsUnlocked = true;
                    SFX.marsDiscovered();
                    this.showModal('mars-story-modal');
                }
            }

            // Cooldown
            GameState.cooldowns.global = Date.now() + 30000;
            this.showCooldown();
        } else {
            SFX.defeat();
            this.notify('Defeat', `Failed to conquer ${countries[battle.targetCountry]?.name}`);
        }

        document.getElementById('battlefield-overlay').classList.remove('active');
        this.drawMap();
        this.updateUI();
        this.saveGame();
    }

    showCooldown() {
        const el = document.getElementById('cooldown-timer-display');
        el.style.display = 'block';
        const update = () => {
            const remaining = Math.max(0, GameState.cooldowns.global - Date.now());
            if (remaining <= 0) {
                el.style.display = 'none';
                return;
            }
            document.getElementById('cooldown-timer-value').textContent = Math.ceil(remaining / 1000);
            requestAnimationFrame(update);
        };
        update();
    }

    // ---- World Switching ----
    switchWorld(world) {
        if (world === 'mars' && !GameState.player.marsUnlocked) {
            this.notify('Locked', 'Conquer 90% of Earth to unlock Mars');
            return;
        }
        GameState.player.currentWorld = world;
        this.drawMap();
        this.updateUI();

        // Update toggle buttons
        document.querySelectorAll('.world-toggle button').forEach(b => b.classList.remove('active'));
        const btn = world === 'mars' ? document.querySelector('[data-action="switch-mars"]') : document.querySelector('[data-action="switch-earth"]');
        if (btn) btn.classList.add('active');
    }

    // ---- Map Zoom ----
    zoomMap(factor) {
        const svg = document.getElementById('map-svg');
        if (!svg) return;
        const current = svg.style.transform || 'scale(1)';
        const match = current.match(/scale\(([\d.]+)\)/);
        const scale = match ? Math.min(Math.max(parseFloat(match[1]) * factor, 0.5), 5) : factor;
        svg.style.transform = `scale(${scale})`;
        svg.style.transformOrigin = 'center';
    }

    resetMapZoom() {
        const svg = document.getElementById('map-svg');
        if (svg) svg.style.transform = 'scale(1)';
    }

    // ---- UI Updates ----
    updateUI() {
        const el = (id) => document.getElementById(id);
        if (el('player-flag')) el('player-flag').textContent = GameState.player.flag;
        if (el('token-count')) el('token-count').textContent = GameState.player.tokens;
        if (el('population-count')) el('population-count').textContent = this.formatPop(GameState.player.population);
        if (el('level-display')) el('level-display').textContent = GameState.player.level;
        if (el('card-count')) el('card-count').textContent = GameState.player.cards.length;
    }

    // ---- Game Loop ----
    startGameLoop() {
        // Population growth every 10 seconds
        const popTimer = setInterval(() => {
            const owned = GameState.player.territories.length;
            GameState.player.population += owned * 100;
            this.updateUI();
        }, 10000);
        this.timers.push(popTimer);

        // Auto-save every 30 seconds
        const saveTimer = setInterval(() => this.saveGame(), 30000);
        this.timers.push(saveTimer);
    }

    // ---- Save/Load ----
    saveGame() {
        const saveData = {
            player: GameState.player,
            connections: GameState.connections,
            chests: GameState.chests,
            usedGiftCodes: GameState.usedGiftCodes,
            cooldowns: GameState.cooldowns,
            marsStoryShown: GameState.marsStoryShown,
            quizScore: GameState.quizScore,
            savedAt: Date.now(),
            version: 1
        };
        api.save(saveData);
    }

    loadGame() {
        const saved = api.load();
        if (!saved || !saved.player || !saved.player.signedUp) {
            this.notify('No Save', 'No saved game found');
            return;
        }
        Object.assign(GameState.player, saved.player);
        GameState.connections = saved.connections || [];
        GameState.chests = saved.chests || {};
        GameState.usedGiftCodes = saved.usedGiftCodes || [];
        GameState.cooldowns = saved.cooldowns || { global: 0 };
        if (saved.marsStoryShown) GameState.marsStoryShown = saved.marsStoryShown;
        if (saved.quizScore) GameState.quizScore = saved.quizScore;

        this.showScreen('map-screen');
        this.drawMap();
        this.updateUI();
        this.startGameLoop();
        if (GameState.cooldowns.global > Date.now()) this.showCooldown();
        this.notify('Loaded', 'Game loaded successfully');
    }

    // ---- Modals ----
    showModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }

    showTutorial() {
        document.getElementById('tutorial-text').textContent = t('tutorial.text');
        this.showModal('tutorial-modal');
    }

    showStory() {
        document.getElementById('story-text').innerHTML = `
            <h2>The Story</h2>
            <p>In the year 2150, Earth's resources have been depleted. Nations fight for the remaining territories.
            You are the leader of a new nation, destined to conquer the world — and beyond.</p>
            <p style="margin-top:10px;color:var(--neon-green);">Conquer territories, build connections, form alliances, and unlock Mars!</p>
        `;
        this.showModal('story-modal');
    }

    // ---- Pause ----
    togglePause() {
        const menu = document.getElementById('pause-menu');
        menu.classList.toggle('active');
    }

    quitToMenu() {
        this.saveGame();
        this.timers.forEach(t => clearInterval(t));
        this.timers = [];
        this.showScreen('main-menu');
        document.getElementById('pause-menu').classList.remove('active');
    }

    // ---- Mars ----
    acceptMars() {
        this.closeModal('mars-story-modal');
        this.switchWorld('mars');
    }

    skipMars() {
        GameState.marsStoryShown = true;
        this.closeModal('mars-story-modal');
    }

    // ---- Cards/Shop/Alliance/Quiz/Settings Stubs ----
    showCardsScreen() { this.notify('Cards', `${GameState.player.cards.length} cards in your inventory`); }
    showShopScreen() {
        if (GameState.player.tokens >= 5) {
            GameState.player.tokens -= 5;
            const card = this.generateCard();
            GameState.player.cards.push(card);
            SFX.cardOpen();
            this.notify('Card Pack', `Got a ${card.rarity} card!`);
            this.updateUI();
            this.saveGame();
        } else {
            this.notify('Not Enough Tokens', 'You need 5 tokens to buy a pack');
            SFX.error();
        }
    }
    showAllianceScreen() { this.notify('Alliance', 'Alliance system coming in Phase 6'); }
    showQuizScreen() { this.notify('Quiz', 'Quiz system coming in Phase 5'); }
    showSettingsScreen() {
        const data = JSON.stringify(GameState, null, 2);
        this.notify('Settings', `Game data exported. Save: ${api.save({player: GameState.player, connections: GameState.connections, chests: GameState.chests, usedGiftCodes: GameState.usedGiftCodes, cooldowns: GameState.cooldowns}) ? 'OK' : 'Failed'}`);
    }

    generateCard() {
        const roll = Math.random();
        let rarity = 'common';
        if (roll > 0.95) rarity = 'legendary';
        else if (roll > 0.85) rarity = 'mythic';
        else if (roll > 0.7) rarity = 'metropolis';
        else if (roll > 0.5) rarity = 'super-rare';
        else if (roll > 0.3) rarity = 'rare';

        const minStat = rarity === 'legendary' ? 8 : rarity === 'mythic' ? 6 : rarity === 'metropolis' ? 4 : rarity === 'super-rare' ? 3 : rarity === 'rare' ? 2 : 1;
        const maxStat = minStat + 3;

        return {
            id: Date.now() + Math.random(),
            rarity,
            airports: minStat + Math.floor(Math.random() * (maxStat - minStat + 1)),
            trains: minStat + Math.floor(Math.random() * (maxStat - minStat + 1)),
            military: minStat + Math.floor(Math.random() * (maxStat - minStat + 1))
        };
    }

    // ---- Mobile Nav ----
    toggleMobileNav() {
        this.togglePause();
    }

    // ---- Language ----
    setupLanguageSelectors() {
        document.querySelectorAll('#language-select, #language-select-map').forEach(sel => {
            sel.addEventListener('change', (e) => {
                setLanguage(e.target.value);
                this.applyTranslations();
            });
        });
    }

    applyTranslations() {
        // Update static UI elements with translations
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = t(key);
        });
    }

    // ---- Notifications ----
    notify(title, msg) {
        const notif = document.getElementById('notification');
        if (!notif) return;
        notif.querySelector('.notification-title').textContent = title;
        notif.querySelector('.notification-message').textContent = msg;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 3000);
        SFX.notification();
    }

    // ---- Helpers ----
    formatPop(pop) {
        if (pop >= 1000000) return (pop / 1000000).toFixed(1) + 'M';
        if (pop >= 1000) return (pop / 1000).toFixed(0) + 'k';
        return pop.toString();
    }

    getTotalMilitary() {
        return GameState.player.territories.reduce((sum, id) => {
            const isMars = GameState.player.currentWorld === 'mars';
            const countries = isMars ? GameState.marsCountries : GameState.countries;
            return sum + (countries[id]?.military || 0);
        }, 0);
    }

    destroy() {
        this.timers.forEach(t => clearInterval(t));
        this.timers = [];
    }
}

// ==================== BOOTSTRAP ====================
const game = new WarXOneGame();

// Make GameState accessible for debugging
window.__warxone = { game, GameState };
