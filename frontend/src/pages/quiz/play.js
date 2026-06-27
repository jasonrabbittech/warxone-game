/**
 * WarXOne - Quiz Play Page
 * Displays questions, timer, handles answer submission
 */

import { QuizTimer } from '../../components/QuizTimer.js';
import { QuizQuestion } from '../../components/QuizQuestion.js';
import { QuizService } from '../../services/quizService.js';

export class QuizPlay {
  /**
   * @param {HTMLElement} container - DOM element to render page
   * @param {string} token - JWT access token
   * @param {string} difficulty - Difficulty level
   * @param {Function} onComplete - Callback when quiz completes
   */
  constructor(container, token, difficulty, onComplete) {
    this.container = container;
    this.token = token;
    this.difficulty = difficulty;
    this.onComplete = onComplete;
    this.attemptId = null;
    this.questions = [];
    this.currentIndex = 0;
    this.timer = null;
    this.questionComponent = null;
    this.timerContainer = null;
    this.questionContainer = null;
  }

  /**
   * Initialize the page (start quiz)
   */
  async init() {
    try {
      this.renderLoading();
      
      // Start quiz (call backend)
      const result = await QuizService.startQuiz(this.difficulty, this.token);
      this.attemptId = result.attemptId;
      this.questions = result.questions;
      this.timerPerQuestion = result.timerPerQuestion;

      this.currentIndex = 0;
      this.renderQuestion();
    } catch (err) {
      console.error('Failed to start quiz:', err);
      this.renderError(err.message);
    }
  }

  /**
   * Render loading state
   */
  renderLoading() {
    this.container.innerHTML = `
      <div class="quiz-loading">
        <p>Starting quiz...</p>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderError(message) {
    this.container.innerHTML = `
      <div class="quiz-error">
        <p>Error: ${message}</p>
        <button id="retry-btn">Retry</button>
      </div>
    `;
    
    const retryBtn = this.container.querySelector('#retry-btn');
    retryBtn?.addEventListener('click', () => this.init());
  }

  /**
   * Render current question
   */
  async renderQuestion() {
    if (this.currentIndex >= this.questions.length) {
      // All questions answered, fetch daily status then show results
      let dailyStatus = null;
      try {
        dailyStatus = await QuizService.getDailyStatus(this.token);
      } catch (err) {
        console.error('Failed to fetch daily status:', err);
      }
      
      if (this.onComplete) {
        this.onComplete(this.attemptId, dailyStatus);
      }
      return;
    }

    const question = this.questions[this.currentIndex];

    this.container.innerHTML = `
      <div class="quiz-play">
        <div class="quiz-header">
          <span class="quiz-progress">Question ${this.currentIndex + 1}/${this.questions.length}</span>
          <div class="quiz-timer-container" id="timer-container"></div>
        </div>
        <div class="quiz-question-container" id="question-container"></div>
        <button class="quiz-submit-btn" id="submit-btn" disabled>Submit</button>
      </div>
    `;

    // Create timer
    this.timerContainer = this.container.querySelector('#timer-container');
    this.timer = new QuizTimer(
      this.timerContainer,
      this.timerPerQuestion,
      () => this.onTimerExpire()
    );
    this.timer.start();

    // Create question
    this.questionContainer = this.container.querySelector('#question-container');
    this.questionComponent = new QuizQuestion(
      this.questionContainer,
      question,
      (answer) => this.onAnswerSelected(answer)
    );
    this.questionComponent.render();

    // Submit button
    const submitBtn = this.container.querySelector('#submit-btn');
    submitBtn.addEventListener('click', () => this.submitAnswer());
  }

  /**
   * Handle answer selection
   */
  onAnswerSelected(answer) {
    const submitBtn = this.container.querySelector('#submit-btn');
    submitBtn.disabled = false;
  }

  /**
   * Handle timer expiry
   */
  onTimerExpire() {
    // Auto-submit with timeout
    this.submitAnswer(true);
  }

  /**
   * Submit current answer
   * @param {boolean} isTimeout - Whether submission is due to timeout
   */
  async submitAnswer(isTimeout = false) {
    const selected = isTimeout ? null : this.questionComponent.getSelectedAnswer();
    const timeSpent = this.timer ? this.timer.getRemainingSeconds() : 0;

    try {
      const result = await QuizService.submitAnswer(
        this.attemptId,
        this.currentIndex,
        selected,
        isTimeout,
        this.timerPerQuestion - timeSpent,
        this.token
      );

      // Stop timer
      if (this.timer) {
        this.timer.destroy();
      }

      // Show feedback (brief)
      this.showFeedback(result.is_correct, result.tokens);

      // Move to next question after delay
      setTimeout(() => {
        this.currentIndex++;
        this.renderQuestion();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit answer:', err);
      this.renderError(err.message);
    }
  }

  /**
   * Show answer feedback
   */
  showFeedback(isCorrect, tokens) {
    const feedback = document.createElement('div');
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.textContent = isCorrect ? `Correct! +${tokens} tokens` : `Incorrect. ${tokens} tokens`;
    
    this.container.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 1500);
  }

  /**
   * Destroy the page (cleanup)
   */
  destroy() {
    if (this.timer) {
      this.timer.destroy();
    }
    if (this.questionComponent) {
      this.questionComponent.destroy();
    }
    this.container.innerHTML = '';
  }
}
