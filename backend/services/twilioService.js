'use strict';

const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  }

  /**
   * Initiate an outbound call to the given number.
   * @param {string} toNumber - E.164 formatted phone number
   * @param {string} contactId - UUID of the contact record
   * @returns {Promise<object>} Twilio call resource
   */
  async makeCall(toNumber, contactId) {
    const call = await this.client.calls.create({
      to: toNumber,
      from: this.fromNumber,
      url: `${this.baseUrl}/api/calls/twiml?contactId=${contactId}`,
      statusCallback: `${this.baseUrl}/api/calls/status-callback`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no-answer']
    });
    return call;
  }
}

module.exports = new TwilioService();
