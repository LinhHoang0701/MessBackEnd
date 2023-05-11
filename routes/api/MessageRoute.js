const express = require("express");
const {
  sendMessage,
  fetchAllMessages,
  deleteMessage,
} = require("../../controllers/MessageController");
const router = express.Router();
const isAuthenticated = require("../../middlewares/auth");

router.route("/send").post(isAuthenticated, sendMessage);
router.route("/:chatId").get(isAuthenticated, fetchAllMessages);
router.route("/deletemessage").delete(isAuthenticated, deleteMessage);

module.exports = router;
