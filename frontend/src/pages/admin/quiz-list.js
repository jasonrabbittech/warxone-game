/**
 * WarXOne - Admin Quiz List Page
 * Displays quiz questions with CRUD operations
 */

export class AdminQuizList {
  /**
   * @param {HTMLElement} container - DOM element to render page
   * @param {string} token - JWT admin token
   * @param {Function} onCreate - Callback to navigate to create page
   * @param {Function} onEdit - Callback to navigate to edit page
   * @param {Function} onBack - Callback to go back
   */
  constructor(container, token, onCreate, onEdit, onBack) {
    this.container = container;
    this.token = token;
    this.onCreate = onCreate;
    this.onEdit = onEdit;
    this.onBack = onBack;
    this.questions = [];
    this.currentPage = 1;
    this.limit = 20;
    this.total = 0;
  }

  /**
   * Initialize the page (fetch questions)
   */
  async init() {
    this.renderLoading();
    await this.fetchQuestions();
    this.render();
  }

  /**
   * Fetch questions from API
   */
  async fetchQuestions() {
    try {
      const response = await fetch(
        `/api/admin/quiz-list?page=${this.currentPage}&limit=${this.limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to fetch questions');
      }

      this.questions = data.data.questions || [];
      this.total = data.data.pagination?.total || 0;
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      this.error = err.message;
    }
  }

  /**
   * Render loading state
   */
  renderLoading() {
    this.container.innerHTML = '<div class="admin-loading">Loading questions...</div>';
  }

  /**
   * Render the page
   */
  render() {
    if (this.error) {
      this.container.innerHTML = `<div class="admin-error">Error: ${this.error}</div>`;
      return;
    }

    const questionsHtml = this.questions.map(q => `
      <tr class="question-row">
        <td>${this.escapeHtml(q.question)}</td>
        <td>${q.difficulty}</td>
        <td>${q.category}</td>
        <td>${q.isActive ? 'Active' : 'Inactive'}</td>
        <td>
          <button class="edit-btn" data-id="${q.id}">Edit</button>
          <button class="delete-btn" data-id="${q.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    const totalPages = Math.ceil(this.total / this.limit) || 1;

    this.container.innerHTML = `
      <div class="admin-quiz-list">
        <div class="admin-header">
          <h1>Manage Quiz Questions</h1>
          <button class="create-btn" id="create-btn">Create New</button>
          <button class="back-btn" id="back-btn">Back</button>
        </div>
        <table class="questions-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Difficulty</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${questionsHtml || '<tr><td colspan="5">No questions found.</td></tr>'}
          </tbody>
        </table>
        <div class="pagination">
          <button ${this.currentPage <= 1 ? 'disabled' : ''} id="prev-btn">Previous</button>
          <span>Page ${this.currentPage} of ${totalPages}</span>
          <button ${this.currentPage >= totalPages ? 'disabled' : ''} id="next-btn">Next</button>
        </div>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Create button
    const createBtn = this.container.querySelector('#create-btn');
    createBtn?.addEventListener('click', () => {
      if (this.onCreate) {
        this.onCreate();
      }
    });

    // Back button
    const backBtn = this.container.querySelector('#back-btn');
    backBtn?.addEventListener('click', () => {
      if (this.onBack) {
        this.onBack();
      }
    });

    // Edit buttons
    const editBtns = this.container.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (this.onEdit) {
          this.onEdit(id);
        }
      });
    });

    // Delete buttons
    const deleteBtns = this.container.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.handleDelete(id);
      });
    });

    // Pagination
    const prevBtn = this.container.querySelector('#prev-btn');
    prevBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.init();
      }
    });

    const nextBtn = this.container.querySelector('#next-btn');
    nextBtn?.addEventListener('click', () => {
      const totalPages = Math.ceil(this.total / this.limit);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.init();
      }
    });
  }

  /**
   * Handle delete question
   * @param {string} id - Question ID
   */
  async handleDelete(id) {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/quiz-delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(data.message || 'Failed to delete question');
      }

      alert('Question deleted successfully');
      await this.init(); // Refresh list
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert(`Error: ${err.message}`);
    }
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
   * Destroy the page (cleanup)
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
