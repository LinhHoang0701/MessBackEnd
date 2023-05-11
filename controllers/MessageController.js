const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');


// @desc send message in a chat
// @route /api/chat/message/send
// @access private
// @method POST

const sendMessage = async (req, res) => {
    try {
        // get the content and chat id from the body
        const { content, chatId } = req.body;
        // throw eeeors if content and chat id not found
        if (!content || !chatId) {
            return res.status(400).json({ success: false, message: "required data not passed with the request" })
        }
        // create a new message data
        const newMessageData = {
            sender: req.user._id,
            content: content,
            chat: chatId
        }

        // create a new message using the message data
        let message = await Message.create(newMessageData)
        // populate the sender of the message and the chat in which the message has been send, we are populating using the instance of message model 
        message = await message.populate('sender', 'name avatar')
        message = await message.populate('chat')
        // populate the users of the messages
        message = await User.populate(message, {
            path: 'chat.users',
            select: 'name avatar'
        })

        // update the latest message with the message sent in the chat
        const updatedLAtestMessage = await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message
        });
        if (!updatedLAtestMessage) {
            return res.status(400).json({ success: false, message: "Message not sent" })
        } else {
            res.status(200).json({ success: true, message })
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};


// @desc fetch all messages for a particular chat by using its chatid
// @route /api/chat/message/:chatId
// @access private
// @method GET

const fetchAllMessages = async (req, res) => {
    try {
        // find the messages in the chat by sing params and populate sender and chat
        let allMessages = await Message.find({ chat: req.params.chatId }).populate('sender', '_id name avatar').populate('chat');
        allMessages = await Chat.populate(allMessages, {
            path: 'chat.latestMessage',
            select: 'sender content'
        })
        res.status(200).json({ success: true, allMessages })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { message } = req.body
        const deletedMessage = await Message.findByIdAndDelete(message?._id).exec()
        if (deletedMessage) {
            res.status(200).send(deletedMessage)
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};

module.exports = { sendMessage, fetchAllMessages, deleteMessage }