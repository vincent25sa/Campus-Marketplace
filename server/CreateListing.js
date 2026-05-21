app.post("/listings", (req, res) => {
  const { title, description, price, image, location, user_id } = req.body;

  db.query(
    "INSERT INTO listings (title, description, price, image, location, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, price, image, location, user_id],
    (err, result) => {
      if (err) return res.send(err);
      res.send("Listing added");
    }
  );
});