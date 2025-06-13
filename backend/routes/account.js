const express = require('express');
const router = express.Router();
const algosdk = require('algosdk');
const pool = require('../config/db');

router.post('/create-account', async (req, res) => {
  const { name, email, occupation } = req.body;

  const account = algosdk.generateAccount();
  const address = account.addr;
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

  try {
    await pool.query(
      'INSERT INTO accounts (name, email, occupation, address, mnemonic) VALUES ($1, $2, $3, $4, $5)',
      [name, email, occupation, address, mnemonic]
    );
    res.json({ address, mnemonic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, occupation, address, created_at FROM accounts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
