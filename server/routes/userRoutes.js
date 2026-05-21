const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { getUserProfile } = require("../controllers/userController");

// public: GET /api/users/:user_id
router.get("/:user_id", getUserProfile);

module.exports = router;
