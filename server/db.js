require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

let resolveDbReady;
const dbReadyPromise = new Promise((resolve) => {
  resolveDbReady = resolve;
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Database connected!");

  // Create database if it doesn't exist
  db.query("CREATE DATABASE IF NOT EXISTS campus_marketplace", (err) => {
    if (err) {
      console.error("Error creating database:", err);
      return;
    }
    console.log("Database 'campus_marketplace' created or already exists.");

    // Switch to the database
    db.changeUser({ database: "campus_marketplace" }, (err) => {
      if (err) {
        console.error("Error switching to database:", err);
        return;
      }
      console.log("Switched to database 'campus_marketplace'.");
      resolveDbReady();
    });
  });
});

module.exports = db;
module.exports.ready = dbReadyPromise;
