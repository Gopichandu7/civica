'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbGet, dbRun } = require('../database');
const twilioService = require('../services/twilioService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTwiML(message) {
  const escaped = (message || 'నమస్కారం. మీకు మా అభ్యర్థి నుండి శుభాకాంక్షలు.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">${escaped}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="hi-IN">ధన్యవాదాలు. మీకు శుభదినం.</Say>
</Response>`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/calls/twiml?contactId=XXX
router.get('/twiml', (req, res) => {
  try {
    const { contactId } = req.query;
    let message = null;

    if (contactId) {
      const contact = dbGet('SELECT * FROM contacts WHERE id = ?', [contactId]);
      if (contact) {
        const campaign = dbGet('SELECT * FROM campaign ORDER BY id DESC LIMIT 1');
        if (campaign) {
          message = campaign.message_telugu || campaign.message_english;
          if (message && contact.name) {
            message = message.replace(/\{name\}/gi, contact.name).replace(/\{village\}/gi, contact.village || '');
          }
        }
      }
    }

    res.set('Content-Type', 'text/xml');
    res.send(buildTwiML(message));
  } catch (err) {
    console.error('[calls] GET /twiml', err);
    res.set('Content-Type', 'text/xml');
    res.send(buildTwiML(null));
  }
});

// GET /api/calls — list all calls with contact info
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const calls = dbAll(`
      SELECT ca.*, co.name as contact_name, co.phone as contact_phone, co.village as contact_village
      FROM calls ca
      LEFT JOIN contacts co ON ca.contact_id = co.id
      ORDER BY ca.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const totalRow = dbGet('SELECT COUNT(*) as total FROM calls');
    const total = totalRow ? totalRow.total : 0;

    res.json({ success: true, calls, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('[calls] GET /', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/stats
router.get('/stats', (req, res) => {
  try {
    const rows = dbAll(`SELECT status, COUNT(*) as count FROM calls GROUP BY status`);
    const pendingRow = dbGet(`SELECT COUNT(*) as count FROM contacts WHERE status = 'pending'`);

    const stats = { total: 0, completed: 0, failed: 0, in_progress: 0, pending: pendingRow ? pendingRow.count : 0 };
    for (const r of rows) {
      stats[r.status] = (stats[r.status] || 0) + r.count;
      stats.total += r.count;
    }

    res.json({ success: true, stats });
  } catch (err) {
    console.error('[calls] GET /stats', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/start — initiate calls to all pending contacts
router.post('/start', async (req, res) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_account_sid_here') {
      return res.status(400).json({ success: false, error: 'Twilio credentials not configured. Please set up .env file.' });
    }

    const pendingContacts = dbAll(`SELECT * FROM contacts WHERE status = 'pending'`);

    if (pendingContacts.length === 0) {
      return res.json({ success: true, initiated: 0, message: 'No pending contacts to call.' });
    }

    let initiated = 0;
    const errors = [];

    for (const contact of pendingContacts) {
      try {
        const call = await twilioService.makeCall(contact.phone, contact.id);
        const callId = uuidv4();
        dbRun(
          `INSERT INTO calls (id, contact_id, call_sid, status) VALUES (?, ?, ?, 'initiated')`,
          [callId, contact.id, call.sid]
        );
        dbRun(`UPDATE contacts SET status = 'called' WHERE id = ?`, [contact.id]);
        initiated++;
      } catch (callErr) {
        console.error(`[calls] Failed to call ${contact.phone}:`, callErr.message);
        errors.push({ contactId: contact.id, phone: contact.phone, error: callErr.message });
        dbRun(`UPDATE contacts SET status = 'failed' WHERE id = ?`, [contact.id]);
      }

      // Small delay to avoid Twilio rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    res.json({ success: true, initiated, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    console.error('[calls] POST /start', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/start-single/:contactId
router.post('/start-single/:contactId', async (req, res) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_account_sid_here') {
      return res.status(400).json({ success: false, error: 'Twilio credentials not configured.' });
    }

    const contact = dbGet('SELECT * FROM contacts WHERE id = ?', [req.params.contactId]);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    const call = await twilioService.makeCall(contact.phone, contact.id);
    const callId = uuidv4();
    dbRun(
      `INSERT INTO calls (id, contact_id, call_sid, status) VALUES (?, ?, ?, 'initiated')`,
      [callId, contact.id, call.sid]
    );
    dbRun(`UPDATE contacts SET status = 'called' WHERE id = ?`, [contact.id]);

    res.json({ success: true, callSid: call.sid, callId });
  } catch (err) {
    console.error('[calls] POST /start-single', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET + POST /api/calls/status-callback — Twilio webhook
router.get('/status-callback', (req, res) => _handleStatusCallback(req.query, res));
router.post('/status-callback', (req, res) => _handleStatusCallback(req.body, res));

function _handleStatusCallback(data, res) {
  try {
    const { CallSid, CallStatus, CallDuration } = data;
    if (!CallSid) return res.status(400).json({ error: 'Missing CallSid' });

    const statusMap = {
      'initiated': 'initiated',
      'ringing': 'in_progress',
      'in-progress': 'in_progress',
      'answered': 'in_progress',
      'completed': 'completed',
      'failed': 'failed',
      'busy': 'failed',
      'no-answer': 'failed',
      'canceled': 'failed'
    };

    const status = statusMap[CallStatus] || CallStatus;
    const duration = CallDuration ? parseInt(CallDuration) : null;
    const messageDelivered = status === 'completed' ? 1 : 0;

    dbRun(
      `UPDATE calls SET status = ?, duration = COALESCE(?, duration), message_delivered = ? WHERE call_sid = ?`,
      [status, duration, messageDelivered, CallSid]
    );

    console.log(`[calls] Status callback: CallSid=${CallSid} Status=${CallStatus}`);
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response/>');
  } catch (err) {
    console.error('[calls] status-callback error', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/calls/stop
router.post('/stop', (req, res) => {
  try {
    const info = dbRun(`UPDATE calls SET status = 'stopped' WHERE status IN ('initiated', 'in_progress')`);
    res.json({ success: true, updated: info.changes });
  } catch (err) {
    console.error('[calls] POST /stop', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
