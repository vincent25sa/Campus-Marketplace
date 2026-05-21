const express = require("express");
const mysql = require("mysql");
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "vincent",
  password: "system",
  database: "campus_marketplace"
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected!");
});

app.post("/messages", (req, res) => {
  const { sender_id, receiver_id, message } = req.body;

  db.query(
    "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
    [sender_id, receiver_id, message],
    (err, result) => {
      if (err) return res.send(err);
      res.send("Message sent");
    }
  );
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});