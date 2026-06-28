/**
 * 主游戏 UI 管理器
 * 初始化和管理所有游戏界面组件
 */

import { GameState } from '../game/GameState.js';
import { ResourcePanel } from './ui/ResourcePanel.js';
import { MilitaryPanel } from './ui/MilitaryPanel.js';
import { BattlePanel } from './ui/BattlePanel.js';

export class GameUI {
    constructor() {
        this.panels = {};
        this.initialized = false;
    }

    /**
     * 初始化游戏 UI
     */
    init() {
        if (this.initialized) {
            console.warn('GameUI already initialized');
            return;
        }

        console.log('Initializing Game UI...');

        // 创建 UI 容器
        this.createContainers();

        // 初始化所有面板
        this.initPanels();

        // 初始化事件系统
        this.initEventSystem();

        // 加载游戏状态
        this.loadGameState();

        this.initialized = true;
        console.log('Game UI initialized successfully');
    }

    /**
     * 创建 UI 容器
     */
    createContainers() {
        // 主容器
        const mainContainer = document.createElement('div');
        mainContainer.id = 'game-ui';
        mainContainer.className = 'game-ui';
        document.body.appendChild(mainContainer);

        // 左侧面板（资源 + 军事）
        const leftPanel = document.createElement('div');
        leftPanel.id = 'left-panel';
        leftPanel.className = 'panel-left';
        leftPanel.innerHTML = `
            <div id="resource-panel-container"></div>
            <div id="military-panel-container"></div>
        `;
        mainContainer.appendChild(leftPanel);

        // 中间区域（地图）
        const centerPanel = document.createElement('div');
        centerPanel.id = 'center-panel';
        centerPanel.className = 'panel-center';
        centerPanel.innerHTML = `
            <div id="map-container"></div>
            <div id="battle-panel-container"></div>
        `;
        mainContainer.appendChild(centerPanel);

        // 右侧面板（聊天 + 信息）
        const rightPanel = document.createElement('div');
        rightPanel.id = 'right-panel';
        rightPanel.className = 'panel-right';
        rightPanel.innerHTML = `
            <div id="chat-panel-container"></div>
            <div id="info-panel-container"></div>
        `;
        mainContainer.appendChild(rightPanel);

        // 顶部栏（世界切换 + 用户菜单）
        const topBar = document.createElement('div');
        topBar.id = 'top-bar';
        topBar.className = 'top-bar';
        topBar.innerHTML = `
            <div class="world-switch">
                <button id="btn-earth" class="world-btn active">🌍 地球 / Earth</button>
                <button id="btn-mars" class="world-btn">🔴 火星 / Mars</button>
            </div>
            <div class="user-menu">
                <span id="user-email">${GameState.player.email || '未登录'}</span>
                <button id="btn-settings">⚙️</button>
            </div>
        `;
        mainContainer.appendChild(topBar);

        // 底部栏（通知区域）
        const bottomBar = document.createElement('div');
        bottomBar.id = 'bottom-bar';
        bottomBar.className = 'bottom-bar';
        bottomBar.innerHTML = `
            <div id="notification-area"></div>
        `;
        mainContainer.appendChild(bottomBar);
    }

    /**
     * 初始化所有面板
     */
    initPanels() {
        // 资源面板
        this.panels.resource = new ResourcePanel('resource-panel-container');
        this.panels.resource.init();

        // 军事面板
        this.panels.military = new MilitaryPanel('military-panel-container');
        this.panels.military.init();

        // 战斗面板
        this.panels.battle = new BattlePanel('battle-panel-container');
        this.panels.battle.init();

        console.log('All panels initialized');
    }

