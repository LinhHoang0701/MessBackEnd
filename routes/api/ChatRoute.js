const express = require("express");
const {
  accessSingleChat,
  fetchAllChats,
  createGroupChat,
  renameGroup,
  addUserToGroup,
  removeSelfFromGroup,
  updateGroupImage,
  exitAndDeleteGroup,
  addUnreadMessagesToChat,
  removeUnreadMessages,
  removeSingleChat,
} = require("../../controllers/ChatController");
const router = express.Router();
const isAuthenticated = require("../../middlewares/auth");

router.route("/single/access").post(isAuthenticated, accessSingleChat);
router.route("/findall").get(isAuthenticated, fetchAllChats);
router.route("/group/create").post(isAuthenticated, createGroupChat);
router.route("/group/rename").put(isAuthenticated, renameGroup);
router.route("/group/add").put(isAuthenticated, addUserToGroup);
router.route("/group/remove").put(isAuthenticated, removeSelfFromGroup);
router.route("/group/image/upload").put(isAuthenticated, updateGroupImage);
router.route("/group/delete").delete(isAuthenticated, exitAndDeleteGroup);
router.route("/unread/add").put(isAuthenticated, addUnreadMessagesToChat);
router.route("/unread/remove").put(isAuthenticated, removeUnreadMessages);
router.route("/single/remove").put(isAuthenticated, removeSingleChat);

module.exports = router;
