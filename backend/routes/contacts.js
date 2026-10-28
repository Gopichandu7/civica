'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbGet, dbRun } = require('../database');
const path = require('path');
const fs = require('fs');

// ─── Multer Setup ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return null;
  let phone = String(raw).replace(/[\s\-().]/g, '');
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('91') && phone.length >= 12) return `+${phone}`;
  return `+91${phone}`;
}

function insertContacts(rows) {
  let count = 0;
  for (const c of rows) {
    try {
      dbRun(
        `INSERT OR IGNORE INTO contacts (id, name, phone, village, status) VALUES (?, ?, ?, ?, 'pending')`,
        [uuidv4(), c.name, c.phone, c.village || '']
      );
      count++;
    } catch (e) {
      // skip duplicates
    }
  }
  return count;
}

function parseRows(rawRows) {
  return rawRows
    .filter(r => r.name && r.phone)
    .map(r => ({
      name: String(r.name).trim(),
      phone: normalizePhone(r.phone),
      village: r.village ? String(r.village).trim() : ''
    }))
    .filter(r => r.phone);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/contacts — paginated list
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const contacts = dbAll('SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    const totalRow = dbGet('SELECT COUNT(*) as total FROM contacts');
    const total = totalRow ? totalRow.total : 0;

    res.json({
      success: true,
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[contacts] GET /', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contacts/stats
router.get('/stats', (req, res) => {
  try {
    const rows = dbAll(`SELECT status, COUNT(*) as count FROM contacts GROUP BY status`);
    const stats = { total: 0, pending: 0, called: 0, failed: 0 };
    for (const r of rows) {
      stats[r.status] = r.count;
      stats.total += r.count;
    }
    res.json({ success: true, stats });
  } catch (err) {
    console.error('[contacts] GET /stats', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contacts/upload — CSV or Excel file
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let rows = [];

    if (ext === '.csv') {
      rows = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csvParser({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      rows = rawData.map(r => {
        const normalized = {};
        for (const [k, v] of Object.entries(r)) {
          normalized[k.trim().toLowerCase()] = v;
        }
        return normalized;
      });
    }

    const contacts = parseRows(rows);
    if (contacts.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid contacts found. Ensure columns: name, phone, village.' });
    }

    const count = insertContacts(contacts);
    fs.unlink(filePath, () => {});

    const inserted = dbAll('SELECT * FROM contacts ORDER BY created_at DESC LIMIT ?', [count]);
    res.json({ success: true, count, contacts: inserted });
  } catch (err) {
    console.error('[contacts] POST /upload', err);
    fs.unlink(filePath, () => {});
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contacts — add single contact
router.post('/', (req, res) => {
  try {
    const { name, phone, village } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'name and phone are required' });
    }

    const id = uuidv4();
    const normalizedPhone = normalizePhone(phone);

    dbRun(
      `INSERT INTO contacts (id, name, phone, village, status) VALUES (?, ?, ?, ?, 'pending')`,
      [id, name.trim(), normalizedPhone, (village || '').trim()]
    );

    const contact = dbGet('SELECT * FROM contacts WHERE id = ?', [id]);
    res.status(201).json({ success: true, contact });
  } catch (err) {
    console.error('[contacts] POST /', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/contacts — delete all contacts
router.delete('/', (req, res) => {
  try {
    const info = dbRun('DELETE FROM contacts');
    res.json({ success: true, deleted: info.changes });
  } catch (err) {
    console.error('[contacts] DELETE /', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/contacts/:id — delete single contact
router.delete('/:id', (req, res) => {
  try {
    const existing = dbGet('SELECT id FROM contacts WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    const info = dbRun('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, deleted: info.changes });
  } catch (err) {
    console.error('[contacts] DELETE /:id', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
