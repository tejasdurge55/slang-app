const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "Tejas&2012", // Replace with your MySQL password
  database: "slang_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool.promise();
