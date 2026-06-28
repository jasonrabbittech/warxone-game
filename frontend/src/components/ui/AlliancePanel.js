/**
 * 联盟面板组件 (User Story 6)
 * 显示联盟信息、成员列表和管理选项
 */

import { GameState } from '../../game/GameState.js';

export class AlliancePanel {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.alliance = null;
        this.updateInterval = null;
    }

    /**
     * 初始化联盟面板
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
    }

    /**
     * 渲染联盟面板
     */
    render() {
        const userAlliance = GameState.player.alliance;

        if (!userAlliance) {
            this.renderNoAlliance();
            return;
        }

        // 获取联盟详情
        this.loadAllianceDetails(userAlliance);
    }

    /**
     * 渲染无联盟状态
     */
    renderNoAlliance() {
        this.container.innerHTML = `
            <div class="alliance-panel">
                <h3>🤝 联盟 / Alliance</h3>
                <div class="no-alliance">
                    <p>您不在任何联盟中</p>
                    <p><small>加入或创建一个联盟以与其他玩家合作</small></p>
                    <div class="alliance-actions">
                        <button class="btn-create" id="btn-create-alliance">
                            创建联盟 / Create Alliance
                        </button>
                        <button class="btn-browse" id="btn-browse-alliances">
                            浏览联盟 / Browse Alliances
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 加载联盟详情
     * @param {string} allianceId - 联盟ID
     */
    async loadAllianceDetails(allianceId) {
        try {
            // 从后端获取联盟详情
            const response = await fetch(`/api/alliance/details?id=${allianceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.alliance = data.data.alliance;
                    this.renderAllianceDetails();
                }
            } else {
                // 使用本地数据
                this.alliance = {
                    id: allianceId,
                    name: 'Unknown Alliance',
                    description: '',
                    members: [],
                    level: 1,
                };
                this.renderAllianceDetails();
            }
        } catch (error) {
            console.error('Failed to load alliance details:', error);
            this.renderNoAlliance();
        }
    }

    /**
     * 渲染联盟详情
     */
    renderAllianceDetails() {
        if (!this.alliance) return;

        const isLeader = this.alliance.leaderId === GameState.player.id;

        this.container.innerHTML = `
            <div class="alliance-panel active">
                <h3>🤝 ${this.alliance.name}</h3>

                <div class="alliance-info">
                    <div class="info-item">
                        <span class="info-label">等级 / Level:</span>
                        <span class="info-value">${this.alliance.level || 1}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">成员 / Members:</span>
                        <span class="info-value" id="alliance-member-count">
                            ${(this.alliance.members || []).length}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">经验 / XP:</span>
                        <span class="info-value" id="alliance-xp">
                            ${this.alliance.experience || 0}
                        </span>
                    </div>
                </div>

                <div class="alliance-description">
                    <p>${this.alliance.description || '无描述 / No description'}</p>
                </div>

                <div class="alliance-members">
                    <h4>成员列表 / Members</h4>
                    <div class="member-list" id="alliance-member-list">
                        ${(this.alliance.members || []).map(member => `
                            <div class="member-item ${member.id === this.alliance.leaderId ? 'leader' : ''}">
                                <span class="member-name">${member.email || 'Unknown'}</span>
                                ${member.id === this.alliance.leaderId ? '<span class="leader-badge">👑</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="alliance-actions">
                    <button class="btn-leave" id="btn-leave-alliance">
                        离开联盟 / Leave Alliance
                    </button>
                    ${isLeader ? `
                        <button class="btn-manage" id="btn-manage-alliance">
                            管理联盟 / Manage Alliance
                        </button>
                    ` : ''}
                    <button class="btn-chat" id="btn-alliance-chat">
                        联盟聊天 / Alliance Chat
                    </button>
                </div>
            </div>
        `;
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
        }, 10000); // 每10秒更新一次
    }

    /**
     * 更新联盟显示
     */
    update() {
        if (!this.alliance) return;

        // 更新成员数量
        const memberCount = document.getElementById('alliance-member-count');
        if (memberCount) {
            memberCount.textContent = (this.alliance.members || []).length;
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 创建联盟按钮
        const createBtn = document.getElementById('btn-create-alliance');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateAllianceModal();
            });
        }

        // 浏览联盟按钮
        const browseBtn = document.getElementById('btn-browse-alliances');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                this.showBrowseAlliancesModal();
            });
        }

        // 离开联盟按钮
        const leaveBtn = document.getElementById('btn-leave-alliance');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                this.leaveAlliance();
            });
        }

        // 管理联盟按钮
        const manageBtn = document.getElementById('btn-manage-alliance');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                this.showManageAllianceModal();
            });
        }

        // 联盟聊天按钮
        const chatBtn = document.getElementById('btn-alliance-chat');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                this.showAllianceChat();
            });
        }
    }

    /**
     * 显示创建联盟模态框
     */
    showCreateAllianceModal() {
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showModal', {
                title: '🤝 创建联盟 / Create Alliance',
                content: `
                    <div class="create-alliance-form">
                        <div class="form-group">
                            <label>联盟名称 / Alliance Name:</label>
                            <input type="text" id="alliance-name-input" maxlength="30" placeholder="输入联盟名称...">
                        </div>
                        <div class="form-group">
                            <label>描述 / Description:</label>
                            <textarea id="alliance-desc-input" maxlength="200" placeholder="输入联盟描述..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="alliance-public-input" checked>
                                公开联盟 / Public Alliance
                            </label>
                        </div>
                        <button class="btn-submit" id="btn-submit-create-alliance">
                            创建 / Create
                        </button>
                    </div>
                `,
            });

            // 绑定提交事件
            setTimeout(() => {
                const submitBtn = document.getElementById('btn-submit-create-alliance');
                if (submitBtn) {
                    submitBtn.addEventListener('click', () => {
                        this.createAlliance();
                    });
                }
            }, 100);
        }
    }

    /**
     * 创建联盟
     */
    async createAlliance() {
        const name = document.getElementById('alliance-name-input')?.value;
        const description = document.getElementById('alliance-desc-input')?.value;
        const isPublic = document.getElementById('alliance-public-input')?.checked;

        if (!name || name.length < 3) {
            this.showNotification('联盟名称至少3个字符', 'error');
            return;
        }

        try {
            const response = await fetch('/api/alliance/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ name, description, isPublic }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    GameState.player.alliance = data.data.allianceId;
                    this.alliance = data.data.alliance;
                    this.render();
                    this.showNotification('联盟创建成功！', 'success');
                } else {
                    this.showNotification(data.error || '创建失败', 'error');
                }
            } else {
                this.showNotification('创建失败', 'error');
            }
        } catch (error) {
            console.error('Create alliance error:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 显示浏览联盟模态框
     */
    showBrowseAlliancesModal() {
        if (GameState.eventSystem) {
            GameState.eventSystem.emit('showModal', {
                title: '🤝 浏览联盟 / Browse Alliances',
                content: `
                    <div class="browse-alliances">
                        <div class="alliance-list" id="browse-alliance-list">
                            <p>加载中... / Loading...</p>
                        </div>
                        <div class="pagination" id="alliance-pagination"></div>
                    </div>
                `,
            });

            // 加载联盟列表
            this.loadAllianceList();
        }
    }

    /**
     * 加载联盟列表
     * @param {number} page - 页码
     */
    async loadAllianceList(page = 1) {
        try {
            const response = await fetch(`/api/alliance/list?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.renderAllianceList(data.data.alliances, data.data.pagination);
                }
            }
        } catch (error) {
            console.error('Load alliance list error:', error);
        }
    }

    /**
     * 渲染联盟列表
     * @param {Array} alliances - 联盟数组
     * @param {Object} pagination - 分页信息
     */
    renderAllianceList(alliances, pagination) {
        const listContainer = document.getElementById('browse-alliance-list');
        const paginationContainer = document.getElementById('alliance-pagination');

        if (!listContainer) return;

        listContainer.innerHTML = alliances.map(alliance => `
            <div class="alliance-item">
                <div class="alliance-item-info">
                    <h4>${alliance.name}</h4>
                    <p>${alliance.description || '无描述'}</p>
                    <small>成员: ${alliance.memberCount} | 等级: ${alliance.level}</small>
                </div>
                <button class="btn-join-alliance" data-alliance-id="${alliance.id}">
                    加入 / Join
                </button>
            </div>
        `).join('');

        // 绑定加入按钮事件
        listContainer.querySelectorAll('.btn-join-alliance').forEach(btn => {
            btn.addEventListener('click', () => {
                this.joinAlliance(btn.dataset.allianceId);
            });
        });

        // 渲染分页
        if (paginationContainer && pagination) {
            paginationContainer.innerHTML = `
                <button ${pagination.page <= 1 ? 'disabled' : ''} onclick="window.loadAlliancePage(${pagination.page - 1})">
                    上一页 / Previous
                </button>
                <span>第 ${pagination.page} 页，共 ${pagination.totalPages} 页</span>
                <button ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="window.loadAlliancePage(${pagination.page + 1})">
                    下一页 / Next
                </button>
            `;

            // 暴露分页函数
            window.loadAlliancePage = (page) => {
                this.loadAllianceList(page);
            };
        }
    }

    /**
     * 加入联盟
     * @param {string} allianceId - 联盟ID
     */
    async joinAlliance(allianceId) {
        try {
            const response = await fetch('/api/alliance/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ allianceId }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    GameState.player.alliance = allianceId;
                    this.render();
                    this.showNotification('成功加入联盟！', 'success');
                } else {
                    this.showNotification(data.error || '加入失败', 'error');
                }
            }
        } catch (error) {
            console.error('Join alliance error:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 离开联盟
     */
    async leaveAlliance() {
        if (!confirm('确定要离开联盟吗？ / Are you sure you want to leave the alliance?')) {
            return;
        }

        try {
            const response = await fetch('/api/alliance/leave', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    GameState.player.alliance = null;
                    this.alliance = null;
                    this.render();
                    this.showNotification('已离开联盟', 'info');
                } else {
                    this.showNotification(data.error || '离开失败', 'error');
                }
            }
        } catch (error) {
            console.error('Leave alliance error:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 显示管理联盟模态框
     */
    showManageAllianceModal() {
        // TODO: 实现联盟管理功能
        this.showNotification('联盟管理功能即将推出', 'info');
    }

    /**
     * 显示联盟聊天
     */
    showAllianceChat() {
        // TODO: 实现联盟聊天功能
        this.showNotification('联盟聊天功能即将推出', 'info');
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
     * 销毁联盟面板
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
