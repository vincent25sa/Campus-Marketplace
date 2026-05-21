const bcrypt = require("bcrypt");
const db = require("../db");

const createTables = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      surname VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      reset_token VARCHAR(255),
      reset_token_expiry DATETIME,
      is_admin TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) {
      console.error("Error creating users table:", err);
    } else {
      console.log("Users table created or already exists.");
      createDefaultAdmin();
    }
  });

  db.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      location TEXT NOT NULL,
      image VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) {
      console.error("Error creating listings table:", err);
    } else {
      console.log("Listings table created or already exists.");
    }
  });

  db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      reply_to INT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) {
      console.error("Error creating messages table:", err);
    } else {
      console.log("Messages table created or already exists.");
    }
  });

  db.query("ALTER TABLE messages ADD COLUMN reply_to INT NULL", (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("Error adding reply_to column to messages table:", err);
    }
  });
  db.query("ALTER TABLE messages ADD COLUMN item_id INT NULL", (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("Error adding item_id column to messages table:", err);
    }
  });

  db.query("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0", (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("Error adding is_admin column to users table:", err);
    }
  });

  db.query("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL", (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("Error adding profile_image column to users table:", err);
    }
  });

  const createDefaultAdmin = async () => {
    const adminEmail = "admin@campusmarketplace.local";
    const adminPassword = "Admin123!";

    db.query("SELECT id FROM users WHERE email = ?", [adminEmail], async (selectErr, result) => {
      if (selectErr) {
        console.error("Error checking admin account:", selectErr);
        return;
      }

      if (result.length === 0) {
        try {
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          db.query(
            "INSERT INTO users (name, surname, email, password, is_admin) VALUES (?, ?, ?, ?, 1)",
            ["Admin", "User", adminEmail, hashedPassword],
            (insertErr) => {
              if (insertErr) {
                console.error("Error creating default admin account:", insertErr);
                return;
              }
              console.log("Default admin account created: admin@campusmarketplace.local / Admin123!");
            }
          );
        } catch (hashErr) {
          console.error("Error hashing admin password:", hashErr);
        }
      } else {
        console.log("Default admin account already exists.");
      }
    });
  };
};

module.exports = createTables;
