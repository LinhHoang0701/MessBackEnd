const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    isGroupChat: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        trim: true
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    groupImage: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/615/615075.png"
    },
    groupUpdates: [{
        updateMessage: String,
        updateTime: Date
    }],
    unreadMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Message"
    }]
}, { timestamps: true , minimize:false});

module.exports = mongoose.model("Chat", chatSchema);