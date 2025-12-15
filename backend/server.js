const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mfa_demo',
  user: process.env.DB_USER || 'mfa_user',
  password: process.env.DB_PASSWORD || 'mfa_password',
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MFA Backend API',
    version: '2.0.0',
    endpoints: {
      users: 'POST /v2/users',
      register: 'POST /v2/mfa/register',
      devices: 'GET /v2/mfa/:email',
      update: 'PUT /v2/mfa/:id',
      updateUsed: 'PUT /v2/mfa/:id/used',
      delete: 'DELETE /v2/mfa/:id'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Create or get user
app.post('/v2/users', async (req, res) => {
  const { email, cognito_sub } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (email, cognito_sub) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET cognito_sub = $2 RETURNING *',
      [email, cognito_sub]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register MFA device
app.post('/v2/mfa/register', async (req, res) => {
  const { user_email, device_type, device_name, totp_secret, passkey_credential_id } = req.body;
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [user_email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user_id = userResult.rows[0].id;

    const result = await pool.query(
      'INSERT INTO mfa_devices (user_id, device_type, device_name, totp_secret, passkey_credential_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, device_type, device_name, totp_secret, passkey_credential_id]
    );

    await pool.query('UPDATE users SET mfa_compliant = true WHERE id = $1', [user_id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user MFA devices
app.get('/v2/mfa/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(
      'SELECT m.* FROM mfa_devices m JOIN users u ON m.user_id = u.id WHERE u.email = $1 AND m.is_active = true',
      [email]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update MFA device
app.put('/v2/mfa/:id', async (req, res) => {
  const { id } = req.params;
  const { device_name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE mfa_devices SET device_name = $1 WHERE id = $2 RETURNING *',
      [device_name, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update MFA device last used
app.put('/v2/mfa/:id/used', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE mfa_devices SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete MFA device
app.delete('/v2/mfa/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE mfa_devices SET is_active = false WHERE id = $1', [id]);
    
    const deviceResult = await pool.query('SELECT user_id FROM mfa_devices WHERE id = $1', [id]);
    if (deviceResult.rows.length > 0) {
      const user_id = deviceResult.rows[0].user_id;
      const activeDevices = await pool.query(
        'SELECT COUNT(*) FROM mfa_devices WHERE user_id = $1 AND is_active = true',
        [user_id]
      );
      if (parseInt(activeDevices.rows[0].count) === 0) {
        await pool.query('UPDATE users SET mfa_compliant = false WHERE id = $1', [user_id]);
      }
    }
    
    res.json({ message: 'MFA device removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Frontend logs endpoint
app.post('/api/logs', (req, res) => {
  const { level, message, timestamp } = req.body;
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/v2`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});
