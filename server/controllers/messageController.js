const db = require("../db");

exports.sendMessage = (req, res) => {
  const { sender_id, receiver_id, message, reply_to, item_id } = req.body;
  if (!sender_id || !receiver_id || !message) {
    return res.status(400).json({ error: "sender_id, receiver_id, and message are required." });
  }

  db.query(
    "INSERT INTO messages (sender_id, receiver_id, message, reply_to, item_id) VALUES (?, ?, ?, ?, ?)",
    [sender_id, receiver_id, message, reply_to || null, item_id || null],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while sending message." });
      }

      res.status(201).json({ message: "Message sent successfully.", messageId: result.insertId });
    }
  );
};

exports.getMessages = (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required." });
  }

  // Get all messages where user is sender or receiver, ordered by most recent
  db.query(
    `SELECT 
       m.id,
       m.sender_id,
       m.receiver_id,
       m.message,
       m.reply_to,
       m.item_id as message_item_id,
       m.created_at,
       sender.name as sender_name,
       sender.profile_image as sender_profile_image,
       receiver.name as receiver_name,
       receiver.profile_image as receiver_profile_image,
       replied.message as replied_message,
       replied.sender_id as replied_sender_id,
       replied_sender.name as replied_sender_name,
       replied_sender.profile_image as replied_sender_profile_image,
       l.id as item_id,
       l.title as item_title,
       l.image as item_image,
       l.price as item_price
     FROM messages m
     LEFT JOIN users sender ON m.sender_id = sender.id
     LEFT JOIN users receiver ON m.receiver_id = receiver.id
     LEFT JOIN messages replied ON m.reply_to = replied.id
     LEFT JOIN users replied_sender ON replied.sender_id = replied_sender.id
     LEFT JOIN listings l ON m.item_id = l.id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [user_id, user_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching messages." });
      }

      res.json(result);
    }
  );
};

exports.updateMessage = (req, res) => {
  const { message_id } = req.params;
  const { user_id, message } = req.body;

  if (!message_id || !user_id || !message) {
    return res.status(400).json({ error: "message_id, user_id, and message are required." });
  }

  db.query(
    "SELECT sender_id, created_at FROM messages WHERE id = ?",
    [message_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error while fetching message." });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Message not found." });
      }

      const messageRow = result[0];
      if (messageRow.sender_id !== Number(user_id)) {
        return res.status(403).json({ error: "Only the sender can edit this message." });
      }

      const ageMs = Date.now() - new Date(messageRow.created_at).getTime();
      const fifteenMinutesMs = 15 * 60 * 1000;

      if (ageMs > fifteenMinutesMs) {
        return res.status(403).json({ error: "Messages can only be edited within the first 15 minutes." });
      }

      db.query(
        "UPDATE messages SET message = ? WHERE id = ?",
        [message.trim(), message_id],
        (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ error: "Database error while updating message." });
          }

          res.json({ message: "Message updated successfully." });
        }
      );
    }
  );
};

exports.deleteMessage = (req, res) => {
  const { message_id } = req.params;
  const { user_id } = req.body;

  if (!message_id || !user_id) {
    return res.status(400).json({ error: "message_id and user_id are required." });
  }

  db.query("SELECT sender_id, receiver_id FROM messages WHERE id = ?", [message_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error while fetching message." });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Message not found." });
    }

    const messageRow = result[0];
    if (messageRow.sender_id !== Number(user_id) && messageRow.receiver_id !== Number(user_id)) {
      return res.status(403).json({ error: "You are not authorized to delete this message." });
    }

    db.query("DELETE FROM messages WHERE id = ?", [message_id], (deleteErr) => {
      if (deleteErr) {
        console.error(deleteErr);
        return res.status(500).json({ error: "Database error while deleting message." });
      }

      res.json({ message: "Message deleted for everyone." });
    });
  });
};
