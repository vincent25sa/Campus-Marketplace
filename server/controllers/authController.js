const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Jimp = require("jimp");
const db = require("../db");

exports.register = async (req, res) => {
  const { name, surname, email, password } = req.body;
  if (!name || !surname || !email || !password) {
    return res.status(400).json({ error: "Name, surname, email, and password are required." });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], async (checkErr, checkResult) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(500).json({ error: "Database error while checking email." });
    }

    if (checkResult.length > 0) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)",
        [name, surname, email, hashedPassword],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error(insertErr);
            return res.status(500).json({ error: "Database error while creating user." });
          }

          res.status(201).json({ message: "User registered successfully.", userId: insertResult.insertId });
        }
      );
    } catch (hashErr) {
      console.error(hashErr);
      res.status(500).json({ error: "Error while hashing password." });
    }
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error while fetching user." });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = result[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    res.json({ id: user.id, name: user.name, surname: user.surname, email: user.email, profile_image: user.profile_image || null, created_at: user.created_at, is_admin: user.is_admin === 1 });
  });
};

exports.requestPasswordReset = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required." });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error." });
    }

    if (result.length === 0) {
      // For security, don't reveal if email exists
      return res.json({ message: "If the email exists, the password has been reset." });
    }

    const user = result[0];

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
        [hashedPassword, user.id],
        (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ error: "Database error while resetting password." });
          }

          res.json({ message: "Password reset successfully." });
        }
      );
    } catch (hashErr) {
      console.error(hashErr);
      res.status(500).json({ error: "Error while hashing password." });
    }
  });
};

exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "Reset token and new password are required." });
  }

  db.query(
    "SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
    [resetToken],
    async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error." });
      }

      if (result.length === 0) {
        return res.status(400).json({ error: "Invalid or expired reset token." });
      }

      const userId = result[0].id;

      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query(
          "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
          [hashedPassword, userId],
          (updateErr) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({ error: "Database error while resetting password." });
            }

            res.json({ message: "Password reset successfully." });
          }
        );
      } catch (hashErr) {
        console.error(hashErr);
        res.status(500).json({ error: "Error while hashing password." });
      }
    }
  );
};

exports.updateProfile = async (req, res) => {
  const { user_id, name, email, password } = req.body;
  if (!user_id || (!name && !email && !password)) {
    return res.status(400).json({ error: "user_id and at least one field to update are required." });
  }

  try {
    // Check if email is already in use by another user
    if (email) {
      db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, user_id], (checkErr, checkResult) => {
        if (checkErr) {
          console.error(checkErr);
          return res.status(500).json({ error: "Database error while checking email." });
        }

        if (checkResult.length > 0) {
          return res.status(409).json({ error: "Email is already registered." });
        }

        updateUserData();
      });
    } else {
      updateUserData();
    }

    async function updateUserData() {
      const updates = [];
      const values = [];

      if (name) {
        updates.push("name = ?");
        values.push(name);
      }
      if (email) {
        updates.push("email = ?");
        values.push(email);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push("password = ?");
        values.push(hashedPassword);
      }

      values.push(user_id);

      const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
      db.query(query, values, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Database error while updating profile." });
        }

        // Fetch updated user data
        db.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [user_id], (fetchErr, result) => {
          if (fetchErr || result.length === 0) {
            return res.status(500).json({ error: "Error fetching updated user data." });
          }
          res.json({ message: "Profile updated successfully.", user: result[0] });
        });
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating profile." });
  }
};

exports.deleteAccount = (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required." });
  }

  // First, delete all listings created by the user
  db.query("DELETE FROM listings WHERE user_id = ?", [user_id], (deleteListingsErr) => {
    if (deleteListingsErr) {
      console.error(deleteListingsErr);
      return res.status(500).json({ error: "Database error while deleting listings." });
    }

    // Delete all messages involving the user (both as sender and receiver)
    db.query("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", [user_id, user_id], (deleteMessagesErr) => {
      if (deleteMessagesErr) {
        console.error(deleteMessagesErr);
        return res.status(500).json({ error: "Database error while deleting messages." });
      }

      // Finally, delete the user account
      db.query("DELETE FROM users WHERE id = ?", [user_id], (deleteUserErr) => {
        if (deleteUserErr) {
          console.error(deleteUserErr);
          return res.status(500).json({ error: "Database error while deleting account." });
        }

        res.json({ message: "Account deleted successfully." });
      });
    });
  });
};

exports.uploadProfileImage = async (req, res) => {
  const userId = req.body.user_id;
  if (!userId) return res.status(400).json({ error: "user_id is required." });
  if (!req.file) return res.status(400).json({ error: "profile_image file is required." });

  const imagePath = `/uploads/${req.file.filename}`;
  const filePath = req.file.path;

  try {
    const image = await Jimp.read(filePath);
    await image.cover(256, 256);
    await image.writeAsync(filePath);
  } catch (processErr) {
    console.error(processErr);
    return res.status(500).json({ error: "Error processing profile image." });
  }

  db.query("UPDATE users SET profile_image = ? WHERE id = ?", [imagePath, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error while updating profile image." });
    }

    res.json({ message: "Profile image uploaded successfully.", profile_image: imagePath });
  });
};
