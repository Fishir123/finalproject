const mysql = require('mysql2');

// Konfigurasi database
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_reservasi',
  port: 3306
};

// Membuat connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Membuat promise-based pool
const promisePool = pool.promise();

module.exports = {
  pool,
  promisePool
};

