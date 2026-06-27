/**
 * WarXOne - Quiz Selection Page
 * Difficulty selection UI with daily limit check
 */

import { QuizService } from '../services/quizService.js';

export class QuizSelect {
  /**
   * @param {HTMLElement} container - DOM element to render page
   * @param {string} token - JWT access token
   * @param {Function} onSelectDifficulty - Callback when difficulty selected
   */
  constructor(container, token, onSelectDifficulty) {
    this.container = container;
    this.token = token;
    this.onSelectDifficulty = onSelectDifficulty;
    this.dailyStatus = null;
  }

  /**
   * Initialize the page (check daily status)
   */
  async init() {
    try {
      this.dailyStatus = await QuizService.getDailyStatus(this.token);
      this.render();
    } catch (err) {
      console.error('Failed to check daily status:', err);
      this.dailyStatus = { canPlay: true };
      this.render();
    }
  }

  /**
   * Render the page to DOM
   */
  render() {
    const canPlay = this.dailyStatus?.canPlay !== false;
    const nextAttemptIn = this.dailyStatus?.nextAttemptIn || 0;

    let statusHtml = '';
    if (!canPlay) {
      const hours = Math.floor(nextAttemptIn / 3600);
      const minutes = Math.floor((nextAttemptIn % 3600) / 60);
      statusHtml = `
        <div class="quiz-daily-limit">
          <p class="limit-title">Daily Limit Reached</p>
          <p class="limit-message">You have already completed a quiz today.</p>
          <p class="limit-countdown">Next attempt in: ${hours}h ${minutes}m</p>
        </div>
      `;
    }

    const difficulties = [
      { key: 'easy', name: 'Easy', reward: '+1/token per correct', penalty: 'No penalty', timer: '5s/q' },
      { key: 'medium', name: 'Medium', reward: '+2/tokens per correct', penalty: '-1/token per incorrect', timer: '10s/q' },
      { key: 'hard', name: 'Hard', reward: '+3/tokens per correct', penalty: '-2/tokens per incorrect', timer: '15s/q' },
    ];

    const difficultiesHtml = difficulties.map(diff => `
      <button 
        class="difficulty-btn ${!canPlay ? 'disabled' : ''}" 
        data-difficulty="${diff.key}"
        ?disabled="${!canPlay}"
      >
        <span class="diff-name">${diff.name}</span>
        <span class="diff-reward">${diff.reward}</span>
        <span class="diff-penalty">${diff.penalty}</span>
        <span class="diff-timer">${diff.timer}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="quiz-select">
        <h1 class="select-title">Select Difficulty</h1>
        ${statusHtml}
        <div class="difficulty-list">
          ${difficultiesHtml}
        </div>
      </div>
    `;

    // Attach event listeners (only if can play)
    if (canPlay) {
      const buttons = this.container.querySelectorAll('.difficulty-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const difficulty = btn.dataset.difficulty;
          if (this.onSelectDifficulty) {
            this.onSelectDifficulty(difficulty);
          }
        });
      });
    }
  }

  /**
   * Destroy the page (cleanup)
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
