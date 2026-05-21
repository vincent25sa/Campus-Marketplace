const db = require("../db");

exports.searchListings = (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? `%${q}%` : "%";

  db.query(
    `SELECT l.*, u.name AS seller_name
     FROM listings l
     JOIN users u ON u.id = l.user_id
     WHERE l.title LIKE ? OR l.description LIKE ?
     ORDER BY l.created_at DESC`,
    [searchTerm, searchTerm],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while searching listings." });
      }
      res.json(result);
    }
  );
};
