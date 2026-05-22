require("dotenv").config();
const mysql = require("mysql2");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "vincent";
const DB_PASSWORD = process.env.DB_PASSWORD || "system";
const DB_PORT = Number(process.env.DB_PORT || 3307);
const DB_NAME = process.env.DB_NAME || "campus_marketplace";

const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT
});

let resolveDbReady;
const dbReadyPromise = new Promise((resolve) => {
  resolveDbReady = resolve;
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Database connected!");

  // Create database if it doesn't exist
  db.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`, (err) => {
    if (err) {
      console.error("Error creating database:", err);
      return;
    }
    console.log(`Database '${DB_NAME}' created or already exists.`);

    // Switch to the database
    db.changeUser({ database: DB_NAME }, (err) => {
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
