const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: [true, 'Email already exists'],
        lowercase:true
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [5, 'Password should be minimum 5 characters '],
        select: false
    },
    avatar: {
        type: String,
        required:true,
        default: 'https://st4.depositphotos.com/4329009/19956/v/600/depositphotos_199564354-stock-illustration-creative-vector-illustration-default-avatar.jpg'
    },
    isAvatarSet: {
        type: Boolean,
        default:false
    },
    groupNotifications:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Message'
    }]
 
}, { timestamps: true, minimize: false });

// minimiize false flag will show empty fields in the db as well

// before saving the user to db we will run a pre middleware that will hash the password which we enter and then save the user , we will also check if the password is modified or not to prevent double hashing of the password

// note dont use arrow function below as it changes the scope of this keyword

userSchema.pre("save", async function (next) {
    // only hash the password if the password is modified or changed , if other fileds are modified and not password then we will not hash the password again
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next();
})

// create a middleware function matchPassword which will match the password entered by the user form the in the db, this method will recieve password from the user as params

userSchema.methods.matchPassword = async function (password) {
    // use bcrypt to compare passwords
    return await bcrypt.compare(password, this.password) // this refers to the userschema 
}

// create a middleware dunction generate token to generate a jwt on the basis of _id of the existing user

userSchema.methods.generateToken = function () {
    // use sign method from jwt
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn:'15d'
    });
}

module.exports = mongoose.model('User', userSchema);