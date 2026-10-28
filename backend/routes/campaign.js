'use strict';

const express = require('express');
const router = express.Router();
const { dbGet, dbRun } = require('../database');

// GET /api/campaign
router.get('/', (req, res) => {
  try {
    const campaign = dbGet('SELECT * FROM campaign ORDER BY id DESC LIMIT 1');
    res.json({ success: true, campaign: campaign || null });
  } catch (err) {
    console.error('[campaign] GET /', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/campaign
router.post('/', (req, res) => {
  try {
    const { candidate_name, message_telugu, message_english, village_name } = req.body;
    if (!candidate_name) {
      return res.status(400).json({ success: false, error: 'candidate_name is required' });
    }

    // Upsert single campaign row at id=1
    dbRun(
      `INSERT INTO campaign (id, candidate_name, message_telugu, message_english, village_name)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         candidate_name = excluded.candidate_name,
         message_telugu = excluded.message_telugu,
         message_english = excluded.message_english,
         village_name = excluded.village_name,
         created_at = CURRENT_TIMESTAMP`,
      [candidate_name, message_telugu || '', message_english || '', village_name || '']
    );

    const campaign = dbGet('SELECT * FROM campaign WHERE id = 1');
    res.json({ success: true, campaign });
  } catch (err) {
    console.error('[campaign] POST /', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/campaign/preview-message
router.get('/preview-message', (req, res) => {
  try {
    const campaign = dbGet('SELECT * FROM campaign ORDER BY id DESC LIMIT 1');
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'No campaign configured yet.' });
    }

    const preview = {
      telugu: campaign.message_telugu || '',
      english: campaign.message_english || '',
      candidate: campaign.candidate_name,
      village: campaign.village_name,
      formatted_telugu: (campaign.message_telugu || '')
        .replace(/\{candidate_name\}/gi, campaign.candidate_name || '')
        .replace(/\{village_name\}/gi, campaign.village_name || ''),
      formatted_english: (campaign.message_english || '')
        .replace(/\{candidate_name\}/gi, campaign.candidate_name || '')
        .replace(/\{village_name\}/gi, campaign.village_name || '')
    };

    res.json({ success: true, preview });
  } catch (err) {
    console.error('[campaign] GET /preview-message', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
