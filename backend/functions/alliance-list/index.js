/**
 * 联盟列表 SCF 函数
 * 获取所有公开联盟
 */

const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();

exports.main = async (event, context) => {
    const { headers, queryStringParameters } = event;

    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    try {
        // 解析查询参数
        const params = queryStringParameters || {};
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const skip = (page - 1) * limit;

        // 获取公开联盟
        const allianceCollection = db.collection('alliances');
        const totalResult = await allianceCollection.where({ isPublic: true }).count();
        const total = totalResult.total;

        const allianceDocs = await allianceCollection
            .where({ isPublic: true })
            .orderBy('createdAt', 'desc')
            .skip(skip)
            .limit(limit)
            .get();

        const alliances = allianceDocs.data.map(doc => ({
            id: doc._id,
            name: doc.name,
            description: doc.description,
            memberCount: doc.members ? doc.members.length : 0,
            level: doc.level || 1,
            createdAt: doc.createdAt,
        }));

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    alliances,
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
        console.error('List alliances error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
