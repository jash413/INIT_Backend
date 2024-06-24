/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// server/db.js
require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// eslint-disable-next-line no-undef
module.exports = pool.promise();
