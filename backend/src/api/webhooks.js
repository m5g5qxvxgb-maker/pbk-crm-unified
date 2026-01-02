const express = require('express');
const router = express.Router();

router.post('/retell', (req, res) => {
  res.json({ success: true, message: 'Retell webhook received' });
});

router.post('/telegram', (req, res) => {
  res.json({ success: true, message: 'Telegram webhook received' });
});

module.exports = router;
