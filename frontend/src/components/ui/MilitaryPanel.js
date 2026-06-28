/**
 * 军事面板组件 (User Story 2 - T024)
 * 显示军事单位、训练选项和军事力量
 */

import { GameState } from '../../game/GameState.js';
import { Military } from '../../game/military.js';

export class MilitaryPanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.updateInterval = null;
        this.listeners = [];
    }

    /**
     * 初始化军事面板
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }

        this.render();
        this.startAutoUpdate();
        this.bindEvents();
        this.bindGameEvents();
    }

    /**
     * 渲染军事面板 (T024)
     */
    render() {
        const player = GameState.player;
        const militaryDetails = Military.getMilitaryDetails();
        const trainingQueue = Military.getTrainingQueue();
        const trainingCost = Military.getTrainingCost(10);

        this.container.innerHTML = `
            <div class="military-panel">
                <h3>⚔️ 军事 / Military</h3>

                <div class="military-stats">
                    <div class="stat-item">
                        <span class="stat-label">总军事力量 / Total Power</span>
                        <span class="stat-value" id="military-total">${militaryDetails.total}</span>
                    </div>
                    <div class="stat-breakdown">
                        <div class="breakdown-item">
                            <span class="breakdown-label">基础 / Base:</span>
                            <span class="breakdown-value">${militaryDetails.base}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">卡牌奖励 / Card Bonus:</span>
                            <span class="breakdown-value">+${militaryDetails.cardBonus}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">基础设施奖励 / Infra Bonus:</span>
                            <span class="breakdown-value">+${militaryDetails.infrastructureBonus}</span>
                        </div>
                    </div>
                </div>

                <div class="training-section">
                    <h4>训练 / Training</h4>
                    <div class="training-cost">
                        <small>成本 / Cost (per 10 units):</small>
                        <div class="cost-items">
                            <span class="cost-item">👥 ${(trainingCost.population || 0).toLocaleString()}</span>
                            <span class="cost-item">🎟️ ${trainingCost.tokens || 0}</span>
                        </div>
                    </div>
                    <div class="training-actions">
                        <button class="btn-train" id="btn-train-10">
                            训练 10 单位 / Train 10
                        </button>
                        <button class="btn-train" id="btn-train-50">
                            训练 50 单位 / Train 50
                        </button>
                    </div>
                    <div class="training-queue" id="training-queue">
                        ${this.renderTrainingQueue(trainingQueue)}
                    </div>
                </div>

                <div class="military-actions">
                    <h4>行动 / Actions</h4>
                    <button class="btn-action" id="btn-auto-train">
                        ${GameState.player.autoTrain ? '⏸️ 停止自动训练' : '▶️ 开始自动训练'}
                    </button>
                    <button class="btn-action" id="btn-view-military">
                        查看详情 / View Details
                    </button>
                </div>

                <div class="battle-history">
                    <h4>战斗历史 / Battle History</h4>
                    <div class="history-list" id="battle-history-list">
                        ${this.renderBattleHistory()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染训练队列
     */
    renderTrainingQueue(queue) {
        if (!queue || queue.length === 0) {
            return '<small>队列为空 / Queue empty</small>';
        }

        return queue.map((item, index) => `
            <div class="queue-item">
                <span class="queue-index">#${index + 1}</span>
                <span class="queue-count">${item.count} 单位 / units</span>
                <div class="queue-progress-bar">
                    <div class="queue-progress-fill" style="width: ${item.progress}%"></div>
                </div>
                <span class="queue-progress">${item.progress}%</span>
                <button class="btn-cancel-queue" data-index="${index}">取消 / Cancel</button>
            </div>
        `).join('');
    }

    /**
     * 渲染战斗历史
     */
    renderBattleHistory() {
        const battleHistory = GameState.player.battleHistory || [];

        if (battleHistory.length === 0) {
            return '<small>无战斗记录 / No battles yet</small>';
        }

        // 显示最近5场战斗
        const recentBattles = battleHistory.slice(-5).reverse();
        return recentBattles.map(battle => `
            <div class="history-item ${battle.won ? 'victory' : 'defeat'}">
                <span class="battle-result">${battle.won ? '✅' : '❌'}</span>
                <span class="battle-territory">${battle.territoryName || 'Unknown'}</span>
                <span class="battle-turns">${battle.turns || 0} 回合 / turns</span>
                <span class="battle-time">${this.formatTime(battle.timestamp)}</span>
            </div>
        `).join('');
    }

    /**
     * 启动自动更新
     */
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.update();
        }, 2000); // 每2秒更新一次
    }

    /**
     * 更新军事显示
     */
    update() {
        const militaryDetails = Military.getMilitaryDetails();
        const totalElement = document.getElementById('military-total');
        if (totalElement) {
            totalElement.textContent = militaryDetails.total;
        }

        // 更新训练队列
        this.updateTrainingQueue();

        // 更新战斗历史
        this.updateBattleHistory();
    }

    /**
     * 更新训练队列显示
     */
    updateTrainingQueue() {
        const queueElement = document.getElementById('training-queue');
        if (!queueElement) return;

        const trainingQueue = Military.getTrainingQueue();
        queueElement.innerHTML = this.renderTrainingQueue(trainingQueue);
    }

    /**
     * 更新战斗历史显示
     */
    updateBattleHistory() {
        const historyElement = document.getElementById('battle-history-list');
        if (!historyElement) return;

        historyElement.innerHTML = this.renderBattleHistory();
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚 / Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前 / min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前 / hours ago`;
        return date.toLocaleDateString();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 训练 10 单位按钮
        const train10Button = document.getElementById('btn-train-10');
        if (train10Button) {
            train10Button.addEventListener('click', () => {
                this.trainMilitary(10);
            });
        }

        // 训练 50 单位按钮
        const train50Button = document.getElementById('btn-train-50');
        if (train50Button) {
            train50Button.addEventListener('click', () => {
                this.trainMilitary(50);
            });
        }

        // 自动训练按钮
        const autoTrainButton = document.getElementById('btn-auto-train');
        if (autoTrainButton) {
            autoTrainButton.addEventListener('click', () => {
                this.toggleAutoTrain();
            });
        }

        // 查看军事按钮
        const viewMilitaryButton = document.getElementById('btn-view-military');
        if (viewMilitaryButton) {
            viewMilitaryButton.addEventListener('click', () => {
                this.showMilitaryDetails();
            });
        }

        // 取消训练队列按钮 (事件委托)
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-cancel-queue')) {
                const index = parseInt(e.target.dataset.index);
                this.cancelTraining(index);
            }
        });
    }

    /**
     * 绑定游戏事件
     */
    bindGameEvents() {
        // 军事训练开始
        const onTrainingStarted = (e) => {
            this.showNotification(`训练开始 / Training started: +${e.detail.count} units`, 'success');
            this.update();
        };
        document.addEventListener('military-training-started', onTrainingStarted);
        this.listeners.push(() => document.removeEventListener('military-training-started', onTrainingStarted));

        // 军事训练完成
        const onTrained = (e) => {
            this.showNotification(`训练完成 / Training completed: +${e.detail.count} units (Total: ${e.detail.total})`, 'success');
            this.update();
        };
        document.addEventListener('military-trained', onTrained);
        this.listeners.push(() => document.removeEventListener('military-trained', onTrained));

        // 自动训练切换
        const onAutoTrainToggled = (e) => {
            this.showNotification(
                e.detail.enabled ? '自动训练已开启 / Auto-train enabled' : '自动训练已关闭 / Auto-train disabled',
                'info'
            );
            this.update();
        };
        document.addEventListener('auto-train-toggled', onAutoTrainToggled);
        this.listeners.push(() => document.removeEventListener('auto-train-toggled', onAutoTrainToggled));
    }

    /**
     * 训练军事单位
     */
    trainMilitary(count) {
        const result = Military.trainMilitary(count);

        if (result.success) {
            this.showNotification(`训练开始 / Training started: ${count} units`, 'success');
            this.update();
        } else {
            this.showNotification(result.error || '训练失败 / Training failed', 'error');
        }
    }

    /**
     * 切换自动训练
     */
    toggleAutoTrain() {
        Military.toggleAutoTrain();
    }

    /**
     * 取消训练
     */
    cancelTraining(index) {
        const result = Military.cancelTraining(index);

        if (result) {
            this.showNotification('训练已取消 / Training cancelled', 'info');
            this.update();
        }
    }

    /**
     * 显示军事详情
     */
    showMilitaryDetails() {
        const militaryDetails = Military.getMilitaryDetails();
        const trainingQueue = Military.getTrainingQueue();

        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showModal', {
                title: '⚔️ 军事详情 / Military Details',
                content: `
                    <div class="military-details">
                        <div class="detail-row">
                            <span>总军事力量 / Total Power:</span>
                            <span>${militaryDetails.total}</span>
                        </div>
                        <div class="detail-row">
                            <span>基础 / Base:</span>
                            <span>${militaryDetails.base}</span>
                        </div>
                        <div class="detail-row">
                            <span>卡牌奖励 / Card Bonus:</span>
                            <span>+${militaryDetails.cardBonus}</span>
                        </div>
                        <div class="detail-row">
                            <span>基础设施奖励 / Infra Bonus:</span>
                            <span>+${militaryDetails.infrastructureBonus}</span>
                        </div>
                        <h4>训练队列 / Training Queue:</h4>
                        <p>${trainingQueue.length} 单位正在训练 / units training</p>
                        <h4>战斗历史 / Battle History:</h4>
                        <p>${(GameState.player.battleHistory || []).length} 场战斗 / battles</p>
                    </div>
                `
            });
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showNotification', { message, type });
        }
    }

    /**
     * 销毁军事面板
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // 移除事件监听器
        this.listeners.forEach(removeListener => removeListener());
        this.listeners = [];
    }
}
