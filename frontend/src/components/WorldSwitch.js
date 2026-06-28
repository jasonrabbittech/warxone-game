// World switch UI component
// Implements: T023 (world switch UI)

import { GameState } from '../game/GameState.js';
import { MapModule } from '../game/map.js';

/**
 * WorldSwitch component for switching between Earth and Mars
 */
export function createWorldSwitch() {
  const container = document.createElement('div');
  container.id = 'world-switch';
  container.className = 'world-switch';

  // Earth button
  const earthBtn = document.createElement('button');
  earthBtn.id = 'earth-btn';
  earthBtn.className = 'world-btn';
  earthBtn.textContent = '🌍 Earth';
  earthBtn.addEventListener('click', () => {
    MapModule.switchWorld('earth');
    updateActiveButton('earth');
  });

  // Mars button (disabled until unlocked)
  const marsBtn = document.createElement('button');
  marsBtn.id = 'mars-btn';
  marsBtn.className = 'world-btn';
  marsBtn.textContent = '🔴 Mars (Locked)';
  marsBtn.disabled = true;
  marsBtn.addEventListener('click', () => {
    MapModule.switchWorld('mars');
    updateActiveButton('mars');
  });

  container.appendChild(earthBtn);
  container.appendChild(marsBtn);

  // Listen for Mars unlock event
  document.addEventListener('mars-unlocked', (e) => {
    marsBtn.disabled = false;
    marsBtn.textContent = '🔴 Mars';
    showNotification(e.detail.message);
  });

  // Listen for world switch event
  document.addEventListener('world-switched', (e) => {
    updateActiveButton(e.detail.world);
  });

  // Initial state
  updateActiveButton(GameState.player.currentWorld);

  return container;
}

/**
 * Update active button styling
 * @param {string} world - Current world
 */
function updateActiveButton(world) {
  const earthBtn = document.getElementById('earth-btn');
  const marsBtn = document.getElementById('mars-btn');

  if (earthBtn && marsBtn) {
    earthBtn.classList.remove('active');
    marsBtn.classList.remove('active');

    if (world === 'earth') {
      earthBtn.classList.add('active');
    } else {
      marsBtn.classList.add('active');
    }
  }
}

/**
 * Show notification message
 * @param {string} message - Notification message
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Initialize WorldSwitch component
 * @param {HTMLElement} parent - Parent element to append to
 */
export function initWorldSwitch(parent) {
  const worldSwitch = createWorldSwitch();
  if (parent) {
    parent.appendChild(worldSwitch);
  } else {
    document.body.appendChild(worldSwitch);
  }
  return worldSwitch;
}
