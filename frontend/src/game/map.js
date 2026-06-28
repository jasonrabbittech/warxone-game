// Map rendering, zoom, pan, and territory selection
// Implements: T016 (zoom), T017 (pan), T018 (territory selection), T021 (territory acquisition), T022-T023 (Mars unlock/switch)

import { GameState } from './GameState.js';
import { countries } from './countries.js';
import { marsCountries } from './marsCountries.js';
import { countryPaths } from './countryPaths.js';
import { marsCountryPaths } from './marsPaths.js';

/**
 * Map module for SVG map interaction
 */
export const MapModule = {
  svgElement: null,
  viewBox: { x: 0, y: 0, width: 1000, height: 600 },
  isDragging: false,
  lastMousePos: { x: 0, y: 0 },
  scale: 1,
  minScale: 0.5,
  maxScale: 5,

  /**
   * Initialize map module
   * @param {SVGElement} svg - SVG element
   */
  init(svg) {
    this.svgElement = svg;
    this.setupZoomPan();
    this.renderMap();
  },

  /**
   * Setup zoom and pan controls (T016, T017)
   */
  setupZoomPan() {
    const svg = this.svgElement;
    if (!svg) return;

    // Zoom with scroll wheel
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      this.zoom(delta, e.clientX, e.clientY);
    });

    // Pan with drag
    svg.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        svg.style.cursor = 'grabbing';
      }
    });

    svg.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = (e.clientX - this.lastMousePos.x) * this.scale;
        const dy = (e.clientY - this.lastMousePos.y) * this.scale;
        this.pan(dx, dy);
        this.lastMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    svg.addEventListener('mouseup', () => {
      this.isDragging = false;
      svg.style.cursor = 'grab';
    });

    svg.addEventListener('mouseleave', () => {
      this.isDragging = false;
      svg.style.cursor = 'grab';
    });

    // Touch events for mobile
    svg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    svg.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        e.preventDefault();
        const dx = (e.touches[0].clientX - this.lastMousePos.x) * this.scale;
        const dy = (e.touches[0].clientY - this.lastMousePos.y) * this.scale;
        this.pan(dx, dy);
        this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: false });

    svg.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    svg.style.cursor = 'grab';
  },

  /**
   * Zoom map (T016)
   * @param {number} factor - Zoom factor (>1 to zoom in, <1 to zoom out)
   * @param {number} centerX - Zoom center X
   * @param {number} centerY - Zoom center Y
   */
  zoom(factor, centerX, centerY) {
    const newScale = this.scale * factor;
    if (newScale < this.minScale || newScale > this.maxScale) return;

    // Calculate zoom center in SVG coordinates
    const svgPoint = this.screenToSVG(centerX, centerY);
    
    // Update viewBox
    this.scale = newScale;
    this.viewBox.width = 1000 / this.scale;
    this.viewBox.height = 600 / this.scale;
    
    // Adjust viewBox to keep zoom center
    this.viewBox.x = svgPoint.x - this.viewBox.width / 2;
    this.viewBox.y = svgPoint.y - this.viewBox.height / 2;

    this.updateViewBox();
  },

  /**
   * Pan map (T017)
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  pan(dx, dy) {
    this.viewBox.x -= dx;
    this.viewBox.y -= dy;
    this.updateViewBox();
  },

  /**
   * Update SVG viewBox
   */
  updateViewBox() {
    if (!this.svgElement) return;
    const { x, y, width, height } = this.viewBox;
    this.svgElement.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  },

  /**
   * Convert screen coordinates to SVG coordinates
   * @param {number} screenX - Screen X
   * @param {number} screenY - Screen Y
   * @returns {Object} - SVG coordinates { x, y }
   */
  screenToSVG(screenX, screenY) {
    const svg = this.svgElement;
    if (!svg) return { x: 0, y: 0 };

    const pt = svg.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgPt.x, y: svgPt.y };
  },

  /**
   * Render map with territories (T018)
   */
  renderMap() {
    const svg = this.svgElement;
    if (!svg) return;

    // Clear existing content
    svg.innerHTML = '';

    // Get current world territories
    const currentCountries = GameState.getCurrentCountries();
    const currentPaths = GameState.player.currentWorld === 'earth' 
      ? countryPaths 
      : marsCountryPaths;

    // Render each territory
    Object.keys(currentCountries).forEach(countryId => {
      const country = currentCountries[countryId];
      const pathData = currentPaths[countryId];
      
      if (!pathData) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('data-country-id', countryId);
      path.setAttribute('class', 'territory');
      
      // Set color based on owner
      if (GameState.player.territories.includes(countryId)) {
        path.setAttribute('fill', '#4CAF50'); // Player's territory (green)
      } else if (country.owner === 'ai') {
        path.setAttribute('fill', '#F44336'); // AI territory (red)
      } else {
        path.setAttribute('fill', '#9E9E9E'); // Neutral territory (gray)
      }

      // Add click handler for territory selection (T018)
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectTerritory(countryId);
      });

      svg.appendChild(path);
    });
  },

  /**
   * Select territory (T018)
   * @param {string} countryId - Territory ID
   */
  selectTerritory(countryId) {
    const player = GameState.player;
    const currentCountries = GameState.getCurrentCountries();
    const country = currentCountries[countryId];

    if (!country) return;

    // Check if territory is already owned
    if (player.territories.includes(countryId)) {
      this.showMessage('Already owned');
      return;
    }

    // Check adjacency (T018)
    if (!this.isAdjacent(countryId)) {
      this.showMessage('Not adjacent');
      return;
    }

    // Show territory info and attack button
    this.showTerritoryInfo(countryId);
  },

  /**
   * Check if territory is adjacent to player's territories
   * @param {string} countryId - Territory ID
   * @returns {boolean}
   */
  isAdjacent(countryId) {
    const player = GameState.player;
    const currentCountries = GameState.getCurrentCountries();
    const country = currentCountries[countryId];

    if (!country || !country.adjacent) return false;

    // Check if any adjacent territory is owned by player
    return country.adjacent.some(adjId => 
      player.territories.includes(adjId)
    );
  },

  /**
   * Show territory info
   * @param {string} countryId - Territory ID
   */
  showTerritoryInfo(countryId) {
    const currentCountries = GameState.getCurrentCountries();
    const country = currentCountries[countryId];

    if (!country) return;

    // Dispatch event to show territory info panel
    const event = new CustomEvent('territory-selected', {
      detail: { countryId, country }
    });
    document.dispatchEvent(event);
  },

  /**
   * Acquire territory (T021)
   * @param {string} countryId - Territory ID
   */
  acquireTerritory(countryId) {
    const player = GameState.player;

    // Add to player's territories
    if (!player.territories.includes(countryId)) {
      player.territories.push(countryId);
    }

    // Update territory owner
    const currentCountries = GameState.getCurrentCountries();
    if (currentCountries[countryId]) {
      currentCountries[countryId].owner = 'player';
    }

    // Reward: +1 token (T021)
    player.tokens += 1;

    // Check Mars unlock (T022)
    this.checkMarsUnlock();

    // Re-render map
    this.renderMap();

    // Dispatch event
    const event = new CustomEvent('territory-acquired', {
      detail: { countryId }
    });
    document.dispatchEvent(event);
  },

  /**
   * Check Mars unlock condition (T022)
   * Condition: Player conquers 90% of Earth territories
   */
  checkMarsUnlock() {
    const player = GameState.player;

    // Only check for Earth world
    if (player.currentWorld !== 'earth') return;

    const totalEarthTerritories = Object.keys(countries).length;
    const playerEarthTerritories = player.territories.filter(t => 
      countries[t] !== undefined
    ).length;

    const percentage = (playerEarthTerritories / totalEarthTerritories) * 100;

    if (percentage >= 90 && !player.marsUnlocked) {
      player.marsUnlocked = true;
      this.showMarsUnlockNotification();
    }
  },

  /**
   * Show Mars unlock notification (T022)
   */
  showMarsUnlockNotification() {
    const event = new CustomEvent('mars-unlocked', {
      detail: { message: 'Mars is now unlocked! You can switch worlds.' }
    });
    document.dispatchEvent(event);
  },

  /**
   * Switch world (T023)
   * @param {string} world - World to switch to ('earth' or 'mars')
   */
  switchWorld(world) {
    const player = GameState.player;

    if (world === 'mars' && !player.marsUnlocked) {
      this.showMessage('Mars is not yet unlocked');
      return;
    }

    player.currentWorld = world;
    this.renderMap();

    // Dispatch event
    const event = new CustomEvent('world-switched', {
      detail: { world }
    });
    document.dispatchEvent(event);
  },

  /**
   * Show message to user
   * @param {string} message - Message to show
   */
  showMessage(message) {
    const event = new CustomEvent('game-message', {
      detail: { message }
    });
    document.dispatchEvent(event);
  }
};
