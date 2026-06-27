/**
 * WarXOne - Quiz Timer Component
 * Countdown timer with auto-submit on expire, supports reconnect resume
 */

export class QuizTimer {
  /**
   * @param {HTMLElement} container - DOM element to render timer
   * @param {number} seconds - Initial time in seconds
   * @param {Function} onExpire - Callback when timer expires
   */
  constructor(container, seconds, onExpire) {
    this.container = container;
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.onExpire = onExpire;
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();
    
    this.intervalId = setInterval(() => {
      this.remainingSeconds--;
      this.render();
      
      if (this.remainingSeconds <= 0) {
        this.stop();
        if (this.onExpire) {
          this.onExpire();
        }
      }
    }, 1000);
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Resume the timer
   */
  resume() {
    this.start();
  }

  /**
   * Stop the timer
   */
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get remaining time in seconds
   * @returns {number}
   */
  getRemainingSeconds() {
    return this.remainingSeconds;
  }

  /**
   * Render the timer to DOM
   */
  render() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Add warning class when time is low (< 5 seconds)
    const warningClass = this.remainingSeconds <= 5 ? 'timer-warning' : '';
    
    this.container.innerHTML = `
      <div class="quiz-timer ${warningClass}">
        <span class="timer-icon">⏱️</span>
        <span class="timer-text">${timeStr}</span>
      </div>
    `;
  }

  /**
   * Destroy the timer (cleanup)
   */
  destroy() {
    this.stop();
    this.container.innerHTML = '';
  }
}

/**
 * Create timer state for reconnect (store in localStorage or send to backend)
 * @param {number} remainingSeconds 
 * @param {number} currentQuestionIndex
 * @returns {Object}
 */
export function createReconnectState(remainingSeconds, currentQuestionIndex) {
  return {
    current_question_index: currentQuestionIndex,
    seconds_left: remainingSeconds,
    disconnected_at: new Date().toISOString(),
  };
}

/**
 * Restore timer from reconnect state
 * @param {Object} reconnectState 
 * @returns {{secondsLeft: number, questionIndex: number}}
 */
export function restoreFromReconnectState(reconnectState) {
  if (!reconnectState) {
    return { secondsLeft: 0, questionIndex: 0 };
  }
  
  return {
    secondsLeft: reconnectState.seconds_left || 0,
    questionIndex: reconnectState.current_question_index || 0,
  };
}
