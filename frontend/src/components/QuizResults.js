/**
 * WarXOne - Quiz Results Component
 * Displays summary + collapsible per-question details
 */

export class QuizResults {
  /**
   * @param {HTMLElement} container - DOM element to render results
   * @param {Object} results - Results object {score, total, correctCount, incorrectCount, tokensEarned, questions: [{question, selected, correct, explanation, tokens}]}
   * @param {Object} [dailyStatus] - Optional daily status {canPlay: boolean, nextAttemptIn: number}
   */
  constructor(container, results, dailyStatus = null) {
    this.container = container;
    this.results = results;
    this.dailyStatus = dailyStatus;
    this.isDetailsVisible = false;
  }

  /**
   * Render the results to DOM
   */
  render() {
    const { score, total, correctCount, incorrectCount, tokensEarned, questions } = this.results;
    
    const summaryHtml = `
      <div class="results-summary">
        <h2 class="results-title">Quiz Complete!</h2>
        <div class="results-score">Score: ${score}/${total}</div>
        <div class="results-breakdown">
          <span class="correct">Correct: ${correctCount}</span>
          <span class="incorrect">Incorrect: ${incorrectCount}</span>
        </div>
        <div class="results-tokens ${tokensEarned >= 0 ? 'positive' : 'negative'}">
          Tokens: ${tokensEarned >= 0 ? '+' : ''}${tokensEarned}
        </div>
      </div>
    `;

    const detailsHtml = this.isDetailsVisible ? this.renderDetails(questions) : '';
    const toggleText = this.isDetailsVisible ? 'Hide Details' : 'View Details';

    this.container.innerHTML = `
      <div class="quiz-results">
        ${summaryHtml}
        <button class="results-toggle-details" id="toggle-details">${toggleText}</button>
        <div class="results-details" id="results-details">
          ${detailsHtml}
        </div>
        ${this.renderDailyLimitMessage()}
        <button class="results-close-btn" id="close-results">Close</button>
      </div>
    `;

    // Attach event listeners
    const toggleBtn = this.container.querySelector('#toggle-details');
    toggleBtn.addEventListener('click', () => {
      this.isDetailsVisible = !this.isDetailsVisible;
      this.render();
    });

    const closeBtn = this.container.querySelector('#close-results');
    closeBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
    });
  }

  /**
   * Render daily limit message if limit reached
   * @returns {string}
   */
  renderDailyLimitMessage() {
    if (!this.dailyStatus || this.dailyStatus.canPlay) {
      return '';
    }

    const nextAttemptIn = this.dailyStatus.nextAttemptIn || 0;
    const hours = Math.floor(nextAttemptIn / 3600);
    const minutes = Math.floor((nextAttemptIn % 3600) / 60);
    
    return `
      <div class="results-daily-limit">
        <p class="daily-limit-title">Daily Limit Reached</p>
        <p class="daily-limit-message">You have already completed a quiz today.</p>
        <p class="daily-limit-countdown">Next attempt in: ${hours}h ${minutes}m</p>
      </div>
    `;
  }

  /**
   * Render per-question details
   * @param {Array} questions 
   * @returns {string}
   */
  renderDetails(questions) {
    if (!questions || questions.length === 0) {
      return '<p>No question details available.</p>';
    }

    return questions.map((q, index) => {
      const isCorrect = q.selected === q.correct;
      const rowClass = q.is_timeout ? 'timeout' : (isCorrect ? 'correct' : 'incorrect');
      
      return `
        <div class="detail-row ${rowClass}">
          <div class="detail-question">
            <span class="detail-index">Q${index + 1}</span>
            <span class="detail-text">${this.escapeHtml(q.question)}</span>
          </div>
          <div class="detail-answers">
            <span class="detail-selected">Your answer: ${q.selected || '(timeout)'}</span>
            <span class="detail-correct">Correct: ${q.correct}</span>
          </div>
          ${q.explanation ? `<div class="detail-explanation">${this.escapeHtml(q.explanation)}</div>` : ''}
          <div class="detail-tokens">
            Tokens: ${q.tokens >= 0 ? '+' : ''}${q.tokens}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text 
   * @returns {string}
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the component (cleanup)
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
