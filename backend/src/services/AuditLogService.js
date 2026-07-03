const AuditLogRepository = require('../repositories/AuditLogRepository');

class AuditLogService {
  async logAction({ adminId, action, entityId, entityType, previousState = null, newState = null }) {
    return await AuditLogRepository.create({
      adminId,
      action,
      entityId: entityId.toString(),
      entityType,
      previousState,
      newState
    });
  }

  async getLogs(filters = {}, options = {}) {
    return await AuditLogRepository.findAll(filters, options);
  }
}

module.exports = new AuditLogService();
