/**
 * WarXOne Admin - Audit Log Utility
 * Provides functions to log admin actions for security and debugging.
 */

const { execute, queryOne } = require('./db');

/**
 * Log an admin action to audit_logs table
 * @param {object} params - { adminId, action, targetType, targetId, details, ipAddress, userAgent }
 */
async function logAudit(params) {
  const {
    adminId,
    action,
    targetType,
    targetId,
    details = null,
    ipAddress = null,
    userAgent = null,
  } = params;

  // Ensure audit_logs table exists
  await queryOne(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      admin_id VARCHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id VARCHAR(36) NOT NULL,
      details JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_id (admin_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const auditId = require('crypto').randomUUID();
  await execute(
    `INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditId,
      adminId,
      action,
      targetType,
      targetId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    ]
  );
}

/**
 * Get audit logs (paginated)
 * @param {object} params - { page, limit, adminId, action, startDate, endDate }
 * @returns {object} { logs, total, page, limit, totalPages }
 */
async function getAuditLogs(params = {}) {
  const {
    page = 1,
    limit = 20,
    adminId = null,
    action = null,
    startDate = null,
    endDate = null,
  } = params;

  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  const queryParams = [];

  if (adminId) {
    whereClause += ' AND admin_id = ?';
    queryParams.push(adminId);
  }

  if (action) {
    whereClause += ' AND action = ?';
    queryParams.push(action);
  }

  if (startDate) {
    whereClause += ' AND created_at >= ?';
    queryParams.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND created_at <= ?';
    queryParams.push(endDate);
  }

  // Get total count
  const countResult = await queryOne(
    `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
    queryParams
  );
  const total = countResult.total;

  // Get logs
  const logs = await require('./db').query(
    `SELECT al.*, au.email as admin_email
     FROM audit_logs al
     LEFT JOIN admin_users au ON al.admin_id = au.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );

  return {
    logs: logs.map(log => ({
      id: log.id,
      adminId: log.admin_id,
      adminEmail: log.admin_email,
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      details: log.details ? JSON.parse(log.details) : null,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  logAudit,
  getAuditLogs,
};
