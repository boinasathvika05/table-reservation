const AuditLog = require('../models/AuditLog');

class AuditLogRepository {
  async create(logData) {
    const log = new AuditLog(logData);
    return await log.save();
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const count = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return {
      logs,
      total: count,
      page,
      limit
    };
  }
}

module.exports = new AuditLogRepository();
