const User = require("../models/User");
const Message = require("../models/Message");

// @desc  register the user
// @route  /api/user/register
// @access  public
// @method POST
const registerUser = async (req, res) => {
  try {
    // destructure the body
    const { name, email, password } = req.body;
    // find if the user already exixts
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User alreay exists" });
    }
    // create new user
    const user = await User.create({ name, email, password });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to register user" });
    }

    // we will login the user also when we register the user successfully , so we will again create and store a token  and save it to cookie
    const token = await user.generateToken();

    res.status(201).json({ success: true, user, token });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc login the registered user
// @route /api/user/login
// @access public
// @method POST

const loginUser = async (req, res) => {
  try {
    // destructure email and passowrd from rq.body
    const { email, password } = req.body;
    // check if the user exists
    const existingUser = await User.findOne({ email }).select("+password"); // +password because in the user model we have given the select false  for password
    if (!existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User Dosen't exist" });
    }
    // check if the passwords match of the existing user , use a method matchPassword which we will create in the user model , this method will return true or false
    const isMatch = await existingUser.matchPassword(password); // we have passed the password from req.body

    // if passwords dont match return with an error
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    // if password match , generate a token from jwt , we will call the function here and make it in the user model
    const token = await existingUser.generateToken();
    // send the token along with the user
    res.status(200).json({ success: true, user: existingUser, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc logout user
// @route api/user/logout
// @access private
// @method GET

// const logoutUser = async function (req, res) {
//     try {
//         // just set the cookie to null
//         res.status(200).cookie('token', null, { expires: new Date(Date.now()), httpOnly: true }).json({ success: true, message: "User Logged Out" })

//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message })
//     }
// };

// @desc update user password
// @route api/user/update/password
// @access private
// @method PUT

const updatePassword = async function (req, res) {
  try {
    // find the logged in user by its id which is obtained from req.user._id
    const loggedUser = await User.findById(req.user._id).select("+password");
    // destructure new and old passwords from the body
    const { oldPassword, newPassword } = req.body;
    // match the old password to check if the user has entered the correct old password
    const isMatch = await loggedUser.matchPassword(oldPassword);
    // return error if passwords dont match
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect Old Password" });
    }
    // save the new password to the user.password and save the user again
    loggedUser.password = newPassword;
    await loggedUser.save();
    res.status(200).json({ success: true, message: "Password Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc update user profile
// @route api/user/update/profile
// @access private
// @method PUT

const updateProfile = async function (req, res) {
  try {
    // find the loggedIn user
    const loggedUser = await User.findById(req.user._id);
    // destructure body
    const { name, email } = req.body;
    if (name) {
      loggedUser.name = name;
    }
    if (email) {
      loggedUser.email = email;
    }

    await loggedUser.save();
    res.status(200).json({ success: true, message: "Profile Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc search users to chat with by using query against usernames
// @route /api/user/find?search=username
// @access Private
// @method GET

const searchUsers = async (req, res) => {
  try {
    // find the logged in user
    const loggedUser = await User.findById(req.user._id);
    // create a keyword for query based on usernames
    const keyword = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    // find the users using the keyword but not including the user who is logged in currently
    const users = await User.find(keyword).find({ _id: { $ne: loggedUser } });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc upload avatar for a user new or existing user
// @route /api/user/avatar/upload
// @access private
// @method PUT

const uploadAvatar = async (req, res) => {
  try {
    const loggedUser = await User.findById(req.user._id);
    if (!loggedUser) {
      return res
        .status(400)
        .json({ success: false, message: "Please sign in first" });
    }
    const { avatar } = req.body;

    // if we get imagedata means if its not undefined then we update
    if (avatar) {
      loggedUser.avatar = avatar;
      loggedUser.isAvatarSet = true;
    }
    await loggedUser.save();

    res.status(200).json({ success: true, message: "Avatar Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc remove profile picture
// @route /api/user/avatar/remove
// @access private
// @method PUT

const removeProfilePicture = async (req, res) => {
  try {
    const loggedUser = await User.findById(req.user._id);
    if (!loggedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Please login first" });
    }
    const removedAvatar = await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { avatar: "" },
        $set: { isAvatarSet: false },
      },
      { new: true }
    );
    if (!removedAvatar) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove, please try after sometime",
      });
    } else {
      res.status(201).json({ success: true, message: "Avatar Removed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc get details of logged in user
// @route GET /api/user/me
// @access Private

const getMe = async (req, res) => {
  try {
    // destructure what we want to get from user data
    let { _id, name, email, avatar, isAvatarSet, groupNotifications } =
      await User.findById(req.user._id).populate({
        path: "groupNotifications",
        options: { sort: { updatedAt: -1 } },
      });
    groupNotifications = await User.populate(groupNotifications, {
      path: "chat",
      select: "_id groupName groupImage isGroupChat",
    });
    res.status(200).json({
      success: true,
      _id,
      name,
      email,
      avatar,
      isAvatarSet,
      groupNotifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @ load group notifications for individual user
// @route GET /api/user/group/notifications
// @access private

const loadGroupNotifications = async (req, res) => {
  try {
    let notifications = await User.find({ _id: req.user._id })
      .select("groupNotifications")
      .populate({
        path: "groupNotifications",
        options: { sort: { updatedAt: -1 } },
      });
    notifications = await Message.populate(notifications, {
      path: "groupNotifications.chat",
      select: "_id groupName groupImage isGroupChat",
    });
    res.status(200).send(notifications);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updatePassword,
  updateProfile,
  searchUsers,
  uploadAvatar,
  getMe,
  removeProfilePicture,
  loadGroupNotifications,
};
