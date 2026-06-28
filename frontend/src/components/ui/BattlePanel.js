/**
 * 战斗面板组件 (User Story 2 - T024, T026-T029)
 * 显示战斗状态、进度和结果
 */

import { GameState } from '../../game/GameState.js';
import { BattleModule } from '../../game/battle.js';

export class BattlePanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.battleInterval = null;
        this.cooldownInterval = null;
        this.listeners = [];
    }

    /**
     * 初始化战斗面板
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }

        this.render();
        this.bindEvents();
        this.bindGameEvents();
        this.startCooldownMonitoring();
    }

    /**
     * 渲染战斗面板
     */
    render() {
        const battle = GameState.battle;

        // 检查冷却状态 (T026)
        const onCooldown = BattleModule.isOnCooldown();
        const remainingCooldown = BattleModule.getRemainingCooldown();

        if (!battle || !battle.active) {
            // 无活跃战斗，显示冷却状态或空闲状态
            this.container.innerHTML = `
                <div class="battle-panel">
                    <h3>⚔️ 战斗 / Battle</h3>
                    ${onCooldown ? `
                        <div class="battle-cooldown">
                            <p>⏳ 战斗冷却中 / Battle on cooldown</p>
                            <div class="cooldown-timer">
                                <span id="cooldown-timer">${remainingCooldown}</span> 秒 / seconds
                            </div>
                        </div>
                    ` : `
                        <div class="no-battle">
                            <p>无活跃战斗 / No active battle</p>
                            <p><small>选择一个相邻敌方领土开始战斗 / Select adjacent enemy territory to start battle</small></p>
                        </div>
                    `}
                </div>
            `;
            return;
        }

        // 计算战斗进度
        const attacker = battle.attacker;
        const defender = battle.defender;
        const turn = battle.turn || 0;
        const log = battle.log || [];

        // 获取军事力量
        const playerMilitary = GameState.player.military || 0;
        const currentCountries = GameState.getCurrentCountries();
        const defenderMilitary = currentCountries[defender]?.military || 0;

        this.container.innerHTML = `
            <div class="battle-panel active">
                <h3>⚔️ 战斗进行中 / Battle in Progress (Turn ${turn})</h3>

                <div class="battle-participants">
                    <div class="participant attacker">
                        <h4>${attacker} (你 / You)</h4>
                        <div class="military-bar">
                            <div class="military-fill" id="attacker-military"
                                 style="width: ${Math.min(100, (playerMilitary / 100) * 100)}%"></div>
                        </div>
                        <span class="military-text" id="attacker-military-text">
                            军事 / Military: ${playerMilitary}
                        </span>
                    </div>

                    <div class="battle-vs">VS (Turn ${turn})</div>

                    <div class="participant defender">
                        <h4>${defender}</h4>
                        <div class="military-bar">
                            <div class="military-fill defender" id="defender-military"
                                 style="width: ${Math.min(100, (defenderMilitary / 100) * 100)}%"></div>
                        </div>
                        <span class="military-text" id="defender-military-text">
                            军事 / Military: ${defenderMilitary}
                        </span>
                    </div>
                </div>

                <div class="battle-actions">
                    <button class="btn-retreat" id="btn-retreat">
                        🏃 撤退 / Retreat (49.9% 成功率 / 49.9% success rate)
                    </button>
                </div>

                <div class="battle-log">
                    <h4>战斗日志 / Battle Log</h4>
                    <div class="log-list" id="battle-log-list">
                        ${log.slice(-10).map(entry => `
                            <div class="log-entry ${entry.type || 'info'}">
                                <span class="log-turn">Turn ${entry.turn || 0}</span>
                                <span class="log-message">${entry.message || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 启动战斗监控
     */
    startBattleMonitoring() {
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
        }

        this.battleInterval = setInterval(() => {
            this.updateBattle();
        }, 500); // 每0.5秒更新一次
    }

    /**
     * 启动冷却监控 (T026)
     */
    startCooldownMonitoring() {
        if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
        }

        this.cooldownInterval = setInterval(() => {
            this.updateCooldown();
        }, 1000); // 每秒更新一次
    }

    /**
     * 更新战斗显示
     */
    updateBattle() {
        const battle = GameState.battle;

        if (!battle || !battle.active) {
            this.render();
            this.stopBattleMonitoring();
            return;
        }

        // 更新军事力量显示
        const playerMilitary = GameState.player.military || 0;
        const currentCountries = GameState.getCurrentCountries();
        const defenderMilitary = currentCountries[battle.defender]?.military || 0;

        const attackerMilitaryText = document.getElementById('attacker-military-text');
        const defenderMilitaryText = document.getElementById('defender-military-text');

        if (attackerMilitaryText) {
            attackerMilitaryText.textContent = `军事 / Military: ${playerMilitary}`;
        }
        if (defenderMilitaryText) {
            defenderMilitaryText.textContent = `军事 / Military: ${defenderMilitary}`;
        }

        // 更新战斗日志
        this.updateBattleLog();
    }

    /**
     * 更新冷却显示 (T026)
     */
    updateCooldown() {
        if (BattleModule.isOnCooldown()) {
            const remaining = BattleModule.getRemainingCooldown();
            const cooldownTimer = document.getElementById('cooldown-timer');
            if (cooldownTimer) {
                cooldownTimer.textContent = remaining;
            }
        } else {
            // 冷却结束，重新渲染
            this.render();
        }
    }

    /**
     * 更新战斗日志
     */
    updateBattleLog() {
        const logList = document.getElementById('battle-log-list');
        if (!logList) return;

        const battle = GameState.battle;
        const log = battle.log || [];

        // 只显示最近10条
        const recentLog = log.slice(-10);
        logList.innerHTML = recentLog.map(entry => `
            <div class="log-entry ${entry.type || 'info'}">
                <span class="log-turn">Turn ${entry.turn || 0}</span>
                <span class="log-message">${entry.message || ''}</span>
            </div>
        `).join('');

        // 自动滚动到底部
        logList.scrollTop = logList.scrollHeight;
    }

    /**
     * 停止战斗监控
     */
    stopBattleMonitoring() {
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
            this.battleInterval = null;
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 撤退按钮 (T027)
        const retreatButton = document.getElementById('btn-retreat');
        if (retreatButton) {
            retreatButton.addEventListener('click', () => {
                this.retreat();
            });
        }
    }

    /**
     * 绑定游戏事件
     */
    bindGameEvents() {
        // 战斗开始事件
        const onBattleStart = (e) => {
            this.render();
            this.startBattleMonitoring();
        };
        document.addEventListener('battle-start', onBattleStart);
        this.listeners.push(() => document.removeEventListener('battle-start', onBattleStart));

        // 战斗更新事件
        const onBattleUpdate = (e) => {
            this.updateBattle();
        };
        document.addEventListener('battle-update', onBattleUpdate);
        this.listeners.push(() => document.removeEventListener('battle-update', onBattleUpdate));

        // 战斗结束事件 (T029)
        const onBattleEnd = (e) => {
            this.stopBattleMonitoring();
            this.showBattleResult(e.detail);
            setTimeout(() => {
                this.render();
            }, 5000); // 5秒后重新渲染
        };
        document.addEventListener('battle-end', onBattleEnd);
        this.listeners.push(() => document.removeEventListener('battle-end', onBattleEnd));

        // 前线更新事件 (T028)
        const onFrontLineUpdate = (e) => {
            this.updateFrontLine(e.detail);
        };
        document.addEventListener('front-line-update', onFrontLineUpdate);
        this.listeners.push(() => document.removeEventListener('front-line-update', onFrontLineUpdate));
    }

    /**
     * 撤退 (T027)
     */
    retreat() {
        const result = BattleModule.retreat();

        if (result.success) {
            this.showNotification('撤退成功 / Retreat successful', 'info');
        } else {
            this.showNotification(result.error || '撤退失败 / Retreat failed', 'error');
            if (result.additionalLoss) {
                this.showNotification(`额外损失 / Additional loss: ${result.additionalLoss} military`, 'warning');
            }
        }
    }

    /**
     * 更新前线显示 (T028)
     */
    updateFrontLine(detail) {
        // 前线显示在 battle.js 的 displayFrontLine() 方法中处理
        // 这里可以更新 UI 中的前线信息
        console.log('Front line updated:', detail);
    }

    /**
     * 显示战斗结果 (T029)
     */
    showBattleResult(detail) {
        const result = detail.result;
        const won = result.win;
        const resultText = won ? '胜利 / Victory' : '失败 / Defeat';
        const className = won ? 'victory' : 'defeat';

        // 计算奖励
        const rewards = won ? {
            territory: detail.defender,
            experience: 100,
            resources: Math.floor(Math.random() * 50) + 10,
        } : {};

        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showModal', {
                title: `⚔️ 战斗结束 / Battle Ended - ${resultText}`,
                content: `
                    <div class="battle-result ${className}">
                        <h2>${won ? '✅' : '❌'} ${resultText}</h2>
                        <p><strong>回合 / Turns:</strong> ${detail.turns || 0}</p>
                        <p><strong>原因 / Reason:</strong> ${result.reason || 'Unknown'}</p>
                        ${won ? `
                            <p><strong>征服领土 / Conquered Territory:</strong> ${rewards.territory}</p>
                            <p><strong>奖励 / Rewards:</strong></p>
                            <ul>
                                <li>经验 / XP: +${rewards.experience}</li>
                                <li>资源 / Resources: +${rewards.resources}</li>
                            </ul>
                        ` : ''}
                        <button class="btn-continue" onclick="this.closest('.modal').remove()">
                            继续 / Continue
                        </button>
                    </div>
                `,
                modalClass: className
            });
        }

        // 显示通知
        this.showNotification(
            won ? `战斗胜利 / Battle won! ${detail.defender} conquered.` : `战斗失败 / Battle lost!`,
            won ? 'success' : 'error'
        );
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
     * 销毁战斗面板
     */
    destroy() {
        this.stopBattleMonitoring();

        if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
        }

        // 移除事件监听器
        this.listeners.forEach(removeListener => removeListener());
        this.listeners = [];
    }
}
