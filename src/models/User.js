// File: User.js 
// Desc: model for the User
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

userSchema.pre('save', function(next) {
    const user = this; 
    if (!user.isModified('password')) {
        return next(); // if user has not modified password, don't salt anything 
    }

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash; 
            next();
        });
    });
});

// add method to automatically compare passwords everytime user logs in 
userSchema.methods.comparePassword = function (candidatePassword) {
    const user = this; 

    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
            if (err) {
                return reject(err);
            }
            if (!isMatch) {
                return reject(false);
            }

            resolve(true);
        });
    });
}

module.exports = mongoose.model('User', userSchema);