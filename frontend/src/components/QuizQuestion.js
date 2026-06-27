/**
 * WarXOne - Quiz Question Component
 * Displays question and options
 */

export class QuizQuestion {
  /**
   * @param {HTMLElement} container - DOM element to render question
   * @param {Object} question - Question object {id, question, option_a, option_b, option_c, option_d, correct_answer, explanation}
   * @param {Function} onAnswer - Callback when player selects answer (answer: string)
   */
  constructor(container, question, onAnswer) {
    this.container = container;
    this.question = question;
    this.onAnswer = onAnswer;
    this.selectedAnswer = null;
  }

  /**
   * Render the question to DOM
   */
  render() {
    const options = [
      { key: 'A', text: this.question.option_a },
      { key: 'B', text: this.question.option_b },
      { key: 'C', text: this.question.option_c },
      { key: 'D', text: this.question.option_d },
    ];

    const optionsHtml = options.map(opt => `
      <button 
        class="quiz-option ${this.selectedAnswer === opt.key ? 'selected' : ''}" 
        data-answer="${opt.key}"
        ?disabled="${this.selectedAnswer ? 'true' : 'false'}"
      >
        <span class="option-key">${opt.key}</span>
        <span class="option-text">${this.escapeHtml(opt.text)}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="quiz-question">
        <div class="question-text">${this.escapeHtml(this.question.question)}</div>
        <div class="question-options">${optionsHtml}</div>
      </div>
    `;

    // Attach event listeners
    const buttons = this.container.querySelectorAll('.quiz-option');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.selectedAnswer) return; // Already answered
        
        this.selectedAnswer = btn.dataset.answer;
        if (this.onAnswer) {
          this.onAnswer(this.selectedAnswer);
        }
        
        // Update UI
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  /**
   * Reset the question (allow re-selection)
   */
  reset() {
    this.selectedAnswer = null;
    this.render();
  }

  /**
   * Get selected answer
   * @returns {string|null}
   */
  getSelectedAnswer() {
    return this.selectedAnswer;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text 
   * @returns {string}
   */
  escapeHtml(text) {
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
