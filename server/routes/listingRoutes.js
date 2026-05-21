const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { getListing, createListing, updateListing, deleteListing } = require("../controllers/listingController");

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

router.post("/", upload.single("image"), createListing);
router.get("/:listing_id", getListing);
router.put("/:listing_id", upload.single("image"), updateListing);
router.delete("/:listing_id", deleteListing);

module.exports = router;
