const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, updateMessage, deleteMessage } = require("../controllers/messageController");

router.post("/", sendMessage);
router.get("/", getMessages);
router.put("/:message_id", updateMessage);
router.delete("/:message_id", deleteMessage);

module.exports = router;