    /**
     * 初始化事件系统
     */
    initEventSystem() {
        // 确保 GameState 有事件系统
        if (!GameState.eventSystem) {
            GameState.eventSystem = {
                _events: {},
                on(event, callback) {
                    if (!this._events[event]) {
                        this._events[event] = [];
                    }
                    this._events[event].push(callback);
                },
                off(event, callback) {
                    if (!this._events[event]) return;
                    this._events[event] = this._events[event].filter(cb => cb !== callback);
                },
                emit(event, data) {
                    if (!this._events[event]) return;
                    this._events[event].forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`Error in event handler for ${event}:`, error);
                        }
                    });
                }
            };
        }

        // 注册全局事件处理器
        this.registerEventHandlers();
    }

    /**
     * 注册事件处理器
     */
    registerEventHandlers() {
        const eventSystem = GameState.eventSystem;

        // 显示模态框
        eventSystem.on('showModal', (data) => {
            this.showModal(data);
        });

        // 显示通知
        eventSystem.on('showNotification', (data) => {
            this.showNotification(data.message, data.type);
        });

        // 战斗开始
        eventSystem.on('battleStarted', () => {
            console.log('Battle started');
        });

        // 战斗结束
        eventSystem.on('battleEnded', (data) => {
            this.showBattleResult(data);
        });

        // 领土征服
        eventSystem.on('territoryConquered', (data) => {
            this.showNotification(`征服了 ${data.territoryName}!`, 'success');
        });

        // 资源更新
        eventSystem.on('resourcesUpdated', () => {
            if (this.panels.resource) {
                this.panels.resource.update();
            }
        });

        // 世界切换
        eventSystem.on('worldChanged', (data) => {
            this.updateWorldSwitch(data.world);
        });
    }

    /**
     * 加载游戏状态
     */
    async loadGameState() {
        try {
            const result = await GameState.load();

            if (result.success) {
                console.log(`Game state loaded from ${result.source}`);
                this.showNotification(`游戏已加载 / Game loaded (${result.source})`, 'success');
            } else {
                console.log('No saved game found, starting new game');
                this.showNotification('新游戏开始 / New game started', 'info');
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
            this.showNotification('加载游戏失败 / Failed to load game', 'error');
        }
    }

    /**
     * 显示模态框
     * @param {Object} data - 模态框数据
     */
    showModal(data) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content ${data.modalClass || ''}">
                <div class="modal-header">
                    <h3 class="modal-title">${data.title || 'Modal'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${data.content || ''}
                </div>
            </div>
        `;

        // 关闭按钮事件
        const closeButton = modal.querySelector('.modal-close');
        closeButton.addEventListener('click', () => {
            modal.remove();
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 (success, error, info, warning)
     */
    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notification-area');
        if (!notificationArea) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
        `;

        notificationArea.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * 显示战斗结果
     * @param {Object} data - 战斗结果数据
     */
    showBattleResult(data) {
        const result = data.won ? '胜利 / Victory' : '失败 / Defeat';
        const className = data.won ? 'victory' : 'defeat';

        this.showModal({
            title: `⚔️ 战斗结束 / Battle Ended - ${result}`,
            content: `
                <div class="battle-result ${className}">
                    <h2>${data.won ? '✅' : '❌'} ${result}</h2>
                    <p><strong>领土 / Territory:</strong> ${data.territoryName || 'Unknown'}</p>
                    ${data.rewards ? `
                        <p><strong>奖励 / Rewards:</strong></p>
                        <ul>
                            ${Object.entries(data.rewards).map(([key, value]) =>
                                `<li>${key}: +${value}</li>`
                            ).join('')}
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

    /**
     * 更新世界切换按钮
     * @param {string} world - 当前世界 ('earth' 或 'mars')
     */
    updateWorldSwitch(world) {
        const earthBtn = document.getElementById('btn-earth');
        const marsBtn = document.getElementById('btn-mars');

        if (earthBtn && marsBtn) {
            earthBtn.classList.toggle('active', world === 'earth');
            marsBtn.classList.toggle('active', world === 'mars');
        }
    }

    /**
     * 销毁游戏 UI
     */
    destroy() {
        // 销毁所有面板
        for (const panel of Object.values(this.panels)) {
            if (panel.destroy) {
                panel.destroy();
            }
        }

        // 移除 UI 容器
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.remove();
        }

        this.initialized = false;
        console.log('Game UI destroyed');
    }
}

// 创建单例实例
export const gameUI = new GameUI();
