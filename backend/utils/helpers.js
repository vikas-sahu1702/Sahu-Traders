const ActivityLog = require('../models/ActivityLog');

/**
 * Utility to log user activities for audit tracking
 * @param {string} userId - User ID who performed the action
 * @param {string} action - Action identifier (e.g. "Create Invoice")
 * @param {string} description - Brief details of what changed
 * @param {Object} req - Express request object to retrieve IP Address
 */
const logActivity = async (userId, action, description, req = null) => {
  try {
    let ipAddress = 'unknown';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    }
    await ActivityLog.create({
      user: userId,
      action,
      description,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write activity log:', error.message);
  }
};

module.exports = { logActivity };
