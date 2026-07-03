const logger = require('../config/logger');

// Interface-like base provider
class BaseNotificationProvider {
  constructor(name) {
    this.name = name;
  }
  async send(recipient, subject, body) {
    throw new Error('Send method not implemented');
  }
}

// Concrete Email Provider (Placeholder)
class EmailNotificationProvider extends BaseNotificationProvider {
  constructor() {
    super('Email');
  }
  async send(recipient, subject, body) {
    logger.info(`[NotificationService -> Email] Mocking email delivery to [${recipient}]: "${subject}" | Content: ${body.substring(0, 50)}...`);
    return { success: true, provider: 'Email', messageId: `mock-email-${Date.now()}` };
  }
}

// Concrete SMS Provider (Placeholder)
class SMSNotificationProvider extends BaseNotificationProvider {
  constructor() {
    super('SMS');
  }
  async send(recipient, subject, body) {
    logger.info(`[NotificationService -> SMS] Mocking SMS delivery to [${recipient}]: ${body.substring(0, 50)}...`);
    return { success: true, provider: 'SMS', messageId: `mock-sms-${Date.now()}` };
  }
}

// Concrete Push Provider (Placeholder)
class PushNotificationProvider extends BaseNotificationProvider {
  constructor() {
    super('Push');
  }
  async send(recipient, subject, body) {
    logger.info(`[NotificationService -> Push] Mocking Web Push delivery to [User: ${recipient}]: ${body.substring(0, 50)}...`);
    return { success: true, provider: 'Push', messageId: `mock-push-${Date.now()}` };
  }
}

class NotificationService {
  constructor() {
    this.providers = {
      email: new EmailNotificationProvider(),
      sms: new SMSNotificationProvider(),
      push: new PushNotificationProvider()
    };
  }

  /**
   * Dispatches a notification across specified channels.
   * @param {Object} params
   * @param {string} params.recipient - Email, phone, or user ID
   * @param {string} params.subject - Message subject
   * @param {string} params.body - Detailed message text
   * @param {Array<string>} params.channels - e.g. ['email', 'sms']
   */
  async sendNotification({ recipient, subject, body, channels = ['email'] }) {
    const results = [];
    
    for (const channel of channels) {
      const provider = this.providers[channel.toLowerCase()];
      if (provider) {
        try {
          const res = await provider.send(recipient, subject, body);
          results.push(res);
        } catch (error) {
          logger.error(`Notification failed on channel ${channel}:`, error);
          results.push({ success: false, provider: channel, error: error.message });
        }
      } else {
        logger.warn(`Notification channel not configured: ${channel}`);
      }
    }
    
    return results;
  }
}

module.exports = new NotificationService();
