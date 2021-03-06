// File: Project.js
// Desc: This file contains the Project model
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    tasks: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        dueDate: {
            type: Date
        },
        created: {
            type: Date,
            required: true,
            default: Date.now
        },
        assignedTo: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
    }]
});

module.exports = mongoose.model('Project', projectSchema);