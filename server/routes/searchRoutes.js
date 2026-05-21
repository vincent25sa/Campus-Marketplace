const express = require("express");
const router = express.Router();
const { searchListings } = require("../controllers/searchController");

router.get("/", searchListings);

module.exports = router;
