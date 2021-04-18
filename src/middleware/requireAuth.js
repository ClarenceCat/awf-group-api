// File: requireAuth.js
// Desc: This file contains the middleware used to check if the incoming request is authorized 
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const  User = mongoose.model('User'); 

// Description: Takes request, and does some preprocessing 

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    // authorization === 'Bearer dsfsdfsdfreg', found in header of requests to root 

    // no authorization header
    if (!authorization) {
        return res.status(401).send({ error: 'You must be logged in. '});
    }

    const token = authorization.replace('Bearer ', '');
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err)
        {
            // invalid token 
            return res.status(401).send({ error: 'You must be logged in.' });
        }
        
        const { userId } = payload; // video 184 

        const user = await User.findById(userId); // tells mongoose to look at db and find user with this ID 
        req.user = user;
        next();
    });
}; 