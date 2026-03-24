const mysql = require('mysql2/promise');
const fs = require('fs');

const connectionUri = process.env.DB_URI || process.env.DATABASE_URL;
const parsedUri = connectionUri ? new URL(connectionUri) : null;
const uriSslMode = parsedUri
  ? parsedUri.searchParams.get('ssl-mode') || parsedUri.searchParams.get('sslmode')
  : null;

if (parsedUri) {
  parsedUri.searchParams.delete('ssl-mode');
  parsedUri.searchParams.delete('sslmode');
}

const normalizedUri = parsedUri ? parsedUri.toString() : null;
const shouldUseSsl =
  process.env.DB_SSL === 'true' || (uriSslMode && uriSslMode.toUpperCase() !== 'DISABLED');

const sslRejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || process.env.NODE_ENV === 'production';
const sslCaPath = process.env.DB_SSL_CA_PATH;
const sslConfig = shouldUseSsl
  ? {
      rejectUnauthorized: sslRejectUnauthorized,
      ...(sslCaPath ? { ca: fs.readFileSync(sslCaPath, 'utf8') } : {}),
    }
  : undefined;

const pool = normalizedUri
  ? mysql.createPool({
      uri: normalizedUri,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: sslConfig,
    })
  : mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: sslConfig,
    });

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`LOGIN-DEMO_USERS\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = {
  query,
  pool,
  initDb,
};
