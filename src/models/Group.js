// File: Group.js
// Description: This file contains the Group model
    // This models groups in the application - groups are entities comprised of one or many individuals

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    members: [{type: mongoose.Types.ObjectId, ref: 'User'}],
    projects: [{type: mongoose.Types.ObjectId, ref: 'Project'}]
})

module.exports = mongoose.model('Group', groupSchema)