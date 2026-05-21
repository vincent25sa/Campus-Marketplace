const db = require("../db");

const VALID_LOCATIONS = ["Corridor Hill", "Khayalethu", "Building 54", "Private accommodation"];

exports.getListing = (req, res) => {
  const { listing_id } = req.params;

  db.query("SELECT * FROM listings WHERE id = ?", [listing_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Listing not found." });
    }

    res.json(results[0]);
  });
};

exports.createListing = (req, res) => {
  const { user_id, title, description, price, location } = req.body;
  if (!user_id || !title || !price || !location) {
    return res.status(400).json({ error: "user_id, title, price, and location are required." });
  }

  // Validate location
  if (!VALID_LOCATIONS.includes(location)) {
    return res.status(400).json({ error: "Invalid location. Must be one of: " + VALID_LOCATIONS.join(", ") });
  }

  // If a file was uploaded, use the file path, otherwise use empty string
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  db.query(
    "INSERT INTO listings (user_id, title, description, price, location, image) VALUES (?, ?, ?, ?, ?, ?)",
    [user_id, title, description || "", price, location, image],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while creating listing." });
      }

      res.status(201).json({ message: "Listing created successfully.", listingId: result.insertId });
    }
  );
};

exports.updateListing = (req, res) => {
  const { listing_id } = req.params;
  const { user_id, title, description, price, location } = req.body;

  if (!listing_id || !user_id || !title || !price || !location) {
    return res.status(400).json({ error: "listing_id, user_id, title, price, and location are required." });
  }

  // Validate location
  if (!VALID_LOCATIONS.includes(location)) {
    return res.status(400).json({ error: "Invalid location. Must be one of: " + VALID_LOCATIONS.join(", ") });
  }

  // First check if the user owns the listing
  db.query("SELECT user_id FROM listings WHERE id = ?", [listing_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Listing not found." });
    }

    if (results[0].user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: "Unauthorized: You can only edit your own listings." });
    }

    // If a file was uploaded, use the file path, otherwise use the existing image
    let updateQuery = "UPDATE listings SET title = ?, description = ?, price = ?, location = ?";
    let queryParams = [title, description || "", price, location];

    if (req.file) {
      updateQuery += ", image = ?";
      queryParams.push(`/uploads/${req.file.filename}`);
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(listing_id);

    db.query(updateQuery, queryParams, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while updating listing." });
      }

      res.json({ message: "Listing updated successfully." });
    });
  });
};

exports.deleteListing = (req, res) => {
  const { listing_id } = req.params;
  const { user_id } = req.body;

  if (!listing_id || !user_id) {
    return res.status(400).json({ error: "listing_id and user_id are required." });
  }

  // First check if the user owns the listing
  db.query("SELECT user_id, image FROM listings WHERE id = ?", [listing_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Listing not found." });
    }

    if (results[0].user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own listings." });
    }

    // Delete the listing
    db.query("DELETE FROM listings WHERE id = ?", [listing_id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while deleting listing." });
      }

      res.json({ message: "Listing deleted successfully." });
    });
  });
};
