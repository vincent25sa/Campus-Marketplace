const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { register, login, updateProfile, deleteAccount, requestPasswordReset, resetPassword, uploadProfileImage } = require("../controllers/authController");

// setup multer storage for profile images
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/uploads")),
	filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/register", register);
router.post("/login", login);
router.put("/profile", updateProfile);
router.post("/profile-picture", upload.single("profile_image"), uploadProfileImage);
router.delete("/account", deleteAccount);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;
