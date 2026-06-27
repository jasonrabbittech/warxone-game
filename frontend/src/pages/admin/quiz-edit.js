/**
 * WarXOne - Admin Quiz Edit Page
 * Create or edit quiz question
 */

export class AdminQuizEdit {
  /**
   * @param {HTMLElement} container - DOM element to render page
   * @param {string} token - JWT admin token
   * @param {string} [questionId] - Question ID (for editing)
   * @param {Function} onSave - Callback when question saved
   * @param {Function} onCancel - Callback when cancelled
   */
  constructor(container, token, questionId, onSave, onCancel) {
    this.container = container;
    this.token = token;
    this.questionId = questionId;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.question = null;
  }

  /**
   * Initialize the page
   */
  async init() {
    if (this.questionId) {
      await this.fetchQuestion();
    }
    this.render();
  }

  /**
   * Fetch question details (if editing)
   */
  async fetchQuestion() {
    try {
      const response = await fetch(
        `/api/admin/quiz-list?id=${this.questionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to fetch question');
      }

      this.questions = data.data.questions?.[0] || null;
    } catch (err) {
      console.error('Failed to fetch question:', err);
      this.error = err.message;
    }
  }

  /**
   * Render the page
   */
  render() {
    const q = this.questions || {};
    const isEdit = !!this.questionId;

    this.container.innerHTML = `
      <div class="admin-quiz-edit">
        <h1>${isEdit ? 'Edit' : 'Create'} Quiz Question</h1>
        <form id="quiz-form">
          <div class="form-group">
            <label>Question:</label>
            <textarea id="question" required>${q.question || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Option A:</label>
            <input type="text" id="option_a" required value="${q.options?.A || ''}" />
          </div>
          <div class="form-group">
            <label>Option B:</label>
            <input type="text" id="option_b" required value="${q.options?.B || ''}" />
          </div>
          <div class="form-group">
            <label>Option C:</label>
            <input type="text" id="option_c" required value="${q.options?.C || ''}" />
          </div>
          <div class="form-group">
            <label>Option D:</label>
            <input type="text" id="option_d" required value="${q.options?.D || ''}" />
          </div>
          <div class="form-group">
            <label>Correct Answer:</label>
            <select id="correct_answer" required>
              <option value="A" ${q.correctAnswer === 'A' ? 'selected' : ''}>A</option>
              <option value="B" ${q.correctAnswer === 'B' ? 'selected' : ''}>B</option>
              <option value="C" ${q.correctAnswer === 'C' ? 'selected' : ''}>C</option>
              <option value="D" ${q.correctAnswer === 'D' ? 'selected' : ''}>D</option>
            </select>
          </div>
          <div class="form-group">
            <label>Explanation:</label>
            <textarea id="explanation">${q.explanation || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Difficulty:</label>
            <select id="difficulty">
              <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
              <option value="medium" ${q.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
              <option value="super_hard" ${q.difficulty === 'super_hard' ? 'selected' : ''}>Super Hard</option>
              <option value="invincible_hard" ${q.difficulty === 'invincible_hard' ? 'selected' : ''}>Invincible Hard</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category:</label>
            <input type="text" id="category" value="${q.category || 'general'}" />
          </div>
          <div class="form-group">
            <label>Active:</label>
            <input type="checkbox" id="is_active" ${q.isActive !== false ? 'checked' : ''} />
          </div>
          <div class="form-actions">
            <button type="submit">Save</button>
            <button type="button" id="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const form = this.container.querySelector('#quiz-form');
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    const cancelBtn = this.container.querySelector('#cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
    });
  }

  /**
   * Handle form submit
   * @param {Event} e - Submit event
   */
  async handleSubmit(e) {
    e.preventDefault();

    const body = {
      question: this.container.querySelector('#question').value,
      option_a: this.container.querySelector('#option_a').value,
      option_b: this.container.querySelector('#option_b').value,
      option_c: this.container.querySelector('#option_c').value,
      option_d: this.container.querySelector('#option_d').value,
      correct_answer: this.container.querySelector('#correct_answer').value,
      explanation: this.container.querySelector('#explanation').value,
      difficulty: this.container.querySelector('#difficulty').value,
      category: this.container.querySelector('#category').value,
      is_active: this.container.querySelector('#is_active').checked,
    };

    if (this.questionId) {
      body.id = this.questionId;
    }

    try {
      const url = this.questionId ? '/api/admin/quiz-update' : '/api/admin/quiz-create';
      const method = this.questionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save question');
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to save question');
      }

      alert(`Question ${this.questionId ? 'updated' : 'created'} successfully!`);
      
      if (this.onSave) {
        this.onSave();
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      alert(`Error: ${err.message}`);
    }
  }

  /**
   * Destroy the page (cleanup)
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
