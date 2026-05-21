const express = require("express");
const router = express.Router();
const {
  getUsers,
  getListings,
  getMessages,
  downloadUsersReport,
  downloadListingsReport,
  downloadMessagesReport,
} = require("../controllers/adminController");

router.get("/users", getUsers);
router.get("/listings", getListings);
router.get("/messages", getMessages);
router.get("/users-report", downloadUsersReport);
router.get("/listings-report", downloadListingsReport);
router.get("/messages-report", downloadMessagesReport);

module.exports = router;
