// File: authRoutes.js
// Description: This file contains the autorization routes used to login or register 
const express = require ('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = mongoose.model('User');

const router = express.Router();

// Description: Post request handler 
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body; ;

    if(!email || !password || !firstName || !lastName){
        return res.status(200).send({error: 'Credentials are missing'})
    }

    try{
        const checkForUser = await User.findOne({email});

        // check if the user was found
        if(checkForUser) {
            return res.status(200).send({error: 'A user with this email already exists'})
        }
    }catch(e){
        console.log(e);
        return
    }

    // handling duplicate emails and empty email/password fields 
    try {
        const user = new User ({ firstName, lastName, email, password });
        const newUser = await user.save();

        console.log('saved user ' + newUser.email + ' to the database');
        
        // generate token 
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET); 

        res.send({ 
            token: token,
            user: {
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }
         });
    } catch (err) {
        console.log(err);
        return res.status(400).send(err.message);
    }
    
});

// @POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body; 

    if(!email || !password) {
        return res.status(200).send({error: 'Must provide email and password'});
    }

    const user = await User.findOne({ email });
    if(!user) {
        return res.status(200).send({ error: 'Email not found'}); // may want to use same err message for security against malicious users 
    }

    try {
        await user.comparePassword(password);

        const retUser = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)
        res.send({ 
            token: token,
            user: retUser
         });
    } catch (err) {
        return res.status(401).send({ error: 'Invalid password or email' });
    }
});

module.exports = router; 
