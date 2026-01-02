const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Email API coming soon', data: [] });
});

module.exports = router;
