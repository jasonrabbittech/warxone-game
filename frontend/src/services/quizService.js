/**
 * WarXOne - Quiz Service
 * API call wrappers for quiz functions
 */

const API_BASE_URL = process.env.API_BASE_URL || '/api';

/**
 * Start a new quiz
 * @param {string} difficulty - Difficulty level (easy, medium, hard, super_hard, invincible_hard)
 * @param {string} token - JWT access token
 * @returns {Promise<{attemptId: string, questions: Array}>}
 */
export async function startQuiz(difficulty, token) {
  const response = await fetch(`${API_BASE_URL}/quiz-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ difficulty }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start quiz');
  }

  return response.json();
}

/**
 * Submit an answer for current question
 * @param {string} attemptId - Quiz attempt ID
 * @param {number} questionIndex - Current question index (0-based)
 * @param {string} selected - Selected answer (A/B/C/D) or null if timeout
 * @param {boolean} isTimeout - Whether answer was submitted due to timeout
 * @param {number} timeSpent - Time spent on this question (seconds)
 * @param {string} token - JWT access token
 * @returns {Promise<{isCorrect: boolean, tokens: number, nextQuestion: Object|null}>}
 */
export async function submitAnswer(attemptId, questionIndex, selected, isTimeout, timeSpent, token) {
  const response = await fetch(`${API_BASE_URL}/quiz-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      question_index: questionIndex,
      selected,
      is_timeout: isTimeout,
      time_spent: timeSpent,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit answer');
  }

  return response.json();
}

/**
 * Get quiz results
 * @param {string} attemptId - Quiz attempt ID
 * @param {string} token - JWT access token
 * @returns {Promise<Object>}
 */
export async function getResults(attemptId, token) {
  const response = await fetch(`${API_BASE_URL}/quiz-results?attempt_id=${attemptId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get results');
  }

  return response.json();
}

/**
 * Check daily status (can play today?)
 * @param {string} token - JWT access token
 * @returns {Promise<{canPlay: boolean, nextAttemptIn: number, message: string}>}
 */
export async function getDailyStatus(token) {
  const response = await fetch(`${API_BASE_URL}/quiz-daily-status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check daily status');
  }

  return response.json();
}

/**
 * Get player profile (for level check)
 * @param {string} token - JWT access token
 * @returns {Promise<{level: number}>}
 */
export async function getPlayerProfile(token) {
  const response = await fetch(`${API_BASE_URL}/player-profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get player profile');
  }

  return response.json();
}
