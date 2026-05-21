const db = require("../db");

exports.getUserProfile = (req, res) => {
  const { user_id } = req.params;
  if (!user_id) return res.status(400).json({ error: "user_id is required." });

  db.query(
    `SELECT id, name, surname, email, profile_image, created_at FROM users WHERE id = ?`,
    [user_id],
    (err, users) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching user." });
      }

      if (users.length === 0) return res.status(404).json({ error: "User not found." });

      const user = users[0];

      db.query(
        `SELECT id, title, price, image, location, created_at, user_id FROM listings WHERE user_id = ? ORDER BY created_at DESC`,
        [user_id],
        (listErr, listings) => {
          if (listErr) {
            console.error(listErr);
            return res.status(500).json({ error: "Database error while fetching listings." });
          }

          res.json({ user, listings });
        }
      );
    }
  );
};
