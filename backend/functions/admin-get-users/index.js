/**
 * 管理员获取所有用户 SCF 函数
 * 仅管理员可访问
 */

const { adminAuth } = require('../_common/admin-auth.js');
const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();

exports.main = adminAuth(async (event, context) => {
    const { queryStringParameters } = event;

    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        // 解析查询参数
        const params = queryStringParameters || {};
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const skip = (page - 1) * limit;

        // 获取用户列表
        const userCollection = db.collection('users');
        const totalResult = await userCollection.count();
        const total = totalResult.total;

        const userDocs = await userCollection
            .orderBy('createdAt', 'desc')
            .skip(skip)
            .limit(limit)
            .get();

        const users = userDocs.data.map(doc => ({
            id: doc._id,
            email: doc.email,
            isAdmin: doc.isAdmin || false,
            isBanned: doc.isBanned || false,
            allianceId: doc.allianceId || null,
            createdAt: doc.createdAt,
            lastLogin: doc.lastLogin || null,
        }));

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    users,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            }),
        };
    } catch (error) {
        console.error('Admin get users error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
});
