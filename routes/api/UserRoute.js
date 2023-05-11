// here we will make the router and link the controller , and write the main logic of the function in the controller file

const express = require("express");
const {
  registerUser,
  loginUser,
  updatePassword,
  updateProfile,
  searchUsers,
  uploadAvatar,
  getMe,
  removeProfilePicture,
  loadGroupNotifications,
} = require("../../controllers/UserController");
const router = express.Router();
const isAuthenticated = require("../../middlewares/auth");

// link the controller to the specific route
router.post("/register", registerUser); // registeruser is the controller exported from the controllers folder
router.put("/avatar/upload", isAuthenticated, uploadAvatar);

router.post("/login", loginUser); // loginUser controller

// router.get("/logout", logoutUser);
router.put("/update/password", isAuthenticated, updatePassword); // private route , hence middleware will run before actual endpoint
router.put("/update/profile", isAuthenticated, updateProfile); // private route
router.get("/find", isAuthenticated, searchUsers); // private route
router.get("/me", isAuthenticated, getMe); //private route
router.put("/avatar/remove", isAuthenticated, removeProfilePicture); // private route
router.get("/group/notifications", isAuthenticated, loadGroupNotifications);

module.exports = router;
