const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// @desc access one to one chat or create a new one to chat
// @route /api/chat/single/access
// @access private
// @method POST

const accessSingleChat = async (req, res) => {
    // first we will take the userID of the person we want to chat with from the body , which we will send from the frontend when we start a chat 
    const { userId } = req.body;
    try {
        // send error if we dont recieve userid from the params
        if (!userId) {
            return res.status(400).json({ success: false, message: "user id not sent with the request" })
        }
        // if userid is found then it means , either we want to access an existing chat between the logged in user and the user whose id we sent , else we want to start a new chat with that user

        // find the existing chat , conditions: isgroupchat : false, and both users should be present and populate users array with their latestmessage

        let existingChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } }, //logged in user
                { users: { $elemMatch: { $eq: userId } } } // user whose id we sent 
            ]
        }).populate('users').populate('latestMessage')

        // now wen we found the chat with the latest message , we also need to populate the senders of those messages , we will use populate that takes first argument as  in where to find the senders and second arg as the options

        existingChat = await User.populate(existingChat, {
            path: 'latestMessage.sender',
            select: 'name email avatar'
        })

        // check if the chat exists as there can be only 1 chat between the two users , then send the chat 
        if (existingChat.length > 0) {
            res.status(200).send(existingChat[0])
        } else {
            // create a new chat 
            let chatOptions = {
                isGroupChat: false,
                users: [req.user._id, userId]
            }

            // create a new chat with the chat options
            const createdChat = await Chat.create(chatOptions)
            // find the created chat with the chat id and populate its users
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users')
            res.status(200).json({ ...fullChat._doc })

        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

// @desc get all chats of the logged in user
// @route /api/chat/findall
// @access Private
// @method GET

const fetchAllChats = async (req, res) => {
    try {
        // find the logged in  user 
        const loggedUser = await User.findById(req.user._id);
        // find all chats of the logged user in the chat model and populate the chat data : users, groupadmin, latestmessage and sort from new to old
        const allChats = await Chat.find({ users: { $elemMatch: { $eq: loggedUser } } }).populate('users').populate('groupAdmin').populate('latestMessage').populate('groupUpdates').populate({ path: 'unreadMessages', options: { sort: { updatedAt: -1 } } }).sort({ updatedAt: -1 })
        // populate the senders of the chat
        let allChatsData = await User.populate(allChats, {
            path: 'latestMessage.sender ',
            select: 'name email avatar'
        })
        allChatsData = await User.populate(allChatsData, {
            path: "unreadMessages.sender",
            select: '_id name avatar'
        })

        res.status(200).send([...allChatsData])


    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};


// @desc create a group chat with users
// @route /api/chat/group/create
// @access private
// @method POST

const createGroupChat = async (req, res) => {
    try {

        const loggedUser = await User.findById(req.user._id)
        // we need two things for a group chat from the user: group name , users array, if we dont get any of the two , we will throw errors
        if (!req.body.users) {
            return res.status(400).json({ success: false, message: "Add members to the group first" })
        }
        if (!req.body.groupName) {
            return res.status(400).json({ success: false, message: "Group Name cannot be left empty" })
        }

        // since users array from the frontend will be in string form we need to parse the array into json
        let users = (req.body.users);

        // check if users array is more than one , it sould be greater than one , else group chat cannot be created 
        if (users.length < 2) {
            return res.status(400).json({ success: false, message: "Cannot create a group with less than two users" })
        }
        // add the logged in user to the users array as he is also a part of the chat
        users.push(loggedUser)
        // create chat options
        const chatOptions = {
            isGroupChat: true,
            groupName: req.body.groupName,
            users: users,
            groupAdmin: loggedUser
        }
        // create the group chat
        const createdGroupChat = await Chat.create(chatOptions);

        // find the created group chat and populate the users and group admin
        const fullGroupChat = await Chat.findOne({ _id: createdGroupChat._id }).populate('users').populate('groupAdmin')
        res.status(200).json({ ...fullGroupChat._doc })


    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

// @desc rename already created group
// @route /api/chat/group/rename
// @access private
// @method PUT

const renameGroup = async (req, res) => {
    try {
        // get the chat id and the group name from the body
        const { chatId, groupName } = req.body
        // find the group by its id and update the name and populate results
        const updatedGroupChat = await Chat.findByIdAndUpdate(chatId, {
            groupName
        }, { new: true }).populate('users').populate('groupAdmin')

        if (!updatedGroupChat) {
            return res.status(404).json({ success: false, message: "Group Chat not found" })
        } else {
            res.status(200).send(updatedGroupChat._doc)
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

// @desc update group image
// @route /api/group/image/upload
// @access private
// @method PUT

const updateGroupImage = async (req, res) => {
    try {
        const { chatId, groupImage } = req.body;
        const updateGroupChat = await Chat.findByIdAndUpdate(chatId, {
            groupImage
        }, { new: true }).populate('users').populate('groupAdmin');
        if (!updateGroupChat) {
            return res.status(404).json({ success: false, message: "Group Chat not found" })
        } else {
            res.status(200).send(updateGroupChat._doc)
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// @desc add a user to the existing group (only group admin can do that)
// @route /api/chat/group/add
// @access private admin only
// @method PUT

const addUserToGroup = async (req, res) => {
    try {
        // firstly find the logged in user
        const user = await User.findById(req.user._id);
        // take the chatid and userId from the body 
        const { chatId } = req.body;
        let users = req.body.users

        // find if the chat in which we want to add user is admin or not 
        const adminUser = await Chat.findById(chatId).find({ groupAdmin: user }).count() > 0 ? true : false

        if (!adminUser) {
            return res.status(401).json({ success: false, message: "Only Admin can add to the group" })
        } else {
            // push the userid into the users array and populate the users and admin
            if (users.length === 1) {
                const addedUser = await Chat.findByIdAndUpdate(chatId, {
                    $push: { users: users[0]._id, groupUpdates: { updateMessage: `${user.name} added ${users[0].name} to the group`, updateTime: new Date() } }
                }, { new: true, upsert: true }).populate('users').populate('groupAdmin')
                if (!addedUser) {
                    return res.status(400).json({ success: false, message: "Cannot add user to the group" })
                } else {
                    res.status(200).json({ success: true, addedUser })
                }
            }
            if (users.length > 1) {
                const addedUsers = await Chat.findByIdAndUpdate(chatId, {
                    $push: { users: { $each: [...users] }, groupUpdates: { updateMessage: `${user.name} added ${users.map((u) => u.name)} to the group`, updateTime: new Date() } }
                }, { new: true, upsert: true }).populate('users').populate('groupAdmin')
                if (!addedUsers) {
                    return res.status(400).json({ success: false, message: "Cannot add users to the group" })
                } else {
                    res.status(200).json({ success: true, addedUsers })
                }
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};


// @ desc delete single chat of the logged user
// @route /api/chat/single/remove
// @access private
// @method put

const removeSingleChat = async (req, res) => {
    // TODO : have to make changes in the models
}

// @desc remove yourself from the group , means logged in usr can remove himself only
// @route /api/chat/group/remove
// @access private
// @method PUT

const removeSelfFromGroup = async (req, res) => {
    try {
        const loggedUser = await User.findById(req.user._id)
        // get chat id from the body
        const { chatId } = req.body

        const adminUser = await Chat.findById(chatId).find({ groupAdmin: req.user._id }).count() > 0 ? true : false

        // remove logged user from the chat
        let removedUser;

        removedUser = await Chat.findByIdAndUpdate(chatId, {
            $pull: { users: req.user._id },
            $push: { groupUpdates: { updateMessage: `${loggedUser?.name} left the group`, updateTime: new Date() } }
        }, { new: true }).populate('users').exec()

        if (adminUser) {
            removedUser = await Chat.findByIdAndUpdate(chatId, {
                $set: { groupAdmin: removedUser?.users[0] },
                $push: { groupUpdates: { updateMessage: `${removedUser?.users[0]?.name} is now admin`, updateTime: new Date() } }
            }, { new: true }).populate('groupAdmin').populate('groupUpdates')

            return res.status(200).json({ updatedChat: removedUser._doc })
        }

        if (!removedUser) {
            return res.status(404).json({ success: false, message: "Chat Not Found" })
        }
        removedUser = await Chat.findById(chatId).populate('groupAdmin').populate('groupUpdates')
        res.status(200).json({ updatedChat: removedUser._doc })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

// @desc exit and delete the group if users left in the group is 1
// @route /api/chat/group/delete
// @access private
// @method DELETE

const exitAndDeleteGroup = async (req, res) => {
    try {

        const { chatId } = req.body;

        let deletedGroup;
        let messagesIngroup = await Message.find({ chat: chatId }).deleteMany().exec()
        if (messagesIngroup) {
            deletedGroup = await Chat.findByIdAndDelete(chatId, { new: true });
        }

        if (!deletedGroup) {
            return res.status(402).json({ success: false, message: "Chat not found!" })
        } else {
            res.status(200).json({ success: true, message: "Group deleted Successfully" })
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

// @desc add unread message in the chat
// @route /api/chat/unread/add
// @access private
// @method PUT

const addUnreadMessagesToChat = async (req, res) => {
    try {
        // destructure user to whome message is t sent , chat in which chat is ti be sent and message from the body
        const { chat, message } = req.body;
        if (!chat || !message) {
            return res.status(402).json({ success: false, message: 'Required data not passed with the request' })
        }
        if (!chat?.isGroupChat) {
            const addedMessage = await Chat.findByIdAndUpdate(chat?._id, {
                $addToSet: { unreadMessages: message }
            }, { new: true, upsert: true })
            if (!addedMessage) {
                return res.status(402).json({ success: false, message: 'Chat not found' })
            } else {
                res.status(200).send(message)
            }
        } else {
            const groupNotifications = await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { groupNotifications: message }
            }, { new: true, upsert: true }).populate({ path: 'groupNotifications', options: { sort: { updatedAt: -1 } } })
            if (!groupNotifications) {
                return res.status(402).json({ success: false, message: 'Chat not found' })
            } else {
                res.status(200).send(groupNotifications)
            }
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

// @desc remove all unread messages of the chat
// @route /api/chat/unread/remove
// @access private
// @method delete

const removeUnreadMessages = async (req, res) => {
    try {
        const { chat, userId } = req.body;

        if (!chat || !userId) {
            return res.status(402).json({ success: false, message: 'chat not sent with request' })
        }
        let originalUnreadMessages = chat?.unreadMessages?.filter((unread) => unread?.sender?._id === userId);

        if (!chat?.isGroupChat) {
            let updatedUnread = await Chat.findById(chat?._id);
            if (updatedUnread) {
                updatedUnread.unreadMessages = originalUnreadMessages
            }
            await updatedUnread.save()
            res.status(200).send(updatedUnread)
        } else {
            let loggedUser = await User.findById(userId).populate({ path: 'groupNotifications', options: { sort: { updatedAt: -1 } } }).exec()
            let copy = JSON.parse(JSON.stringify(loggedUser?.groupNotifications));
            if (copy) {
                let messagesTodelete = copy?.filter((result) => result.chat !== chat?._id)
                loggedUser.groupNotifications = messagesTodelete
            }
            await loggedUser.save()
            res.status(200).send(loggedUser)
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}



module.exports = { accessSingleChat, fetchAllChats, createGroupChat, renameGroup, addUserToGroup, removeSelfFromGroup, updateGroupImage, exitAndDeleteGroup, addUnreadMessagesToChat, removeUnreadMessages, removeSingleChat }