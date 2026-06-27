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

// API client
import { auth, game, isLoggedIn, getStoredUser, getAccessToken, clearAuthData } from './api/client.js';

// Quiz pages
import { QuizPage } from './pages/quiz/index.js';

// API layer: uses cloud API when logged in, localStorage as fallback
const api = {
    async save(state) {
        if (isLoggedIn()) {
            const result = await game.save(state);
            if (result.success) return true;
            console.warn('Cloud save failed, falling back to localStorage:', result.error);
        }
        // Fallback to localStorage
        try {
            localStorage.setItem('warxone_save', JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },
    async load() {
        if (isLoggedIn()) {
            const result = await game.load();
            if (result.success && result.data) return result.data.gameState;
            console.warn('Cloud load failed, falling back to localStorage:', result.error);
        }
        // Fallback to localStorage
        try {
            const data = localStorage.getItem('warxone_save');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    },
    async delete() {
        if (isLoggedIn()) {
            await game.deleteSave().catch(() => {});
        }
        localStorage.removeItem('warxone_save');
    }
};

// ==================== WARXONE GAME ====================
function createGame() {
    const timers = [];

    // ---- Event Delegation ----
    function setupEventDelegation() {
        document.getElementById('game-container').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            e.preventDefault(); // Prevent default for links and forms
            handleAction(btn.dataset.action, btn, e);
        });
    }

    function handleAction(action, btn, e) {
        SFX.buttonClick();
        switch (action) {
            case 'new-game': showScreen('signup-screen'); break;
            case 'load-game': loadGame(); break;
            case 'login-screen': showScreen('login-screen'); break;
            case 'login': handleLogin(); break;
            case 'login-google': handleGoogleLogin(); break;
            case 'show-signup': showScreen('signup-screen'); break;
            case 'show-login': showScreen('login-screen'); break;
            case 'logout': handleLogout(); break;
            case 'story': showStory(); break;
            case 'settings': showScreen('settings-screen'); break;
            case 'how-to-play': showTutorial(); break;
            case 'back-to-menu': showScreen('main-menu'); break;
            case 'signup': handleSignup(); break;
            case 'start-game': handleStartGame(); break;
            case 'switch-earth': switchWorld('earth'); break;
            case 'switch-mars': switchWorld('mars'); break;
            case 'zoom-in': zoomMap(1.2); break;
            case 'zoom-out': zoomMap(0.8); break;
            case 'zoom-reset': resetMapZoom(); break;
            case 'nav-map': showScreen('map-screen'); break;
            case 'nav-cards': showCardsScreen(); break;
            case 'nav-shop': showShopScreen(); break;
            case 'nav-alliance': showAllianceScreen(); break;
            case 'nav-quiz': showQuizScreen(); break;
            case 'nav-settings': showSettingsScreen(); break;
            case 'auto-battle': autoBattle(); break;
            case 'retreat': retreatBattle(); break;
            case 'save-game': saveGame(); break;
            case 'resume': togglePause(); break;
            case 'quit-to-menu': quitToMenu(); break;
            case 'close-tutorial': closeModal('tutorial-modal'); break;
            case 'close-story': closeModal('story-modal'); break;
            case 'mars-story-accept': acceptMars(); break;
            case 'mars-story-skip': skipMars(); break;
            case 'toggle-mobile-nav': toggleMobileNav(); break;
            default: break;
        }
    }

    // ---- Screen Management ----
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(id);
        if (screen) screen.classList.add('active');
    }

    // ---- Auth ----
    function checkAutoLogin() {
        const user = getStoredUser();
        if (user) {
            updateLoggedInUI(user);
        }
    }

    function updateLoggedInUI(user) {
        const indicator = document.getElementById('logged-in-indicator');
        const emailEl = document.getElementById('logged-in-email');
        if (indicator && emailEl && user) {
            emailEl.textContent = user.email || '';
            indicator.style.display = 'flex';
        }
    }

    function showAuthError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
        }
    }

    function hideAuthError(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.style.display = 'none';
    }

    async function handleSignup() {
        const email = document.getElementById('signup-email').value.trim();
        const pw = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm-password').value;
        hideAuthError('signup-error');

        if (!email || !pw) { showAuthError('signup-error', 'Please fill all fields'); SFX.error(); return; }
        if (pw.length < 8) { showAuthError('signup-error', 'Password must be at least 8 characters'); SFX.error(); return; }
        if (pw !== confirm) { showAuthError('signup-error', 'Passwords do not match'); SFX.error(); return; }

        try {
            const result = await auth.register(email, pw);
            if (result.success) {
                updateLoggedInUI(result.data.user);
                showScreen('setup-screen');
                populateStartingCountries();
            } else {
                showAuthError('signup-error', result.error || 'Registration failed');
                SFX.error();
            }
        } catch (err) {
            showAuthError('signup-error', 'Network error. Please try again.');
            SFX.error();
        }
    }

    async function handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const pw = document.getElementById('login-password').value;
        hideAuthError('login-error');

        if (!email || !pw) { showAuthError('login-error', 'Please fill all fields'); SFX.error(); return; }

        try {
            const result = await auth.login(email, pw);
            if (result.success) {
                updateLoggedInUI(result.data.user);
                // Try to load cloud save after login
                const cloudSave = await game.load();
                if (cloudSave.success && cloudSave.data && cloudSave.data.gameState) {
                    Object.assign(GameState.player, cloudSave.data.gameState.player || {});
                    GameState.connections = cloudSave.data.gameState.connections || [];
                    GameState.chests = cloudSave.data.gameState.chests || {};
                    GameState.usedGiftCodes = cloudSave.data.gameState.usedGiftCodes || [];
                    GameState.cooldowns = cloudSave.data.gameState.cooldowns || { global: 0 };
                    if (cloudSave.data.gameState.marsStoryShown) GameState.marsStoryShown = cloudSave.data.gameState.marsStoryShown;
                    if (cloudSave.data.gameState.quizScore) GameState.quizScore = cloudSave.data.gameState.quizScore;

                    showScreen('map-screen');
                    drawMap();
                    updateUI();
                    startGameLoop();
                    notify('Welcome Back', 'Cloud save loaded!');
                } else {
                    showScreen('setup-screen');
                    populateStartingCountries();
                }
            } else {
                showAuthError('login-error', result.error || 'Login failed');
                SFX.error();
            }
        } catch (err) {
            showAuthError('login-error', 'Network error. Please try again.');
            SFX.error();
        }
    }

    function handleGoogleLogin() {
        // Phase D: Google SSO not yet configured
        notify('Coming Soon', 'Google login will be available in a future update');
    }

    async function handleLogout() {
        await auth.logout();
        const indicator = document.getElementById('logged-in-indicator');
        if (indicator) indicator.style.display = 'none';
        notify('Logged Out', 'You have been logged out');
        showScreen('main-menu');
    }

    // ---- Game Setup ----
    function populateStartingCountries() {
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

    function handleStartGame() {
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
        assignChests();

        showScreen('map-screen');
        drawMap();
        updateUI();
        startGameLoop();
        saveGame();
    }

    function assignChests() {
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
    // ViewBox-based map navigation: stores current viewport as {x, y, w, h}
    // Values from generate_realistic_map.py (Natural Earth geographic data)
    const MAP_VIEW = {
        earth: { x: 130, y: -60, w: 3210, h: 1340 },
        mars:  { x: 130, y: -60, w: 1270, h: 1260 }
    };
    function getMapView() {
        return GameState.player.currentWorld === 'mars' ? MAP_VIEW.mars : MAP_VIEW.earth;
    }

    function applyViewBox() {
        const svg = document.getElementById('map-svg');
        if (!svg) return;
        const v = getMapView();
        svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
        // Reset CSS transform so it doesn't conflict with viewBox
        svg.style.transform = '';
    }

    function drawMap() {
        const svg = document.getElementById('map-svg');
        if (!svg) return;

        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;
        const paths = isMars ? GameState.marsCountryPaths : GameState.countryPaths;

        svg.innerHTML = '';

        applyViewBox();

        // Draw continent background labels for Earth
        if (!isMars) {
            const continentLabels = [
                { text: 'AMERICAS', x: 90, y: 50, cls: 'continent-label' },
                { text: 'EUROPE', x: 520, y: 35, cls: 'continent-label' },
                { text: 'ASIA', x: 1040, y: 35, cls: 'continent-label' },
                { text: 'AFRICA', x: 550, y: 590, cls: 'continent-label' },
                { text: 'OCEANIA', x: 990, y: 430, cls: 'continent-label' },
            ];
            for (const cl of continentLabels) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.classList.add(cl.cls);
                label.setAttribute('x', cl.x);
                label.setAttribute('y', cl.y);
                label.textContent = cl.text;
                svg.appendChild(label);
            }
        }

        for (const [id, country] of Object.entries(countries)) {
            const pathData = paths[id];
            if (!pathData) continue;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('data-country', id);
            path.classList.add('country-path');

            if (country.owner === 'player') {
                path.classList.add(isMars ? 'mars-owned' : 'owned');
            } else if (isAdjacent(id)) {
                path.classList.add(isMars ? 'mars-adjacent' : 'adjacent');
            } else if (country.owner !== 'player') {
                path.classList.add(isMars ? 'mars-enemy' : 'enemy');
            }

            path.addEventListener('click', (e) => {
                // Ignore clicks that were actually drags (pan operations)
                if (mapPan.dragged) {
                    e.stopPropagation();
                    return;
                }
                selectCountry(id);
            });
            svg.appendChild(path);

            // Country label - use hex center instead of getBBox for better centering
            const bbox = path.getBBox();
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.classList.add('country-label');
            label.setAttribute('x', cx);
            label.setAttribute('y', cy + 2);
            // Show full name if short, abbreviated if long
            const name = country.name;
            label.textContent = name.length <= 8 ? name : name.substring(0, 7) + '…';
            svg.appendChild(label);

            // Chest icon
            if (GameState.chests[id] && country.owner !== 'player') {
                const chest = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                chest.classList.add('chest-icon');
                chest.setAttribute('x', cx);
                chest.setAttribute('y', bbox.y + 14);
                chest.textContent = '\u{1F6E0}';
                svg.appendChild(chest);
            }
        }
    }

    function isAdjacent(countryId) {
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

    function selectCountry(id) {
        const isMars = GameState.player.currentWorld === 'mars';
        const countries = isMars ? GameState.marsCountries : GameState.countries;
        const country = countries[id];
        if (!country) return;

        if (country.owner === 'player') {
            // Show country info
            notify(country.name, `Pop: ${formatPop(country.pop)} | Military: ${country.military}`);
        } else if (isAdjacent(id)) {
            // Attack
            startBattle(id);
        } else {
            notify(country.name, 'Not adjacent to your territories');
        }
    }

    // ---- Battle ----
    function startBattle(countryId) {
        if (GameState.cooldowns.global > Date.now()) {
            notify('Cooldown', 'Wait for the cooldown to finish');
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
            attacker: { name: GameState.player.countryName, pop: attackerPop, military: getTotalMilitary() },
            defender: { name: defender.name, pop: defenderPop, military: defender.military },
            turn: 0,
            interval: null
        };

        // Show battlefield
        const overlay = document.getElementById('battlefield-overlay');
        overlay.classList.add('active');
        document.getElementById('attacker-name').textContent = GameState.battle.attacker.name;
        document.getElementById('defender-name').textContent = GameState.battle.defender.name;
        document.getElementById('attacker-pop').textContent = formatPop(attackerPop);
        document.getElementById('defender-pop').textContent = formatPop(defenderPop);
        document.getElementById('battle-log').innerHTML = '';

        SFX.battleStart();
    }

    function autoBattle() {
        if (!GameState.battle || !GameState.battle.active) return;

        const battle = GameState.battle;
        const attDmg = battle.defender.military * 1000;
        const defDmg = battle.attacker.military * 1000;

        if (attDmg > defDmg) {
            resolveBattle(true);
        } else {
            resolveBattle(false);
        }
    }

    function retreatBattle() {
        if (GameState.battle) {
            GameState.battle.active = false;
            if (GameState.battle.interval) clearInterval(GameState.battle.interval);
        }
        document.getElementById('battlefield-overlay').classList.remove('active');
    }

    function resolveBattle(victory) {
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
                notify('Victory!', `Conquered ${countries[countryId].name}! Found a chest! +2 tokens`);
            } else {
                notify('Victory!', `Conquered ${countries[countryId].name}! +2 tokens`);
            }

            // Check Mars unlock (90% of Earth)
            if (!isMars && !GameState.player.marsUnlocked) {
                const total = Object.keys(GameState.countries).length;
                const owned = GameState.player.territories.filter(t => GameState.countries[t]).length;
                if (owned / total >= 0.9) {
                    GameState.player.marsUnlocked = true;
                    SFX.marsDiscovered();
                    showModal('mars-story-modal');
                }
            }

            // Cooldown
            GameState.cooldowns.global = Date.now() + 30000;
            showCooldown();
        } else {
            SFX.defeat();
            notify('Defeat', `Failed to conquer ${countries[battle.targetCountry]?.name}`);
        }

        document.getElementById('battlefield-overlay').classList.remove('active');
        drawMap();
        updateUI();
        saveGame();
    }

    function showCooldown() {
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
    function switchWorld(world) {
        if (world === 'mars' && !GameState.player.marsUnlocked) {
            notify('Locked', 'Conquer 90% of Earth to unlock Mars');
            return;
        }
        GameState.player.currentWorld = world;
        drawMap();
        updateUI();

        // Update toggle buttons
        document.querySelectorAll('.world-toggle button').forEach(b => b.classList.remove('active'));
        const btn = world === 'mars' ? document.querySelector('[data-action="switch-mars"]') : document.querySelector('[data-action="switch-earth"]');
        if (btn) btn.classList.add('active');
    }

    // ---- Map Zoom (viewBox-based) ----
    // Full map bounds (from Natural Earth geographic data)
    const MAP_BOUNDS = {
        earth: { minX: 130, minY: -60, maxX: 3340, maxY: 1280 },
        mars:  { minX: 130, minY: -60, maxX: 1400, maxY: 1200 }
    };

    function zoomMap(factor) {
        const v = getMapView();
        const svg = document.getElementById('map-svg');
        if (!svg || !svg.clientWidth) return;

        // Zoom by scaling w/h around the center of current view
        const newW = v.w / factor;
        const newH = v.h / factor;
        if (newW < 200 || newH < 200) return; // max zoom limit
        if (newW > 5000 || newH > 4000) return; // min zoom limit

        v.x += (v.w - newW) / 2;
        v.y += (v.h - newH) / 2;
        v.w = newW;
        v.h = newH;

        clampViewBox();
        applyViewBox();
    }

    function resetMapZoom() {
        const bounds = GameState.player.currentWorld === 'mars' ? MAP_BOUNDS.mars : MAP_BOUNDS.earth;
        const v = getMapView();
        v.x = bounds.minX;
        v.y = bounds.minY;
        v.w = bounds.maxX - bounds.minX;
        v.h = bounds.maxY - bounds.minY;
        applyViewBox();
    }

    function clampViewBox() {
        const bounds = GameState.player.currentWorld === 'mars' ? MAP_BOUNDS.mars : MAP_BOUNDS.earth;
        const v = getMapView();
        const fullW = bounds.maxX - bounds.minX;
        const fullH = bounds.maxY - bounds.minY;

        // If viewport is bigger than the map, center it
        if (v.w >= fullW) {
            v.x = bounds.minX - (v.w - fullW) / 2;
        } else {
            v.x = Math.max(bounds.minX, Math.min(v.x, bounds.maxX - v.w));
        }
        if (v.h >= fullH) {
            v.y = bounds.minY - (v.h - fullH) / 2;
        } else {
            v.y = Math.max(bounds.minY, Math.min(v.y, bounds.maxY - v.h));
        }
    }

    // ---- Map Pan (drag to navigate) ----
    // Uses drag threshold to distinguish pan (drag) from country click (tap)
    const DRAG_THRESHOLD = 5; // pixels — below this is a click, above is a drag
    let mapPan = { active: false, startX: 0, startY: 0, viewX: 0, viewY: 0, dragged: false };

    function initMapPan() {
        const svg = document.getElementById('map-svg');
        if (!svg) return;

        // Mouse drag
        svg.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent text selection during drag
            mapPan.active = true;
            mapPan.dragged = false;
            mapPan.startX = e.clientX;
            mapPan.startY = e.clientY;
            const v = getMapView();
            mapPan.viewX = v.x;
            mapPan.viewY = v.y;
            svg.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!mapPan.active) return;
            const svg = document.getElementById('map-svg');
            if (!svg) return;
            const dx = e.clientX - mapPan.startX;
            const dy = e.clientY - mapPan.startY;

            // Mark as drag if moved beyond threshold
            if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                mapPan.dragged = true;
            }
            if (!mapPan.dragged) return;

            // Convert screen pixels to SVG coordinate units
            const rect = svg.getBoundingClientRect();
            const scaleX = getMapView().w / rect.width;
            const scaleY = getMapView().h / rect.height;

            const v = getMapView();
            v.x = mapPan.viewX - dx * scaleX;
            v.y = mapPan.viewY - dy * scaleY;

            clampViewBox();
            applyViewBox();
        });

        window.addEventListener('mouseup', () => {
            if (mapPan.active) {
                mapPan.active = false;
                const svg = document.getElementById('map-svg');
                if (svg) svg.style.cursor = 'grab';
            }
        });

        // Touch support
        let touchStartDist = 0;
        let touchStartView = null;

        svg.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                mapPan.active = true;
                mapPan.dragged = false;
                const t = e.touches[0];
                mapPan.startX = t.clientX;
                mapPan.startY = t.clientY;
                const v = getMapView();
                mapPan.viewX = v.x;
                mapPan.viewY = v.y;
            } else if (e.touches.length === 2) {
                mapPan.active = false; // stop single-touch pan
                touchStartDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const v = getMapView();
                touchStartView = { x: v.x, y: v.y, w: v.w, h: v.h };
            }
        }, { passive: true });

        svg.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && mapPan.active) {
                e.preventDefault();
                const t = e.touches[0];
                const dx = t.clientX - mapPan.startX;
                const dy = t.clientY - mapPan.startY;

                if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                    mapPan.dragged = true;
                }
                if (!mapPan.dragged) return;

                const rect = svg.getBoundingClientRect();
                const scaleX = getMapView().w / rect.width;
                const scaleY = getMapView().h / rect.height;

                const v = getMapView();
                v.x = mapPan.viewX - dx * scaleX;
                v.y = mapPan.viewY - dy * scaleY;

                clampViewBox();
                applyViewBox();
            } else if (e.touches.length === 2 && touchStartView) {
                e.preventDefault();
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const scale = dist / touchStartDist;
                const v = getMapView();
                v.w = Math.max(200, Math.min(5000, touchStartView.w / scale));
                v.h = Math.max(200, Math.min(4000, touchStartView.h / scale));

                // Keep center point stable during pinch
                const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const rect = svg.getBoundingClientRect();
                const ratioX = (cx - rect.left) / rect.width;
                const ratioY = (cy - rect.top) / rect.height;

                v.x = touchStartView.x + (touchStartView.w - v.w) * ratioX;
                v.y = touchStartView.y + (touchStartView.h - v.h) * ratioY;

                clampViewBox();
                applyViewBox();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            mapPan.active = false;
            touchStartView = null;
        }, { passive: true });
    }

    // ---- UI Updates ----
    function updateUI() {
        const el = (id) => document.getElementById(id);
        if (el('player-flag')) el('player-flag').textContent = GameState.player.flag;
        if (el('token-count')) el('token-count').textContent = GameState.player.tokens;
        if (el('population-count')) el('population-count').textContent = formatPop(GameState.player.population);
        if (el('level-display')) el('level-display').textContent = GameState.player.level;
        if (el('card-count')) el('card-count').textContent = GameState.player.cards.length;
    }

    // ---- Game Loop ----
    function startGameLoop() {
        // Population growth every 10 seconds
        const popTimer = setInterval(() => {
            const owned = GameState.player.territories.length;
            GameState.player.population += owned * 100;
            updateUI();
        }, 10000);
        timers.push(popTimer);

        // Auto-save every 30 seconds
        const saveTimer = setInterval(() => saveGame(), 30000);
        timers.push(saveTimer);
    }

    // ---- Save/Load ----
    function saveGame() {
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
        api.save(saveData); // async but fire-and-forget for auto-save
    }

    async function loadGame() {
        const saved = await api.load();
        if (!saved || !saved.player) {
            notify('No Save', 'No saved game found');
            return;
        }
        Object.assign(GameState.player, saved.player);
        GameState.connections = saved.connections || [];
        GameState.chests = saved.chests || {};
        GameState.usedGiftCodes = saved.usedGiftCodes || [];
        GameState.cooldowns = saved.cooldowns || { global: 0 };
        if (saved.marsStoryShown) GameState.marsStoryShown = saved.marsStoryShown;
        if (saved.quizScore) GameState.quizScore = saved.quizScore;

        showScreen('map-screen');
        drawMap();
        updateUI();
        startGameLoop();
        if (GameState.cooldowns.global > Date.now()) showCooldown();
        notify('Loaded', 'Game loaded successfully');
    }

    // ---- Modals ----
    function showModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }

    function showTutorial() {
        document.getElementById('tutorial-text').textContent = t('tutorial.text');
        showModal('tutorial-modal');
    }

    function showStory() {
        document.getElementById('story-text').innerHTML = `
            <h2>The Story</h2>
            <p>In the year 2150, Earth's resources have been depleted. Nations fight for the remaining territories.
            You are the leader of a new nation, destined to conquer the world — and beyond.</p>
            <p style="margin-top:10px;color:var(--neon-green);">Conquer territories, build connections, form alliances, and unlock Mars!</p>
        `;
        showModal('story-modal');
    }

    // ---- Pause ----
    function togglePause() {
        const menu = document.getElementById('pause-menu');
        menu.classList.toggle('active');
    }

    function quitToMenu() {
        saveGame();
        timers.forEach(t => clearInterval(t));
        timers.length = 0;
        showScreen('main-menu');
        document.getElementById('pause-menu').classList.remove('active');
    }

    // ---- Mars ----
    function acceptMars() {
        closeModal('mars-story-modal');
        switchWorld('mars');
    }

    function skipMars() {
        GameState.marsStoryShown = true;
        closeModal('mars-story-modal');
    }

    // ---- Cards/Shop/Alliance/Quiz/Settings Stubs ----
    function showCardsScreen() { notify('Cards', `${GameState.player.cards.length} cards in your inventory`); }
    function showShopScreen() {
        if (GameState.player.tokens >= 5) {
            GameState.player.tokens -= 5;
            const card = generateCard();
            GameState.player.cards.push(card);
            SFX.cardOpen();
            notify('Card Pack', `Got a ${card.rarity} card!`);
            updateUI();
            saveGame();
        } else {
            notify('Not Enough Tokens', 'You need 5 tokens to buy a pack');
            SFX.error();
        }
    }
    function showAllianceScreen() { notify('Alliance', 'Alliance system coming in Phase 6'); }
    function showQuizScreen() {
        // Get game container
        const container = document.getElementById('game-container');
        if (!container) {
            notify('Error', 'Game container not found');
            return;
        }

        // Get access token
        const token = getAccessToken();
        if (!token) {
            notify('Login Required', 'Please login to play quiz');
            return;
        }

        // Create QuizPage instance
        const quizPage = new QuizPage(
            container,
            token,
            () => {
                // onBack callback: return to main menu
                showScreen('main-menu');
            }
        );

        // Initialize quiz page
        quizPage.init();

        // Store reference for cleanup
        if (!window._quizPageInstance) {
            window._quizPageInstance = quizPage;
        }
    }
    function showSettingsScreen() {
        saveGame(); // async save
        notify('Settings', 'Game data saved');
    }

    function generateCard() {
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
    function toggleMobileNav() {
        togglePause();
    }

    // ---- Language ----
    function setupLanguageSelectors() {
        document.querySelectorAll('#language-select, #language-select-map').forEach(sel => {
            sel.addEventListener('change', (e) => {
                setLanguage(e.target.value);
                applyTranslations();
            });
        });
    }

    function applyTranslations() {
        // Main menu
        const logo = document.querySelector('.logo');
        if (logo) logo.textContent = t('mainMenu.title');
        const tagline = document.querySelector('.tagline');
        if (tagline) tagline.textContent = t('mainMenu.tagline');
        document.querySelectorAll('#main-menu [data-action]').forEach(btn => {
            const map = { 'new-game': 'newGame', 'load-game': 'loadGame', 'login-screen': 'login', 'story': 'story', 'settings': 'settings', 'how-to-play': 'howToPlay', 'logout': 'logout' };
            const key = map[btn.dataset.action];
            if (key) btn.textContent = t('mainMenu.' + key);
        });

        // Signup
        const signupH1 = document.querySelector('#signup-screen h1');
        if (signupH1) signupH1.textContent = t('signup.title');
        const signupEmailLabel = document.querySelector('label[for="signup-email"]');
        if (signupEmailLabel) signupEmailLabel.textContent = t('signup.email');
        const signupPwLabel = document.querySelector('label[for="signup-password"]');
        if (signupPwLabel) signupPwLabel.textContent = t('signup.password');
        const signupConfirmLabel = document.querySelector('label[for="signup-confirm-password"]');
        if (signupConfirmLabel) signupConfirmLabel.textContent = t('signup.confirm');
        const signupBtn = document.querySelector('[data-action="signup"]');
        if (signupBtn) signupBtn.textContent = t('signup.btn');
        const signupBack = document.querySelector('#signup-screen [data-action="back-to-menu"]');
        if (signupBack) signupBack.textContent = t('signup.back');

        // Login screen
        const loginH1 = document.querySelector('#login-screen h1');
        if (loginH1) loginH1.textContent = t('auth.loginTitle');
        const loginEmailLabel = document.querySelector('#login-screen label');
        if (loginEmailLabel) loginEmailLabel.textContent = t('auth.email');
        const loginPwLabel = document.querySelector('#login-screen label:nth-of-type(2)');
        if (loginPwLabel) loginPwLabel.textContent = t('auth.password');
        const loginBtn = document.querySelector('[data-action="login"]');
        if (loginBtn) loginBtn.textContent = t('auth.loginBtn');
        const googleBtn = document.querySelector('[data-action="login-google"]');
        if (googleBtn) googleBtn.innerHTML = `<span class="google-icon">G</span> ${t('auth.googleBtn')}`;
        const loginBack = document.querySelector('#login-screen [data-action="back-to-menu"]');
        if (loginBack) loginBack.textContent = t('signup.back');
        const logoutBtn = document.querySelector('[data-action="logout"]');
        if (logoutBtn) logoutBtn.textContent = t('auth.logout');

        // Auth switch links
        const authSwitchLinks = document.querySelectorAll('.auth-switch a');
        authSwitchLinks.forEach(link => {
            if (link.dataset.action === 'show-signup') {
                link.textContent = t('auth.signupLink');
            } else if (link.dataset.action === 'show-login') {
                link.textContent = t('auth.loginLink');
            }
        });
        const authSwitchTexts = document.querySelectorAll('.auth-switch');
        authSwitchTexts.forEach(el => {
            if (el.querySelector('[data-action="show-signup"]')) {
                el.innerHTML = `${t('auth.noAccount')} <a href="#" data-action="show-signup">${t('auth.signupLink')}</a>`;
            } else if (el.querySelector('[data-action="show-login"]')) {
                el.innerHTML = `${t('auth.hasAccount')} <a href="#" data-action="show-login">${t('auth.loginLink')}</a>`;
            }
        });
        const divider = document.querySelector('.auth-divider span');
        if (divider) divider.textContent = t('auth.orContinueWith');

        // Setup
        const setupH1 = document.querySelector('#setup-screen h1');
        if (setupH1) setupH1.textContent = t('setup.title');
        const cnLabel = document.querySelector('label[for="country-name"]');
        if (cnLabel) cnLabel.textContent = t('setup.countryName');
        const capLabel = document.querySelector('label[for="capital-name"]');
        if (capLabel) capLabel.textContent = t('setup.capitalName');
        const flagLabel = document.querySelector('label[for="flag-select"]');
        if (flagLabel) flagLabel.textContent = t('setup.flag');
        const scLabel = document.querySelector('label[for="starting-country"]');
        if (scLabel) scLabel.textContent = t('setup.startingCountry');
        const startBtn = document.querySelector('[data-action="start-game"]');
        if (startBtn) startBtn.textContent = t('setup.startBtn');
        const setupBack = document.querySelector('#setup-screen [data-action="back-to-menu"]');
        if (setupBack) setupBack.textContent = t('setup.backBtn');

        // Map dashboard labels
        const infoLabels = document.querySelectorAll('.info-label');
        if (infoLabels.length >= 4) {
            infoLabels[0].textContent = t('map.tokens');
            infoLabels[1].textContent = t('map.pop');
            infoLabels[2].textContent = t('map.lvl');
            infoLabels[3].textContent = t('map.land');
        }

        // Tutorial
        const tutorialH2 = document.querySelector('#tutorial-modal h2');
        if (tutorialH2) tutorialH2.textContent = t('tutorial.title');
        const tutorialText = document.getElementById('tutorial-text');
        if (tutorialText) tutorialText.innerText = t('tutorial.text');

        // Battlefield
        const bfTitle = document.querySelector('.battlefield-title');
        if (bfTitle) bfTitle.textContent = t('battle.title');
        const atkName = document.getElementById('attacker-name');
        if (atkName) atkName.textContent = t('battle.attacker');
        const defName = document.getElementById('defender-name');
        if (defName) defName.textContent = t('battle.defender');
        const autoBtn = document.querySelector('[data-action="auto-battle"]');
        if (autoBtn) autoBtn.textContent = t('battle.auto');
        const retreatBtn = document.querySelector('[data-action="retreat"]');
        if (retreatBtn) retreatBtn.textContent = t('battle.retreat');

        // Pause menu
        const pauseH2 = document.querySelector('#pause-menu h2');
        if (pauseH2) pauseH2.textContent = t('settings.pause') || 'Paused';
        const resumeBtn = document.querySelector('[data-action="resume"]');
        if (resumeBtn) resumeBtn.textContent = t('settings.resume') || 'Resume';
        const saveBtn = document.querySelector('[data-action="save-game"]');
        if (saveBtn) saveBtn.textContent = t('settings.save') || 'Save Game';
        const quitBtn = document.querySelector('[data-action="quit-to-menu"]');
        if (quitBtn) quitBtn.textContent = t('settings.quit') || 'Quit to Menu';

        // Bottom nav
        const navActions = ['nav-map','nav-cards','nav-shop','nav-alliance','nav-quiz','nav-settings'];
        const navLabels = ['map.mapNav','card.title','card.shopNav','alliance.title','quiz.title','settings.title'];
        navActions.forEach((action, i) => {
            const btn = document.querySelector(`[data-action="${action}"]`);
            if (btn && navLabels[i]) {
                const spans = btn.querySelectorAll('span');
                if (spans.length >= 2) spans[1].textContent = t(navLabels[i]);
            }
        });

        // Sync language selectors
        const lang = getCurrentLanguage();
        document.querySelectorAll('#language-select, #language-select-map').forEach(sel => {
            sel.value = lang;
        });
    }

    // ---- Notifications ----
    function notify(title, msg) {
        const notif = document.getElementById('notification');
        if (!notif) return;
        notif.querySelector('.notification-title').textContent = title;
        notif.querySelector('.notification-message').textContent = msg;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 3000);
        SFX.notification();
    }

    // ---- Helpers ----
    function formatPop(pop) {
        if (pop >= 1000000) return (pop / 1000000).toFixed(1) + 'M';
        if (pop >= 1000) return (pop / 1000).toFixed(0) + 'k';
        return pop.toString();
    }

    function getTotalMilitary() {
        return GameState.player.territories.reduce((sum, id) => {
            const isMars = GameState.player.currentWorld === 'mars';
            const countries = isMars ? GameState.marsCountries : GameState.countries;
            return sum + (countries[id]?.military || 0);
        }, 0);
    }

    function destroy() {
        timers.forEach(t => clearInterval(t));
        timers.length = 0;
    }

    // ---- Initialize ----
    setupEventDelegation();
    setupLanguageSelectors();
    initMapPan();
    checkAutoLogin();

    return { destroy };
}

// ==================== BOOTSTRAP ====================
createGame();

// Make GameState accessible for debugging
window.__warxone = { GameState };
