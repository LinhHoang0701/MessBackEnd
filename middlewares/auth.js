const User = require('../models/User');
const jwt = require('jsonwebtoken');

const isAuthenticated = async function (req, res, next) {
    // initialise a token variable
    let token;
    //req.headers.authorisations holds the toen and the token starts with Bearer token so we have to chekcif the token starts with Bearer and get the token 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // get the token from bearer herder
            token = req.headers.authorization.split(' ')[1]
            // if token is present then decode the token value  using jwt verify method
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            // decodedtoken is an object that has the user _id , save that to the user
            req.user = await User.findById(decodedToken._id).select('-password')
            next()
        } catch (error) {
            res.status(401).json({ message: "Not authorised" })
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not Authorised, token not found" })
    }


};

module.exports = isAuthenticated