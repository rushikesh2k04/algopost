require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const algosdk = require('algosdk');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Ensure 'accounts' table exists
const ensureTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      occupation TEXT NOT NULL,
      mnemonic TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Table 'accounts' ensured.");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  }
};
ensureTable();

// POST: Create account
app.post('/api/create-account', async (req, res) => {
  const { name, email, occupation } = req.body;

  if (!name || !email || !occupation) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check unique email
    const check = await pool.query('SELECT * FROM accounts WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create Algorand account
    const account = algosdk.generateAccount();
    const address = account.addr;
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

    // Insert into DB
    await pool.query(
      'INSERT INTO accounts (name, email, occupation, address, mnemonic) VALUES ($1, $2, $3, $4, $5)',
      [name, email, occupation, address, mnemonic]
    );

    res.json({
      message: 'Account created successfully',
      address: address
      // ✅ Do NOT return mnemonic here — it's stored safely in DB.
    });

  } catch (err) {
    console.error("❌ Error creating account:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: List all accounts (without mnemonic!)
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, occupation, address, created_at FROM accounts'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching accounts:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
