const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "vincent",
  password: "system",
  port: 3307
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
