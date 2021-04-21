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
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
    tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}]
});

module.exports = mongoose.model('Project', projectSchema);