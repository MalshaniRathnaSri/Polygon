const mysql = require('mysql2/promise')
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env

const pool = mysql.createPool({
  host: DB_HOST || 'localhost',
  user: DB_USER || 'root',
  password: DB_PASSWORD || '',
  database: DB_NAME || 'polygon',
  waitForConnections: true,
  connectionLimit: 10
})

module.exports = pool
