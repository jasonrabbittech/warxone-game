/**
 * 管理员认证中间件
 * 验证用户是否为管理员
 */

const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();

/**
 * 验证用户是否为管理员
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 验证结果
 */
exports.verifyAdmin = async (token) => {
    try {
        // 验证 JWT
        const decoded = await app.auth().verifyToken(token);
        const userId = decoded.uid;

        // 获取用户信息
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.data || userDoc.data.length === 0) {
            return { success: false, error: 'User not found' };
        }

        const user = userDoc.data[0];

        // 检查是否为管理员
        if (!user.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        return { success: true, userId, user };
    } catch (error) {
        console.error('Admin verification error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * 管理员认证装饰器
 * @param {Function} handler - 处理函数
 * @returns {Function} 包装后的处理函数
 */
exports.adminAuth = (handler) => {
    return async (event, context) => {
        const { headers } = event;

        // CORS 头
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // 处理 OPTIONS 请求
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: '',
            };
        }

        // 验证 JWT
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: 'Unauthorized' }),
            };
        }

        // 验证管理员权限
        const authResult = await exports.verifyAdmin(token);
        if (!authResult.success) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, error: authResult.error }),
            };
        }

        // 将用户信息添加到事件对象
        event.user = authResult.user;
        event.userId = authResult.userId;

        // 调用处理函数
        return await handler(event, context);
    };
};
