/**
 * WarXOne - Quiz Main Page
 * Manages the quiz flow: selection -> play -> results
 */

import { QuizSelect } from './select.js';
import { QuizPlay } from './play.js';
import { QuizResults } from '../../components/QuizResults.js';
import { QuizService } from '../../services/quizService.js';

export class QuizPage {
  /**
   * @param {HTMLElement} container - DOM element to render page
   * @param {string} token - JWT access token
   * @param {Function} onBack - Callback to go back to main menu
   */
  constructor(container, token, onBack) {
    this.container = container;
    this.token = token;
    this.onBack = onBack;
    this.currentPage = null;  // 'select', 'play', 'results'
  }

  /**
   * Initialize the quiz page (show difficulty selection)
   */
  init() {
    this.showSelection();
  }

  /**
   * Show difficulty selection page
   */
  showSelection() {
    this.cleanup();
    this.currentPage = 'select';
    
    this.selectPage = new QuizSelect(
      this.container,
      this.token,
      (difficulty) => this.onDifficultySelected(difficulty)
    );
    this.selectPage.init();
  }

  /**
   * Handle difficulty selection
   * @param {string} difficulty - Selected difficulty
   */
  onDifficultySelected(difficulty) {
    this.showPlay(difficulty);
  }

  /**
   * Show quiz play page
   * @param {string} difficulty - Selected difficulty
   */
  showPlay(difficulty) {
    this.cleanup();
    this.currentPage = 'play';
    
    this.playPage = new QuizPlay(
      this.container,
      this.token,
      difficulty,
      (attemptId, dailyStatus) => this.onQuizComplete(attemptId, dailyStatus)
    );
    this.playPage.init();
  }

  /**
   * Handle quiz completion
   * @param {string} attemptId - Quiz attempt ID
   * @param {Object} dailyStatus - Daily limit status
   */
  async onQuizComplete(attemptId, dailyStatus) {
    try {
      // Fetch results
      const results = await QuizService.getResults(attemptId, this.token);
      
      // Show results
      this.showResults(results, dailyStatus);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      // Still show results page with error message
      this.showResults({ error: err.message }, dailyStatus);
    }
  }

  /**
   * Show results page
   * @param {Object} results - Quiz results
   * @param {Object} dailyStatus - Daily limit status
   */
  showResults(results, dailyStatus) {
    this.cleanup();
    this.currentPage = 'results';
    
    this.resultsContainer = document.createElement('div');
    this.container.appendChild(this.resultsContainer);
    
    this.resultsPage = new QuizResults(
      this.resultsContainer,
      results,
      dailyStatus
    );
    this.resultsPage.render();
    
    // Add back button
    const backBtn = document.createElement('button');
    backBtn.className = 'quiz-back-btn';
    backBtn.textContent = 'Back to Menu';
    backBtn.addEventListener('click', () => {
      if (this.onBack) {
        this.onBack();
      }
    });
    this.container.appendChild(backBtn);
  }

  /**
   * Cleanup current page
   */
  cleanup() {
    if (this.selectPage) {
      this.selectPage.destroy();
      this.selectPage = null;
    }
    if (this.playPage) {
      this.playPage.destroy();
      this.playPage = null;
    }
    if (this.resultsPage) {
      this.resultsPage.destroy();
      this.resultsPage = null;
    }
    if (this.resultsContainer) {
      this.resultsContainer.remove();
      this.resultsContainer = null;
    }
    
    // Remove back button if exists
    const backBtn = this.container.querySelector('.quiz-back-btn');
    if (backBtn) {
      backBtn.remove();
    }
    
    this.container.innerHTML = '';
  }

  /**
   * Destroy the page (cleanup)
   */
  destroy() {
    this.cleanup();
  }
}
