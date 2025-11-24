require('dotenv').config();
const mysql = require('mysql2');

const boberdb = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}).promise();

console.log(`🌐 Connecting to database...`);

boberdb.getConnection()
  .then(() => console.log('🟢 Successfully connected to database.'))
  .catch(err => console.error("🔴 Can't connect to database.\n", err));

module.exports = boberdb;
